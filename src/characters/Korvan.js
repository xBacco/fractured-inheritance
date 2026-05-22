import { BaseCharacter } from './BaseCharacter.js'
import { PLAYER_SPEED, TILE_SIZE } from '../config/GameConfig.js'
import { KeyBindings } from '../config/KeyBindings.js'

const BASE_COLOR    = 0x0D0D0D
const HP_MAX        = 200
const SPEED_MULT    = 0.75

const DMG_REDUCTION = 0.20
const STATUS_RESIST = 0.50

const CLEAVE_RANGE  = 42
const CLEAVE_DAMAGE = 18
const CLEAVE_CD     = 500

const PARRY_MS      = 300
const PARRY_CD      = 1200
const PARRY_DMG     = 28

const ALONE_MAX_MS  = 2500
const ALONE_MIN_RAD = 55
const ALONE_MAX_RAD = 130
const ALONE_MIN_DMG = 15
const ALONE_MAX_DMG = 50

const TAUNT_RANGE   = 180
const TAUNT_DEF_MS  = 2500
const TAUNT_CD      = 5000

export class Korvan extends BaseCharacter {
  constructor(scene, x, y) {
    super(scene, x, y, 22, 36, BASE_COLOR)

    this.hp       = HP_MAX
    this.maxHp    = HP_MAX
    this.alive    = true
    this._dead    = false
    this.speed    = PLAYER_SPEED * SPEED_MULT

    this._attackCd    = 0
    this._parryCd     = 0
    this._parryMs     = 0
    this._tauntCd     = 0
    this._tauntDefMs  = 0
    this._aloneMs     = 0
    this._aloneHeld   = false
    this._rootedMs    = 0
    this._disorientMs = 0

    this.projectiles = scene.physics.add.group()
    this.qKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability1'))
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))

    this._axeL    = scene.add.rectangle(x - 14, y, 4, 12, 0x666666).setDepth(3)
    this._axeR    = scene.add.rectangle(x + 14, y, 4, 12, 0x666666).setDepth(3)
    this._auraRing = scene.add.graphics().setDepth(1)
    this._hpBar   = scene.add.rectangle(0, 0, 80, 6, 0xaa2222).setScrollFactor(0).setDepth(20)
  }

  update(scene, delta) {
    if (!this.alive) { this._checkDeath(scene); return }
    this._tickCooldowns(delta)
    super.update(scene)
    this._handleLMB(scene)
    this._handleRMB(scene)
    this._handleQ(scene, delta)
    this._handleF(scene)
    this._updateVisual(scene)
    this._checkDeath(scene)
  }

  handleMovement(scene) {
    if (this._rootedMs > 0) { this.body.setVelocity(0, 0); return }
    const prevSpeed = this.speed
    if (this._disorientMs > 0) this.speed *= 0.70
    super.handleMovement(scene)
    this.speed = prevSpeed
  }

  takeDamage(amount) {
    if (!this.alive) return
    if (this._parryMs > 0) {
      this._parryMs = 0
      this._doParryCounter()
      return
    }
    let dmg = amount * (1 - DMG_REDUCTION)
    if (this._tauntDefMs > 0) dmg *= 0.70
    this.hp = Math.max(0, this.hp - dmg)
    if (this.hp <= 0) this.alive = false
    this.fillColor = 0xffffff
    this.scene.time.delayedCall(80, () => {
      if (this.alive) this.fillColor = BASE_COLOR
    })
  }

  applyRoot(duration) {
    this._rootedMs = Math.max(this._rootedMs, Math.floor(duration * STATUS_RESIST))
  }

  applyDisorient(duration) {
    this._disorientMs = Math.max(this._disorientMs, Math.floor(duration * STATUS_RESIST))
  }

  rebindActions(scene) {
    scene.input.keyboard.removeKey(this.qKey)
    scene.input.keyboard.removeKey(this.fKey)
    this.qKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability1'))
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))
  }

  destroy() {
    this._axeL?.destroy()
    this._axeR?.destroy()
    this._auraRing?.destroy()
    this._hpBar?.destroy()
    super.destroy()
  }

  // ── LMB: Taglio Incrociato ────────────────────────────────────────────

  _handleLMB(scene) {
    if (!this._lmbDown || this._attackCd > 0) return
    this._taglioIncrociato(scene)
    this._attackCd = CLEAVE_CD
  }

  _taglioIncrociato(scene) {
    if (!scene.enemies) return

    const h1 = scene.add.rectangle(this.x, this.y, CLEAVE_RANGE * 2, 8, 0x9A9A9A, 0.7).setDepth(5)
    const h2 = scene.add.rectangle(this.x, this.y, 8, CLEAVE_RANGE * 2, 0x9A9A9A, 0.7).setDepth(5)
    scene.time.delayedCall(130, () => { if (h1.active) h1.destroy(); if (h2.active) h2.destroy() })

    ;[this._axeL, this._axeR].forEach(axe => {
      if (!axe?.active) return
      axe.fillColor = 0x9A9A9A
      scene.time.delayedCall(130, () => { if (this.alive && axe.active) axe.fillColor = 0x666666 })
    })

    scene.enemies.getChildren().forEach(enemy => {
      if (!enemy.alive) return
      if (Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) < CLEAVE_RANGE) {
        enemy.takeDamage(CLEAVE_DAMAGE)
      }
    })
  }

  // ── RMB: Parata ──────────────────────────────────────────────────────

  _handleRMB(scene) {
    if (!this._rmbDown) return
    this._rmbDown = false
    if (this._parryCd > 0) return

    this._parryMs = PARRY_MS
    this._parryCd = PARRY_CD
    this.fillColor = 0x9A9A9A
  }

  _doParryCounter() {
    this.fillColor = 0xffffff
    this.scene.time.delayedCall(100, () => { if (this.alive) this.fillColor = BASE_COLOR })
    if (!this.scene.enemies) return
    this.scene.enemies.getChildren().forEach(enemy => {
      if (!enemy.alive) return
      if (Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) < 38) {
        enemy.takeDamage(PARRY_DMG)
        enemy._bound      = true
        enemy._boundTimer = 600
      }
    })
  }

  // ── Q: Alone Nero ─────────────────────────────────────────────────────

  _handleQ(scene, delta) {
    const held = this.qKey.isDown

    if (held && !this._aloneHeld) this._aloneHeld = true
    if (this._aloneHeld && held)  this._aloneMs = Math.min(this._aloneMs + delta, ALONE_MAX_MS)

    if (!held && this._aloneHeld) {
      this._aloneHeld = false
      this._releaseAlone(scene)
      this._aloneMs = 0
    }
  }

  _releaseAlone(scene) {
    if (this._aloneMs < 200) { this._aloneMs = 0; return }

    const t      = this._aloneMs / ALONE_MAX_MS
    const radius = ALONE_MIN_RAD + (ALONE_MAX_RAD - ALONE_MIN_RAD) * t
    const dmg    = ALONE_MIN_DMG + (ALONE_MAX_DMG - ALONE_MIN_DMG) * t

    const ring = scene.add.graphics().setDepth(5)
    ring.lineStyle(3, 0x050505, 0.9)
    ring.strokeCircle(0, 0, 10)
    ring.setPosition(this.x, this.y)
    scene.tweens.add({
      targets: ring,
      scaleX: radius / 10,
      scaleY: radius / 10,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => { if (ring.active) ring.destroy() }
    })

    if (!scene.enemies) return
    scene.enemies.getChildren().forEach(enemy => {
      if (!enemy.alive) return
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (dist >= radius) return
      enemy.takeDamage(dmg)
      const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x)
      const force = 220 * (1 - dist / radius)
      enemy.body?.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force)
      enemy._slowTimer = 600
      enemy._slowMult  = 0.4
    })

    scene.cameras.main.shake(180, 0.007 * t)
  }

  // ── F: Provoca ───────────────────────────────────────────────────────

  _handleF(scene) {
    if (!Phaser.Input.Keyboard.JustDown(this.fKey)) return
    if (this._tauntCd > 0) return

    this._tauntCd    = TAUNT_CD
    this._tauntDefMs = TAUNT_DEF_MS

    const pulse = scene.add.graphics().setDepth(5)
    pulse.fillStyle(0x888888, 0.25)
    pulse.fillCircle(0, 0, 12)
    pulse.setPosition(this.x, this.y)
    scene.tweens.add({
      targets: pulse,
      scaleX: TAUNT_RANGE / 12,
      scaleY: TAUNT_RANGE / 12,
      alpha: 0,
      duration: 400,
      ease: 'Power1',
      onComplete: () => { if (pulse.active) pulse.destroy() }
    })

    scene.cameras.main.shake(120, 0.004)

    if (!scene.enemies) return
    scene.enemies.getChildren().forEach(enemy => {
      if (!enemy.alive) return
      if (Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) > TAUNT_RANGE) return
      if (typeof enemy._activate === 'function') enemy._activate()
    })
  }

  // ── Tick & Visual ────────────────────────────────────────────────────

  _tickCooldowns(delta) {
    if (this._attackCd    > 0) this._attackCd    -= delta
    if (this._parryCd     > 0) this._parryCd     -= delta
    if (this._tauntCd     > 0) this._tauntCd     -= delta
    if (this._tauntDefMs  > 0) this._tauntDefMs  -= delta
    if (this._rootedMs    > 0) this._rootedMs    = Math.max(0, this._rootedMs    - delta)
    if (this._disorientMs > 0) this._disorientMs = Math.max(0, this._disorientMs - delta)

    if (this._parryMs > 0) {
      this._parryMs -= delta
      if (this._parryMs <= 0) {
        this._parryMs = 0
        if (this.fillColor === 0x9A9A9A) this.fillColor = BASE_COLOR
      }
    }
  }

  _updateVisual(scene) {
    this._axeL?.setPosition(this.x - 14, this.y)
    this._axeR?.setPosition(this.x + 14, this.y)

    this._auraRing.clear()
    if (this._aloneHeld && this._aloneMs > 0) {
      const t = this._aloneMs / ALONE_MAX_MS
      const r = (ALONE_MIN_RAD + (ALONE_MAX_RAD - ALONE_MIN_RAD) * t) * 0.4
      this._auraRing.lineStyle(2, 0x050505, t * 0.7)
      this._auraRing.strokeCircle(this.x, this.y, r)
    }

    const hx  = 20
    const hy  = scene.game.config.height - 40
    const barW = 80
    const hf   = this.hp / HP_MAX
    const hue  = hf > 0.5 ? 0xaa2222 : hf > 0.25 ? 0xcc4400 : 0xff2200
    this._hpBar
      .setPosition(hx + (barW * hf) / 2, hy)
      .setSize(barW * hf + 1, 6)
      .setFillStyle(hue)
  }

  _checkDeath(scene) {
    if (!this.alive && !this._dead) {
      this._dead = true
      this._axeL?.destroy();    this._axeL    = null
      this._axeR?.destroy();    this._axeR    = null
      this._auraRing?.destroy(); this._auraRing = null
      this._hpBar?.destroy();   this._hpBar   = null
      // transizione a GameOverScene gestita da GameScene.update()
    }
  }
}
