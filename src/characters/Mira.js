import { BaseCharacter } from './BaseCharacter.js'
import { PLAYER_SPEED, TILE_SIZE } from '../config/GameConfig.js'
import { KeyBindings } from '../config/KeyBindings.js'
import { TILE } from '../map/TileTypes.js'
import {
  TEMP_MAX, TEMP_LOCKOUT_MS, GLOVES_MAX,
  MAT, materialForTile, abilityCost, wallDuration, rmbDamage,
  tempAfterDecay, tempWithCost, isOverheat,
  reboundResult,
  REBOUND_INVINCIBLE_MS, REBOUND_VIGNETTE_MS,
} from './MiraAlchemy.js'

const HP_MAX = 100

export class Mira extends BaseCharacter {
  constructor(scene, x, y) {
    super(scene, x, y, 16, 24, 0xD44E0A)

    this.hp          = HP_MAX
    this.temperature = 0
    this.gloves      = GLOVES_MAX
    this.alive       = true
    this._dead       = false

    this._lockoutMs     = 0
    this._reboundMs     = 0
    this._invincibleMs  = 0
    this._bleedMs       = 0
    this._bleedDps      = 0
    this._vignetteMs    = 0
    this._attackCooldown = 0

    this._qDown     = false
    this._qHoldMs   = 0
    this._qOnMetal  = false
    this._qShield   = null
    this._qShieldActive = false

    this.qKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability1'))
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))
    this.projectiles = scene.physics.add.group()

    this._tempBar   = scene.add.rectangle(0, 0, 50, 6, 0x3AAEFF).setScrollFactor(0).setDepth(20)
    this._glovesBar = scene.add.rectangle(0, 0, 50, 6, 0x00aa44).setScrollFactor(0).setDepth(20)
    this._vignette  = scene.add.rectangle(0, 0, 1, 1, 0xff0000, 0).setScrollFactor(0).setDepth(25)
  }

  update(scene, delta) {
    if (!this.alive) { this._checkDeath(scene); return }

    if (this._reboundMs > 0) {
      this._tickRebound(scene, delta)
      return
    }

    super.update(scene)
    this._tickTemperature(delta)
    this._tickLockout(delta)
    this._tickAttackCooldown(delta)
    this._handleAbilities(scene, delta)
    this._tickBleed(delta)
    this._updateVisual(scene)
    this._checkDeath(scene)
  }

  takeDamage(amount) {
    if (!this.alive || this._invincibleMs > 0) return
    if (this._qShieldActive) {
      this._qShieldActive = false
      if (this._qShield?.active) this._qShield.destroy()
      return
    }
    this.hp = Math.max(0, this.hp - amount)
    if (this.hp <= 0) this.alive = false
    this.fillColor = 0xff8800
    this.scene.time.delayedCall(80, () => { if (this.alive) this.fillColor = 0xD44E0A })
  }

  rebindActions(scene) {
    scene.input.keyboard.removeKey(this.qKey)
    scene.input.keyboard.removeKey(this.fKey)
    this.qKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability1'))
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))
  }

  // ── Tick helpers ──────────────────────────────────────────────────────────

  _tickTemperature(delta) {
    this.temperature = tempAfterDecay(this.temperature, delta)
  }

  _tickLockout(delta) {
    if (this._lockoutMs > 0) this._lockoutMs -= delta
  }

  _tickAttackCooldown(delta) {
    if (this._attackCooldown > 0) this._attackCooldown -= delta
  }

  _precastCheck(scene) {
    if (this._lockoutMs > 0 || this.gloves <= 0) {
      this._triggerRebound(scene)
      return true
    }
    return false
  }

  _postcastCheck() {
    if (isOverheat(this.temperature)) {
      this._lockoutMs = TEMP_LOCKOUT_MS
    }
  }

  _handleAbilities(scene, delta) {
    this._handleLMB(scene)
    this._handleRMB(scene)
    this._handleQ(scene, delta)
    this._handleF(scene)
  }

  _handleLMB(scene)      { /* Task 7 */ }
  _handleRMB(scene)      { /* Task 8 */ }
  _handleQ(scene, delta) { /* Task 9 */ }
  _handleF(scene)        { /* Task 10 */ }

  // Stubs for later tasks — will be implemented in Tasks 11 and 12
  _triggerRebound(scene)     { /* Task 11 */ }
  _tickRebound(scene, delta) { /* Task 11 */ }
  _tickBleed(delta)          { /* Task 11 */ }
  _updateVignette(scene)     { /* Task 11 */ }
  _updateVisual(scene)       { /* Task 12 */ }
  _checkDeath(scene)         { /* Task 12 */ }
}
