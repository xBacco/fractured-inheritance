import { BaseEnemy } from './BaseEnemy.js'

const BASE_COLOR   = 0x1a1008
const NODE_DORMANT = 0x1a2010
const NODE_ACTIVE  = 0x3ac040
const NODE_SLAM    = 0xffffff

const S = {
  DORMANT:     'DORMANT',
  ACTIVE:      'ACTIVE',
  BRANCH_SLAM: 'BRANCH_SLAM',
  ROOT_TRAP:   'ROOT_TRAP',
  COOLDOWN:    'COOLDOWN',
  SILENCED:    'SILENCED',
}

const AGGRO_RANGE    = 180
const BLOOD_RANGE    = 200
const ATTACK_RANGE_W = 250
const CHAIN_RANGE    = 240
const NODE_HP_MAX    = 30
const SILENCE_MS     = 20000
const SLAM_RANGE     = 45
const ROOT_RANGE     = 80

export class AlberoRichiusa extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 18, 40, BASE_COLOR, 200, 12, 0)
    this.body.setImmovable(true)
    this.setDepth(2)

    this._state      = S.DORMANT
    this._stateTimer = 0
    this._nodeHp     = NODE_HP_MAX
    this._rootVis    = null

    this._node    = scene.add.rectangle(x, y - 10, 6, 6, NODE_DORMANT).setDepth(3)
    this._branchL = scene.add.rectangle(x - 14, y - 6, 12, 4, 0x141008).setDepth(2)
    this._branchR = scene.add.rectangle(x + 14, y - 6, 12, 4, 0x141008).setDepth(2)

    this._onEnemyKilled    = (ex, ey) => this._handleEnemyKilled(ex, ey)
    this._onPlayerAttacked = (ax, ay) => this._handlePlayerAttacked(ax, ay)
    this._onRichiusaHit    = (hx, hy) => this._handleChainActivation(hx, hy)

    scene.events.on('enemy_killed',    this._onEnemyKilled)
    scene.events.on('player_attacked', this._onPlayerAttacked)
    scene.events.on('richiusa_hit',    this._onRichiusaHit)
  }

  update(player, delta) {
    if (!this.alive) return
    this._stateTimer -= delta
    this._tickBound(delta)
    this._tickSlowAndAcid(delta)
    this.body.setVelocity(0, 0)
    if (this._bound) return
    this._tick(player, delta)
  }

  takeDamage(amount) {
    if (!this.alive) return
    if (this._state === S.DORMANT || this._state === S.SILENCED) return

    this.scene.events.emit('richiusa_hit', this.x, this.y)

    this._nodeHp -= amount
    const prev = this.fillColor
    this.fillColor = 0xffffff
    this.scene.time.delayedCall(80, () => { if (this.alive) this.fillColor = prev })

    if (this._nodeHp <= 0) {
      const excess = -this._nodeHp
      this._nodeHp = NODE_HP_MAX
      this._goSilenced()
      if (excess > 0) { this.hp -= excess; if (this.hp <= 0) this._die() }
      return
    }

    this.hp -= amount
    if (this.hp <= 0) this._die()
  }

  destroy() {
    this.scene?.events.off('enemy_killed',    this._onEnemyKilled)
    this.scene?.events.off('player_attacked', this._onPlayerAttacked)
    this.scene?.events.off('richiusa_hit',    this._onRichiusaHit)
    this._node?.destroy()
    this._branchL?.destroy()
    this._branchR?.destroy()
    this._rootVis?.destroy()
    super.destroy()
  }

  _die() {
    if (!this.alive) return
    this.alive = false
    this.scene.events.off('enemy_killed',    this._onEnemyKilled)
    this.scene.events.off('player_attacked', this._onPlayerAttacked)
    this.scene.events.off('richiusa_hit',    this._onRichiusaHit)
    if (this.body) { this.body.setVelocity(0, 0); this.body.enable = false }
    this._node?.destroy();    this._node    = null
    this._branchL?.destroy(); this._branchL = null
    this._branchR?.destroy(); this._branchR = null
    this._rootVis?.destroy(); this._rootVis = null
    this.scene.events.emit('enemy_killed', this.x, this.y)
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 800,
      onComplete: () => { if (this.active) this.destroy() }
    })
  }

  // ─── FSM ──────────────────────────────────────────────────────────────────────

  _tick(player, delta) {
    if (!player?.alive) return
    if (player._fusionActive && player._inShadow) return
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)

    switch (this._state) {
      case S.DORMANT:
        if (dist < AGGRO_RANGE) this._activate()
        break

      case S.ACTIVE:
        if (this._stateTimer <= 0) this._chooseAttack(player, dist)
        break

      case S.BRANCH_SLAM:
        if (this._stateTimer <= 0) {
          if (dist < SLAM_RANGE && player.alive) player.takeDamage(this.damage)
          this._goto(S.COOLDOWN, 1500)
        }
        break

      case S.ROOT_TRAP:
        if (this._stateTimer <= 0) {
          if (dist < ROOT_RANGE && player.alive && typeof player.applyRoot === 'function') {
            player.applyRoot(1500)
          }
          this._rootVis?.destroy()
          this._rootVis = null
          this._goto(S.COOLDOWN, 2000)
        }
        break

      case S.COOLDOWN:
        if (this._stateTimer <= 0) this._goto(S.ACTIVE, Phaser.Math.Between(2500, 4000))
        break

      case S.SILENCED:
        if (this._stateTimer <= 0) this._goto(S.DORMANT)
        break
    }
  }

  // ─── Activation ───────────────────────────────────────────────────────────────

  _activate() {
    if (this._state !== S.DORMANT) return
    this._goto(S.ACTIVE, Phaser.Math.Between(2500, 4000))
  }

  _goSilenced() {
    this._goto(S.SILENCED, SILENCE_MS)
    this._rootVis?.destroy()
    this._rootVis = null
  }

  // ─── Attack selection ─────────────────────────────────────────────────────────

  _chooseAttack(player, dist) {
    if (dist < 60) {
      this._startBranchSlam()
    } else {
      this._startRootTrap(player)
    }
  }

  _startBranchSlam() {
    this._goto(S.BRANCH_SLAM, 700)
    if (this._node) this._node.fillColor = NODE_SLAM
    this.scene.time.delayedCall(150, () => {
      if (this.alive && this._state === S.BRANCH_SLAM && this._node) {
        this._node.fillColor = NODE_ACTIVE
      }
    })
    this.scene.tweens.add({ targets: this._branchL, y: this._branchL.y + 8, duration: 300, yoyo: true })
    this.scene.tweens.add({ targets: this._branchR, y: this._branchR.y + 8, duration: 300, yoyo: true, delay: 80 })
  }

  _startRootTrap(player) {
    this._goto(S.ROOT_TRAP, 600)
    this._rootVis?.destroy()
    this._rootVis = this.scene.add.rectangle(player.x, player.y + 16, 14, 4, 0x2a1808)
      .setDepth(1).setAlpha(0.7)
    this.scene.tweens.add({ targets: this._rootVis, scaleY: 2.5, alpha: 0.9, duration: 500, ease: 'Power1' })
  }

  // ─── Event handlers ───────────────────────────────────────────────────────────

  _handleEnemyKilled(ex, ey) {
    if (this._state !== S.DORMANT) return
    if (Phaser.Math.Distance.Between(this.x, this.y, ex, ey) < BLOOD_RANGE) this._activate()
  }

  _handlePlayerAttacked(ax, ay) {
    if (this._state !== S.DORMANT) return
    if (Phaser.Math.Distance.Between(this.x, this.y, ax, ay) < ATTACK_RANGE_W) this._activate()
  }

  _handleChainActivation(hx, hy) {
    if (this._state !== S.DORMANT) return
    if (Phaser.Math.Distance.Between(this.x, this.y, hx, hy) < CHAIN_RANGE) {
      const delay = Phaser.Math.Between(1000, 3000)
      this.scene.time.delayedCall(delay, () => {
        if (this.alive && this._state === S.DORMANT) this._activate()
      })
    }
  }

  _goto(state, duration = 0) {
    this._state      = state
    this._stateTimer = duration
    if (!this._node) return
    if (state === S.DORMANT || state === S.SILENCED) this._node.fillColor = NODE_DORMANT
    else if (state !== S.BRANCH_SLAM) this._node.fillColor = NODE_ACTIVE
  }
}
