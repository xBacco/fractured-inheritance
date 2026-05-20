# Esecutori di Illyrium — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the partial `EsecutoreIllyrium` implementation with the full Esecutori di Illyrium enemy system — 3-stage visual degradation, slot-based formation with leader, and ricalibrazione on unit death.

**Architecture:** `FormationSystem` holds the group state (slots, ricalibrazione timer, leaderless flag) and computes slot target positions each frame. `EsecutoreComune` and `EsecutoreLeader` hold visual decorations (eyes + seal as child rectangles) and query their formation for movement targets. `GameScene` creates the system, wires units, and calls `formation.update(delta)`.

**Tech Stack:** Phaser 3, ES modules, no test framework — verify visually by running the browser game.

---

## File Map

| File | Action |
|---|---|
| `src/systems/FormationSystem.js` | CREATE — slot assignment, ricalibrazione, leaderless flag |
| `src/enemies/EsecutoreComune.js` | CREATE — 3-stage degradation, no flash, no blood pool, corpse stays |
| `src/enemies/EsecutoreLeader.js` | CREATE — extends EsecutoreComune, different size/stats/thresholds |
| `src/scenes/GameScene.js` | MODIFY — new imports, `_spawnEsecutoriGroup()`, formation.update() |
| `src/enemies/EsecutoreIllyrium.js` | DELETE |

---

## Task 1: FormationSystem

**Files:**
- Create: `src/systems/FormationSystem.js`

### How slot targets work

The formation computes one target position per slot around the player. The **approach angle** is the angle from the player toward the group centroid — so `fronte` (offset 0) places the target between the player and the group, `retro` (offset +π) places it behind the player.

```
approachAngle = atan2(centroid.y − player.y, centroid.x − player.x)
slot_target   = { x: player.x + cos(approachAngle + rotation) × SLOT_DIST,
                  y: player.y + sin(approachAngle + rotation) × SLOT_DIST }
```

Slot rotations:

| Slot | Rotation |
|---|---|
| fronte | 0 |
| fianco_sx | +π/2 |
| fianco_dx | −π/2 |
| retro | +π |

- [ ] **Step 1: Create `src/systems/FormationSystem.js`**

```javascript
const SLOT_DIST = 20
const SLOT_ORDER = ['fronte', 'fianco_sx', 'fianco_dx', 'retro']
const SLOT_ROTATION = { fronte: 0, fianco_sx: Math.PI / 2, fianco_dx: -Math.PI / 2, retro: Math.PI }

export class FormationSystem {
  constructor() {
    this._units = []       // [{ unit, slot }]
    this.leaderless = false
    this._paused = false
    this._pauseTimer = 0
  }

  /** Call once per unit when spawning the group. */
  addUnit(unit, slot) {
    this._units.push({ unit, slot })
    unit._formation = this
    unit._slot = slot
  }

  /** Called by a unit inside its _die(). */
  onUnitDied(deadUnit) {
    this._units = this._units.filter(u => u.unit !== deadUnit)
    if (deadUnit._isLeader) this.leaderless = true
    this._paused = true
    this._pauseTimer = this.leaderless ? 800 : 600
    this._reassignSlots()
  }

  isPaused() { return this._paused }

  /** Returns the world-space target position for a slot this frame. */
  getSlotTarget(slot, playerX, playerY) {
    const c = this._centroid()
    const angle = Math.atan2(c.y - playerY, c.x - playerX)
    const rot = SLOT_ROTATION[slot] ?? 0
    return {
      x: playerX + Math.cos(angle + rot) * SLOT_DIST,
      y: playerY + Math.sin(angle + rot) * SLOT_DIST
    }
  }

  /** Must be called each frame from GameScene.update(). */
  update(delta) {
    if (!this._paused) return
    this._pauseTimer -= delta
    if (this._pauseTimer <= 0) this._paused = false
  }

  _centroid() {
    const alive = this._units.filter(u => u.unit.alive)
    if (alive.length === 0) return { x: 0, y: 0 }
    const sum = alive.reduce((a, u) => ({ x: a.x + u.unit.x, y: a.y + u.unit.y }), { x: 0, y: 0 })
    return { x: sum.x / alive.length, y: sum.y / alive.length }
  }

  _reassignSlots() {
    const alive = this._units.filter(u => u.unit.alive)
    const leaderEntry = alive.find(u => u.unit._isLeader)
    if (leaderEntry) {
      leaderEntry.slot = 'fronte'
      leaderEntry.unit._slot = 'fronte'
    }
    alive.filter(u => !u.unit._isLeader).forEach((entry, i) => {
      const slot = SLOT_ORDER[leaderEntry ? i + 1 : i] ?? 'fianco_sx'
      entry.slot = slot
      entry.unit._slot = slot
    })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/systems/FormationSystem.js
git commit -m "feat: add FormationSystem for Esecutori slot management"
```

---

## Task 2: EsecutoreComune

**Files:**
- Create: `src/enemies/EsecutoreComune.js`

### Visual degradation thresholds (EsecutoreComune, 60 HP)

| HP% | State | Left eye | Right eye | Seal |
|---|---|---|---|---|
| >50% | Operativo | `0xffffff` | `0xffffff` | `0x7888a0` |
| 21–50% | Degrado | `0x222222` | `0xffffff` | `0x7888a0` |
| 1–20% | Critico | `0x222222` | `0x222222` | `0x333333` |
| 0% | Collasso | `0x222222` | `0x222222` | `0x1a1a1a` |

Eyes: 2×2 px rects. Seal: 3×3 px rect. All at depth 1 (body is at default depth 0).
Eye positions: left at `(x−5, y−5)`, right at `(x+3, y−5)`. Seal at `(x, y+3)`.

- [ ] **Step 1: Create `src/enemies/EsecutoreComune.js`**

```javascript
import { BaseEnemy } from './BaseEnemy.js'

export class EsecutoreComune extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 18, 18, 0x5a6070, 60, 10, 90)
    this._isLeader = false
    this._formation = null
    this._slot = 'fronte'

    this._eyeL = scene.add.rectangle(x - 5, y - 5, 2, 2, 0xffffff).setDepth(1)
    this._eyeR = scene.add.rectangle(x + 3, y - 5, 2, 2, 0xffffff).setDepth(1)
    this._seal = scene.add.rectangle(x, y + 3, 3, 3, 0x7888a0).setDepth(1)
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.hp -= amount
    this._updateDegradation()
    if (this.hp <= 0) this._die()
  }

  _die() {
    this.alive = false
    if (this.body) {
      this.body.setVelocity(0, 0)
      this.body.enable = false
    }
    this.fillColor = 0x2a2d32
    this._eyeL.fillColor = 0x222222
    this._eyeR.fillColor = 0x222222
    this._seal.fillColor = 0x1a1a1a
    if (this._formation) this._formation.onUnitDied(this)
  }

  chasePlayer(player) {
    if (!this.alive || !player?.alive || this._bound) return
    if (player._fusionActive && player._inShadow) return
    if (this._formation?.isPaused()) {
      this.body.setVelocity(0, 0)
      return
    }

    let targetX, targetY
    if (this._formation) {
      const t = this._formation.getSlotTarget(this._slot, player.x, player.y)
      targetX = t.x
      targetY = t.y
    } else {
      targetX = player.x
      targetY = player.y
    }

    const dx = targetX - this.x
    const dy = targetY - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 5) return
    this.body.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed)
  }

  attackPlayer(player, delta) {
    if (!this.alive || !player?.alive || this._bound) return
    if (player._fusionActive && player._inShadow) return
    this.attackCooldown -= delta
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    const cooldown = (this._formation?.leaderless && !this._isLeader) ? 1200 : 1000
    if (dist < 25 && this.attackCooldown <= 0) {
      player.takeDamage(this.damage)
      this.attackCooldown = cooldown
    }
  }

  update(player, delta) {
    if (!this.alive) return
    this._tickBound(delta)
    this._syncDecorations()
    this.chasePlayer(player)
    this.attackPlayer(player, delta)
  }

  destroy() {
    this._eyeL?.destroy()
    this._eyeR?.destroy()
    this._seal?.destroy()
    super.destroy()
  }

  _syncDecorations() {
    this._eyeL.setPosition(this.x - 5, this.y - 5)
    this._eyeR.setPosition(this.x + 3, this.y - 5)
    this._seal.setPosition(this.x, this.y + 3)
  }

  _updateDegradation() {
    const pct = this.hp / this.maxHp
    if (pct > 0.5) {
      this._eyeL.fillColor = 0xffffff
      this._eyeR.fillColor = 0xffffff
      this._seal.fillColor = 0x7888a0
    } else if (pct > 0.2) {
      this._eyeL.fillColor = 0x222222
      this._eyeR.fillColor = 0xffffff
      this._seal.fillColor = 0x7888a0
    } else {
      this._eyeL.fillColor = 0x222222
      this._eyeR.fillColor = 0x222222
      this._seal.fillColor = 0x333333
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/enemies/EsecutoreComune.js
git commit -m "feat: add EsecutoreComune with visual degradation system"
```

---

## Task 3: EsecutoreLeader

**Files:**
- Create: `src/enemies/EsecutoreLeader.js`

### Differences from EsecutoreComune

| Property | Comune | Leader |
|---|---|---|
| Size | 18×18 | 22×22 |
| Color | `0x5a6070` | `0x3a4050` |
| HP | 60 | 108 |
| Damage | 10 | 15 |
| Speed | 90 | 85 |
| `_isLeader` | false | **true** |
| Slot | assigned | always **fronte** |

### Visual degradation thresholds (Leader, 108 HP)

| HP% | State | Left eye | Right eye | Seal |
|---|---|---|---|---|
| >70% | Operativo | `0xffffff` | `0xffffff` | `0x9090c0` |
| 41–70% | Degrado | `0x222222` | `0xffffff` | `0x9090c0` |
| 1–40% | Critico | `0x222222` | `0x222222` | `0x333333` |

Eye positions (22×22 body): left at `(x−6, y−6)`, right at `(x+3, y−6)`. Seal at `(x, y+4)`, size 4×4.

- [ ] **Step 1: Create `src/enemies/EsecutoreLeader.js`**

```javascript
import { EsecutoreComune } from './EsecutoreComune.js'

export class EsecutoreLeader extends EsecutoreComune {
  constructor(scene, x, y) {
    super(scene, x, y)
    this._isLeader = true
    this._slot = 'fronte'

    // Override base dimensions and stats
    this.setSize(22, 22)
    this.fillColor = 0x3a4050
    this.hp = 108
    this.maxHp = 108
    this.damage = 15
    this.speed = 85

    // Override decorations: larger, repositioned, brighter seal
    this._eyeL.destroy()
    this._eyeR.destroy()
    this._seal.destroy()
    this._eyeL = scene.add.rectangle(x - 6, y - 6, 2, 2, 0xffffff).setDepth(1)
    this._eyeR = scene.add.rectangle(x + 3, y - 6, 2, 2, 0xffffff).setDepth(1)
    this._seal = scene.add.rectangle(x, y + 4, 4, 4, 0x9090c0).setDepth(1)
  }

  _syncDecorations() {
    this._eyeL.setPosition(this.x - 6, this.y - 6)
    this._eyeR.setPosition(this.x + 3, this.y - 6)
    this._seal.setPosition(this.x, this.y + 4)
  }

  _updateDegradation() {
    const pct = this.hp / this.maxHp
    if (pct > 0.7) {
      this._eyeL.fillColor = 0xffffff
      this._eyeR.fillColor = 0xffffff
      this._seal.fillColor = 0x9090c0
    } else if (pct > 0.4) {
      this._eyeL.fillColor = 0x222222
      this._eyeR.fillColor = 0xffffff
      this._seal.fillColor = 0x9090c0
    } else {
      this._eyeL.fillColor = 0x222222
      this._eyeR.fillColor = 0x222222
      this._seal.fillColor = 0x333333
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/enemies/EsecutoreLeader.js
git commit -m "feat: add EsecutoreLeader extending EsecutoreComune"
```

---

## Task 4: Wire GameScene + delete EsecutoreIllyrium

**Files:**
- Modify: `src/scenes/GameScene.js`
- Delete: `src/enemies/EsecutoreIllyrium.js`

### Changes to GameScene

1. Replace the `EsecutoreIllyrium` import with `EsecutoreComune`, `EsecutoreLeader`, `FormationSystem`.
2. In `create()`, add `this.floor = 1` (default; change to 2+ to test leader spawning) and `this._formations = []`.
3. In `update()`, call `this._formations.forEach(f => f.update(delta))`.
4. Replace `_spawnEnemies()` to call `_spawnEsecutoriGroup()` instead of spawning individual `EsecutoreIllyrium`.
5. Add `_spawnEsecutoriGroup(cx, cy)`.

- [ ] **Step 1: Update imports in `GameScene.js`** (lines 8)

Replace:
```javascript
import { EsecutoreIllyrium } from '../enemies/EsecutoreIllyrium.js'
```
With:
```javascript
import { EsecutoreComune } from '../enemies/EsecutoreComune.js'
import { EsecutoreLeader } from '../enemies/EsecutoreLeader.js'
import { FormationSystem } from '../systems/FormationSystem.js'
```

- [ ] **Step 2: Add `this.floor` and `this._formations` in `create()`** (after line 26, player spawn)

Add after `this.player = new Silas(this, spawnX, spawnY)`:
```javascript
this.floor = 1
this._formations = []
```

- [ ] **Step 3: Call `formation.update(delta)` in `update()`** (after the enemies loop, ~line 71)

Add after the enemies forEach block:
```javascript
if (this._formations) {
  this._formations.forEach(f => f.update(delta))
}
```

- [ ] **Step 4: Replace `_spawnEnemies()` and add `_spawnEsecutoriGroup()`**

Replace the existing `_spawnEnemies()` method (lines 103–117) with:
```javascript
_spawnEnemies() {
  const enemyRooms = this.rooms.slice(1)
  const splitAt = Math.ceil(enemyRooms.length / 2)
  enemyRooms.forEach((room, i) => {
    const cx = (room.x + Math.floor(room.width / 2)) * TILE_SIZE
    const cy = (room.y + Math.floor(room.height / 2)) * TILE_SIZE
    if (i < splitAt) {
      this._spawnEsecutoriGroup(cx, cy)
    } else {
      this._spawnSkravPack(cx, cy)
    }
  })
}

_spawnEsecutoriGroup(cx, cy) {
  const count = Phaser.Math.Between(1, 3)
  const system = new FormationSystem()
  const SLOT_ORDER = ['fronte', 'fianco_sx', 'fianco_dx']
  const SPAWN_OFFSETS = [[0, 0], [-25, -15], [25, -15]]

  if (this.floor >= 2) {
    const leader = new EsecutoreLeader(this, cx, cy)
    system.addUnit(leader, 'fronte')
    this.enemies.add(leader)
    for (let i = 0; i < count - 1; i++) {
      const [ox, oy] = SPAWN_OFFSETS[i + 1]
      const unit = new EsecutoreComune(this, cx + ox, cy + oy)
      system.addUnit(unit, SLOT_ORDER[i + 1])
      this.enemies.add(unit)
    }
  } else {
    for (let i = 0; i < count; i++) {
      const [ox, oy] = SPAWN_OFFSETS[i]
      const unit = new EsecutoreComune(this, cx + ox, cy + oy)
      system.addUnit(unit, SLOT_ORDER[i])
      this.enemies.add(unit)
    }
  }

  this._formations.push(system)
}
```

- [ ] **Step 5: Delete `src/enemies/EsecutoreIllyrium.js`**

```bash
git rm src/enemies/EsecutoreIllyrium.js
```

- [ ] **Step 6: Commit all GameScene changes**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: wire Esecutori formation system into GameScene, remove EsecutoreIllyrium"
```

---

## Task 5: Visual Verification

- [ ] **Step 1: Run the game**

```bash
npx serve . --port 3000
```

Open `http://localhost:3000` in the browser (or whatever the project's dev server is — check `package.json` for the start script).

- [ ] **Step 2: Verify formation**

In a room with Esecutori, confirm:
- Multiple enemies approach the player from different angles (not all piling from one side)
- After killing one enemy, all remaining units **stop for ~600ms**, then resume

- [ ] **Step 3: Verify visual degradation**

Hit an Esecutore multiple times and confirm:
- No white flash on hit
- At ~50% HP: left eye turns dark, right eye stays white
- At ~20% HP: both eyes dark, seal fades to gray
- On death: no blood pool tile, body stays as a dark rectangle

- [ ] **Step 4: Verify Leader (change floor to 2 in GameScene.create())**

Temporarily set `this.floor = 2`, reload, and confirm:
- Larger darker rectangle spawns as the leader
- On leader death: remaining comuni pause for **800ms** (longer than non-leader death)

- [ ] **Step 5: Commit verification result**

No code changes if everything passes. Reset `this.floor = 1`.

```bash
git add src/scenes/GameScene.js
git commit -m "chore: reset floor to 1 after leader verification"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| No flash on damage | Task 2 — `takeDamage()` no fillColor change |
| 3-stage degradation (Operativo/Degrado/Critico) | Task 2 — `_updateDegradation()` |
| Collasso: body stays, no blood pool, no sound | Task 2 — `_die()` sets velocity 0, no `_placeBloodPool` |
| EsecutoreLeader: larger, darker, different thresholds | Task 3 |
| Leader always fronte slot | Task 3 — `_isLeader = true`, Task 4 — always assigned 'fronte' |
| Slot system (fronte/fianco_sx/fianco_dx/retro) | Task 1 — FormationSystem |
| Ricalibrazione: 600ms pause with leader, 800ms without | Task 1 — `onUnitDied()` |
| Leaderless flag + +200ms attack cooldown | Task 1 (`leaderless`), Task 2 (`attackPlayer`) |
| Slot reassignment after unit death | Task 1 — `_reassignSlots()` |
| 1–3 units per room | Task 4 — `Phaser.Math.Between(1, 3)` |
| Leader from floor 2+ | Task 4 — `if (this.floor >= 2)` |
| Silence on ricalibrazione | Implicit — no sound calls anywhere |
| Silas shadow: formation doesn't update during invisibility | Inherited from BaseEnemy `chasePlayer` guard — `player._fusionActive && player._inShadow` |
| Damian Phase 3 knockback exception in Critico state | Not implemented — requires Damian integration (future task when Damian is built) |
| Zeryth pausa tattica | Inherited from TacticalPause timeScale system — already works |
