export class BaseEnemy extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, w, h, color, hp, damage, speed) {
    super(scene, x, y, w, h, color)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.hp = hp
    this.maxHp = hp
    this.damage = damage
    this.speed = speed
    this.alive = true
    this.attackCooldown = 0
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.hp -= amount
    const prev = this.fillColor
    this.fillColor = 0xffffff
    this.scene.time.delayedCall(80, () => { if (this.alive) this.fillColor = prev })
    if (this.hp <= 0) this._die()
  }

  _die() {
    this.alive = false
    this.scene._placeBloodPool(this.x, this.y)
    this.destroy()
  }

  chasePlayer(player) {
    if (!this.alive || !player?.alive) return
    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 5) return
    this.body.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed)
  }

  attackPlayer(player, delta) {
    if (!this.alive || !player?.alive) return
    this.attackCooldown -= delta
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    if (dist < 25 && this.attackCooldown <= 0) {
      player.takeDamage(this.damage)
      this.attackCooldown = 1000
    }
  }

  update(player, delta) {
    this.chasePlayer(player)
    this.attackPlayer(player, delta)
  }
}
