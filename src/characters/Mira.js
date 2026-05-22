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
    this._disorientMs    = 0
    this._rootedMs       = 0

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
    this._tickDisorient(delta)
    this._tickRooted(delta)
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
    this.scene.time.delayedCall(80, () => { if (this.alive && this._disorientMs <= 0) this.fillColor = 0xD44E0A })
  }

  applyDisorient(duration) {
    this._disorientMs = duration
    this.scene.cameras.main.flash(200, 0, 160, 120)
  }

  applyRoot(duration) {
    this._rootedMs = Math.max(this._rootedMs, duration)
    this.scene.cameras.main.shake(150, 0.005)
  }

  handleMovement(scene) {
    if (this._rootedMs > 0) { this.body.setVelocity(0, 0); return }
    if (this._disorientMs <= 0) { super.handleMovement(scene); return }
    const body = this.body
    let vx = 0
    let vy = 0
    if (this.wasd.left.isDown)  vx += 1
    if (this.wasd.right.isDown) vx -= 1
    if (this.wasd.up.isDown)    vy += 1
    if (this.wasd.down.isDown)  vy -= 1
    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy)
      vx = (vx / len) * this.speed
      vy = (vy / len) * this.speed
      this.facingX = vx > 0 ? 1 : vx < 0 ? -1 : this.facingX
      this.facingY = vy > 0 ? 1 : vy < 0 ? -1 : this.facingY
    }
    const nextX  = this.x + vx * (1 / 60)
    const nextY  = this.y + vy * (1 / 60)
    const tileX  = Math.floor(nextX / TILE_SIZE)
    const tileY  = Math.floor(nextY / TILE_SIZE)
    if (scene.isWalkable(tileX, tileY)) {
      body.setVelocity(vx, vy)
    } else {
      body.setVelocityX(scene.isWalkable(tileX, Math.floor(this.y / TILE_SIZE)) ? vx : 0)
      body.setVelocityY(scene.isWalkable(Math.floor(this.x / TILE_SIZE), tileY) ? vy : 0)
    }
  }

  rebindActions(scene) {
    scene.input.keyboard.removeKey(this.qKey)
    scene.input.keyboard.removeKey(this.fKey)
    this.qKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability1'))
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))
  }

  // ── Tick helpers ──────────────────────────────────────────────────────────

  _tickDisorient(delta) {
    if (this._disorientMs <= 0) return
    this._disorientMs = Math.max(0, this._disorientMs - delta)
    this.fillColor = this._disorientMs > 0 ? 0x4a8870 : 0xD44E0A
  }

  _tickRooted(delta) {
    if (this._rootedMs <= 0) return
    this._rootedMs = Math.max(0, this._rootedMs - delta)
  }

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

    this._attackCooldown = 300
    if (this._precastCheck(scene)) return

    this.temperature = tempWithCost(this.temperature, abilityCost('LMB', mat))
    this._postcastCheck()
    scene.events.emit('player_attacked', this.x, this.y)
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
    scene.events.emit('player_attacked', this.x, this.y)
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
    scene.events.emit('player_attacked', this.x, this.y)
    const lance = scene.add.rectangle(this.x, this.y, 8, 4, 0xaab0b8).setDepth(5)
    scene.physics.add.existing(lance)
    lance.damage = 40
    lance.body.setVelocity(this.facingX * 450, this.facingY * 450)
    this.projectiles.add(lance)
    scene.time.delayedCall(800, () => { if (lance.active) lance.destroy() })
  }

  _spawnShield(scene) {
    scene.events.emit('player_attacked', this.x, this.y)
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
    scene.events.emit('player_attacked', this.x, this.y)

    const gfx = scene.add.rectangle(
      target.x * TILE_SIZE + TILE_SIZE / 2,
      target.y * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE, TILE_SIZE, 0x3AAEFF, 0.65
    ).setDepth(4)
    scene.time.delayedCall(300, () => { if (gfx.active) gfx.destroy() })
  }

  // ── Rebound system (Task 11) ──────────────────────────────────────────────

  _triggerRebound(scene) {
    const result = reboundResult(this.temperature, this.gloves)
    this.temperature = result.newTemp
    this.gloves      = result.newGloves

    if (result.aggravated) {
      this.hp = Math.max(0, this.hp - result.directDmg)
    } else {
      this._bleedMs  = result.bleedMs
      this._bleedDps = result.bleedDmg
    }

    this._reboundMs    = result.stunMs + REBOUND_INVINCIBLE_MS
    this._invincibleMs = REBOUND_INVINCIBLE_MS
    this._vignetteMs   = REBOUND_VIGNETTE_MS

    this.fillColor = 0xffffff
    this.setAlpha(0.55)
  }

  _tickRebound(scene, delta) {
    this._reboundMs    -= delta
    if (this._invincibleMs > 0) this._invincibleMs -= delta
    if (this._disorientMs  > 0) this._tickDisorient(delta)
    if (this._vignetteMs  > 0) {
      this._vignetteMs -= delta
      this._updateVignette(scene)
    }
    this._tickBleed(delta)

    if (this._reboundMs <= 0) {
      this._reboundMs = 0
      this.setAlpha(1)
      this.fillColor  = 0xD44E0A
    }
    this._checkDeath(scene)
  }

  _tickBleed(delta) {
    if (this._bleedMs <= 0) return
    this._bleedMs -= delta
    this.hp = Math.max(0, this.hp - this._bleedDps * (delta / 1000))
    if (this.hp <= 0) this.alive = false
  }

  _updateVignette(scene) {
    const alpha = Math.max(0, this._vignetteMs / REBOUND_VIGNETTE_MS) * 0.45
    const cam = scene.cameras.main
    this._vignette
      .setPosition(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2)
      .setSize(cam.width, cam.height)
      .setAlpha(alpha)
  }
  _updateVisual(scene) {
    const hx   = 20
    const hy   = scene.game.config.height - 40
    const barW = 80

    const tf = this.temperature / TEMP_MAX
    const tr = Math.round(0x3A + tf * (0xDD - 0x3A))
    const tg = Math.round(0xAE + tf * (0x33 - 0xAE))
    const tb = Math.round(0xFF + tf * (0x11 - 0xFF))
    this._tempBar
      .setPosition(hx + (barW * tf) / 2, hy)
      .setSize(barW * tf + 1, 6)
      .setFillStyle((tr << 16) | (tg << 8) | tb)

    const gf = this.gloves / 100
    this._glovesBar
      .setPosition(hx + (barW * gf) / 2, hy + 10)
      .setSize(barW * gf + 1, 6)
      .setFillStyle(gf > 0.25 ? 0x00aa44 : 0x556655)
  }

  _checkDeath(scene) {
    if (!this.alive && !this._dead) {
      this._dead = true
      this._tempBar.destroy()
      this._glovesBar.destroy()
      this._vignette.destroy()
      if (this._qShield?.active) this._qShield.destroy()
      // transizione a GameOverScene gestita da GameScene.update()
    }
  }
}
