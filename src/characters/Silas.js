import { BaseCharacter } from './BaseCharacter.js'
import { PLAYER_SPEED, TILE_SIZE } from '../config/GameConfig.js'
import { KeyBindings } from '../config/KeyBindings.js'
import { TILE } from '../map/TileTypes.js'
import {
  TEMP_MAX, TEMP_MIN,
  TEMP_DRAIN_BIND, TEMP_DRAIN_TELEPORT, TEMP_DRAIN_HIT,
  tempDelta, isFrozen, speedMultiplier, powersEnabled,
} from './SilasTemp.js'

const FUSION_PULSE_MS = 400
const FUSION_ALPHA_LOW  = 0.1
const FUSION_ALPHA_HIGH = 0.8
const BACKSTAB_MULT = 3

export class Silas extends BaseCharacter {
  constructor(scene, x, y) {
    super(scene, x, y, 16, 24, 0x0a0a1a)

    this.temperature = TEMP_MAX
    this.alive = true
    this._dead  = false

    this._fusionActive   = false
    this._hadFusion      = false
    this._inShadow       = false
    this._fusionPulseMs  = 0

    this._bindCooldown  = 0
    this.attackCooldown = 0

    this.qKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability1'))
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))

    this.projectiles = scene.physics.add.group()

    this._tempIndicator   = scene.add.rectangle(this.x, this.y - 20, 6, 6, 0x0a0a1a).setDepth(6)
    this._shadowIndicator = scene.add.rectangle(this.x - 12, this.y, 4, 4, 0x111111).setDepth(6)
  }

  update(scene, delta) {
    super.update(scene)
    if (!this.alive) return

    const tileX = Math.floor(this.x / TILE_SIZE)
    const tileY = Math.floor(this.y / TILE_SIZE)
    this._inShadow = scene.isInShadow(tileX, tileY)

    this._updateTemperature(delta)
    this._handleAbilities(scene, delta)
    this._handleAttack(scene, delta)
    this._updateVisual(delta)
    this._checkDeath(scene)
  }

  takeDamage(amount) {
    if (!this.alive) return
    if (isFrozen(this.temperature)) {
      this.alive = false
      return
    }
    this.temperature = Math.max(TEMP_MIN, this.temperature - TEMP_DRAIN_HIT)
    const prev = this.fillColor
    this.fillColor = 0x4488ff
    this.scene.time.delayedCall(80, () => { if (this.alive) this.fillColor = prev })
  }

  rebindActions(scene) {
    scene.input.keyboard.removeKey(this.qKey)
    scene.input.keyboard.removeKey(this.fKey)
    this.qKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability1'))
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))
  }

  _updateTemperature(delta) {
    const dt = tempDelta(this._inShadow, this._fusionActive, delta)
    this.temperature = Math.max(TEMP_MIN, Math.min(TEMP_MAX, this.temperature + dt))

    if (isFrozen(this.temperature)) {
      this._fusionActive = false
      this._hadFusion    = false
    }

    this.speed = PLAYER_SPEED * speedMultiplier(this.temperature)
  }

  _handleAbilities(scene, delta) {
    if (this._bindCooldown > 0) this._bindCooldown -= delta

    const canUse = this._inShadow && powersEnabled(this.temperature)

    if (this._rmbDown && canUse && this._bindCooldown <= 0) {
      this._shadowBind(scene)
      this._bindCooldown = 1500
      this._rmbDown = false
    }

    if (Phaser.Input.Keyboard.JustDown(this.qKey) && canUse) {
      this._shadowTeleport(scene)
    }

    if (Phaser.Input.Keyboard.JustDown(this.fKey) && canUse) {
      this._fusionActive = !this._fusionActive
      if (this._fusionActive) this._hadFusion = true
    }
  }

  _handleAttack(scene, delta) {
    if (this.attackCooldown > 0) this.attackCooldown -= delta
    if (!this._lmbDown || this.attackCooldown > 0) return
    this._strike(scene)
    this.attackCooldown = 250
  }

  _strike(scene) {
    if (!scene.enemies) return
    const reach = 30
    const aimX  = this.facingX
    const aimY  = this.facingY

    const isBackstab = this._hadFusion && this._inShadow
    let dmg = isBackstab ? 12 * BACKSTAB_MULT : this._inShadow ? 18 : 12

    if (isBackstab) {
      this._fusionActive = false
      this._hadFusion    = false
    }

    const color = isBackstab ? 0xff4400 : 0x4488ff
    const fx = scene.add.rectangle(this.x + aimX * reach, this.y + aimY * reach, 10, 10, color, 0.7).setDepth(5)
    scene.time.delayedCall(120, () => { if (fx.active) fx.destroy() })

    scene.enemies.getChildren().forEach(enemy => {
      if (Phaser.Math.Distance.Between(this.x + aimX * reach, this.y + aimY * reach, enemy.x, enemy.y) < 25) {
        const finalDmg = enemy._bound ? dmg * 2 : dmg
        enemy.takeDamage(finalDmg)
      }
    })
  }

  _shadowBind(scene) {
    if (!scene.enemies) return
    let nearest = null
    let nearestDist = Infinity

    scene.enemies.getChildren().forEach(enemy => {
      if (!enemy.alive) return
      const d = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (d < 50 && d < nearestDist) { nearest = enemy; nearestDist = d }
    })

    if (!nearest) return

    nearest._bound      = true
    nearest._boundTimer = 2000
    this.temperature    = Math.max(TEMP_MIN, this.temperature - TEMP_DRAIN_BIND)

    const prev = nearest.fillColor
    nearest.fillColor = 0x4400aa
    scene.time.delayedCall(300, () => { if (nearest.alive) nearest.fillColor = prev })
  }

  _shadowTeleport(scene) {
    const STEP_PX = 8
    const MAX_DIST = 80
    const steps = Math.floor(MAX_DIST / STEP_PX)
    let tx = this.x
    let ty = this.y

    for (let i = 1; i <= steps; i++) {
      const nx = this.x + this.facingX * STEP_PX * i
      const ny = this.y + this.facingY * STEP_PX * i
      const tileX = Math.floor(nx / TILE_SIZE)
      const tileY = Math.floor(ny / TILE_SIZE)
      const tile  = scene.grid?.[tileY]?.[tileX]

      if (tile === TILE.LIGHT) break
      if (!scene.isWalkable(tileX, tileY)) break
      tx = nx
      ty = ny
    }

    if (tx === this.x && ty === this.y) return
    this.x = tx
    this.y = ty
    this.body.reset(tx, ty)
    this.temperature = Math.max(TEMP_MIN, this.temperature - TEMP_DRAIN_TELEPORT)
  }

  _updateVisual(delta) {
    // Body color: warm #0a0a1a → frozen #4488ff
    const t = 1 - (this.temperature / TEMP_MAX)
    const r = Math.round(0x0a + t * (0x44 - 0x0a))
    const g = Math.round(0x0a + t * (0x88 - 0x0a))
    const b = Math.round(0x1a + t * (0xff - 0x1a))
    this.fillColor = (r << 16) | (g << 8) | b

    // Fusion pulse: alpha oscillates 0.1↔0.8 every 400ms
    const fusionEffective = this._fusionActive && this._inShadow
    if (fusionEffective) {
      this._fusionPulseMs += delta
      const pulse = (Math.sin(this._fusionPulseMs * Math.PI * 2 / FUSION_PULSE_MS) + 1) / 2
      this.setAlpha(FUSION_ALPHA_LOW + (FUSION_ALPHA_HIGH - FUSION_ALPHA_LOW) * pulse)
    } else {
      this.setAlpha(1)
    }

    // Indicators
    this._tempIndicator.setPosition(this.x, this.y - 20)
    this._tempIndicator.fillColor = (r << 16) | (g << 8) | b

    this._shadowIndicator.setPosition(this.x - 12, this.y)
    this._shadowIndicator.fillColor = this._inShadow ? 0x003300 : 0x111111
  }

  _checkDeath(scene) {
    if (!this.alive && !this._dead) {
      this._dead = true
      this._tempIndicator.destroy()
      this._shadowIndicator.destroy()
      scene.scene.start('GameOverScene', { score: scene.scoreSystem?.getScore() ?? 0 })
    }
  }
}
