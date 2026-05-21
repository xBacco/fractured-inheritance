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
    this._bound = false
    this._boundTimer = 0
    this._slowTimer  = 0
    this._slowMult   = 1
    this._acidMs     = 0
    this._acidDps    = 0
  }

  _tickBound(delta) {
    if (!this._bound) return
    this._boundTimer -= delta
    if (this._boundTimer <= 0) {
      this._bound = false
      this._boundTimer = 0
    }
  }

  _tickSlowAndAcid(delta) {
    if (this._slowTimer > 0) {
      this._slowTimer -= delta
      if (this._slowTimer <= 0) { this._slowTimer = 0; this._slowMult = 1 }
    }
    if (this._acidMs > 0) {
      this._acidMs -= delta
      const dmg = this._acidDps * (delta / 1000)
      this.hp -= dmg
      if (this.hp <= 0) this._die()
    }
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
    this.scene.events.emit('enemy_killed', this.x, this.y)
    this.scene._placeBloodPool(this.x, this.y)
    this.destroy()
  }

  chasePlayer(player) {
    if (!this.alive || !player?.alive || this._bound) return
    if (player._fusionActive && player._inShadow) return
    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 5) return
    const effectiveSpeed = this.speed * this._slowMult
    this.body.setVelocity((dx / dist) * effectiveSpeed, (dy / dist) * effectiveSpeed)
  }

  attackPlayer(player, delta) {
    if (!this.alive || !player?.alive || this._bound) return
    if (player._fusionActive && player._inShadow) return
    this.attackCooldown -= delta
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    if (dist < 25 && this.attackCooldown <= 0) {
      player.takeDamage(this.damage)
      this.attackCooldown = 1000
    }
  }

  update(player, delta) {
    this._tickBound(delta)
    this._tickSlowAndAcid(delta)
    this.chasePlayer(player)
    this.attackPlayer(player, delta)
  }
}
