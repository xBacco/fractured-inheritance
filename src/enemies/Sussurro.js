import { BaseEnemy } from './BaseEnemy.js'

const BASE_COLOR   = 0x252525
const CHARGE_COLOR = 0xb8b8b8

const S = {
  WANDER:  'WANDER',
  AGGRO:   'AGGRO',
  CHARGE:  'CHARGE',
  SCATTER: 'SCATTER',
}

const AGGRO_RANGE  = 220
const CHARGE_RANGE = 45
const SCREAM_RANGE = 120
const SCREAM_HALF  = Math.PI / 3   // cono ±60°
const AoE_RADIUS   = 80
const AoE_DAMAGE   = 20
const CHAIN_HP_PCT = 0.2

export class Sussurro extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 14, 30, BASE_COLOR, 45, 18, 70)
    this.setAlpha(0.18)
    this.setDepth(3)
    this.body.setCollideWorldBounds(true)

    this._state       = S.WANDER
    this._stateTimer  = 0
    this._wobble      = Math.random() * Math.PI * 2
    this._wanderAngle = Math.random() * Math.PI * 2
    this._facingAngle = 0

    this._mouth = scene.add.rectangle(x, y - 2, 8, 3, 0xf0f0f0).setDepth(4).setAlpha(0)
  }

  update(player, delta) {
    if (!this.alive) return
    this._stateTimer -= delta
    this._tickBound(delta)
    this._tickSlowAndAcid(delta)
    this._wobble += delta * 0.003
    this._syncVisuals()
    if (this._bound) {
      this.body.setVelocity(0, 0)
      if (this._state === S.CHARGE && this._stateTimer <= 0) this._goto(S.SCATTER, 600)
      return
    }
    this._tick(player, delta)
  }

  takeDamage(amount) {
    if (!this.alive) return
    if (this._state !== S.CHARGE) return
    this.hp -= amount
    this.fillColor = 0xffffff
    this.scene.time.delayedCall(80, () => { if (this.alive) this.fillColor = CHARGE_COLOR })
    if (this.hp <= 0) this._die()
  }

  destroy() {
    this._mouth?.destroy()
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
    this._mouth?.destroy()
    this._explode()
    this.fillColor = 0xffffff
    this.setAlpha(0.9)
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 3,
      scaleY: 3,
      duration: 350,
      ease: 'Power2',
      onComplete: () => { if (this.active) this.destroy() }
    })
  }

  _explode() {
    const player = this.scene.player
    if (player?.alive) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
      if (dist < AoE_RADIUS) player.takeDamage(AoE_DAMAGE)
    }

    this.scene.enemies.getChildren().slice().forEach(e => {
      if (!(e instanceof Sussurro) || !e.alive || e === this) return
      const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y)
      if (d < AoE_RADIUS && e.hp / e.maxHp < CHAIN_HP_PCT) e._die()
    })

    const ring = this.scene.add.graphics().setDepth(5)
    ring.lineStyle(2, 0xffffff, 0.85)
    ring.strokeCircle(0, 0, 8)
    ring.setPosition(this.x, this.y)
    this.scene.tweens.add({
      targets: ring,
      scaleX: AoE_RADIUS / 8,
      scaleY: AoE_RADIUS / 8,
      alpha: 0,
      duration: 350,
      ease: 'Power1',
      onComplete: () => { if (ring.active) ring.destroy() }
    })
  }

  // ─── FSM ──────────────────────────────────────────────────────────────────────

  _tick(player, delta) {
    if (!player?.alive) return
    const dist            = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    const playerStationary = this._isPlayerStationary(player)

    switch (this._state) {
      case S.WANDER:
        this._doWander()
        if (dist < AGGRO_RANGE) this._goto(S.AGGRO)
        break

      case S.AGGRO:
        this._moveTo(player.x, player.y, 140)
        if (dist > AGGRO_RANGE + 40) this._goto(S.WANDER)
        if (playerStationary || dist < CHARGE_RANGE) this._startCharge(player)
        break

      case S.CHARGE:
        this.body.setVelocity(0, 0)
        if (this._stateTimer <= 0) {
          this._doScream(player, dist)
          const away = Math.atan2(this.y - player.y, this.x - player.x)
          this.body.setVelocity(Math.cos(away) * 180, Math.sin(away) * 180)
          this._goto(S.SCATTER, 600)
        }
        break

      case S.SCATTER:
        if (this._stateTimer <= 0) this._goto(dist < AGGRO_RANGE ? S.AGGRO : S.WANDER)
        break
    }
  }

  // ─── Attacks ──────────────────────────────────────────────────────────────────

  _startCharge(player) {
    if (this._state === S.CHARGE) return
    this._goto(S.CHARGE, 800)
    this._facingAngle = Math.atan2(player.y - this.y, player.x - this.x)
    this._showWhisperText(player)
  }

  _doScream(player, dist) {
    if (!player?.alive || dist > SCREAM_RANGE) return
    const toPlayer = Math.atan2(player.y - this.y, player.x - this.x)
    const diff     = Math.abs(Phaser.Math.Angle.Wrap(toPlayer - this._facingAngle))
    if (diff < SCREAM_HALF) {
      player.takeDamage(this.damage)
      if (typeof player.applyDisorient === 'function') player.applyDisorient(1000)
    }
  }

  _showWhisperText(player) {
    const lines = ['...ti conosco...', '...ascolta...', '...fermati...']
    const txt   = this.scene.add.text(
      player.x, player.y - 36,
      lines[Math.floor(Math.random() * lines.length)],
      { fontSize: '10px', color: '#b8b8b8', fontFamily: 'monospace' }
    ).setDepth(20).setOrigin(0.5, 1).setAlpha(0)

    this.scene.tweens.add({
      targets: txt,
      alpha: 0.85,
      duration: 400,
      onUpdate: () => { if (txt.active) txt.setPosition(player.x, player.y - 52) },
      onComplete: () => {
        this.scene.tweens.add({
          targets: txt,
          alpha: 0,
          duration: 600,
          delay: 500,
          onComplete: () => { if (txt.active) txt.destroy() }
        })
      }
    })
  }

  // ─── Movement ─────────────────────────────────────────────────────────────────

  _doWander() {
    if (this._stateTimer > 0) return
    this._wanderAngle = Math.random() * Math.PI * 2
    this._stateTimer  = Phaser.Math.Between(1500, 3000)
    const spd = this.speed * this._slowMult
    this.body.setVelocity(Math.cos(this._wanderAngle) * spd, Math.sin(this._wanderAngle) * spd)
  }

  _moveTo(tx, ty, speed) {
    const dx = tx - this.x
    const dy = ty - this.y
    const d  = Math.sqrt(dx * dx + dy * dy)
    if (d < 4) return
    const spd = speed * this._slowMult
    this.body.setVelocity((dx / d) * spd, (dy / d) * spd)
    this._facingAngle = Math.atan2(dy, dx)
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  _isPlayerStationary(player) {
    const vx = player.body?.velocity?.x ?? 0
    const vy = player.body?.velocity?.y ?? 0
    return Math.abs(vx) < 8 && Math.abs(vy) < 8
  }

  _syncVisuals() {
    const inCharge = this._state === S.CHARGE
    const h        = 30 + Math.sin(this._wobble) * 4
    this.setSize(inCharge ? 6 : 14, h)
    this.fillColor = inCharge ? CHARGE_COLOR : BASE_COLOR
    this.setAlpha(inCharge ? 0.5 : 0.18)
    this._mouth?.setPosition(this.x, this.y - 2).setAlpha(inCharge ? 0.9 : 0)
  }

  _goto(state, duration = 0) {
    this._state      = state
    this._stateTimer = duration
  }
}
