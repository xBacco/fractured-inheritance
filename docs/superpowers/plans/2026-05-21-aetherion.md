# Aetherion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementare Aetherion come PG principale del roguelite — teenager con potere binario (Calma vs Burst), 4 abilità (LMB Paint Strike, RMB Dissolve hold, Q Crack/Burst, F Spezza Metallo), HP visibile, niente seconda risorsa narrativa.

**Architecture:** Modulo puro `AetherionBurst.js` con costanti e formula del kill rebate (testabile con vitest). Classe Phaser `Aetherion.js` estende `BaseCharacter`, gestisce visuals/input/event listeners. Pattern coerente con `Mira.js` + `MiraAlchemy.js`.

**Tech Stack:** Phaser 3.80, ES Modules, vitest. Pattern già consolidato nel codebase: BaseCharacter come superclasse, pure module + class split per la logica testabile.

**Spec:** `docs/superpowers/specs/2026-05-21-aetherion-design.md`

---

## File Structure

| File | Stato | Responsabilità |
|---|---|---|
| `src/characters/AetherionBurst.js` | CREATE | Modulo puro: costanti Burst, formula `burstTick`, formula `applyKillRebate`. Zero dipendenze da Phaser. |
| `tests/characters/AetherionBurst.test.js` | CREATE | Unit test del modulo puro. Pattern identico a `MiraAlchemy.test.js`. |
| `src/characters/Aetherion.js` | CREATE | Classe Phaser, estende `BaseCharacter`. Tutte le 4 abilità, HUD, death. |
| `src/scenes/GameScene.js` | MODIFY | Import Aetherion, swap `new Veyra(...)` → `new Aetherion(...)` alla riga 31. |
| `personaggi/giocabili/aetherion/scheda.html` | MODIFY | Aggiornare sezione "Note Implementative" e aggiungere sezione "Abilità". |

---

## Task 1: Modulo puro AetherionBurst.js + test

Costanti e funzioni pure del Burst. Testabili senza Phaser. Pattern `MiraAlchemy.js`.

**Files:**
- Create: `src/characters/AetherionBurst.js`
- Create: `tests/characters/AetherionBurst.test.js`

- [ ] **Step 1: Scrivi il test fallente**

Crea `tests/characters/AetherionBurst.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import {
  BURST_DURATION_MS,
  BURST_AOE_RADIUS,
  BURST_AOE_DPS,
  BURST_SELF_DAMAGE_PER_SEC,
  BURST_KILL_REBATE_MS,
  BURST_COOLDOWN_MS,
  BURST_MAX_REBATE_MS,
  burstTick,
  applyKillRebate,
} from '../../src/characters/AetherionBurst.js'

describe('AetherionBurst — costanti', () => {
  it('BURST_DURATION_MS è 4000',           () => expect(BURST_DURATION_MS).toBe(4000))
  it('BURST_AOE_RADIUS è 60',              () => expect(BURST_AOE_RADIUS).toBe(60))
  it('BURST_AOE_DPS è 15',                 () => expect(BURST_AOE_DPS).toBe(15))
  it('BURST_SELF_DAMAGE_PER_SEC è 6',      () => expect(BURST_SELF_DAMAGE_PER_SEC).toBe(6))
  it('BURST_KILL_REBATE_MS è 1000',        () => expect(BURST_KILL_REBATE_MS).toBe(1000))
  it('BURST_COOLDOWN_MS è 15000',          () => expect(BURST_COOLDOWN_MS).toBe(15000))
  it('BURST_MAX_REBATE_MS è 4000',         () => expect(BURST_MAX_REBATE_MS).toBe(4000))
})

describe('burstTick — gestisce un tick del Burst', () => {
  it('decrementa burstMs di delta', () => {
    const r = burstTick({ burstMs: 4000, selfDamageOffsetMs: 0, hp: 100, delta: 100 })
    expect(r.burstMs).toBe(3900)
  })

  it('applica self-damage HP quando selfDamageOffsetMs <= 0', () => {
    // 6 HP/sec → in 100ms = 0.6 HP
    const r = burstTick({ burstMs: 4000, selfDamageOffsetMs: 0, hp: 100, delta: 100 })
    expect(r.hp).toBeCloseTo(99.4, 5)
  })

  it('NON applica self-damage HP quando selfDamageOffsetMs > 0', () => {
    const r = burstTick({ burstMs: 4000, selfDamageOffsetMs: 1000, hp: 100, delta: 100 })
    expect(r.hp).toBe(100)
  })

  it('decrementa selfDamageOffsetMs quando > 0', () => {
    const r = burstTick({ burstMs: 4000, selfDamageOffsetMs: 1000, hp: 100, delta: 100 })
    expect(r.selfDamageOffsetMs).toBe(900)
  })

  it('selfDamageOffsetMs non scende sotto 0', () => {
    const r = burstTick({ burstMs: 4000, selfDamageOffsetMs: 50, hp: 100, delta: 100 })
    expect(r.selfDamageOffsetMs).toBe(0)
  })

  it('hp non scende sotto 0', () => {
    const r = burstTick({ burstMs: 4000, selfDamageOffsetMs: 0, hp: 0.3, delta: 100 })
    expect(r.hp).toBe(0)
  })

  it('burstMs non scende sotto 0', () => {
    const r = burstTick({ burstMs: 50, selfDamageOffsetMs: 0, hp: 100, delta: 100 })
    expect(r.burstMs).toBe(0)
  })
})

describe('applyKillRebate — aggiunge rebate per kill durante Burst', () => {
  it('aggiunge 1000ms per ogni kill', () => {
    expect(applyKillRebate(0, 1)).toBe(1000)
    expect(applyKillRebate(0, 3)).toBe(3000)
  })

  it('si somma al rebate corrente', () => {
    expect(applyKillRebate(500, 1)).toBe(1500)
  })

  it('cap al BURST_MAX_REBATE_MS (4000)', () => {
    expect(applyKillRebate(3500, 2)).toBe(4000)
    expect(applyKillRebate(0, 10)).toBe(4000)
  })
})
```

- [ ] **Step 2: Verifica che i test falliscano**

Run: `npm test -- AetherionBurst`
Expected: FAIL — "Failed to resolve import './AetherionBurst.js'".

- [ ] **Step 3: Implementa il modulo puro**

Crea `src/characters/AetherionBurst.js`:

```javascript
// --- Costanti Burst ---
export const BURST_DURATION_MS         = 4000
export const BURST_AOE_RADIUS          = 60
export const BURST_AOE_DPS             = 15
export const BURST_SELF_DAMAGE_PER_SEC = 6
export const BURST_KILL_REBATE_MS      = 1000
export const BURST_COOLDOWN_MS         = 15000
export const BURST_MAX_REBATE_MS       = 4000

/**
 * Calcola un tick del Burst.
 * @param {{ burstMs: number, selfDamageOffsetMs: number, hp: number, delta: number }} state
 * @returns {{ burstMs: number, selfDamageOffsetMs: number, hp: number }}
 */
export function burstTick({ burstMs, selfDamageOffsetMs, hp, delta }) {
  const newBurstMs = Math.max(0, burstMs - delta)

  if (selfDamageOffsetMs > 0) {
    const newOffset = Math.max(0, selfDamageOffsetMs - delta)
    return { burstMs: newBurstMs, selfDamageOffsetMs: newOffset, hp }
  }

  const dmg = BURST_SELF_DAMAGE_PER_SEC * (delta / 1000)
  const newHp = Math.max(0, hp - dmg)
  return { burstMs: newBurstMs, selfDamageOffsetMs: 0, hp: newHp }
}

/**
 * Applica il rebate kill al selfDamageOffsetMs.
 * @param {number} currentOffsetMs
 * @param {number} killCount
 * @returns {number} nuovo offset, capped a BURST_MAX_REBATE_MS
 */
export function applyKillRebate(currentOffsetMs, killCount) {
  return Math.min(BURST_MAX_REBATE_MS, currentOffsetMs + killCount * BURST_KILL_REBATE_MS)
}
```

- [ ] **Step 4: Verifica che i test passino**

Run: `npm test -- AetherionBurst`
Expected: PASS — 17 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/characters/AetherionBurst.js tests/characters/AetherionBurst.test.js
git commit -m "feat(aetherion): pure module AetherionBurst with burstTick and applyKillRebate"
```

---

## Task 2: Skeleton Aetherion.js — constructor, update, destroy, HUD

Scheletro della classe. Solo costruzione, update vuoto, HUD (barra HP visibile + burst indicator), nessuna abilità ancora.

**Files:**
- Create: `src/characters/Aetherion.js`

- [ ] **Step 1: Crea Aetherion.js con scheletro minimo**

Crea `src/characters/Aetherion.js`:

```javascript
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
```

- [ ] **Step 2: Verifica che esista il file**

Run: `ls src/characters/Aetherion.js`
Expected: file presente.

- [ ] **Step 3: Verifica sintassi via test esistenti (no regression)**

Run: `npm test`
Expected: 134 test totali, 5 falliti pre-esistenti (TacticalPause). Nessun nuovo fallimento. Il nuovo `AetherionBurst.test.js` deve aggiungere ~17 pass.

- [ ] **Step 4: Commit**

```bash
git add src/characters/Aetherion.js
git commit -m "feat(aetherion): skeleton class with HP bar HUD and burst indicator"
```

---

## Task 3: LMB Paint Strike

Attacco melee corto raggio, 8 dmg, CD 300ms.

**Files:**
- Modify: `src/characters/Aetherion.js`

- [ ] **Step 1: Aggiungi handleLMB al update loop**

Edit `src/characters/Aetherion.js`. Nel metodo `update`, dopo `super.update(scene)` e prima di `_syncScarPosition`, aggiungi:

```javascript
    this._handleLMB(scene)
```

Quindi `update` diventa:

```javascript
  update(scene, delta) {
    if (!this.alive) { this._checkDeath(scene); return }
    this._tickCooldowns(delta)
    super.update(scene)
    this._handleLMB(scene)
    this._syncScarPosition()
    this._updateHud(scene)
    this._checkDeath(scene)
  }
```

- [ ] **Step 2: Implementa il metodo _handleLMB**

Aggiungi dentro la classe, sotto `_updateHud` e prima di `_checkDeath`:

```javascript
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
```

- [ ] **Step 3: Run test esistenti (no regression)**

Run: `npm test`
Expected: 17 AetherionBurst pass, nessuna nuova rottura. Totale ~146 pass + 5 fail pre-esistenti.

- [ ] **Step 4: Commit**

```bash
git add src/characters/Aetherion.js
git commit -m "feat(aetherion): LMB Paint Strike melee 8dmg CD 300ms"
```

---

## Task 4: F Spezza Metallo

Su tile METAL adiacente: distrugge il metallo, AOE 40px 30 dmg + 3 schegge proiettili.

**Files:**
- Modify: `src/characters/Aetherion.js`

- [ ] **Step 1: Aggiungi import TILE e TILE_SIZE**

Edit `src/characters/Aetherion.js`. Nella sezione import in cima, sostituisci:

```javascript
import { PLAYER_SPEED } from '../config/GameConfig.js'
```

con:

```javascript
import { PLAYER_SPEED, TILE_SIZE } from '../config/GameConfig.js'
import { TILE } from '../map/TileTypes.js'
```

- [ ] **Step 2: Aggiungi _handleF al update loop**

Nel metodo `update`, dopo `_handleLMB`, aggiungi:

```javascript
    this._handleF(scene)
```

- [ ] **Step 3: Implementa _handleF**

Aggiungi sotto `_paintStrike`:

```javascript
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
```

- [ ] **Step 4: Run test (no regression)**

Run: `npm test`
Expected: nessuna nuova rottura.

- [ ] **Step 5: Commit**

```bash
git add src/characters/Aetherion.js
git commit -m "feat(aetherion): F Spezza Metallo on METAL tile - AOE 30dmg + 3 shard projectiles"
```

---

## Task 5: RMB Dissolve (hold)

Cono frontale 80px che dissolve proiettili nemici, blocca movimento durante hold, max 2s, CD 4s.

**Files:**
- Modify: `src/characters/Aetherion.js`

- [ ] **Step 1: Aggiungi _dissolveCone in constructor**

Nel constructor, dopo `this._burstIndicator = ...`, aggiungi:

```javascript
    this._dissolveCone = scene.add.graphics().setDepth(4)
```

E nel `destroy`, prima di `super.destroy()`, aggiungi:

```javascript
    this._dissolveCone?.destroy()
```

E nel `_checkDeath`, dopo `this._burstIndicator?.destroy(); this._burstIndicator = null`:

```javascript
      this._dissolveCone?.destroy();     this._dissolveCone     = null
```

- [ ] **Step 2: Aggiungi _handleRMB al update loop**

Nel `update`, dopo `_handleF`, aggiungi:

```javascript
    this._handleRMB(scene, delta)
```

E modifica la firma `_tickCooldowns` chiamata: già OK perché passa `delta`.

- [ ] **Step 3: Implementa _handleRMB e _dissolveTick**

Aggiungi sotto `_spezzaMetallo`:

```javascript
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
    const halfAngle = Math.PI / 6 // 30°
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
```

- [ ] **Step 4: Run test (no regression)**

Run: `npm test`
Expected: nessuna nuova rottura.

- [ ] **Step 5: Commit**

```bash
git add src/characters/Aetherion.js
git commit -m "feat(aetherion): RMB Dissolve hold - cone 80px dissolves enemy projectiles"
```

---

## Task 6: Q Crack/Burst — trigger, AOE tick, self-damage, kill rebate

Cuore del PG. Q entra in Burst, 4s fissi, AOE 60px 15 dmg/s, self-damage 6/s, kill rebate -1s ognuno (max 4), CD 15s.

**Files:**
- Modify: `src/characters/Aetherion.js`

- [ ] **Step 1: Aggiungi import del modulo Burst**

Nella sezione import di Aetherion.js, modifica:

```javascript
import {
  BURST_COOLDOWN_MS,
} from './AetherionBurst.js'
```

in:

```javascript
import {
  BURST_DURATION_MS,
  BURST_AOE_RADIUS,
  BURST_AOE_DPS,
  BURST_COOLDOWN_MS,
  burstTick,
  applyKillRebate,
} from './AetherionBurst.js'
```

- [ ] **Step 2: Aggiungi listener e visuals nel constructor**

Nel constructor, dopo `this._dissolveCone = ...`:

```javascript
    this._burstAura = scene.add.graphics().setDepth(2)
    this._burstKillsThisBurst = 0

    this._onEnemyKilled = (_x, _y) => {
      if (!this._burstActive) return
      this._burstKillsThisBurst++
      this._selfDamageOffsetMs = applyKillRebate(this._selfDamageOffsetMs, 1)
    }
    scene.events.on('enemy_killed', this._onEnemyKilled)
```

- [ ] **Step 3: Cleanup listener in destroy e _checkDeath**

Nel `destroy`, prima di `super.destroy()`:

```javascript
    this.scene?.events.off('enemy_killed', this._onEnemyKilled)
    this._burstAura?.destroy()
```

Nel `_checkDeath`, dopo le altre destroy:

```javascript
      this.scene.events.off('enemy_killed', this._onEnemyKilled)
      this._burstAura?.destroy();        this._burstAura        = null
```

- [ ] **Step 4: Aggiungi _handleBurst al update**

Nel `update`, dopo `_handleRMB`, aggiungi:

```javascript
    this._handleBurst(scene, delta)
```

- [ ] **Step 5: Implementa _handleBurst e helpers**

Aggiungi sotto `_facingAngle`:

```javascript
  // ── Q: Crack / Burst ──────────────────────────────────────────────────────

  _handleBurst(scene, delta) {
    if (!this._burstActive) {
      if (Phaser.Input.Keyboard.JustDown(this.qKey) && this._burstCd <= 0) {
        this._startBurst(scene)
      }
      return
    }

    const tick = burstTick({
      burstMs:            this._burstMs,
      selfDamageOffsetMs: this._selfDamageOffsetMs,
      hp:                 this.hp,
      delta,
    })
    this._burstMs              = tick.burstMs
    this._selfDamageOffsetMs   = tick.selfDamageOffsetMs
    this.hp                    = tick.hp
    if (this.hp <= 0) this.alive = false

    this._burstAOE(scene, delta)
    this._renderBurstAura(scene)

    if (this._burstMs <= 0) this._endBurst()
  }

  _startBurst(scene) {
    if (this._dissolveActive) this._endDissolve()
    this._burstActive          = true
    this._burstMs              = BURST_DURATION_MS
    this._selfDamageOffsetMs   = 0
    this._burstKillsThisBurst  = 0
    this.fillColor             = BURST_COLOR
    this._scar?.setSize(4, 4)
    scene.cameras.main.flash(150, 224, 120, 40)
  }

  _endBurst() {
    this._burstActive        = false
    this._burstMs            = 0
    this._burstCd            = BURST_COOLDOWN_MS
    this.fillColor           = BASE_COLOR
    this._scar?.setSize(2, 2)
    this._burstAura?.clear()
  }

  _burstAOE(scene, delta) {
    if (!scene.enemies) return
    const dmg = BURST_AOE_DPS * (delta / 1000)
    scene.enemies.getChildren().forEach(enemy => {
      if (!enemy.alive) return
      if (Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) < BURST_AOE_RADIUS) {
        enemy.takeDamage(dmg)
      }
    })
    scene.events.emit('player_attacked', this.x, this.y)
  }

  _renderBurstAura(scene) {
    if (!this._burstAura) return
    this._burstAura.clear()
    this._burstAura.fillStyle(BURST_COLOR, 0.20)
    this._burstAura.fillCircle(this.x, this.y, BURST_AOE_RADIUS)
    this._burstAura.lineStyle(2, 0xFFF0C0, 0.6)
    this._burstAura.strokeCircle(this.x, this.y, BURST_AOE_RADIUS)
  }
```

- [ ] **Step 6: Run test (no regression)**

Run: `npm test`
Expected: nessuna nuova rottura.

- [ ] **Step 7: Commit**

```bash
git add src/characters/Aetherion.js
git commit -m "feat(aetherion): Q Crack/Burst - 4s AOE 60px 15dps, self-damage 6/s, kill rebate"
```

---

## Task 7: handleMovement override (root + disorient)

Overrida handleMovement per gestire root e disorient. Pattern Mira/Veyra.

**Files:**
- Modify: `src/characters/Aetherion.js`

- [ ] **Step 1: Implementa handleMovement override**

Aggiungi sotto `takeDamage` (prima di `rebindActions`):

```javascript
  handleMovement(scene) {
    if (this._rootedMs > 0 && !this._burstActive) {
      this.body.setVelocity(0, 0)
      return
    }
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
      this.facingX = vx > 0 ? 1 : vx < 0 ? -1 : this.facingX
      this.facingY = vy > 0 ? 1 : vy < 0 ? -1 : this.facingY
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

  applyRoot(duration) {
    this._rootedMs = Math.max(this._rootedMs, duration)
  }

  applyDisorient(duration) {
    this._disorientMs = Math.max(this._disorientMs, duration)
    this.scene.cameras.main.flash(200, 0, 160, 120)
  }
```

- [ ] **Step 2: Run test (no regression)**

Run: `npm test`
Expected: nessuna nuova rottura.

- [ ] **Step 3: Commit**

```bash
git add src/characters/Aetherion.js
git commit -m "feat(aetherion): handleMovement override - root and disorient (burst ignores root)"
```

---

## Task 8: GameScene swap Veyra → Aetherion

Aetherion diventa il player attivo del roguelite.

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Aggiungi import Aetherion e rimuovi import Veyra**

Edit `src/scenes/GameScene.js`. Sostituisci:

```javascript
import { Mira } from '../characters/Mira.js'
import { Korvan } from '../characters/Korvan.js'
import { Veyra } from '../characters/Veyra.js'
```

con:

```javascript
import { Mira } from '../characters/Mira.js'
import { Korvan } from '../characters/Korvan.js'
import { Veyra } from '../characters/Veyra.js'
import { Aetherion } from '../characters/Aetherion.js'
```

(NB: lasciamo Korvan/Veyra/Mira importati — saranno selezionabili dal character select futuro.)

- [ ] **Step 2: Swap player constructor**

Trova la riga `this.player = new Veyra(this, spawnX, spawnY)` e sostituiscila con:

```javascript
    this.player = new Aetherion(this, spawnX, spawnY)
```

- [ ] **Step 3: Verifica startup test**

Run: `npm test`
Expected: nessuna nuova rottura.

- [ ] **Step 4: Verifica manuale in browser (smoke test)**

Run: `npm run dev`

Apri il browser e verifica:
- Aetherion spawna come rettangolo ember al centro della prima stanza
- HP bar visibile in basso-sinistra
- Burst indicator (cerchio piccolo sotto la barra HP) pieno
- WASD muove
- LMB attiva Paint Strike (rettangolino nero davanti)
- F su tile METAL adiacente spezza il metallo (flash + schegge)
- RMB tenuto premuto mostra il cono ember; rilasciato sparisce
- Q attiva Burst: aura tonda attorno per 4 secondi, poi cooldown sull'indicatore HUD
- HP diminuisce durante il Burst (visibile sulla barra)
- Subire danno da un nemico diminuisce la barra HP visibilmente

Se tutto regge: chiudi il browser.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat(aetherion): swap Veyra with Aetherion as active player in GameScene"
```

---

## Task 9: Aggiorna scheda.html

Rimuovi la nota "meccaniche da definire" e aggiungi sezione abilità con i numeri dello spec.

**Files:**
- Modify: `personaggi/giocabili/aetherion/scheda.html`

- [ ] **Step 1: Aggiorna sezione Struttura Narrativa**

In `personaggi/giocabili/aetherion/scheda.html`, trova la riga:

```html
    <tr><td>Modalità Roguelite</td><td>Non disponibile. La storia è la sua modalità.</td></tr>
```

E sostituisci con:

```html
    <tr><td>Modalità Roguelite</td><td>Disponibile come PG principale (default selezionato).</td></tr>
```

- [ ] **Step 2: Aggiorna sezione Note Implementative**

Trova la sezione `<h2>Note Implementative</h2>` con la tabella. Sostituisci l'intera tabella interna con:

```html
  <table>
    <tr><th>Campo</th><th>Valore</th></tr>
    <tr><td>File</td><td><code>src/characters/Aetherion.js</code> + <code>src/characters/AetherionBurst.js</code> (modulo puro)</td></tr>
    <tr><td>Estende</td><td><code>BaseCharacter</code></td></tr>
    <tr><td>HP max</td><td><span class="val">100</span> (visibile come barra principale, a differenza degli altri PG)</td></tr>
    <tr><td>Speed</td><td><code>PLAYER_SPEED</code> default</td></tr>
    <tr><td>Risorse</td><td>Solo HP — niente seconda risorsa narrativa</td></tr>
    <tr><td>Sprite placeholder</td><td>Rectangle 14×26 colore <code>#E07828</code></td></tr>
    <tr><td>Sprite reale</td><td><code>personaggi/giocabili/aetherion/card.jpg</code></td></tr>
  </table>
```

- [ ] **Step 3: Aggiungi nuova sezione Abilità**

Subito DOPO la sezione "Note Implementative" e prima di `</body>`, aggiungi:

```html
<section>
  <h2>Abilità</h2>

  <h3>LMB — Paint Strike</h3>
  <p>Attacco melee corto raggio. Le mani macchiate di pittura, non di sangue.</p>
  <table>
    <tr><td>Range</td><td><span class="val">25px</span> (rettangolo 12×6 davanti al facing)</td></tr>
    <tr><td>Danno</td><td><span class="val">8</span></td></tr>
    <tr><td>Cooldown</td><td><span class="val">300ms</span></td></tr>
    <tr><td>Costo</td><td>Nessuno</td></tr>
  </table>

  <h3>RMB — Dissolve (hold)</h3>
  <p>Cono di calore frontale che dissolve i proiettili nemici. Manifestazione lore: "dissoluzione di freccia magica".</p>
  <table>
    <tr><td>Range</td><td><span class="val">cono 80px</span>, half-angle ±30°</td></tr>
    <tr><td>Effetto</td><td>Dissolve <code>enemyProjectiles</code> nel cono — no damage diretto</td></tr>
    <tr><td>Durata max hold</td><td><span class="val">2000ms</span></td></tr>
    <tr><td>Movimento</td><td><strong>bloccato</strong> mentre held</td></tr>
    <tr><td>Cooldown</td><td><span class="val">4000ms</span> dal release</td></tr>
  </table>

  <h3>Q — Crack / Burst (signature)</h3>
  <p>"Spacca il lago": entra in Burst Mode. Incessante, non aspetta permesso.</p>
  <table>
    <tr><td>Durata</td><td><span class="val">4000ms fissi</span> — non annullabile</td></tr>
    <tr><td>AOE</td><td>Raggio <span class="val">60px</span> dalla cicatrice, <span class="val">15 dmg/sec</span></td></tr>
    <tr><td>Self-damage</td><td><span class="val">6 HP/sec</span> (24 totali se nessun kill)</td></tr>
    <tr><td>Kill rebate</td><td>Ogni nemico ucciso durante Burst → <span class="val">−1s self-damage</span> (max 4)</td></tr>
    <tr><td>Lockout</td><td>LMB, RMB, F disabilitati durante</td></tr>
    <tr><td>Cooldown</td><td><span class="val">15000ms</span> dopo fine</td></tr>
  </table>

  <h3>F — Spezza Metallo (contestuale)</h3>
  <p>Su tile METAL adiacente: distrugge il metallo. Manifestazione lore: "piegare e spezzare metallo".</p>
  <table>
    <tr><td>Trigger</td><td>Tile <code>METAL</code> in una delle 4 celle adiacenti</td></tr>
    <tr><td>Tile effect</td><td>METAL → FLOOR per 8s, poi ripristino</td></tr>
    <tr><td>AOE</td><td>Raggio <span class="val">40px</span> attorno al tile, <span class="val">30 dmg</span></td></tr>
    <tr><td>Schegge</td><td>3 proiettili a cono ±25° facing, <span class="val">15 dmg</span> ciascuno, speed 320</td></tr>
    <tr><td>Cooldown</td><td><span class="val">6000ms</span></td></tr>
  </table>
</section>
```

- [ ] **Step 4: Aggiorna lo stato in Note Implementative**

Trova `<span class="status-story">lore completo — meccaniche da definire</span>` e sostituisci con:

```html
<span class="status-story">implementato — playtest pendente</span>
```

- [ ] **Step 5: Commit**

```bash
git add personaggi/giocabili/aetherion/scheda.html
git commit -m "docs(aetherion): update scheda with implemented abilities and roguelite availability"
```

---

## Self-review checklist (eseguita prima di handoff)

**Spec coverage:**
- Sezione 1 (Identità) → Task 9 (scheda) ✓
- Sezione 2 (Filosofia) → implicita nei numeri di Task 1, 3-6 ✓
- Sezione 3 (Stats) → Task 2 (constructor) ✓
- Sezione 4.1 LMB → Task 3 ✓
- Sezione 4.2 RMB Dissolve → Task 5 ✓
- Sezione 4.3 Q Burst → Task 1 (modulo) + Task 6 ✓
- Sezione 4.4 F Spezza Metallo → Task 4 ✓
- Sezione 5 (Stati) — lockout LMB/RMB/F durante Burst → Task 3 (`if burstActive return`), Task 4 (idem), Task 5 (`if burstActive end dissolve`) ✓
- Sezione 6 (Effetti stato in ingresso) → Task 7 ✓
- Sezione 7 (HUD) → Task 2 (barra HP + burst indicator) ✓
- Sezione 8 (Death) → Task 2 (`_checkDeath`) + Task 6 (cleanup listener in death) ✓
- Sezione 9 (Architettura) → Task 8 + Task 1+2 ✓
- Sezione 10 (Bilanciamento) → numeri applicati Task 1-6 ✓
- Sezione 11 (task list) → tutti i task presenti tranne il #10 "Test modulo puro Burst (se estratto)" — INTEGRATO in Task 1 ✓

**Placeholder scan:** nessun "TBD", "TODO", "implement later", "add error handling" generico, "similar to Task N". Tutto il codice è completo nei blocchi.

**Type consistency:**
- `BURST_DURATION_MS` usato in Task 6 corrisponde a quello esportato in Task 1 ✓
- `_burstActive`, `_burstMs`, `_burstCd`, `_selfDamageOffsetMs` definiti in Task 2 (constructor) e usati coerentemente in Task 5 e 6 ✓
- `_dissolveActive`, `_dissolveMs`, `_dissolveCd` definiti in Task 2 e usati in Task 5 ✓
- `_facingAngle()` definita in Task 5 e usata internamente in Task 5 ✓
- `BASE_COLOR`, `BURST_COLOR` definiti in Task 2, usati in Task 6 (`_startBurst`/`_endBurst`) ✓
- `TILE_SIZE`, `TILE` importati in Task 4 e usati in Task 4 + Task 7 ✓

---

**Pronto all'esecuzione.**
