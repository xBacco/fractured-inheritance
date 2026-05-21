import { BaseEnemy } from './BaseEnemy.js'
import { TILE } from '../map/TileTypes.js'
import { TILE_SIZE } from '../config/GameConfig.js'

const BASE_COLOR = 0x4a5840

const S = {
  IDLE:      'IDLE',
  AGGRO:     'AGGRO',
  SIBILATE:  'SIBILATE',
  SPIT:      'SPIT',
  RECOVER:   'RECOVER',
}

export class Anghiato extends BaseEnemy {
  constructor(scene, x, y, enemyProjectiles) {
    super(scene, x, y, 18, 14, BASE_COLOR, 70, 12, 80)
    this._enemyProjectiles = enemyProjectiles
    this._state            = S.IDLE
    this._stateTimer       = 0
    this._inWater          = false
    this._sibilateCooldown = 5000
    this._spitCooldown     = 2000

    this._drip = scene.add.rectangle(x, y + 8, 3, 5, 0x0a0a0a).setDepth(2).setAlpha(0.8)
  }

  update(player, delta) {
    if (!this.alive) return
    this._stateTimer -= delta
    this._tickBound(delta)
    this._tickSlowAndAcid(delta)
    this._checkWater()
    this._tickCooldowns(delta)
    this._syncVisuals()
    if (this._bound) { this.body.setVelocity(0, 0); return }
    this._tick(player, delta)
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.hp -= amount
    const prev = this.fillColor
    this.fillColor = 0xffffff
    this.scene.time.delayedCall(80, () => { if (this.alive) this.fillColor = prev })
    if (this.hp <= 0) this._die()
  }

  destroy() {
    this._drip?.destroy()
    super.destroy()
  }

  // ─── Death ────────────────────────────────────────────────────────────────────

  _die() {
    if (!this.alive) return
    this.alive = false
    this.scene.events.emit('enemy_killed', this.x, this.y)
    if (this.body) {
      this.body.setVelocity(0, 0)
      this.body.enable = false
    }
    this._drip?.destroy()
    this._placeDarkWater()
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.4,
      scaleY: 0.4,
      duration: 600,
      onComplete: () => { if (this.active) this.destroy() }
    })
  }

  _placeDarkWater() {
    const puddle = this.scene.add
      .ellipse(this.x, this.y + 4, 28, 12, 0x081418)
      .setDepth(0)
      .setAlpha(0.75)
    this.scene.tweens.add({
      targets: puddle,
      alpha: 0,
      delay: 5000,
      duration: 3000,
      onComplete: () => { if (puddle.active) puddle.destroy() }
    })
  }

  // ─── FSM ──────────────────────────────────────────────────────────────────────

  _tick(player, delta) {
    if (!player?.alive) return
    if (player._fusionActive && player._inShadow) return
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)

    switch (this._state) {
      case S.IDLE:
        this.body.setVelocity(0, 0)
        if (dist < 160) this._goto(S.AGGRO)
        break

      case S.AGGRO:
        this._moveTo(player.x, player.y)
        if (dist < 30 && this.attackCooldown <= 0) {
          player.takeDamage(this._effectiveDamage())
          this.attackCooldown = 1000
        }
        if (dist > 35 && dist < 180 && this._spitCooldown <= 0) {
          this._goto(S.SPIT, 400)
        } else if (dist > 25 && dist < 220 && this._sibilateCooldown <= 0) {
          this._goto(S.SIBILATE, 600)
        }
        break

      case S.SIBILATE:
        this.body.setVelocity(0, 0)
        if (this._stateTimer <= 0) {
          this._doSibilate(player, dist)
          this._sibilateCooldown = 8000
          this._goto(S.RECOVER, 500)
        }
        break

      case S.SPIT:
        this.body.setVelocity(0, 0)
        if (this._stateTimer <= 0) {
          this._doSpit(player)
          this._spitCooldown = 3500
          this._goto(S.RECOVER, 300)
        }
        break

      case S.RECOVER:
        this.body.setVelocity(0, 0)
        if (this._stateTimer <= 0) this._goto(S.AGGRO)
        break
    }
  }

  // ─── Attacks ──────────────────────────────────────────────────────────────────

  _doSibilate(player, dist) {
    this.fillColor = 0xf0f0f0
    this.scene.time.delayedCall(100, () => { if (this.alive) this.fillColor = BASE_COLOR })
    if (dist < 200 && typeof player.applyDisorient === 'function') {
      player.applyDisorient(2500)
    }
  }

  _doSpit(player) {
    const dx = player.x - this.x
    const dy = player.y - this.y
    const d  = Math.sqrt(dx * dx + dy * dy)
    if (d < 1) return
    const proj = this.scene.add.rectangle(this.x, this.y, 6, 6, 0x0a0a0a)
    this.scene.physics.add.existing(proj)
    proj.body.setVelocity((dx / d) * 220, (dy / d) * 220)
    proj.damage    = Math.round(this._effectiveDamage() * 0.8)
    proj.corrosive = true
    this._enemyProjectiles.add(proj)
    this.scene.time.delayedCall(2500, () => { if (proj.active) proj.destroy() })
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  _moveTo(tx, ty) {
    const dx  = tx - this.x
    const dy  = ty - this.y
    const d   = Math.sqrt(dx * dx + dy * dy)
    if (d < 4) return
    const spd = (this._inWater ? this.speed : this.speed * 0.65) * this._slowMult
    this.body.setVelocity((dx / d) * spd, (dy / d) * spd)
  }

  _effectiveDamage() {
    return this._inWater ? this.damage : Math.round(this.damage * 0.8)
  }

  _checkWater() {
    const tx = Math.floor(this.x / TILE_SIZE)
    const ty = Math.floor(this.y / TILE_SIZE)
    this._inWater = this.scene.grid?.[ty]?.[tx] === TILE.WATER
  }

  _tickCooldowns(delta) {
    if (this.attackCooldown    > 0) this.attackCooldown    -= delta
    if (this._spitCooldown     > 0) this._spitCooldown     -= delta
    if (this._sibilateCooldown > 0) this._sibilateCooldown -= delta
  }

  _syncVisuals() {
    this._drip?.setPosition(this.x, this.y + 8)
    this._drip?.setAlpha(this._inWater ? 0.9 : 0.3)
  }

  _goto(state, duration = 0) {
    this._state      = state
    this._stateTimer = duration
  }
}
