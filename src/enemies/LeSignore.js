import { BaseEnemy } from './BaseEnemy.js'

const S = {
  PATROL: 'PATROL',
  AGGRO_RUSH: 'AGGRO_RUSH',
  EVALUATE: 'EVALUATE',
  DIVE: 'DIVE',
  DIVE_CHARGE: 'DIVE_CHARGE',
  CLAW: 'CLAW',
  WINGBEAT: 'WINGBEAT',
  RECOVER: 'RECOVER',
  ENRAGE_RETREAT: 'ENRAGE_RETREAT'
}

const BASE_COLOR = 0x3a1a4a
const ENRAGE_COLOR = 0x5a1a2a
const VISION_RANGE = 200
const VISION_HALF_ANGLE = Math.PI / 3  // 60° → cono 120° totale
const AGGRO_RADIUS = 120

export class LeSignore extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 20, 20, BASE_COLOR, 120, 0, 60)
    this.setDepth(2)

    this._state = S.PATROL
    this._stateTimer = 0
    this._patrolCenter = { x, y }
    this._patrolAngle = Math.random() * Math.PI * 2
    this._facingAngle = Math.random() * Math.PI * 2
    this._enraged = false
    this._floatTime = Math.random() * 3000  // desync tra più istanze
    this._diveTarget = null

    this._shadow = scene.add.rectangle(x, y + 12, 18, 6, 0x000000).setAlpha(0.2).setDepth(1)
    this._eyeGlow = scene.add.rectangle(x, y - 3, 6, 3, 0x886600).setDepth(3)

    this._onSignoraDied = () => this._handleCompagnaDied()
    scene.events.on('signora_died', this._onSignoraDied)
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.hp -= amount
    this.fillColor = 0xffffff
    this.scene.time.delayedCall(80, () => {
      if (this.alive) this.fillColor = this._enraged ? ENRAGE_COLOR : BASE_COLOR
    })
    if (this.hp <= 0) this._die()
  }

  _die() {
    this.alive = false
    if (this.body) {
      this.body.setVelocity(0, 0)
      this.body.enable = false
    }
    this.scene.events.emit('signora_died')
    this._shadow?.destroy()
    this._eyeGlow?.destroy()
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 400,
      onComplete: () => { if (this.active) this.destroy() }
    })
  }

  update(player, delta) {
    if (!this.alive) return
    this._floatTime += delta
    this._stateTimer -= delta
    this._tickBound(delta)
    this._syncVisuals()
    if (this._bound) {
      this.body.setVelocity(0, 0)
      return
    }
    this._tick(player, delta)
  }

  destroy() {
    this.scene?.events.off('signora_died', this._onSignoraDied)
    this._shadow?.destroy()
    this._eyeGlow?.destroy()
    super.destroy()
  }

  // ─── FSM ────────────────────────────────────────────────────────────────────

  _tick(player, delta) {
    if (!player?.alive) return
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)

    switch (this._state) {
      case S.PATROL:
        this._doPatrol(delta)
        if (this._inCone(player, dist)) this._goto(S.AGGRO_RUSH)
        break

      case S.AGGRO_RUSH: {
        const spd = this._enraged ? 200 * 1.4 : 200
        this._moveTo(player.x, player.y, spd)
        if (dist < AGGRO_RADIUS) this._goto(S.EVALUATE, this._enraged ? 0 : 300)
        break
      }

      case S.EVALUATE:
        this.body.setVelocity(0, 0)
        if (this._stateTimer <= 0) this._chooseAttack(player, dist)
        break

      case S.DIVE:
        // velocità di step-back impostata in _startDive; aspetta wind-up
        if (this._stateTimer <= 0) {
          this._diveTarget = { x: player.x, y: player.y }
          this._goto(S.DIVE_CHARGE)
        }
        break

      case S.DIVE_CHARGE: {
        this._moveTo(this._diveTarget.x, this._diveTarget.y, 280)
        const atTarget = Phaser.Math.Distance.Between(
          this.x, this.y, this._diveTarget.x, this._diveTarget.y) < 12
        if (dist < 22) {
          const dmg = this._enraged ? Math.round(25 * 1.3) : 25
          player.takeDamage(dmg)
          this._goto(S.RECOVER, 200)
        } else if (atTarget) {
          this._goto(S.RECOVER, 800)  // dive mancata — finestra vulnerabilità
        }
        break
      }

      case S.CLAW:
        this.body.setVelocity(0, 0)
        if (this._stateTimer <= 0) this._goto(S.RECOVER, 300)
        break

      case S.WINGBEAT:
        this.body.setVelocity(0, 0)
        if (this._stateTimer <= 0) {
          this._doWingbeat(player, dist)
          this._goto(S.RECOVER, 300)
        }
        break

      case S.RECOVER:
        this.body.setVelocity(0, 0)
        if (this._stateTimer <= 0) this._goto(S.AGGRO_RUSH)
        break

      case S.ENRAGE_RETREAT:
        if (this._stateTimer <= 0) this._goto(S.AGGRO_RUSH)
        break
    }
  }

  // ─── Attack helpers ──────────────────────────────────────────────────────────

  _chooseAttack(player, dist) {
    const pv = player.body?.velocity
    const playerMoving = pv && (Math.abs(pv.x) > 5 || Math.abs(pv.y) > 5)

    if (dist < 45 && !playerMoving) {
      this._startClaw(player)
    } else if (!playerMoving || dist > 80) {
      this._startDive(player)
    } else {
      this.body.setVelocity(0, 0)
      this._goto(S.WINGBEAT, 400)
    }
  }

  _startDive(player) {
    const away = Math.atan2(this.y - player.y, this.x - player.x)
    this._moveTo(this.x + Math.cos(away) * 60, this.y + Math.sin(away) * 60, 300)
    this._goto(S.DIVE, 200)
  }

  _startClaw(player) {
    this._goto(S.CLAW, 450)
    const dmg = this._enraged ? Math.round(15 * 1.3) : 15
    ;[100, 250].forEach(delay => {
      this.scene.time.delayedCall(delay, () => {
        if (!this.alive || this._state !== S.CLAW) return
        if (Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) < 35)
          player.takeDamage(dmg)
      })
    })
  }

  _doWingbeat(player, dist) {
    if (dist > 80) return
    const toPlayer = Math.atan2(player.y - this.y, player.x - this.x)
    const diff = Phaser.Math.Angle.Wrap(toPlayer - this._facingAngle)
    if (Math.abs(diff) > Math.PI / 3) return  // fuori dal cono
    const dmg = this._enraged ? Math.round(10 * 1.3) : 10
    player.takeDamage(dmg)
  }

  _handleCompagnaDied() {
    if (!this.alive || this._enraged) return
    this._enraged = true
    this._eyeGlow.fillColor = 0xff2200
    this.fillColor = 0xffffff
    this.scene.time.delayedCall(120, () => { if (this.alive) this.fillColor = ENRAGE_COLOR })
    const player = this.scene.player
    if (player) {
      const away = Math.atan2(this.y - player.y, this.x - player.x)
      this.body.setVelocity(Math.cos(away) * 220, Math.sin(away) * 220)
    }
    this._goto(S.ENRAGE_RETREAT, 600)
  }

  // ─── Movement & detection ────────────────────────────────────────────────────

  _doPatrol(delta) {
    this._patrolAngle += delta * 0.001
    const tx = this._patrolCenter.x + Math.cos(this._patrolAngle) * 50
    const ty = this._patrolCenter.y + Math.sin(this._patrolAngle) * 50
    this._moveTo(tx, ty, 60)
  }

  _inCone(player, dist) {
    if (dist > VISION_RANGE) return false
    if (player._fusionActive && player._inShadow) return false
    const toPlayer = Math.atan2(player.y - this.y, player.x - this.x)
    return Math.abs(Phaser.Math.Angle.Wrap(toPlayer - this._facingAngle)) < VISION_HALF_ANGLE
  }

  _moveTo(tx, ty, speed) {
    const dx = tx - this.x
    const dy = ty - this.y
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d < 4) return
    const vx = (dx / d) * speed
    const vy = (dy / d) * speed
    this.body.setVelocity(vx, vy)
    this._facingAngle = Math.atan2(vy, vx)
  }

  _goto(state, duration = 0) {
    this._state = state
    this._stateTimer = duration
  }

  // ─── Visuals ──────────────────────────────────────────────────────────────────

  _syncVisuals() {
    const f = Math.sin(this._floatTime / 600)
    this._shadow.setPosition(this.x, this.y + 12)
    this._shadow.setAlpha(0.2 - Math.abs(f) * 0.05)  // shadow fades quando "alta"
    this._eyeGlow.setPosition(this.x, this.y - 3)
  }
}
