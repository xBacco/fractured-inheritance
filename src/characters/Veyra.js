import { BaseCharacter } from './BaseCharacter.js'
import { PLAYER_SPEED, TILE_SIZE } from '../config/GameConfig.js'
import { KeyBindings } from '../config/KeyBindings.js'

const BASE_COLOR      = 0x0F0F12
const HP_MAX          = 70
const SPEED_MULT      = 1.10

const FOCUS_MAX       = 100
const FOCUS_REGEN     = 8          // per second

const CHARGE_MAX_MS   = 1500
const ARROW_MIN_DMG   = 15
const ARROW_MAX_DMG   = 45
const ARROW_MIN_SPD   = 300
const ARROW_MAX_SPD   = 580
const ARROW_FOCUS_MAX = 25

const CROW_ATK_DMG    = 22
const CROW_ATK_AOE    = 35
const CROW_ATK_CD     = 1800
const CROW_ATK_FOCUS  = 30

const SCOUT_DUR       = 8000
const SCOUT_RAD       = 100
const SCOUT_CD        = 3000
const SCOUT_FOCUS     = 25
const SCOUT_MAX       = 2

const DASH_DIST       = 72
const DASH_CD         = 2500
const VISION_DUR      = 1500

export class Veyra extends BaseCharacter {
  constructor(scene, x, y) {
    super(scene, x, y, 14, 26, BASE_COLOR)

    this.hp       = HP_MAX
    this.maxHp    = HP_MAX
    this.alive    = true
    this._dead    = false
    this.speed    = PLAYER_SPEED * SPEED_MULT

    this._focus        = FOCUS_MAX
    this._bowCharge    = 0
    this._bowHeld      = false
    this._crowAtkCd    = 0
    this._scoutCd      = 0
    this._dashCd       = 0
    this._rootedMs     = 0
    this._disorientMs  = 0
    this._visionActive = false

    this._scoutCrows = []

    this.projectiles = scene.physics.add.group()
    this.qKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability1'))
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))

    this._bowGfx          = scene.add.rectangle(x + 10, y, 3, 16, 0x5A3A18).setDepth(3)
    this._chargeBar       = scene.add.rectangle(x, y - 18, 0, 3, 0x88bbcc).setDepth(4)
    this._focusBar        = scene.add.rectangle(0, 0, 80, 6, 0x3a7a88).setScrollFactor(0).setDepth(20)
  }

  update(scene, delta) {
    if (!this.alive) { this._checkDeath(scene); return }
    this._tickCooldowns(delta)
    this._tickFocus(delta)
    super.update(scene)
    this._handleLMB(scene, delta)
    this._handleRMB(scene)
    this._handleQ(scene)
    this._handleF(scene)
    this._tickScoutCrows(scene)
    this._updateVisual(scene)
    this._checkDeath(scene)
  }

  handleMovement(scene) {
    if (this._rootedMs > 0) { this.body.setVelocity(0, 0); return }
    if (this._disorientMs <= 0) { super.handleMovement(scene); return }
    const body = this.body
    let vx = 0, vy = 0
    if (this.wasd.left.isDown)  vx += 1
    if (this.wasd.right.isDown) vx -= 1
    if (this.wasd.up.isDown)    vy += 1
    if (this.wasd.down.isDown)  vy -= 1
    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy)
      vx = (vx / len) * this.speed
      vy = (vy / len) * this.speed
    }
    const nextX = this.x + vx * (1 / 60)
    const nextY = this.y + vy * (1 / 60)
    const tileX = Math.floor(nextX / TILE_SIZE)
    const tileY = Math.floor(nextY / TILE_SIZE)
    if (scene.isWalkable(tileX, tileY)) {
      body.setVelocity(vx, vy)
    } else {
      body.setVelocityX(scene.isWalkable(tileX, Math.floor(this.y / TILE_SIZE)) ? vx : 0)
      body.setVelocityY(scene.isWalkable(Math.floor(this.x / TILE_SIZE), tileY) ? vy : 0)
    }
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.hp = Math.max(0, this.hp - amount)
    if (this.hp <= 0) this.alive = false
    const prev = this.fillColor
    this.fillColor = 0xffffff
    this.scene.time.delayedCall(80, () => { if (this.alive) this.fillColor = prev })
  }

  applyRoot(duration) {
    this._rootedMs = Math.max(this._rootedMs, duration)
  }

  applyDisorient(duration) {
    this._disorientMs = Math.max(this._disorientMs, duration)
  }

  rebindActions(scene) {
    scene.input.keyboard.removeKey(this.qKey)
    scene.input.keyboard.removeKey(this.fKey)
    this.qKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability1'))
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))
  }

  destroy() {
    this._bowGfx?.destroy();    this._bowGfx    = null
    this._chargeBar?.destroy(); this._chargeBar = null
    this._focusBar?.destroy();  this._focusBar  = null
    this._scoutCrows.forEach(c => c.gfx?.destroy())
    this._scoutCrows = []
    super.destroy()
  }

  // ── LMB: Arco Caricabile ──────────────────────────────────────────────

  _handleLMB(scene, delta) {
    const held = this._lmbDown

    if (held && !this._bowHeld) {
      this._bowHeld  = true
      this._bowCharge = 0
    }
    if (this._bowHeld && held) {
      this._bowCharge = Math.min(this._bowCharge + delta, CHARGE_MAX_MS)
    }
    if (!held && this._bowHeld) {
      this._bowHeld = false
      this._fireArrow(scene)
      this._bowCharge = 0
    }
  }

  _fireArrow(scene) {
    const t         = this._bowCharge / CHARGE_MAX_MS
    if (t < 0.05) return
    const focusCost = ARROW_FOCUS_MAX * t
    if (focusCost > 0 && this._focus < focusCost) return

    this._focus -= focusCost

    const pointer = scene.input.activePointer
    const wp  = scene.cameras.main.getWorldPoint(pointer.x, pointer.y)
    const dx  = wp.x - this.x
    const dy  = wp.y - this.y
    const d   = Math.sqrt(dx * dx + dy * dy)
    if (d < 1) return

    const dmg   = ARROW_MIN_DMG + (ARROW_MAX_DMG - ARROW_MIN_DMG) * t
    const speed = ARROW_MIN_SPD + (ARROW_MAX_SPD - ARROW_MIN_SPD) * t

    const arrow = scene.add.rectangle(this.x, this.y, 8, 3, 0x7A5528).setDepth(5)
    scene.physics.add.existing(arrow)
    arrow.damage = dmg
    arrow.body.setVelocity((dx / d) * speed, (dy / d) * speed)
    this.projectiles.add(arrow)
    scene.time.delayedCall(1200, () => { if (arrow.active) arrow.destroy() })
  }

  // ── RMB: Corvo Attaccante ─────────────────────────────────────────────

  _handleRMB(scene) {
    if (!this._rmbDown) return
    this._rmbDown = false
    if (this._crowAtkCd > 0 || this._focus < CROW_ATK_FOCUS) return

    this._focus    -= CROW_ATK_FOCUS
    this._crowAtkCd = CROW_ATK_CD

    const pointer = scene.input.activePointer
    const wp = scene.cameras.main.getWorldPoint(pointer.x, pointer.y)
    this._launchAttackCrow(scene, wp.x, wp.y)
  }

  _launchAttackCrow(scene, tx, ty) {
    const dx = tx - this.x
    const dy = ty - this.y
    const d  = Math.sqrt(dx * dx + dy * dy)
    if (d < 1) return

    const crow = scene.add.rectangle(this.x, this.y, 6, 6, 0x0A0A10).setDepth(5)
    scene.physics.add.existing(crow)
    crow.damage = CROW_ATK_DMG
    crow.body.setVelocity((dx / d) * 360, (dy / d) * 360)
    this.projectiles.add(crow)

    scene.time.delayedCall(700, () => {
      if (!crow.active) return
      // AoE burst at arrival point
      if (scene.enemies) {
        scene.enemies.getChildren().forEach(enemy => {
          if (!enemy.alive) return
          if (Phaser.Math.Distance.Between(crow.x, crow.y, enemy.x, enemy.y) < CROW_ATK_AOE) {
            enemy.takeDamage(CROW_ATK_DMG * 0.6)
          }
        })
      }
      const ring = scene.add.graphics().setDepth(5)
      ring.lineStyle(2, 0x0A0A10, 0.8)
      ring.strokeCircle(0, 0, 8)
      ring.setPosition(crow.x, crow.y)
      scene.tweens.add({
        targets: ring,
        scaleX: CROW_ATK_AOE / 8,
        scaleY: CROW_ATK_AOE / 8,
        alpha: 0,
        duration: 250,
        onComplete: () => { if (ring.active) ring.destroy() }
      })
      crow.destroy()
    })
  }

  // ── Q: Corvo Esploratore ──────────────────────────────────────────────

  _handleQ(scene) {
    if (!Phaser.Input.Keyboard.JustDown(this.qKey)) return
    if (this._scoutCd > 0 || this._focus < SCOUT_FOCUS) return
    if (this._scoutCrows.length >= SCOUT_MAX) return

    this._focus  -= SCOUT_FOCUS
    this._scoutCd = SCOUT_CD

    const cx  = this.x + this.facingX * 40
    const cy  = this.y + this.facingY * 40
    const gfx = scene.add.rectangle(cx, cy, 6, 8, 0x0A0A10).setDepth(3)

    const crow = { gfx, x: cx, y: cy }
    this._scoutCrows.push(crow)

    scene.time.delayedCall(SCOUT_DUR, () => {
      gfx.destroy()
      const idx = this._scoutCrows.indexOf(crow)
      if (idx !== -1) this._scoutCrows.splice(idx, 1)
    })
  }

  _tickScoutCrows(scene) {
    this._scoutCrows = this._scoutCrows.filter(c => c.gfx?.active)
    if (!this._scoutCrows.length || !scene.enemies) return

    this._scoutCrows.forEach(crow => {
      scene.enemies.getChildren().forEach(enemy => {
        if (!enemy.alive) return
        if (Phaser.Math.Distance.Between(crow.x, crow.y, enemy.x, enemy.y) < SCOUT_RAD) {
          enemy._slowTimer = 600
          enemy._slowMult  = 0.55
        }
      })
    })
  }

  // ── F: Dash + Visione del Corvo ───────────────────────────────────────

  _handleF(scene) {
    if (!Phaser.Input.Keyboard.JustDown(this.fKey)) return
    if (this._dashCd > 0) return

    this._dashCd = DASH_CD
    this._doDash(scene)
    if (this._scoutCrows.length > 0 && !this._visionActive) this._doCorvoVision(scene)
  }

  _doDash(scene) {
    const dx = this.facingX || 0
    const dy = this.facingY || (dx === 0 ? -1 : 0)

    const steps    = 9
    const stepSize = DASH_DIST / steps
    let tx = this.x, ty = this.y

    for (let i = 0; i < steps; i++) {
      const nx    = tx + dx * stepSize
      const ny    = ty + dy * stepSize
      const tileX = Math.floor(nx / TILE_SIZE)
      const tileY = Math.floor(ny / TILE_SIZE)
      if (!scene.isWalkable(tileX, tileY)) break
      tx = nx
      ty = ny
    }

    this.x = tx
    this.y = ty
    this.body.reset(tx, ty)
    this.setAlpha(0.35)
    scene.time.delayedCall(180, () => { if (this.alive) this.setAlpha(1) })
  }

  _doCorvoVision(scene) {
    this._visionActive = true
    const crow = this._scoutCrows[0]
    const cam  = scene.cameras.main

    cam.stopFollow()
    scene.tweens.add({
      targets: cam,
      scrollX: crow.x - cam.width  / 2,
      scrollY: crow.y - cam.height / 2,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        scene.time.delayedCall(VISION_DUR, () => {
          this._visionActive = false
          if (this.alive) cam.startFollow(this, true, 0.1, 0.1)
        })
      }
    })
  }

  // ── Tick helpers ─────────────────────────────────────────────────────

  _tickCooldowns(delta) {
    if (this._crowAtkCd   > 0) this._crowAtkCd   -= delta
    if (this._scoutCd     > 0) this._scoutCd     -= delta
    if (this._dashCd      > 0) this._dashCd      -= delta
    if (this._rootedMs    > 0) this._rootedMs    = Math.max(0, this._rootedMs    - delta)
    if (this._disorientMs > 0) this._disorientMs = Math.max(0, this._disorientMs - delta)
  }

  _tickFocus(delta) {
    this._focus = Math.min(FOCUS_MAX, this._focus + FOCUS_REGEN * (delta / 1000))
  }

  // ── Visual ────────────────────────────────────────────────────────────

  _updateVisual(scene) {
    this._bowGfx?.setPosition(this.x + this.facingX * 10 + 4, this.y + this.facingY * 6)

    const chargeW = (this._bowCharge / CHARGE_MAX_MS) * 20
    this._chargeBar?.setPosition(this.x, this.y - 18).setSize(Math.max(0, chargeW), 3)

    const hx  = 20
    const hy  = scene.game.config.height - 40
    const barW = 80
    const ff  = this._focus / FOCUS_MAX
    this._focusBar
      .setPosition(hx + (barW * ff) / 2, hy)
      .setSize(barW * ff + 1, 6)
      .setFillStyle(ff > 0.3 ? 0x3a7a88 : 0x886633)
  }

  _checkDeath(scene) {
    if (!this.alive && !this._dead) {
      this._dead = true
      this._bowGfx?.destroy();    this._bowGfx    = null
      this._chargeBar?.destroy(); this._chargeBar = null
      this._focusBar?.destroy();  this._focusBar  = null
      this._scoutCrows.forEach(c => c.gfx?.destroy())
      this._scoutCrows = []
      if (this._visionActive) {
        this._visionActive = false
        scene.tweens.killTweensOf(scene.cameras.main)
        scene.cameras.main.startFollow(this, true, 0.1, 0.1)
      }
      scene.scene.start('GameOverScene', { score: scene.scoreSystem?.getScore() ?? 0 })
    }
  }
}
