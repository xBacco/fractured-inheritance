import { BaseEnemy } from './BaseEnemy.js'

export class EsecutoreIllyrium extends BaseEnemy {
  constructor(scene, x, y, flankOffset = 0) {
    super(scene, x, y, 18, 18, 0x5a6070, 60, 10, 90)
    this._flankOffset = flankOffset
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.hp -= amount
    if (this.hp <= 0) this._die()
  }

  _die() {
    this.alive = false
    if (this.body) {
      this.body.setVelocity(0, 0)
      this.body.enable = false
    }
    this.fillColor = 0x2a2d32
  }

  chasePlayer(player) {
    if (!this.alive || !player?.alive || this._bound) return
    if (player._fusionActive && player._inShadow) return
    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 5) return

    const baseAngle = Math.atan2(dy, dx)
    const isClosest = !this.scene.enemies.getChildren()
      .some(e => e !== this && e.alive && e instanceof EsecutoreIllyrium &&
        Phaser.Math.Distance.Between(e.x, e.y, player.x, player.y) < dist)

    const angle = isClosest ? baseAngle : baseAngle + this._flankOffset
    this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed)
  }
}
