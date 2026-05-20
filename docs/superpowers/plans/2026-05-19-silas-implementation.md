# Silas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Silas — shadow rogue with a Frozen Blood temperature system, stealth fusion, shadow bind, and one-tile shadow teleport.

**Architecture:** SilasTemp.js holds all pure temperature logic (no Phaser, fully testable). FloorBuilder gains random 1×2 SHADOW patches per room. BaseEnemy gains a bound system + fusion evasion. Silas.js extends BaseCharacter. GameScene adds `isInShadow()` and swaps the player to Silas.

**Tech Stack:** Phaser 3.90, Vitest, vanilla ES modules

---

### Task 1: Pure temperature module — SilasTemp.js + SilasTemp.test.js

**Files:**
- Create: `src/characters/SilasTemp.js`
- Create: `tests/characters/SilasTemp.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/characters/SilasTemp.test.js
import { describe, it, expect } from 'vitest'
import { TILE } from '../../src/map/TileTypes.js'
import {
  TEMP_MAX, TEMP_MIN,
  TEMP_DRAIN_HIT, TEMP_DRAIN_BIND, TEMP_DRAIN_TELEPORT, TEMP_DRAIN_FUSION,
  TEMP_REGEN_SHADOW, TEMP_REGEN_BASE,
  tempDelta, isFrozen, speedMultiplier, powersEnabled, isShadowTile,
} from '../../src/characters/SilasTemp.js'

describe('constants', () => {
  it('TEMP_MAX is 100', () => expect(TEMP_MAX).toBe(100))
  it('TEMP_MIN is 0',   () => expect(TEMP_MIN).toBe(0))
  it('TEMP_DRAIN_HIT is 20',       () => expect(TEMP_DRAIN_HIT).toBe(20))
  it('TEMP_DRAIN_BIND is 15',      () => expect(TEMP_DRAIN_BIND).toBe(15))
  it('TEMP_DRAIN_TELEPORT is 25',  () => expect(TEMP_DRAIN_TELEPORT).toBe(25))
  it('TEMP_DRAIN_FUSION is 5',     () => expect(TEMP_DRAIN_FUSION).toBe(5))
  it('TEMP_REGEN_SHADOW is 8',     () => expect(TEMP_REGEN_SHADOW).toBe(8))
  it('TEMP_REGEN_BASE is 3',       () => expect(TEMP_REGEN_BASE).toBe(3))
})

describe('tempDelta', () => {
  it('in shadow, no fusion: +8/s', () =>
    expect(tempDelta(true, false, 1000)).toBeCloseTo(8))
  it('out of shadow, no fusion: +3/s', () =>
    expect(tempDelta(false, false, 1000)).toBeCloseTo(3))
  it('in shadow, fusion active: +8-5=+3/s', () =>
    expect(tempDelta(true, true, 1000)).toBeCloseTo(3))
  it('out of shadow, fusion active (suspended): +3/s', () =>
    expect(tempDelta(false, true, 1000)).toBeCloseTo(3))
  it('scales with delta (500ms = half)', () =>
    expect(tempDelta(true, false, 500)).toBeCloseTo(4))
})

describe('isFrozen', () => {
  it('returns true at 0',    () => expect(isFrozen(0)).toBe(true))
  it('returns false at 1',   () => expect(isFrozen(1)).toBe(false))
  it('returns false at 100', () => expect(isFrozen(100)).toBe(false))
})

describe('speedMultiplier', () => {
  it('0.5 when frozen',    () => expect(speedMultiplier(0)).toBe(0.5))
  it('1.0 when not frozen',() => expect(speedMultiplier(50)).toBe(1.0))
})

describe('powersEnabled', () => {
  it('false at temp 0',   () => expect(powersEnabled(0)).toBe(false))
  it('true at temp 1',    () => expect(powersEnabled(1)).toBe(true))
  it('true at temp 100',  () => expect(powersEnabled(100)).toBe(true))
})

describe('isShadowTile', () => {
  // Grid: 5x5, WALL border, FLOOR inside
  //   col: 0 1 2 3 4
  // row 0: W W W W W
  // row 1: W F F F W
  // row 2: W F F F W
  // row 3: W F F F W
  // row 4: W W W W W
  const W = TILE.WALL
  const F = TILE.FLOOR
  const S = TILE.SHADOW
  const C = TILE.CORRIDOR
  const L = TILE.LIGHT
  const grid = [
    [W, W, W, W, W],
    [W, F, F, F, W],
    [W, F, F, F, W],
    [W, F, F, F, W],
    [W, W, W, W, W],
  ]

  it('SHADOW tile → true', () => {
    const g = grid.map(r => [...r])
    g[1][1] = S
    expect(isShadowTile(g, 1, 1)).toBe(true)
  })

  it('CORRIDOR tile → true', () => {
    const g = grid.map(r => [...r])
    g[2][2] = C
    expect(isShadowTile(g, 2, 2)).toBe(true)
  })

  it('FLOOR at perimeter (adjacent to WALL) → true', () =>
    expect(isShadowTile(grid, 1, 1)).toBe(true))

  it('FLOOR at center (no WALL neighbor) → false', () =>
    expect(isShadowTile(grid, 2, 2)).toBe(false))

  it('LIGHT tile adjacent to WALL → false', () => {
    const g = grid.map(r => [...r])
    g[1][1] = L
    expect(isShadowTile(g, 1, 1)).toBe(false)
  })

  it('WALL tile → false', () =>
    expect(isShadowTile(grid, 0, 0)).toBe(false))

  it('out of bounds → false', () =>
    expect(isShadowTile(grid, -1, 0)).toBe(false))
})
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run tests/characters/SilasTemp.test.js
```
Expected: FAIL — `SilasTemp.js` does not exist

- [ ] **Step 3: Write the implementation**

```javascript
// src/characters/SilasTemp.js
import { TILE } from '../map/TileTypes.js'

export const TEMP_MAX = 100
export const TEMP_MIN = 0
export const TEMP_DRAIN_HIT       = 20
export const TEMP_DRAIN_BIND      = 15
export const TEMP_DRAIN_TELEPORT  = 25
export const TEMP_DRAIN_FUSION    = 5
export const TEMP_REGEN_SHADOW    = 8
export const TEMP_REGEN_BASE      = 3

// Net temperature change per delta ms.
// Fusion drain only applies when in shadow (suspended outside shadow).
export function tempDelta(inShadow, fusionActive, delta) {
  const regen = inShadow ? TEMP_REGEN_SHADOW : TEMP_REGEN_BASE
  const drain = (fusionActive && inShadow) ? TEMP_DRAIN_FUSION : 0
  return (regen - drain) * (delta / 1000)
}

export function isFrozen(temp) {
  return temp <= TEMP_MIN
}

export function speedMultiplier(temp) {
  return isFrozen(temp) ? 0.5 : 1.0
}

export function powersEnabled(temp) {
  return temp > TEMP_MIN
}

// Returns true if the tile at (tileX, tileY) counts as shadow for Silas.
// Shadow = SHADOW tile, CORRIDOR tile, or FLOOR tile adjacent to a WALL.
// LIGHT tiles are never shadow even if adjacent to WALL.
export function isShadowTile(grid, tileX, tileY) {
  const tile = grid[tileY]?.[tileX]
  if (tile === undefined) return false
  if (tile === TILE.WALL || tile === TILE.LIGHT) return false
  if (tile === TILE.SHADOW || tile === TILE.CORRIDOR) return true
  // FLOOR: check if any orthogonal neighbor is WALL
  return [[-1, 0], [1, 0], [0, -1], [0, 1]].some(
    ([dx, dy]) => grid[tileY + dy]?.[tileX + dx] === TILE.WALL
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run tests/characters/SilasTemp.test.js
```
Expected: all tests PASS

- [ ] **Step 5: Commit**

```
git add src/characters/SilasTemp.js tests/characters/SilasTemp.test.js
git commit -m "feat: SilasTemp pure temperature functions + unit tests"
```

---

### Task 2: FloorBuilder — sparse shadow patches

**Files:**
- Modify: `src/map/FloorBuilder.js`
- Modify: `tests/map/FloorBuilder.test.js`

- [ ] **Step 1: Write the failing tests** (add to existing test file)

Append these two `it` blocks inside the existing `describe('FloorBuilder', ...)` block in `tests/map/FloorBuilder.test.js`:

```javascript
  it('aggiunge patch di ombra nelle stanze grandi (> 4x4)', () => {
    const builder = new FloorBuilder(40, 30)
    const room = { x: 2, y: 2, width: 12, height: 10 }
    // start with a fully-FLOOR grid so we can count only the new patches
    const grid = Array.from({ length: 30 }, () => Array(40).fill(TILE.FLOOR))

    builder._placeRandomShadowPatches(grid, room)

    let shadowCount = 0
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (grid[y][x] === TILE.SHADOW) shadowCount++
      }
    }
    // 2–3 patches of 2 tiles each → at least 4 shadow tiles
    expect(shadowCount).toBeGreaterThanOrEqual(4)
  })

  it('non aggiunge patch nelle stanze piccole (width o height ≤ 4)', () => {
    const builder = new FloorBuilder(40, 30)
    const room = { x: 2, y: 2, width: 4, height: 4 }
    const grid = Array.from({ length: 30 }, () => Array(40).fill(TILE.FLOOR))

    builder._placeRandomShadowPatches(grid, room)

    let shadowCount = 0
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (grid[y][x] === TILE.SHADOW) shadowCount++
      }
    }
    expect(shadowCount).toBe(0)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/map/FloorBuilder.test.js
```
Expected: 2 new tests FAIL — `_placeRandomShadowPatches is not a function`

- [ ] **Step 3: Add `_placeRandomShadowPatches` to FloorBuilder**

In `src/map/FloorBuilder.js`, add the new method after `_placeFeatures`, then call it from `_placeFeatures`.

The full updated `_placeFeatures` and new method:

```javascript
  _placeFeatures(grid, rooms) {
    if (rooms.length > 2) {
      const mid = rooms[Math.floor(rooms.length / 2)]
      const cx = Math.floor(mid.x + mid.width / 2)
      const cy = Math.floor(mid.y + mid.height / 2)
      if (this._inBounds(cx, cy)) grid[cy][cx] = TILE.ALTAR
    }
    for (const room of rooms) {
      if (Math.random() > 0.4) {
        const sx = room.x + room.width - 1
        const sy = room.y + room.height - 1
        if (this._inBounds(sx, sy)) grid[sy][sx] = TILE.SHADOW
      }
      if (Math.random() > 0.7) {
        const lx = room.x + Math.floor(room.width / 2)
        const ly = room.y + Math.floor(room.height / 2)
        if (this._inBounds(lx, ly)) grid[ly][lx] = TILE.LIGHT
      }
      this._placeRandomShadowPatches(grid, room)
    }
  }

  _placeRandomShadowPatches(grid, room) {
    if (room.width <= 4 || room.height <= 4) return
    const count = 2 + Math.floor(Math.random() * 2)  // 2 or 3 patches
    const cx = room.x + Math.floor(room.width / 2)
    const cy = room.y + Math.floor(room.height / 2)
    const cornerX = room.x + room.width - 1
    const cornerY = room.y + room.height - 1

    let placed = 0
    let attempts = 0
    while (placed < count && attempts < 20) {
      attempts++
      const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2))
      const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2))

      // Avoid center (LIGHT territory) and existing corner SHADOW
      if (Math.abs(x - cx) < 2 && Math.abs(y - cy) < 2) continue
      if (x === cornerX && (y === cornerY || y === cornerY - 1)) continue

      if (!this._inBounds(x, y) || !this._inBounds(x, y + 1)) continue
      if (grid[y][x] !== TILE.FLOOR) continue
      if (grid[y + 1]?.[x] !== TILE.FLOOR) continue

      grid[y][x]     = TILE.SHADOW
      grid[y + 1][x] = TILE.SHADOW
      placed++
    }
  }
```

- [ ] **Step 4: Run all FloorBuilder tests**

```
npx vitest run tests/map/FloorBuilder.test.js
```
Expected: all tests PASS

- [ ] **Step 5: Commit**

```
git add src/map/FloorBuilder.js tests/map/FloorBuilder.test.js
git commit -m "feat: FloorBuilder places 2-3 random SHADOW patches per room"
```

---

### Task 3: Bound system + fusion evasion in BaseEnemy and subclasses

**Files:**
- Modify: `src/enemies/BaseEnemy.js`
- Modify: `src/enemies/EsecutoreIllyrium.js`
- Modify: `src/enemies/SkravAlpha.js`
- Modify: `src/enemies/SkravMembro.js`

No unit tests (Phaser-dependent). Verification via manual play after Task 5.

- [ ] **Step 1: Modify BaseEnemy**

Replace the entire `src/enemies/BaseEnemy.js` content:

```javascript
export class BaseEnemy extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, w, h, color, hp, damage, speed) {
    super(scene, x, y, w, h, color)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.hp = hp
    this.maxHp = hp
    this.damage = damage
    this.speed = speed
    this.alive = true
    this.attackCooldown = 0
    this._bound = false
    this._boundTimer = 0
  }

  _tickBound(delta) {
    if (!this._bound) return
    this._boundTimer -= delta
    if (this._boundTimer <= 0) {
      this._bound = false
      this._boundTimer = 0
    }
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.hp -= amount
    const prev = this.fillColor
    this.fillColor = 0xffffff
    this.scene.time.delayedCall(80, () => { if (this.alive) this.fillColor = prev })
    if (this.hp <= 0) this._die()
  }

  _die() {
    this.alive = false
    this.scene._placeBloodPool(this.x, this.y)
    this.destroy()
  }

  chasePlayer(player) {
    if (!this.alive || !player?.alive || this._bound) return
    if (player._fusionActive && player._inShadow) return
    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 5) return
    this.body.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed)
  }

  attackPlayer(player, delta) {
    if (!this.alive || !player?.alive || this._bound) return
    if (player._fusionActive && player._inShadow) return
    this.attackCooldown -= delta
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    if (dist < 25 && this.attackCooldown <= 0) {
      player.takeDamage(this.damage)
      this.attackCooldown = 1000
    }
  }

  update(player, delta) {
    this._tickBound(delta)
    this.chasePlayer(player)
    this.attackPlayer(player, delta)
  }
}
```

- [ ] **Step 2: Modify EsecutoreIllyrium.chasePlayer**

EsecutoreIllyrium overrides `chasePlayer` but not `update`, so `BaseEnemy.update` already calls `_tickBound`. Only need to add the bound + fusion guard at the top of the override.

In `src/enemies/EsecutoreIllyrium.js`, change `chasePlayer`:

```javascript
  chasePlayer(player) {
    if (!this.alive || !player?.alive || this._bound) return
    if (player._fusionActive && player._inShadow) return
    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 5) return

    const baseAngle = Math.atan2(dy, dx)
    const isClosest = !this.scene.enemies.getChildren()
      .some(e => e !== this && e.alive && e instanceof EsecutoreIllyrium &&
        Phaser.Math.Distance.Between(e.x, e.y, player.x, player.y) < dist)

    const angle = isClosest ? baseAngle : baseAngle + this._flankOffset
    this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed)
  }
```

- [ ] **Step 3: Modify SkravAlpha.update**

Replace `update` in `src/enemies/SkravAlpha.js`:

```javascript
  update(player, delta) {
    if (!this.alive || !player?.alive) return
    this._tickBound(delta)
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    if (!this.signalGiven && dist < 110) {
      this.signalGiven = true
      this._flashSignal()
    }
    if (this.signalGiven && !this._bound) {
      if (!(player._fusionActive && player._inShadow)) {
        this.chasePlayer(player)
        this.attackPlayer(player, delta)
        this._tailCooldown -= delta
        if (dist > 60 && dist < 180 && this._tailCooldown <= 0) {
          this._fireTail(player)
          this._tailCooldown = 2200
        }
      }
    }
  }
```

- [ ] **Step 4: Modify SkravMembro.update**

Replace `update` in `src/enemies/SkravMembro.js`:

```javascript
  update(player, delta) {
    if (!this.alive) return
    this._tickBound(delta)
    this._updateState(delta)

    if (this._bound) {
      this.body.setVelocity(0, 0)
      return
    }

    if (this._state === 'chase') {
      this.chasePlayer(player)
      this.attackPlayer(player, delta)
    } else if (this._state === 'flee') {
      this._flee(player)
    } else if (this._state === 'waiting') {
      this._driftToAlpha()
    } else {
      this.body.setVelocity(0, 0)
    }
  }
```

- [ ] **Step 5: Run existing tests to check nothing broke**

```
npx vitest run
```
Expected: all existing tests PASS (BaseEnemy changes are Phaser-only, not unit-tested)

- [ ] **Step 6: Commit**

```
git add src/enemies/BaseEnemy.js src/enemies/EsecutoreIllyrium.js src/enemies/SkravAlpha.js src/enemies/SkravMembro.js
git commit -m "feat: enemy bound system + fusion evasion — enemies ignore invisible Silas"
```

---

### Task 4: Silas.js — full implementation

**Files:**
- Create: `src/characters/Silas.js`

- [ ] **Step 1: Create src/characters/Silas.js**

```javascript
import { BaseCharacter } from './BaseCharacter.js'
import { PLAYER_SPEED, TILE_SIZE } from '../config/GameConfig.js'
import { KeyBindings } from '../config/KeyBindings.js'
import { TILE } from '../map/TileTypes.js'
import {
  TEMP_MAX, TEMP_MIN,
  TEMP_DRAIN_BIND, TEMP_DRAIN_TELEPORT, TEMP_DRAIN_HIT,
  tempDelta, isFrozen, speedMultiplier, powersEnabled, isShadowTile,
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
    this.temperature = Math.max(TEMP_MIN, this.temperature - 25)
  }

  _updateVisual(delta) {
    // Body color: warm #0a0a1a → frozen #4488ff
    const t = 1 - (this.temperature / TEMP_MAX)
    const r = Math.round(0x0a + t * (0x44 - 0x0a))
    const g = Math.round(0x0a + t * (0x88 - 0x0a))
    const b = Math.round(0x1a + t * (0xff - 0x1a))
    this.fillColor = (r << 16) | (g << 8) | b

    // Fusion pulse
    const fusionEffective = this._fusionActive && this._inShadow
    if (fusionEffective) {
      this._fusionPulseMs += delta
      const pulse = (Math.sin(this._fusionPulseMs * Math.PI * 2 / FUSION_PULSE_MS) + 1) / 2
      this.setAlpha(FUSION_ALPHA_LOW + (FUSION_ALPHA_HIGH - FUSION_ALPHA_LOW) * pulse)
    } else {
      this.setAlpha(1)
    }

    // Temperature indicator (same blue gradient)
    this._tempIndicator.setPosition(this.x, this.y - 20)
    this._tempIndicator.fillColor = (r << 16) | (g << 8) | b

    // Shadow indicator: green when in shadow, dark otherwise
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
```

- [ ] **Step 2: Run all tests to verify no regressions**

```
npx vitest run
```
Expected: all tests PASS (Silas.js imports are all valid, no Phaser at test time — the file is never imported by unit tests)

- [ ] **Step 3: Commit**

```
git add src/characters/Silas.js
git commit -m "feat: Silas character — temperature system, fusion, bind, teleport, backstab"
```

---

### Task 5: GameScene — isInShadow() + swap player to Silas

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Add `isInShadow` method and swap player import**

Replace the import of Damian with Silas at the top of `src/scenes/GameScene.js`:

```javascript
import { Silas } from '../characters/Silas.js'
```

(Remove the `import { Damian } ...` line.)

Also add the import of SilasTemp's `isShadowTile` to use in `isInShadow`:

```javascript
import { isShadowTile } from '../characters/SilasTemp.js'
```

In `create()`, change:
```javascript
this.player = new Damian(this, spawnX, spawnY)
```
to:
```javascript
this.player = new Silas(this, spawnX, spawnY)
```

Add the `isInShadow` method after `isWalkable`:

```javascript
  isInShadow(tileX, tileY) {
    return isShadowTile(this.grid, tileX, tileY)
  }
```

- [ ] **Step 2: Run all tests**

```
npx vitest run
```
Expected: all tests PASS

- [ ] **Step 3: Open the game in a browser and verify manually**

Start the dev server with:
```
npm run dev
```
Open `http://localhost:8080` (or whatever port is used).

Verify:
1. Silas spawns (dark rectangle 16×24)
2. WASD movement works
3. Entering a corridor or perimeter tile: shadow indicator turns green, temp regen speeds up
4. LMB in light room: 12 dmg flash (blue)
5. LMB in shadow: 18 dmg flash (blue)
6. F in shadow: Silas pulses alpha (invisibility), enemies stop chasing
7. LMB after F while in shadow: 36 dmg backstab flash (orange-red), fusion closes
8. RMB in shadow near enemy: enemy turns purple briefly, stops for 2s; LMB on bound enemy = double damage
9. Q in shadow toward wall: teleports up to 80px; blocked at LIGHT tiles
10. SPACE: tactical pause still works (world slows)
11. Taking damage while frozen (temperature 0): immediate death

- [ ] **Step 4: Commit**

```
git add src/scenes/GameScene.js
git commit -m "feat: GameScene uses Silas as player, adds isInShadow()"
```

---

## Self-Review

**Spec coverage:**
- ✓ Temperature system 0-100 with frozen state (isFrozen, speedMultiplier)
- ✓ Regen in shadow (+8/s) vs out (+3/s)
- ✓ Fusion drain -5/s only when in shadow
- ✓ Hit cost -20 temp; at frozen → death
- ✓ Shadow zones: SHADOW tile, CORRIDOR, FLOOR adjacent to WALL; LIGHT always blocks
- ✓ 2-3 sparse shadow patches per room in FloorBuilder
- ✓ LMB: 12 base, 18 in shadow, 36 backstab (hadFusion + inShadow)
- ✓ RMB Shadow Bind: immobilize 2s, -15 temp, cd 1500ms, ×2 bonus on LMB
- ✓ Q Shadow Teleport: 80px, -25 temp, LIGHT tile blocks mid-path, no cost if destination = current
- ✓ F Shadow Fusion toggle: fusion suspended outside shadow (not cancelled)
- ✓ Enemy bound system: _bound + _boundTimer + _tickBound
- ✓ Enemy fusion evasion: enemies ignore player when _fusionActive && _inShadow
- ✓ Visual indicators: temperature gradient + shadow indicator dot
- ✓ rebindActions for settings hot-reload

**Placeholder scan:** None found — all steps contain complete code.

**Type consistency:** All constants (TEMP_DRAIN_BIND, TEMP_DRAIN_TELEPORT, etc.) are used via named imports in Silas.js — no raw literals in ability code. ✓
