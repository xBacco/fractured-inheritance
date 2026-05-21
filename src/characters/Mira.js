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

  _handleLMB(scene) {
    if (!this._lmbDown || this._attackCooldown > 0) return

    const mx = Math.floor(this.x / TILE_SIZE) + this.facingX
    const my = Math.floor(this.y / TILE_SIZE) + this.facingY
    const mat = materialForTile(scene.grid?.[my]?.[mx])
    if (!mat) return

    if (this._precastCheck(scene)) return

    this.temperature = tempWithCost(this.temperature, abilityCost('LMB', mat))
    this._postcastCheck()
    this._attackCooldown = 300
    this._placeWall(scene, mx, my, mat)
  }

  _placeWall(scene, tileX, tileY, mat) {
    const prev = scene.grid[tileY][tileX]
    scene.grid[tileY][tileX] = TILE.WALL

    const COLORS = {
      [MAT.EARTH]: 0x7a5c2a, [MAT.STONE]: 0x888888,
      [MAT.METAL]: 0xaab0b8, [MAT.LIQUID]: 0x331a00,
    }
    const vis = scene.add.rectangle(
      tileX * TILE_SIZE + TILE_SIZE / 2,
      tileY * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE, TILE_SIZE, COLORS[mat] ?? 0x888888, 0.85
    ).setDepth(3)

    scene.time.delayedCall(wallDuration(mat), () => {
      if (scene.grid?.[tileY]?.[tileX] === TILE.WALL) {
        scene.grid[tileY][tileX] = prev
      }
      if (vis.active) vis.destroy()
    })
  }
  _handleRMB(scene) {
    if (!this._rmbDown) return
    this._rmbDown = false

    const pointer = scene.input.activePointer
    const wp = scene.cameras.main.getWorldPoint(pointer.x, pointer.y)
    if (Phaser.Math.Distance.Between(this.x, this.y, wp.x, wp.y) > 200) return

    const tileX = Math.floor(wp.x / TILE_SIZE)
    const tileY = Math.floor(wp.y / TILE_SIZE)
    const mat   = materialForTile(scene.grid?.[tileY]?.[tileX])
    if (!mat) return

    if (this._precastCheck(scene)) return

    this.temperature = tempWithCost(this.temperature, abilityCost('RMB', mat))
    this._postcastCheck()
    this._applyRMBEffect(scene, tileX, tileY, mat, wp.x, wp.y)
  }

  _applyRMBEffect(scene, tileX, tileY, mat, worldX, worldY) {
    const flash = scene.add.rectangle(
      tileX * TILE_SIZE + TILE_SIZE / 2,
      tileY * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE, TILE_SIZE, 0x3AAEFF, 0.55
    ).setDepth(4)
    scene.time.delayedCall(200, () => { if (flash.active) flash.destroy() })

    if (!scene.enemies) return
    scene.enemies.getChildren().forEach(enemy => {
      if (!enemy.alive) return
      if (Math.floor(enemy.x / TILE_SIZE) !== tileX) return
      if (Math.floor(enemy.y / TILE_SIZE) !== tileY) return

      if (mat === MAT.EARTH) {
        enemy._slowTimer = 2000
        enemy._slowMult  = 0.5
      } else if (mat === MAT.LIQUID) {
        enemy.takeDamage(rmbDamage(mat))
        enemy._acidMs  = 2000
        enemy._acidDps = 10
      } else {
        enemy.takeDamage(rmbDamage(mat))
      }
    })
  }

  _handleQ(scene, delta) {
    const qNowDown = this.qKey.isDown

    if (qNowDown && !this._qDown) {
      this._qDown    = true
      this._qHoldMs  = 0
      const tileX = Math.floor(this.x / TILE_SIZE)
      const tileY = Math.floor(this.y / TILE_SIZE)
      this._qOnMetal = scene.grid?.[tileY]?.[tileX] === TILE.METAL
    }

    if (qNowDown && this._qDown && this._qOnMetal) {
      this._qHoldMs += delta
    }

    if (!qNowDown && this._qDown) {
      const wasOnMetal = this._qOnMetal
      this._qDown    = false
      this._qOnMetal = false

      if (!wasOnMetal) return

      if (this._precastCheck(scene)) return

      const tileX = Math.floor(this.x / TILE_SIZE)
      const tileY = Math.floor(this.y / TILE_SIZE)
      if (scene.grid?.[tileY]?.[tileX] !== TILE.METAL) return
      scene.grid[tileY][tileX] = TILE.FLOOR
      scene.time.delayedCall(8000, () => {
        if (scene.grid?.[tileY]?.[tileX] === TILE.FLOOR) {
          scene.grid[tileY][tileX] = TILE.METAL
        }
      })

      if (this._qHoldMs >= 300) {
        this._spawnShield(scene)
      } else {
        this._throwLance(scene)
      }
    }
  }

  _throwLance(scene) {
    const lance = scene.add.rectangle(this.x, this.y, 8, 4, 0xaab0b8).setDepth(5)
    scene.physics.add.existing(lance)
    lance.damage = 40
    lance.body.setVelocity(this.facingX * 450, this.facingY * 450)
    this.projectiles.add(lance)
    scene.time.delayedCall(800, () => { if (lance.active) lance.destroy() })
  }

  _spawnShield(scene) {
    if (this._qShield?.active) this._qShield.destroy()
    const sx = this.x + this.facingX * 18
    const sy = this.y + this.facingY * 18
    this._qShield = scene.add.rectangle(sx, sy, 12, 20, 0xaab0b8, 0.85).setDepth(5)
    this._qShieldActive = true
    scene.time.delayedCall(5000, () => {
      this._qShieldActive = false
      if (this._qShield?.active) this._qShield.destroy()
    })
  }

  _handleF(scene) {
    if (!Phaser.Input.Keyboard.JustDown(this.fKey)) return

    const cx = Math.floor(this.x / TILE_SIZE)
    const cy = Math.floor(this.y / TILE_SIZE)

    let target = null
    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      if (scene.grid?.[cy + dy]?.[cx + dx] === TILE.DESTRUCTIBLE) {
        target = { x: cx + dx, y: cy + dy }
        break
      }
    }
    if (!target) return

    if (this._precastCheck(scene)) return

    scene.grid[target.y][target.x] = TILE.FLOOR
    this.temperature = tempWithCost(this.temperature, abilityCost('F', null))
    this._postcastCheck()

    const gfx = scene.add.rectangle(
      target.x * TILE_SIZE + TILE_SIZE / 2,
      target.y * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE, TILE_SIZE, 0x3AAEFF, 0.65
    ).setDepth(4)
    scene.time.delayedCall(300, () => { if (gfx.active) gfx.destroy() })
  }

  // Stubs for later tasks — will be implemented in Tasks 11 and 12
  _triggerRebound(scene)     { /* Task 11 */ }
  _tickRebound(scene, delta) { /* Task 11 */ }
  _tickBleed(delta)          { /* Task 11 */ }
  _updateVignette(scene)     { /* Task 11 */ }
  _updateVisual(scene)       { /* Task 12 */ }
  _checkDeath(scene)         { /* Task 12 */ }
}
