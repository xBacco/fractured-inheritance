import { BaseCharacter } from './BaseCharacter.js'
import { PLAYER_SPEED } from '../config/GameConfig.js'
import { KeyBindings } from '../config/KeyBindings.js'
import {
  BURST_COOLDOWN_MS,
} from './AetherionBurst.js'

const BASE_COLOR  = 0xE07828
const BURST_COLOR = 0xFFB040
const HP_MAX      = 100

export class Aetherion extends BaseCharacter {
  constructor(scene, x, y) {
    super(scene, x, y, 14, 26, BASE_COLOR)

    this.hp    = HP_MAX
    this.maxHp = HP_MAX
    this.alive = true
    this._dead = false
    this.speed = PLAYER_SPEED

    this._burstActive          = false
    this._burstMs              = 0
    this._burstCd              = 0
    this._selfDamageOffsetMs   = 0
    this._dissolveActive       = false
    this._dissolveMs           = 0
    this._dissolveCd           = 0
    this._lmbCd                = 0
    this._fCd                  = 0
    this._rootedMs             = 0
    this._disorientMs          = 0

    this.projectiles = scene.physics.add.group()

    this.qKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability1'))
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))

    // Cicatrice stellare (punto sul rettangolo)
    this._scar = scene.add.rectangle(x, y, 2, 2, BURST_COLOR).setDepth(4)

    // HUD: barra HP visibile (a differenza degli altri PG)
    this._hpBar = scene.add.rectangle(0, 0, 80, 6, BASE_COLOR).setScrollFactor(0).setDepth(20)

    // HUD: burst indicator (cerchio sotto barra HP)
    this._burstIndicator = scene.add.graphics().setScrollFactor(0).setDepth(20)
  }

  update(scene, delta) {
    if (!this.alive) { this._checkDeath(scene); return }
    this._tickCooldowns(delta)
    super.update(scene)
    this._syncScarPosition()
    this._updateHud(scene)
    this._checkDeath(scene)
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.hp = Math.max(0, this.hp - amount)
    if (this.hp <= 0) this.alive = false
    const prev = this.fillColor
    this.fillColor = 0xffffff
    this.scene.time.delayedCall(80, () => {
      if (this.alive) this.fillColor = this._burstActive ? BURST_COLOR : BASE_COLOR
    })
  }

  rebindActions(scene) {
    scene.input.keyboard.removeKey(this.qKey)
    scene.input.keyboard.removeKey(this.fKey)
    this.qKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability1'))
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))
  }

  destroy() {
    this._scar?.destroy()
    this._hpBar?.destroy()
    this._burstIndicator?.destroy()
    super.destroy()
  }

  // ── Tick & HUD ────────────────────────────────────────────────────────────

  _tickCooldowns(delta) {
    if (this._lmbCd      > 0) this._lmbCd      -= delta
    if (this._fCd        > 0) this._fCd        -= delta
    if (this._dissolveCd > 0) this._dissolveCd -= delta
    if (this._burstCd    > 0) this._burstCd    -= delta
    if (this._rootedMs   > 0) this._rootedMs    = Math.max(0, this._rootedMs    - delta)
    if (this._disorientMs > 0) this._disorientMs = Math.max(0, this._disorientMs - delta)
  }

  _syncScarPosition() {
    this._scar?.setPosition(this.x, this.y)
  }

  _updateHud(scene) {
    const hx = 20
    const hy = scene.game.config.height - 40
    const barW = 80

    const hf = this.hp / HP_MAX
    const hue = hf > 0.3 ? BASE_COLOR : 0xFF2200
    this._hpBar
      .setPosition(hx + (barW * hf) / 2, hy)
      .setSize(barW * hf + 1, 6)
      .setFillStyle(hue)

    this._burstIndicator.clear()
    const cx = hx + 8
    const cy = hy + 14
    if (this._burstActive) {
      this._burstIndicator.fillStyle(BURST_COLOR, 1).fillCircle(cx, cy, 5)
    } else if (this._burstCd > 0) {
      const t = 1 - this._burstCd / BURST_COOLDOWN_MS
      this._burstIndicator.lineStyle(1, BASE_COLOR, 0.6).strokeCircle(cx, cy, 5)
      this._burstIndicator.fillStyle(BASE_COLOR, 0.6).fillCircle(cx, cy, 5 * t)
    } else {
      this._burstIndicator.fillStyle(BASE_COLOR, 1).fillCircle(cx, cy, 5)
    }
  }

  _checkDeath(scene) {
    if (!this.alive && !this._dead) {
      this._dead = true
      this._scar?.destroy();             this._scar             = null
      this._hpBar?.destroy();            this._hpBar            = null
      this._burstIndicator?.destroy();   this._burstIndicator   = null
      scene.scene.start('GameOverScene', { score: scene.scoreSystem?.getScore() ?? 0 })
    }
  }
}
