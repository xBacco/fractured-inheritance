import { BaseEnemy } from './BaseEnemy.js'

export class SkravAlpha extends BaseEnemy {
  constructor(scene, x, y, enemyProjectiles) {
    super(scene, x, y, 26, 22, 0x7a7060, 120, 15, 65)
    this.signalGiven = false
    this._tailCooldown = 0
    this._enemyProjectiles = enemyProjectiles
  }

  update(player, delta) {
    if (!this.alive || !player?.alive) return
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    if (!this.signalGiven && dist < 110) {
      this.signalGiven = true
      this._flashSignal()
    }
    if (this.signalGiven) {
      this.chasePlayer(player)
      this.attackPlayer(player, delta)
      this._tailCooldown -= delta
      if (dist > 60 && dist < 180 && this._tailCooldown <= 0) {
        this._fireTail(player)
        this._tailCooldown = 2200
      }
    }
  }

  _flashSignal() {
    const prev = this.fillColor
    this.fillColor = 0xffcc00
    this.scene.time.delayedCall(150, () => { if (this.alive) this.fillColor = prev })
  }

  _fireTail(player) {
    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const proj = this.scene.add.rectangle(this.x, this.y, 8, 8, 0x3a2810)
    this.scene.physics.add.existing(proj)
    proj.body.setVelocity((dx / dist) * 200, (dy / dist) * 200)
    proj.damage = 12
    this._enemyProjectiles.add(proj)
    this.scene.time.delayedCall(2000, () => { if (proj.active) proj.destroy() })
  }
}
