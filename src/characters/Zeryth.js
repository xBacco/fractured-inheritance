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
  }

  update(scene, delta) {
    super.update(scene)
    if (!this.alive) return
    this._handleRegen(scene, delta)
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

  _updateVisual() {
    const pct = this.integrity / this.maxIntegrity
    if (pct > 0.6)       this.fillColor = INTEGRITY_COLORS[0]
    else if (pct > 0.35) this.fillColor = INTEGRITY_COLORS[1]
    else if (pct > 0.15) this.fillColor = INTEGRITY_COLORS[2]
    else                 this.fillColor = INTEGRITY_COLORS[3]

    this.speed = pct < 0.2 ? PLAYER_SPEED * 0.5 : PLAYER_SPEED
  }

  _checkDeath(scene) {
    if (this.integrity <= 0) {
      this.alive = false
      scene.scene.start('GameOverScene', { score: scene.scoreSystem?.getScore() ?? 0 })
    }
  }
}
