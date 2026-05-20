# Mira Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Mira — alchimista giocabile con sistema temperatura/guanti, cinque abilità basate sul materiale del tile, e meccanica Rebound.

**Architecture:** Pattern puro + Phaser identico a Silas/Damian. `MiraAlchemy.js` contiene tutta la logica testabile (costanti, lookup material, temperatura, Rebound). `Mira.js` estende `BaseCharacter` e gestisce input, rendering e HUD. `BaseEnemy.js` riceve due piccole estensioni (slow + acid DoT) per supportare le abilità LMB/RMB di Mira.

**Tech Stack:** Phaser 3.80, Vitest 1.6, ES Modules, `src/map/TileTypes.js` per TILE constants

---

## File Structure

| File | Azione | Responsabilità |
|---|---|---|
| `src/characters/MiraAlchemy.js` | Create | Costanti, materialForTile, costi abilità, temperature tick, reboundResult |
| `src/characters/Mira.js` | Create | Classe Phaser: HP, temp, guanti, input LMB/RMB/Q/F, Rebound visual, HUD |
| `tests/characters/MiraAlchemy.test.js` | Create | Test puri per MiraAlchemy |
| `src/enemies/BaseEnemy.js` | Modify | Aggiunge slow (`_slowTimer`/`_slowMult`) e acid DoT (`_acidMs`/`_acidDps`) |
| `src/scenes/GameScene.js` | Modify | Sostituisce `new Silas(...)` con `new Mira(...)` |

---

### Task 1: MiraAlchemy.js — costanti, materialForTile, tabelle abilità

**Files:**
- Create: `src/characters/MiraAlchemy.js`
- Create: `tests/characters/MiraAlchemy.test.js`

- [ ] **Step 1: Scrivi il test fallente per Task 1**

```js
// tests/characters/MiraAlchemy.test.js
import { describe, it, expect } from 'vitest'
import { TILE } from '../../src/map/TileTypes.js'
import {
  TEMP_MAX, TEMP_DECAY_PER_S, TEMP_HIGH_THRESHOLD, TEMP_LOCKOUT_MS,
  GLOVES_MAX, GLOVES_REBOUND_COST,
  MAT, materialForTile, abilityCost, wallDuration, rmbDamage,
} from '../../src/characters/MiraAlchemy.js'

describe('MiraAlchemy — constants', () => {
  it('TEMP_MAX is 100',          () => expect(TEMP_MAX).toBe(100))
  it('TEMP_DECAY_PER_S is 4',   () => expect(TEMP_DECAY_PER_S).toBe(4))
  it('TEMP_HIGH_THRESHOLD is 80', () => expect(TEMP_HIGH_THRESHOLD).toBe(80))
  it('TEMP_LOCKOUT_MS is 2000', () => expect(TEMP_LOCKOUT_MS).toBe(2000))
  it('GLOVES_MAX is 100',       () => expect(GLOVES_MAX).toBe(100))
  it('GLOVES_REBOUND_COST is 25', () => expect(GLOVES_REBOUND_COST).toBe(25))
})

describe('materialForTile', () => {
  it('FLOOR → EARTH',        () => expect(materialForTile(TILE.FLOOR)).toBe(MAT.EARTH))
  it('CORRIDOR → EARTH',     () => expect(materialForTile(TILE.CORRIDOR)).toBe(MAT.EARTH))
  it('SHADOW → EARTH',       () => expect(materialForTile(TILE.SHADOW)).toBe(MAT.EARTH))
  it('DESTRUCTIBLE → STONE', () => expect(materialForTile(TILE.DESTRUCTIBLE)).toBe(MAT.STONE))
  it('METAL → METAL',        () => expect(materialForTile(TILE.METAL)).toBe(MAT.METAL))
  it('BLOOD_POOL → LIQUID',  () => expect(materialForTile(TILE.BLOOD_POOL)).toBe(MAT.LIQUID))
  it('WALL → null',          () => expect(materialForTile(TILE.WALL)).toBeNull())
  it('LIGHT → null',         () => expect(materialForTile(TILE.LIGHT)).toBeNull())
})

describe('abilityCost', () => {
  it('LMB EARTH = 6',  () => expect(abilityCost('LMB', MAT.EARTH)).toBe(6))
  it('LMB STONE = 8',  () => expect(abilityCost('LMB', MAT.STONE)).toBe(8))
  it('LMB METAL = 10', () => expect(abilityCost('LMB', MAT.METAL)).toBe(10))
  it('LMB LIQUID = 8', () => expect(abilityCost('LMB', MAT.LIQUID)).toBe(8))
  it('RMB EARTH = 6',  () => expect(abilityCost('RMB', MAT.EARTH)).toBe(6))
  it('RMB STONE = 10', () => expect(abilityCost('RMB', MAT.STONE)).toBe(10))
  it('RMB METAL = 10', () => expect(abilityCost('RMB', MAT.METAL)).toBe(10))
  it('RMB LIQUID = 8', () => expect(abilityCost('RMB', MAT.LIQUID)).toBe(8))
  it('F (flat) = 15',  () => expect(abilityCost('F', null)).toBe(15))
})

describe('wallDuration', () => {
  it('EARTH = 1500ms',  () => expect(wallDuration(MAT.EARTH)).toBe(1500))
  it('STONE = 3000ms',  () => expect(wallDuration(MAT.STONE)).toBe(3000))
  it('METAL = 4000ms',  () => expect(wallDuration(MAT.METAL)).toBe(4000))
  it('LIQUID = 2000ms', () => expect(wallDuration(MAT.LIQUID)).toBe(2000))
})

describe('rmbDamage', () => {
  it('EARTH = 0 (slow only)', () => expect(rmbDamage(MAT.EARTH)).toBe(0))
  it('STONE = 30',             () => expect(rmbDamage(MAT.STONE)).toBe(30))
  it('METAL = 35',             () => expect(rmbDamage(MAT.METAL)).toBe(35))
  it('LIQUID = 25',            () => expect(rmbDamage(MAT.LIQUID)).toBe(25))
})
```

- [ ] **Step 2: Esegui il test per verificare che fallisca**

```
npx vitest run tests/characters/MiraAlchemy.test.js
```
Expected: FAIL — "Cannot find module '../../src/characters/MiraAlchemy.js'"

- [ ] **Step 3: Scrivi l'implementazione**

```js
// src/characters/MiraAlchemy.js
import { TILE } from '../map/TileTypes.js'

// --- Temperatura ---
export const TEMP_MAX              = 100
export const TEMP_DECAY_PER_S     = 4
export const TEMP_HIGH_THRESHOLD  = 80
export const TEMP_SURCHARGE_MULT  = 1.5
export const TEMP_LOCKOUT_MS      = 2000
export const TEMP_REBOUND_RECOVERY = 30

// --- Guanti ---
export const GLOVES_MAX          = 100
export const GLOVES_REBOUND_COST = 25

// --- Rebound ---
export const REBOUND_STUN_MS       = 800
export const REBOUND_INVINCIBLE_MS = 400
export const REBOUND_VIGNETTE_MS   = 1500
export const REBOUND_BLEED_DPS     = 10
export const REBOUND_BLEED_MS      = 3000
export const REBOUND_AGG_DAMAGE    = 40
export const REBOUND_AGG_STUN_MS   = 1000

// --- Materiali ---
export const MAT = Object.freeze({
  EARTH: 'EARTH', STONE: 'STONE', METAL: 'METAL', LIQUID: 'LIQUID',
})

const TILE_MAT = {
  [TILE.FLOOR]:       MAT.EARTH,
  [TILE.CORRIDOR]:    MAT.EARTH,
  [TILE.SHADOW]:      MAT.EARTH,
  [TILE.DESTRUCTIBLE]:MAT.STONE,
  [TILE.METAL]:       MAT.METAL,
  [TILE.BLOOD_POOL]:  MAT.LIQUID,
}

export function materialForTile(tileType) {
  return TILE_MAT[tileType] ?? null
}

// --- Costi abilità (temperatura aumenta di questo valore per ogni cast) ---
const COST = {
  LMB: { [MAT.EARTH]: 6, [MAT.STONE]: 8, [MAT.METAL]: 10, [MAT.LIQUID]: 8 },
  RMB: { [MAT.EARTH]: 6, [MAT.STONE]: 10, [MAT.METAL]: 10, [MAT.LIQUID]: 8 },
  F: 15,
}

export function abilityCost(ability, material) {
  if (ability === 'F') return COST.F
  return COST[ability]?.[material] ?? 0
}

// --- Wall durations (ms) ---
const WALL_DUR = {
  [MAT.EARTH]: 1500, [MAT.STONE]: 3000, [MAT.METAL]: 4000, [MAT.LIQUID]: 2000,
}
export function wallDuration(material) { return WALL_DUR[material] ?? 1500 }

// --- RMB damage ---
const RMB_DMG = { [MAT.EARTH]: 0, [MAT.STONE]: 30, [MAT.METAL]: 35, [MAT.LIQUID]: 25 }
export function rmbDamage(material) { return RMB_DMG[material] ?? 0 }
```

- [ ] **Step 4: Esegui il test per verificare che passi**

```
npx vitest run tests/characters/MiraAlchemy.test.js
```
Expected: PASS — tutti i test di costanti/materiali

- [ ] **Step 5: Commit**

```
git add src/characters/MiraAlchemy.js tests/characters/MiraAlchemy.test.js
git commit -m "feat: MiraAlchemy constants, materialForTile, cost tables"
```

---

### Task 2: MiraAlchemy.js — temperatura decay, surcharge, overheat

**Files:**
- Modify: `src/characters/MiraAlchemy.js`
- Modify: `tests/characters/MiraAlchemy.test.js`

- [ ] **Step 1: Scrivi i test fallenti — aggiungi in fondo al file di test**

```js
// Aggiungi in tests/characters/MiraAlchemy.test.js
import {
  // (aggiungi agli import esistenti)
  tempAfterDecay, tempWithCost, isOverheat, isHighHeat,
} from '../../src/characters/MiraAlchemy.js'

describe('tempAfterDecay', () => {
  it('decreases by 4 per second at full delta', () =>
    expect(tempAfterDecay(50, 1000)).toBeCloseTo(46))
  it('scales with delta (500ms = -2)', () =>
    expect(tempAfterDecay(50, 500)).toBeCloseTo(48))
  it('does not go below 0', () =>
    expect(tempAfterDecay(1, 1000)).toBe(0))
  it('starts at 0 → stays 0', () =>
    expect(tempAfterDecay(0, 1000)).toBe(0))
})

describe('tempWithCost', () => {
  it('adds base cost at temp < 80', () =>
    expect(tempWithCost(40, 6)).toBe(46))
  it('applies 1.5x surcharge at temp >= 80 (80 + 6*1.5 = 89)', () =>
    expect(tempWithCost(80, 6)).toBe(89))
  it('caps at 100', () =>
    expect(tempWithCost(98, 10)).toBe(100))
  it('at temp 79: no surcharge (79 + 8 = 87)', () =>
    expect(tempWithCost(79, 8)).toBe(87))
})

describe('isOverheat / isHighHeat', () => {
  it('isOverheat true at 100',  () => expect(isOverheat(100)).toBe(true))
  it('isOverheat false at 99',  () => expect(isOverheat(99)).toBe(false))
  it('isHighHeat true at 80',   () => expect(isHighHeat(80)).toBe(true))
  it('isHighHeat false at 79',  () => expect(isHighHeat(79)).toBe(false))
  it('isHighHeat true at 100',  () => expect(isHighHeat(100)).toBe(true))
})
```

- [ ] **Step 2: Esegui il test per verificare che fallisca**

```
npx vitest run tests/characters/MiraAlchemy.test.js
```
Expected: FAIL — nuove funzioni non ancora definite

- [ ] **Step 3: Aggiungi le funzioni a MiraAlchemy.js**

```js
// Aggiungi in fondo a src/characters/MiraAlchemy.js

export function tempAfterDecay(temp, delta) {
  return Math.max(0, temp - TEMP_DECAY_PER_S * (delta / 1000))
}

export function tempWithCost(temp, baseCost) {
  const mult = temp >= TEMP_HIGH_THRESHOLD ? TEMP_SURCHARGE_MULT : 1
  return Math.min(TEMP_MAX, temp + baseCost * mult)
}

export function isOverheat(temp) { return temp >= TEMP_MAX }
export function isHighHeat(temp)  { return temp >= TEMP_HIGH_THRESHOLD }
```

- [ ] **Step 4: Esegui il test per verificare che passi**

```
npx vitest run tests/characters/MiraAlchemy.test.js
```
Expected: PASS

- [ ] **Step 5: Commit**

```
git add src/characters/MiraAlchemy.js tests/characters/MiraAlchemy.test.js
git commit -m "feat: MiraAlchemy temperatura decay, surcharge, overheat check"
```

---

### Task 3: MiraAlchemy.js — reboundResult

**Files:**
- Modify: `src/characters/MiraAlchemy.js`
- Modify: `tests/characters/MiraAlchemy.test.js`

- [ ] **Step 1: Scrivi i test fallenti**

```js
// Aggiungi in tests/characters/MiraAlchemy.test.js
import {
  // (aggiungi agli import esistenti)
  reboundResult,
  REBOUND_STUN_MS, REBOUND_BLEED_DPS, REBOUND_BLEED_MS,
  REBOUND_AGG_DAMAGE, REBOUND_AGG_STUN_MS, TEMP_REBOUND_RECOVERY,
} from '../../src/characters/MiraAlchemy.js'

describe('reboundResult', () => {
  describe('normal (guanti > 0)', () => {
    const r = reboundResult(100, 100)
    it('temp drops by TEMP_REBOUND_RECOVERY',  () => expect(r.newTemp).toBe(70))
    it('gloves drop by GLOVES_REBOUND_COST',   () => expect(r.newGloves).toBe(75))
    it('not aggravated',                        () => expect(r.aggravated).toBe(false))
    it('stunMs = REBOUND_STUN_MS (800)',        () => expect(r.stunMs).toBe(REBOUND_STUN_MS))
    it('bleedDmg = REBOUND_BLEED_DPS (10)',    () => expect(r.bleedDmg).toBe(REBOUND_BLEED_DPS))
    it('bleedMs = REBOUND_BLEED_MS (3000)',    () => expect(r.bleedMs).toBe(REBOUND_BLEED_MS))
    it('directDmg = 0',                        () => expect(r.directDmg).toBe(0))
  })

  describe('aggravated (guanti = 0)', () => {
    const r = reboundResult(100, 0)
    it('aggravated = true',                     () => expect(r.aggravated).toBe(true))
    it('stunMs = REBOUND_AGG_STUN_MS (1000)',   () => expect(r.stunMs).toBe(REBOUND_AGG_STUN_MS))
    it('directDmg = REBOUND_AGG_DAMAGE (40)',   () => expect(r.directDmg).toBe(REBOUND_AGG_DAMAGE))
    it('bleedDmg = 0',                          () => expect(r.bleedDmg).toBe(0))
    it('bleedMs = 0',                           () => expect(r.bleedMs).toBe(0))
    it('newGloves stays at 0',                  () => expect(r.newGloves).toBe(0))
  })

  it('gloves clamp: 10 gloves → 0 after rebound',    () =>
    expect(reboundResult(100, 10).newGloves).toBe(0))
  it('temp clamp: 20 temp → 0 after rebound',         () =>
    expect(reboundResult(20, 100).newTemp).toBe(0))
  it('third rebound: gloves 50 → 25',                 () =>
    expect(reboundResult(100, 50).newGloves).toBe(25))
})
```

- [ ] **Step 2: Esegui il test per verificare che fallisca**

```
npx vitest run tests/characters/MiraAlchemy.test.js
```
Expected: FAIL

- [ ] **Step 3: Aggiungi reboundResult a MiraAlchemy.js**

```js
// Aggiungi in fondo a src/characters/MiraAlchemy.js

export function reboundResult(temp, gloves) {
  const aggravated = gloves <= 0
  return {
    newTemp:   Math.max(0, temp - TEMP_REBOUND_RECOVERY),
    newGloves: Math.max(0, gloves - GLOVES_REBOUND_COST),
    aggravated,
    stunMs:    aggravated ? REBOUND_AGG_STUN_MS : REBOUND_STUN_MS,
    bleedDmg:  aggravated ? 0 : REBOUND_BLEED_DPS,
    bleedMs:   aggravated ? 0 : REBOUND_BLEED_MS,
    directDmg: aggravated ? REBOUND_AGG_DAMAGE : 0,
  }
}
```

- [ ] **Step 4: Esegui il test per verificare che passi**

```
npx vitest run tests/characters/MiraAlchemy.test.js
```
Expected: PASS — tutti i test MiraAlchemy (costanti + decay + rebound)

- [ ] **Step 5: Commit**

```
git add src/characters/MiraAlchemy.js tests/characters/MiraAlchemy.test.js
git commit -m "feat: MiraAlchemy reboundResult — normal + aggravated"
```

---

### Task 4: BaseEnemy.js — slow e acid DoT

**Files:**
- Modify: `src/enemies/BaseEnemy.js`

- [ ] **Step 1: Aggiungi slow e acid DoT al constructor e all'update**

Apri `src/enemies/BaseEnemy.js` e modifica il `constructor` aggiungendo i nuovi flag:

```js
// In BaseEnemy constructor, dopo this._boundTimer = 0:
this._slowTimer  = 0
this._slowMult   = 1
this._acidMs     = 0
this._acidDps    = 0
```

Modifica `chasePlayer` per usare il slow multiplier:

```js
// Sostituisci la riga con setVelocity in chasePlayer:
const effectiveSpeed = this.speed * this._slowMult
this.body.setVelocity((dx / dist) * effectiveSpeed, (dy / dist) * effectiveSpeed)
```

Aggiungi il tick per slow e acid al metodo `update`:

```js
// In update(player, delta), dopo this._tickBound(delta):
this._tickSlowAndAcid(delta)
```

Aggiungi il nuovo metodo privato dopo `_tickBound`:

```js
_tickSlowAndAcid(delta) {
  if (this._slowTimer > 0) {
    this._slowTimer -= delta
    if (this._slowTimer <= 0) { this._slowTimer = 0; this._slowMult = 1 }
  }
  if (this._acidMs > 0) {
    this._acidMs -= delta
    const dmg = this._acidDps * (delta / 1000)
    this.hp -= dmg
    if (this.hp <= 0) this._die()
  }
}
```

- [ ] **Step 2: Verifica che i test esistenti passino ancora**

```
npx vitest run
```
Expected: tutti i test passano (i nuovi campi non rompono nulla)

- [ ] **Step 3: Commit**

```
git add src/enemies/BaseEnemy.js
git commit -m "feat: BaseEnemy slow timer and acid DoT support for Mira abilities"
```

---

### Task 5: Mira.js — constructor, HP, takeDamage, struttura base

**Files:**
- Create: `src/characters/Mira.js`

- [ ] **Step 1: Crea il file con constructor e metodi base**

```js
// src/characters/Mira.js
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

    // HUD bars (scroll-fixed)
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
    const prev = this.fillColor
    this.fillColor = 0xff8800
    this.scene.time.delayedCall(80, () => { if (this.alive) this.fillColor = 0xD44E0A })
  }

  rebindActions(scene) {
    scene.input.keyboard.removeKey(this.qKey)
    scene.input.keyboard.removeKey(this.fKey)
    this.qKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability1'))
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))
  }
}
```

- [ ] **Step 2: Verifica che il file compili senza errori**

```
npx vitest run
```
Expected: PASS — nessun import error (Mira non è ancora importato da nessun parte)

- [ ] **Step 3: Commit**

```
git add src/characters/Mira.js
git commit -m "feat: Mira class scaffold — constructor, HP, takeDamage, rebindActions"
```

---

### Task 6: Mira.js — temperatura, lockout, metodi di tick

**Files:**
- Modify: `src/characters/Mira.js`

- [ ] **Step 1: Aggiungi i metodi di tick alla classe**

Aggiungi questi metodi DENTRO la classe `Mira`, prima della chiusura `}`:

```js
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
    // Returns true if cast is BLOCKED (and triggers Rebound if forced)
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

  _handleLMB(scene)     { /* Task 7 */ }
  _handleRMB(scene)     { /* Task 8 */ }
  _handleQ(scene, delta){ /* Task 9 */ }
  _handleF(scene)       { /* Task 10 */ }
```

- [ ] **Step 2: Verifica che il file compili**

```
npx vitest run
```
Expected: PASS

- [ ] **Step 3: Commit**

```
git add src/characters/Mira.js
git commit -m "feat: Mira temperature tick, lockout, precast/postcast check"
```

---

### Task 7: Mira.js — LMB wall

**Files:**
- Modify: `src/characters/Mira.js`

- [ ] **Step 1: Sostituisci il placeholder `_handleLMB` con l'implementazione completa**

```js
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
```

- [ ] **Step 2: Verifica che i test esistenti passino ancora**

```
npx vitest run
```
Expected: PASS

- [ ] **Step 3: Commit**

```
git add src/characters/Mira.js
git commit -m "feat: Mira LMB wall — tile-based temporary wall per material"
```

---

### Task 8: Mira.js — RMB ground attack

**Files:**
- Modify: `src/characters/Mira.js`

- [ ] **Step 1: Sostituisci il placeholder `_handleRMB` con l'implementazione completa**

```js
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
    // Flash sul tile
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
```

- [ ] **Step 2: Verifica che i test passino**

```
npx vitest run
```
Expected: PASS

- [ ] **Step 3: Commit**

```
git add src/characters/Mira.js
git commit -m "feat: Mira RMB ground attack — slow, spike, lance, acid per material"
```

---

### Task 9: Mira.js — Q rearmo al volo (METAL only)

**Files:**
- Modify: `src/characters/Mira.js`

- [ ] **Step 1: Sostituisci il placeholder `_handleQ` con l'implementazione completa**

```js
  _handleQ(scene, delta) {
    const qNowDown = this.qKey.isDown

    // Q appena premuto
    if (qNowDown && !this._qDown) {
      this._qDown    = true
      this._qHoldMs  = 0
      const tileX = Math.floor(this.x / TILE_SIZE)
      const tileY = Math.floor(this.y / TILE_SIZE)
      this._qOnMetal = scene.grid?.[tileY]?.[tileX] === TILE.METAL
    }

    // Q tenuto premuto
    if (qNowDown && this._qDown && this._qOnMetal) {
      this._qHoldMs += delta
    }

    // Q appena rilasciato
    if (!qNowDown && this._qDown) {
      const wasOnMetal = this._qOnMetal
      this._qDown    = false
      this._qOnMetal = false

      if (!wasOnMetal) return  // silent

      if (this._precastCheck(scene)) return

      // Consuma il tile METAL (torna FLOOR dopo 8s)
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
```

- [ ] **Step 2: Verifica che i test passino**

```
npx vitest run
```
Expected: PASS

- [ ] **Step 3: Commit**

```
git add src/characters/Mira.js
git commit -m "feat: Mira Q rearmo — lance throw or shield from METAL tile"
```

---

### Task 10: Mira.js — F reazione metamorfica

**Files:**
- Modify: `src/characters/Mira.js`

- [ ] **Step 1: Sostituisci il placeholder `_handleF` con l'implementazione completa**

```js
  _handleF(scene) {
    if (!Phaser.Input.Keyboard.JustDown(this.fKey)) return

    const cx = Math.floor(this.x / TILE_SIZE)
    const cy = Math.floor(this.y / TILE_SIZE)

    // Trova il primo tile DESTRUCTIBLE adiacente (N/S/E/W)
    let target = null
    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      if (scene.grid?.[cy + dy]?.[cx + dx] === TILE.DESTRUCTIBLE) {
        target = { x: cx + dx, y: cy + dy }
        break
      }
    }
    if (!target) return  // silent

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
```

- [ ] **Step 2: Verifica che i test passino**

```
npx vitest run
```
Expected: PASS

- [ ] **Step 3: Commit**

```
git add src/characters/Mira.js
git commit -m "feat: Mira F reazione metamorfica — open DESTRUCTIBLE tile"
```

---

### Task 11: Mira.js — Rebound visual, DoT, vignette

**Files:**
- Modify: `src/characters/Mira.js`

- [ ] **Step 1: Aggiungi i metodi Rebound alla classe**

```js
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
```

- [ ] **Step 2: Verifica che i test passino**

```
npx vitest run
```
Expected: PASS

- [ ] **Step 3: Commit**

```
git add src/characters/Mira.js
git commit -m "feat: Mira Rebound — stun, vignette, bleed DoT, aggravated direct damage"
```

---

### Task 12: Mira.js — HUD bars e visual

**Files:**
- Modify: `src/characters/Mira.js`

- [ ] **Step 1: Aggiungi `_updateVisual` e `_checkDeath` alla classe**

```js
  _updateVisual(scene) {
    const cam  = scene.cameras.main
    const hx   = 20
    const hy   = scene.game.config.height - 40
    const barW = 80

    // Barra temperatura: bianca→rossa con temp
    const tf = this.temperature / TEMP_MAX
    const tr = Math.round(0x3A + tf * (0xDD - 0x3A))
    const tg = Math.round(0xAE + tf * (0x33 - 0xAE))
    const tb = Math.round(0xFF + tf * (0x11 - 0xFF))
    this._tempBar
      .setPosition(hx + (barW * tf) / 2, hy)
      .setSize(barW * tf + 1, 6)
      .setFillStyle((tr << 16) | (tg << 8) | tb)

    // Barra guanti: verde→grigio
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
      scene.scene.start('GameOverScene', { score: scene.scoreSystem?.getScore() ?? 0 })
    }
  }
```

- [ ] **Step 2: Verifica che i test passino**

```
npx vitest run
```
Expected: PASS

- [ ] **Step 3: Commit**

```
git add src/characters/Mira.js
git commit -m "feat: Mira HUD bars — temperatura and guanti with visual feedback"
```

---

### Task 13: GameScene.js — wire Mira come player attivo

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Sostituisci l'import Silas con Mira**

In `src/scenes/GameScene.js`, cambia le prime righe di import:

```js
// Rimuovi:
import { Silas } from '../characters/Silas.js'
import { isShadowTile } from '../characters/SilasTemp.js'

// Aggiungi:
import { Mira } from '../characters/Mira.js'
```

- [ ] **Step 2: Sostituisci `new Silas(...)` con `new Mira(...)`**

Nel metodo `create()`, cambia:
```js
// Rimuovi:
this.player = new Silas(this, spawnX, spawnY)

// Aggiungi:
this.player = new Mira(this, spawnX, spawnY)
```

- [ ] **Step 3: Rimuovi l'uso di `isShadowTile` (non più necessario per Mira)**

Rimuovi anche il metodo `isInShadow` se non è più usato da Mira. **Attenzione:** `isInShadow` potrebbe essere ancora usato da `LeSignore` o altri nemici. Verifica prima:

```
grep -r "isInShadow" src/
```

Se solo `Silas` lo usava, rimuovi il metodo da `GameScene`. Se altri lo usano, lascialo.

- [ ] **Step 4: Verifica che i test passino**

```
npx vitest run
```
Expected: PASS

- [ ] **Step 5: Avvia il gioco e verifica**

```
npm run dev
```

Apri il browser e verifica:
- Mira si muove (WASD)
- LMB: piazza un muro sul tile di fronte (solo su FLOOR/CORRIDOR/SHADOW/DESTRUCTIBLE/METAL/BLOOD_POOL)
- RMB: effetto sul tile puntato dal cursore entro 200px
- Q tenuto su tile METAL: tile sparisce, scudo si crea davanti
- Q tap su tile METAL: lancia metallica vola nella direzione di facing
- F: tile DESTRUCTIBLE adiacente diventa FLOOR (flash blu)
- Temperatura sale con le abilità (barra HUD in basso a sinistra)
- Guanti scendono dopo ogni Rebound
- Rebound: Mira diventa bianca/semitrasparente per ~1.2s + vignette rossa
- Morte (HP 0): GameOverScene

- [ ] **Step 6: Commit finale**

```
git add src/scenes/GameScene.js
git commit -m "feat: wire Mira as active player in GameScene"
```

---

## Self-Review

**Spec coverage check:**

| Req spec | Task che lo implementa |
|---|---|
| Temperatura 0→100, sale con cast | Task 2 (tempWithCost) + Task 7-10 (ogni abilità applica il costo) |
| Decay -4/s | Task 2 (tempAfterDecay) + Task 6 (_tickTemperature) |
| A 80+: costo +50% | Task 2 (surcharge in tempWithCost) |
| A 100: lockout 2s | Task 6 (_postcastCheck) |
| Lockout + cast = Rebound | Task 6 (_precastCheck) |
| Guanti 100→0, solo Rebound li degrada | Task 3 (reboundResult.newGloves) + Task 11 (_triggerRebound) |
| Guanti 0: ogni cast = Rebound | Task 6 (_precastCheck checks gloves <= 0) |
| LMB wall per materiale | Task 7 |
| RMB ground attack per materiale | Task 8 |
| Q rearmo METAL (tap=lance, hold=shield) | Task 9 |
| F reazione DESTRUCTIBLE | Task 10 |
| Rebound: svenimento + vignette + sanguinamento | Task 11 |
| Rebound aggravato (guanti=0): direct damage | Task 11 |
| Temp -30 dopo Rebound | Task 3 + 11 |
| HUD barra temp + barra guanti | Task 12 |
| BaseEnemy slow + acid DoT | Task 4 |
| GameScene swap player | Task 13 |

**Spec non implementata in questo piano:** `E — Pozione Potenziata` (stub, come da spec)
