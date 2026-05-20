import { BaseEnemy } from './BaseEnemy.js'

export class EsecutoreComune extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 18, 18, 0x5a6070, 60, 10, 90)
    this._isLeader = false
    this._formation = null
    this._slot = 'fronte'

    this._eyeL = scene.add.rectangle(x - 5, y - 5, 2, 2, 0xffffff).setDepth(1)
    this._eyeR = scene.add.rectangle(x + 3, y - 5, 2, 2, 0xffffff).setDepth(1)
    this._seal = scene.add.rectangle(x, y + 3, 3, 3, 0x7888a0).setDepth(1)
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.hp -= amount
    this._updateDegradation()
    if (this.hp <= 0) this._die()
  }

  _die() {
    this.alive = false
    if (this.body) {
      this.body.setVelocity(0, 0)
      this.body.enable = false
    }
    this.fillColor = 0x2a2d32
    this._eyeL.fillColor = 0x222222
    this._eyeR.fillColor = 0x222222
    this._seal.fillColor = 0x1a1a1a
    if (this._formation) this._formation.onUnitDied(this)
  }

  chasePlayer(player) {
    if (!this.alive || !player?.alive || this._bound) return
    if (player._fusionActive && player._inShadow) return
    if (this._formation?.isPaused()) {
      this.body.setVelocity(0, 0)
      return
    }

    let targetX, targetY
    if (this._formation) {
      const t = this._formation.getSlotTarget(this._slot, player.x, player.y)
      targetX = t.x
      targetY = t.y
    } else {
      targetX = player.x
      targetY = player.y
    }

    const dx = targetX - this.x
    const dy = targetY - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 5) return
    this.body.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed)
  }

  attackPlayer(player, delta) {
    if (!this.alive || !player?.alive || this._bound) return
    if (player._fusionActive && player._inShadow) return
    this.attackCooldown -= delta
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    const cooldown = (this._formation?.leaderless && !this._isLeader) ? 1200 : 1000
    if (dist < 25 && this.attackCooldown <= 0) {
      player.takeDamage(this.damage)
      this.attackCooldown = cooldown
    }
  }

  update(player, delta) {
    if (!this.alive) return
    this._tickBound(delta)
    this._syncDecorations()
    this.chasePlayer(player)
    this.attackPlayer(player, delta)
  }

  destroy() {
    this._eyeL?.destroy()
    this._eyeR?.destroy()
    this._seal?.destroy()
    super.destroy()
  }

  _syncDecorations() {
    this._eyeL.setPosition(this.x - 5, this.y - 5)
    this._eyeR.setPosition(this.x + 3, this.y - 5)
    this._seal.setPosition(this.x, this.y + 3)
  }

  _updateDegradation() {
    const pct = this.hp / this.maxHp
    if (pct > 0.5) {
      this._eyeL.fillColor = 0xffffff
      this._eyeR.fillColor = 0xffffff
      this._seal.fillColor = 0x7888a0
    } else if (pct > 0.2) {
      this._eyeL.fillColor = 0x222222
      this._eyeR.fillColor = 0xffffff
      this._seal.fillColor = 0x7888a0
    } else {
      this._eyeL.fillColor = 0x222222
      this._eyeR.fillColor = 0x222222
      this._seal.fillColor = 0x333333
    }
  }
}
