import { BaseCharacter } from './BaseCharacter.js'
import { PLAYER_SPEED, TILE_SIZE } from '../config/GameConfig.js'
import { TILE } from '../map/TileTypes.js'
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
    this._dissolveCone = scene.add.graphics().setDepth(4)
  }

  update(scene, delta) {
    if (!this.alive) { this._checkDeath(scene); return }
    this._tickCooldowns(delta)
    super.update(scene)
    this._handleLMB(scene)
    this._handleF(scene)
    this._handleRMB(scene, delta)
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
    this._dissolveCone?.destroy()
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

  // ── LMB: Paint Strike ─────────────────────────────────────────────────────

  _handleLMB(scene) {
    if (!this._lmbDown) return
    if (this._lmbCd > 0) return
    if (this._burstActive || this._dissolveActive) return

    this._lmbCd = 300
    this._paintStrike(scene)
  }

  _paintStrike(scene) {
    scene.events.emit('player_attacked', this.x, this.y)

    const hx = this.x + this.facingX * 18
    const hy = this.y + this.facingY * 18
    const hit = scene.add.rectangle(hx, hy, 12, 6, 0x0a0808, 0.75).setDepth(5)
    scene.time.delayedCall(100, () => { if (hit.active) hit.destroy() })

    if (!scene.enemies) return
    scene.enemies.getChildren().forEach(enemy => {
      if (!enemy.alive) return
      if (Phaser.Math.Distance.Between(hx, hy, enemy.x, enemy.y) < 18) {
        enemy.takeDamage(8)
      }
    })
  }

  // ── F: Spezza Metallo ─────────────────────────────────────────────────────

  _handleF(scene) {
    if (!Phaser.Input.Keyboard.JustDown(this.fKey)) return
    if (this._fCd > 0) return
    if (this._burstActive || this._dissolveActive) return

    const cx = Math.floor(this.x / TILE_SIZE)
    const cy = Math.floor(this.y / TILE_SIZE)

    const order = [
      [this.facingX, this.facingY],
      [this.facingY, -this.facingX],
      [-this.facingY, this.facingX],
      [-this.facingX, -this.facingY],
    ]

    let target = null
    for (const [dx, dy] of order) {
      if (dx === 0 && dy === 0) continue
      if (scene.grid?.[cy + dy]?.[cx + dx] === TILE.METAL) {
        target = { x: cx + dx, y: cy + dy }
        break
      }
    }
    if (!target) return

    this._fCd = 6000
    this._spezzaMetallo(scene, target)
  }

  _spezzaMetallo(scene, target) {
    scene.events.emit('player_attacked', this.x, this.y)

    const wx = target.x * TILE_SIZE + TILE_SIZE / 2
    const wy = target.y * TILE_SIZE + TILE_SIZE / 2

    scene.grid[target.y][target.x] = TILE.FLOOR
    scene.time.delayedCall(8000, () => {
      if (scene.grid?.[target.y]?.[target.x] === TILE.FLOOR) {
        scene.grid[target.y][target.x] = TILE.METAL
      }
    })

    const flash = scene.add.rectangle(wx, wy, TILE_SIZE, TILE_SIZE, BURST_COLOR, 0.7).setDepth(4)
    scene.time.delayedCall(200, () => { if (flash.active) flash.destroy() })

    if (scene.enemies) {
      scene.enemies.getChildren().forEach(enemy => {
        if (!enemy.alive) return
        if (Phaser.Math.Distance.Between(wx, wy, enemy.x, enemy.y) < 40) {
          enemy.takeDamage(30)
        }
      })
    }

    const cone = [-25, 0, 25]
    cone.forEach(deg => {
      const rad = deg * Math.PI / 180
      const baseAng = Math.atan2(this.facingY, this.facingX === 0 ? 0.0001 : this.facingX)
      const ang = baseAng + rad
      const shard = scene.add.rectangle(this.x, this.y, 8, 3, 0xaab0b8).setDepth(5)
      scene.physics.add.existing(shard)
      shard.damage = 15
      shard.body.setVelocity(Math.cos(ang) * 320, Math.sin(ang) * 320)
      this.projectiles.add(shard)
      scene.time.delayedCall(600, () => { if (shard.active) shard.destroy() })
    })
  }

  // ── RMB: Dissolve (hold) ──────────────────────────────────────────────────

  _handleRMB(scene, delta) {
    if (this._burstActive) {
      if (this._dissolveActive) this._endDissolve()
      return
    }

    const held = this._rmbDown

    if (held && !this._dissolveActive && this._dissolveCd <= 0) {
      this._dissolveActive = true
      this._dissolveMs     = 0
    }

    if (this._dissolveActive) {
      this._dissolveMs += delta
      this.body.setVelocity(0, 0)
      this._renderDissolveCone(scene)
      this._dissolveProjectiles(scene)
      if (!held || this._dissolveMs >= 2000) this._endDissolve()
    } else {
      this._dissolveCone.clear()
    }
  }

  _endDissolve() {
    this._dissolveActive = false
    this._dissolveMs     = 0
    this._dissolveCd     = 4000
    this._dissolveCone?.clear()
  }

  _renderDissolveCone(scene) {
    if (!this._dissolveCone) return
    const range = 80
    const halfAngle = Math.PI / 6
    const baseAng = this._facingAngle()
    const ax = this.x + Math.cos(baseAng - halfAngle) * range
    const ay = this.y + Math.sin(baseAng - halfAngle) * range
    const bx = this.x + Math.cos(baseAng + halfAngle) * range
    const by = this.y + Math.sin(baseAng + halfAngle) * range
    this._dissolveCone.clear()
    this._dissolveCone.fillStyle(BURST_COLOR, 0.35)
    this._dissolveCone.beginPath()
    this._dissolveCone.moveTo(this.x, this.y)
    this._dissolveCone.lineTo(ax, ay)
    this._dissolveCone.lineTo(bx, by)
    this._dissolveCone.closePath()
    this._dissolveCone.fillPath()
  }

  _dissolveProjectiles(scene) {
    if (!scene.enemyProjectiles) return
    const range = 80
    const halfAngle = Math.PI / 6
    const baseAng = this._facingAngle()
    scene.enemyProjectiles.getChildren().slice().forEach(proj => {
      if (!proj.active) return
      const dx = proj.x - this.x
      const dy = proj.y - this.y
      const d  = Math.sqrt(dx * dx + dy * dy)
      if (d > range || d < 1) return
      const ang = Math.atan2(dy, dx)
      const diff = Math.abs(Phaser.Math.Angle.Wrap(ang - baseAng))
      if (diff <= halfAngle) proj.destroy()
    })
  }

  _facingAngle() {
    if (this.facingX === 0 && this.facingY === 0) return 0
    return Math.atan2(this.facingY, this.facingX)
  }

  _checkDeath(scene) {
    if (!this.alive && !this._dead) {
      this._dead = true
      this._scar?.destroy();             this._scar             = null
      this._hpBar?.destroy();            this._hpBar            = null
      this._burstIndicator?.destroy();   this._burstIndicator   = null
      this._dissolveCone?.destroy();     this._dissolveCone     = null
      scene.scene.start('GameOverScene', { score: scene.scoreSystem?.getScore() ?? 0 })
    }
  }
}
