import { BaseCharacter } from './BaseCharacter.js'
import { TILE_SIZE, PLAYER_SPEED } from '../config/GameConfig.js'
import { TILE, TILE_EFFECTS } from '../map/TileTypes.js'

const MAX_INTEGRITY = 100
const REGEN_RATE = 4
const REGEN_FAST = 12
const INTEGRITY_COLORS = [0x8888aa, 0x6666aa, 0xff4444, 0xff0000]

export class Zeryth extends BaseCharacter {
  constructor(scene, x, y) {
    super(scene, x, y, 20, 28, 0x8888aa)
    this.integrity = MAX_INTEGRITY
    this.maxIntegrity = MAX_INTEGRITY
    this.regenRate = REGEN_RATE
    this.alive = true
    this._prevX = x
    this._prevY = y

    this.swordHeld = false
    this.swordTimer = 0
    this.swordActive = false
    this.swordGfx = null
    this.projectiles = scene.physics.add.group()
    this.attackCooldown = 0
  }

  update(scene, delta) {
    super.update(scene)
    if (!this.alive) return
    this._handleRegen(scene, delta)
    this._handleAttacks(scene, delta)
    this._updateVisual()
    this._checkDeath(scene)
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.integrity = Math.max(0, this.integrity - amount)
  }

  _handleRegen(scene, delta) {
    const tileX = Math.floor(this.x / TILE_SIZE)
    const tileY = Math.floor(this.y / TILE_SIZE)
    const tile = scene.grid?.[tileY]?.[tileX] ?? TILE.FLOOR
    const effects = TILE_EFFECTS[tile]

    const isMoving = Math.abs(this.x - this._prevX) > 0.1 || Math.abs(this.y - this._prevY) > 0.1
    this._prevX = this.x
    this._prevY = this.y

    if (effects?.regenBlocked) return

    let rate = isMoving ? this.regenRate : REGEN_FAST
    if (effects?.zerythRegenMult) rate *= effects.zerythRegenMult

    this.integrity = Math.min(this.maxIntegrity, this.integrity + rate * (delta / 1000))
  }

  _handleAttacks(scene, delta) {
    if (this.attackCooldown > 0) this.attackCooldown -= delta

    if (this._lmbDown && this.attackCooldown <= 0) {
      this._strikeAttack(scene)
      this.attackCooldown = 300
    }

    if (this._rmbDown) {
      if (!this.swordHeld) {
        this.swordHeld = true
        this.swordTimer = 0
      }
      this.swordTimer += delta
      this._showSword(scene)
    } else if (this.swordHeld) {
      this.swordHeld = false
      this._hideSword()
      if (this.swordTimer > 400) {
        this._swordSlash(scene)
      } else {
        this._bloodProjectile(scene)
      }
    }
  }

  _strikeAttack(scene) {
    const reach = 30
    const hx = this.x + this.facingX * reach
    const hy = this.y + this.facingY * reach
    if (scene.enemies) {
      scene.enemies.getChildren().forEach(enemy => {
        const dist = Phaser.Math.Distance.Between(hx, hy, enemy.x, enemy.y)
        if (dist < 25) enemy.takeDamage(20)
      })
    }
  }

  _bloodProjectile(scene) {
    const cost = 8
    if (this.integrity - cost < 5) return
    this.takeDamage(cost)

    const proj = scene.add.rectangle(this.x, this.y, 6, 6, 0xcc0000)
    scene.physics.add.existing(proj)
    proj.body.setVelocity(this.facingX * 400, this.facingY * 400)
    proj.damage = 25
    proj.piercing = true
    this.projectiles.add(proj)

    scene.time.delayedCall(1500, () => proj.destroy())
  }

  _showSword(scene) {
    if (!this.swordGfx) {
      this.swordGfx = scene.add.rectangle(
        this.x + this.facingX * 20,
        this.y + this.facingY * 20,
        8, 28, 0xaa0000
      ).setDepth(5)
    }
    this.integrity = Math.max(5, this.integrity - 0.05)
    this.swordGfx.setPosition(
      this.x + this.facingX * 20,
      this.y + this.facingY * 20
    )
  }

  _hideSword() {
    if (this.swordGfx) { this.swordGfx.destroy(); this.swordGfx = null }
  }

  _swordSlash(scene) {
    if (scene.enemies) {
      scene.enemies.getChildren().forEach(enemy => {
        const dx = enemy.x - this.x
        const dy = enemy.y - this.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 50) enemy.takeDamage(40)
      })
    }
    const flash = scene.add.rectangle(this.x, this.y, 60, 60, 0xff0000, 0.3).setDepth(5)
    scene.time.delayedCall(150, () => flash.destroy())
  }

  _updateVisual() {
    const pct = this.integrity / this.maxIntegrity
    if (pct > 0.6)       this.fillColor = INTEGRITY_COLORS[0]
    else if (pct > 0.35) this.fillColor = INTEGRITY_COLORS[1]
    else if (pct > 0.15) this.fillColor = INTEGRITY_COLORS[2]
    else                 this.fillColor = INTEGRITY_COLORS[3]

    this.speed = pct < 0.2 ? PLAYER_SPEED * 0.5 : PLAYER_SPEED
  }

  rebindActions(scene) {
    // LMB/RMB are mouse buttons — no rebinding needed
  }

  _checkDeath(scene) {
    if (this.integrity <= 0) {
      this.alive = false
      // transizione a GameOverScene gestita da GameScene.update()
    }
  }
}
