import { BaseEnemy } from './BaseEnemy.js'

export class SkravMembro extends BaseEnemy {
  constructor(scene, x, y, alpha) {
    super(scene, x, y, 14, 12, 0x5a4020, 25, 8, 120)
    this._alpha = alpha
    this._state = 'waiting'
    this._fleeDuration = 0
  }

  update(player, delta) {
    if (!this.alive) return
    this._updateState(delta)

    if (this._state === 'chase') {
      this.chasePlayer(player)
      this.attackPlayer(player, delta)
    } else if (this._state === 'flee') {
      this._flee(player)
    } else if (this._state === 'waiting') {
      this._driftToAlpha()
    } else {
      this.body.setVelocity(0, 0)
    }
  }

  _updateState(delta) {
    if (!this._alpha?.alive) {
      if (this._state !== 'flee' && this._state !== 'scattered') {
        this._state = 'flee'
        this._fleeDuration = 3000
      }
    } else if (this._alpha.signalGiven && this._state === 'waiting') {
      this._state = 'chase'
    }

    if (this._state === 'flee') {
      this._fleeDuration -= delta
      if (this._fleeDuration <= 0) this._state = 'scattered'
    }
  }

  _driftToAlpha() {
    if (!this._alpha?.alive) return
    const dx = this._alpha.x - this.x
    const dy = this._alpha.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 40) { this.body.setVelocity(0, 0); return }
    const speed = this.speed * 0.4
    this.body.setVelocity((dx / dist) * speed, (dy / dist) * speed)
  }

  _flee(player) {
    if (!player?.alive) return
    const dx = this.x - player.x
    const dy = this.y - player.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 5) return
    this.body.setVelocity((dx / dist) * this.speed * 1.3, (dy / dist) * this.speed * 1.3)
  }
}
