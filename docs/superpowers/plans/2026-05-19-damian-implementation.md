# Damian "Cross" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the control layout to mouse+keyboard and implement Damian "Cross" as the second playable character with a full phase/corruption/reserve system.

**Architecture:** Two sequential phases — (1) controls refactor across KeyBindings, BaseCharacter, Zeryth, and SettingsScene to replace keyboard-only attacks with LMB/RMB mouse input; (2) Damian class built on top of the refactored base, with pure phase logic extracted to a separate file for vitest unit testing. GameScene instantiates Damian for manual testing; character selection screen comes in a future spec.

**Tech Stack:** Phaser 3.80, Vite 5, Vitest 1.6 (ES modules)

---

## File Structure

**Create:**
- `src/characters/DamianPhase.js` — pure functions for phase logic (no Phaser dependency, unit-testable)
- `src/characters/Damian.js` — Damian class extending BaseCharacter
- `tests/characters/DamianPhase.test.js` — vitest unit tests for phase logic

**Modify:**
- `src/config/KeyBindings.js` — remove `attack`/`blood`, add `ability1`(Q) `ability2`(R) `ability3`(F) `interact`(E)
- `src/scenes/SettingsScene.js` — update ACTIONS array and panel height
- `src/characters/BaseCharacter.js` — add mouse input flags (`_lmbDown`, `_rmbDown`) and context menu block
- `src/characters/Zeryth.js` — replace keyboard attack/blood with mouse flags, simplify rebindActions
- `src/scenes/GameScene.js` — swap player to Damian for testing

---

### Task 1: KeyBindings + SettingsScene — new control layout

**Files:**
- Modify: `src/config/KeyBindings.js`
- Modify: `src/scenes/SettingsScene.js`

- [ ] **Step 1: Replace DEFAULTS in KeyBindings.js**

Replace the `DEFAULTS` constant with:

```javascript
const DEFAULTS = {
  up:       'W',
  down:     'S',
  left:     'A',
  right:    'D',
  ability1: 'Q',
  ability2: 'R',
  ability3: 'F',
  interact: 'E',
  pause:    'SPACE',
}
```

No other changes needed in this file — `load`, `save`, `get`, `set`, `keyCode`, `all`, `defaults` stay identical.

- [ ] **Step 2: Update ACTIONS and panel height in SettingsScene.js**

Replace the `ACTIONS` array:

```javascript
const ACTIONS = [
  { action: 'up',       label: 'Sali' },
  { action: 'down',     label: 'Scendi' },
  { action: 'left',     label: 'Sinistra' },
  { action: 'right',    label: 'Destra' },
  { action: 'ability1', label: 'Abilità 1 (Q)' },
  { action: 'ability2', label: 'Abilità 2 (R)' },
  { action: 'ability3', label: 'Fase / Trasf. (F)' },
  { action: 'interact', label: 'Interagisci (E)' },
  { action: 'pause',    label: 'Pausa Tattica' },
]
```

In `_buildUI`, change `PH = 380` → `PH = 460` (9 rows × 32px + margins).

- [ ] **Step 3: Verify settings panel in browser**

`npm run dev` → start game → press TAB → confirm 9 rows appear without overlap, Ripristina/Salva buttons visible.

- [ ] **Step 4: Commit**

```bash
git add src/config/KeyBindings.js src/scenes/SettingsScene.js
git commit -m "refactor: keybindings - replace attack/blood with ability1/2/3/interact"
```

---

### Task 2: BaseCharacter — mouse input flags

**Files:**
- Modify: `src/characters/BaseCharacter.js`

- [ ] **Step 1: Add `_lmbDown`/`_rmbDown` flags and setup method**

In the constructor, after `this.facingY = 0`, add:

```javascript
this._lmbDown = false
this._rmbDown = false
this._setupMouseInput(scene)
```

Add `_setupMouseInput` to the class body:

```javascript
_setupMouseInput(scene) {
  scene.game.canvas.addEventListener('contextmenu', e => e.preventDefault())
  scene.input.on('pointerdown', (pointer) => {
    if (pointer.button === 0) this._lmbDown = true
    if (pointer.button === 2) this._rmbDown = true
  })
  scene.input.on('pointerup', (pointer) => {
    if (pointer.button === 0) this._lmbDown = false
    if (pointer.button === 2) this._rmbDown = false
  })
}
```

- [ ] **Step 2: Verify context menu is blocked**

`npm run dev` → right-click anywhere on canvas → confirm no browser context menu appears.

- [ ] **Step 3: Commit**

```bash
git add src/characters/BaseCharacter.js
git commit -m "feat: mouse input flags in BaseCharacter (LMB/RMB, no context menu)"
```

---

### Task 3: Zeryth — adapt attacks to mouse flags

**Files:**
- Modify: `src/characters/Zeryth.js`

- [ ] **Step 1: Remove attackKey/bloodKey from constructor**

Delete these two lines from the constructor:

```javascript
this.attackKey = scene.input.keyboard.addKey(KeyBindings.keyCode('attack'))
this.bloodKey  = scene.input.keyboard.addKey(KeyBindings.keyCode('blood'))
```

- [ ] **Step 2: Replace `_handleAttacks` to use mouse flags**

```javascript
_handleAttacks(scene, delta) {
  if (this.attackCooldown > 0) this.attackCooldown -= delta

  if (this._lmbDown && this.attackCooldown <= 0) {
    this._strikeAttack(scene)
    this.attackCooldown = 300
  }

  if (this._rmbDown) {
    if (!this.swordHeld) {
      this.swordHeld = true
      this.swordTimer = 0
    }
    this.swordTimer += delta
    this._showSword(scene)
  } else if (this.swordHeld) {
    this.swordHeld = false
    this._hideSword()
    if (this.swordTimer > 400) this._swordSlash(scene)
    else this._bloodProjectile(scene)
  }
}
```

- [ ] **Step 3: Simplify `rebindActions`**

```javascript
rebindActions(scene) {
  // LMB/RMB are mouse buttons — no rebinding needed
}
```

- [ ] **Step 4: Verify Zeryth still works**

`npm run dev` → confirm:
- LMB strikes nearby enemies
- RMB tap fires blood projectile (costs integrity)
- RMB hold > 400ms then release → sword slash hits in arc

- [ ] **Step 5: Commit**

```bash
git add src/characters/Zeryth.js
git commit -m "refactor: Zeryth attacks moved from keyboard J/K to LMB/RMB"
```

---

### Task 4: DamianPhase — pure logic + unit tests

**Files:**
- Create: `src/characters/DamianPhase.js`
- Create: `tests/characters/DamianPhase.test.js`

- [ ] **Step 1: Create `src/characters/DamianPhase.js`**

```javascript
export const PHASE = Object.freeze({ BASE: 0, AWAKENING: 1, MINOR_DEMON: 2, INCUBUS: 3, BERSERK: 4, TRAUMATIC: 5 })

export const PHASE_COLOR = Object.freeze([0x222233, 0x886600, 0x440066, 0x880022, 0xff0000, 0x555566])

const RESERVE_DRAIN_RATE = [0, 2, 5, 12, 12, 0]
const DAMAGE_TABLE        = [15, 20, 22, 75, 75, 15]

export function phaseFromCorruption(corruption) {
  if (corruption >= 80) return PHASE.INCUBUS
  if (corruption >= 55) return PHASE.MINOR_DEMON
  if (corruption >= 25) return PHASE.AWAKENING
  return PHASE.BASE
}

export function reserveDrain(phase, delta) {
  return (RESERVE_DRAIN_RATE[phase] ?? 0) * (delta / 1000)
}

export function canEscalate(phase, reserve) {
  return phase < PHASE.INCUBUS && reserve > 20
}

export function punchDamage(phase) {
  return DAMAGE_TABLE[phase] ?? 15
}

export function speedMultiplier(phase) {
  if (phase === PHASE.TRAUMATIC) return 0.5
  if (phase === PHASE.MINOR_DEMON) return 1.2
  return 1.0
}
```

- [ ] **Step 2: Create `tests/characters/DamianPhase.test.js`**

```javascript
import { describe, it, expect } from 'vitest'
import { PHASE, phaseFromCorruption, reserveDrain, canEscalate, punchDamage, speedMultiplier } from '../../src/characters/DamianPhase.js'

describe('phaseFromCorruption', () => {
  it('returns BASE at 0',        () => expect(phaseFromCorruption(0)).toBe(PHASE.BASE))
  it('returns BASE at 24',       () => expect(phaseFromCorruption(24)).toBe(PHASE.BASE))
  it('returns AWAKENING at 25',  () => expect(phaseFromCorruption(25)).toBe(PHASE.AWAKENING))
  it('returns AWAKENING at 54',  () => expect(phaseFromCorruption(54)).toBe(PHASE.AWAKENING))
  it('returns MINOR_DEMON at 55',() => expect(phaseFromCorruption(55)).toBe(PHASE.MINOR_DEMON))
  it('returns INCUBUS at 80',    () => expect(phaseFromCorruption(80)).toBe(PHASE.INCUBUS))
  it('returns INCUBUS at 100',   () => expect(phaseFromCorruption(100)).toBe(PHASE.INCUBUS))
})

describe('reserveDrain', () => {
  it('no drain in BASE',          () => expect(reserveDrain(PHASE.BASE, 1000)).toBe(0))
  it('2/s in AWAKENING',          () => expect(reserveDrain(PHASE.AWAKENING, 1000)).toBe(2))
  it('5/s in MINOR_DEMON',        () => expect(reserveDrain(PHASE.MINOR_DEMON, 1000)).toBe(5))
  it('12/s in INCUBUS',           () => expect(reserveDrain(PHASE.INCUBUS, 1000)).toBe(12))
  it('12/s in BERSERK',           () => expect(reserveDrain(PHASE.BERSERK, 1000)).toBe(12))
  it('no drain in TRAUMATIC',     () => expect(reserveDrain(PHASE.TRAUMATIC, 1000)).toBe(0))
  it('scales with delta at 500ms',() => expect(reserveDrain(PHASE.AWAKENING, 500)).toBe(1))
})

describe('canEscalate', () => {
  it('allows BASE with full reserve',     () => expect(canEscalate(PHASE.BASE, 100)).toBe(true))
  it('allows AWAKENING with 50 reserve',  () => expect(canEscalate(PHASE.AWAKENING, 50)).toBe(true))
  it('allows MINOR_DEMON with 50',        () => expect(canEscalate(PHASE.MINOR_DEMON, 50)).toBe(true))
  it('blocks at INCUBUS',                 () => expect(canEscalate(PHASE.INCUBUS, 100)).toBe(false))
  it('blocks at BERSERK',                 () => expect(canEscalate(PHASE.BERSERK, 100)).toBe(false))
  it('blocks at reserve = 20',            () => expect(canEscalate(PHASE.BASE, 20)).toBe(false))
  it('allows at reserve = 21',            () => expect(canEscalate(PHASE.BASE, 21)).toBe(true))
})

describe('punchDamage', () => {
  it('15 in BASE',        () => expect(punchDamage(PHASE.BASE)).toBe(15))
  it('20 in AWAKENING',   () => expect(punchDamage(PHASE.AWAKENING)).toBe(20))
  it('22 in MINOR_DEMON', () => expect(punchDamage(PHASE.MINOR_DEMON)).toBe(22))
  it('75 in INCUBUS',     () => expect(punchDamage(PHASE.INCUBUS)).toBe(75))
  it('75 in BERSERK',     () => expect(punchDamage(PHASE.BERSERK)).toBe(75))
})

describe('speedMultiplier', () => {
  it('1.0 in BASE',       () => expect(speedMultiplier(PHASE.BASE)).toBe(1.0))
  it('1.0 in AWAKENING',  () => expect(speedMultiplier(PHASE.AWAKENING)).toBe(1.0))
  it('1.2 in MINOR_DEMON',() => expect(speedMultiplier(PHASE.MINOR_DEMON)).toBe(1.2))
  it('1.0 in INCUBUS',    () => expect(speedMultiplier(PHASE.INCUBUS)).toBe(1.0))
  it('0.5 in TRAUMATIC',  () => expect(speedMultiplier(PHASE.TRAUMATIC)).toBe(0.5))
})
```

- [ ] **Step 3: Run tests and verify all pass**

```
npm run test
```

Expected: 24 tests pass, 0 fail.

- [ ] **Step 4: Commit**

```bash
git add src/characters/DamianPhase.js tests/characters/DamianPhase.test.js
git commit -m "feat: Damian pure phase logic with vitest coverage (24 tests)"
```

---

### Task 5: Damian — skeleton + phase system

**Files:**
- Create: `src/characters/Damian.js`

- [ ] **Step 1: Create `src/characters/Damian.js`**

```javascript
import { BaseCharacter } from './BaseCharacter.js'
import { PLAYER_SPEED } from '../config/GameConfig.js'
import { KeyBindings } from '../config/KeyBindings.js'
import {
  PHASE, PHASE_COLOR,
  phaseFromCorruption, reserveDrain, canEscalate, speedMultiplier, punchDamage
} from './DamianPhase.js'

export class Damian extends BaseCharacter {
  constructor(scene, x, y) {
    super(scene, x, y, 20, 28, PHASE_COLOR[PHASE.BASE])

    this.phase      = PHASE.BASE
    this.corruption = 0
    this.reserve    = 100
    this.alive      = true

    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))

    this.attackCooldown    = 0
    this.heavyCooldown     = 0
    this.shadowParryActive = false
    this.shadowParryTimer  = 0
    this.shadowAttackTimer = 2000

    this.shadow      = null
    this._shadowLagX = x
    this._shadowLagY = y

    this.projectiles = scene.physics.add.group()

    this._corrIndicator = scene.add.rectangle(this.x - 5, this.y - 20, 6, 6, 0x444444).setDepth(6)
    this._resIndicator  = scene.add.rectangle(this.x + 5, this.y - 20, 6, 6, 0x6600aa).setDepth(6)
    this._traumaOverlay = null
  }

  update(scene, delta) {
    super.update(scene)
    if (!this.alive) return
    this._updatePhase(scene, delta)
    this._updateShadow(scene, delta)
    this._handleAttacks(scene, delta)
    this._updateVisual(scene)
    this._updateIndicators()
    this._checkDeath(scene)
  }

  takeDamage(amount) {
    if (!this.alive) return
    if (this.shadowParryActive) {
      this.shadowParryActive = false
      this.shadowParryTimer  = 0
      return
    }
    if (this.phase === PHASE.TRAUMATIC) {
      this.alive = false
      return
    }
    this.corruption = Math.min(100, this.corruption + amount / 2)
  }

  rebindActions(scene) {
    scene.input.keyboard.removeKey(this.fKey)
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))
  }

  _updatePhase(scene, delta) {
    if (this.phase !== PHASE.TRAUMATIC && this.phase !== PHASE.BERSERK) {
      const triggered = phaseFromCorruption(this.corruption)
      if (triggered > this.phase) this.phase = triggered
    }

    if (Phaser.Input.Keyboard.JustDown(this.fKey)) {
      if (canEscalate(this.phase, this.reserve)) this.phase++
    }

    if (this.phase >= PHASE.AWAKENING && this.phase !== PHASE.TRAUMATIC) {
      this.reserve = Math.max(0, this.reserve - reserveDrain(this.phase, delta))
    }

    if (this.phase === PHASE.INCUBUS && this.reserve <= 10) {
      this.phase = PHASE.BERSERK
    }

    if ((this.phase === PHASE.INCUBUS || this.phase === PHASE.BERSERK) && this.reserve <= 0) {
      this.phase = PHASE.TRAUMATIC
    }

    if (this.phase === PHASE.TRAUMATIC) {
      this.reserve = Math.min(100, this.reserve + 3 * (delta / 1000))
      if (this.reserve >= 30) this.phase = PHASE.BASE
    }

    if (this.shadowParryActive) {
      this.shadowParryTimer -= delta
      if (this.shadowParryTimer <= 0) this.shadowParryActive = false
    }

    this.speed = PLAYER_SPEED * speedMultiplier(this.phase)
  }

  _updateShadow(scene, delta) {
    const needsShadow = this.phase >= PHASE.MINOR_DEMON && this.phase !== PHASE.TRAUMATIC

    if (needsShadow && !this.shadow) {
      this.shadow = scene.add.rectangle(this.x, this.y, 18, 26, 0x220033, 0.5).setDepth(4)
    } else if (!needsShadow && this.shadow) {
      this.shadow.destroy()
      this.shadow = null
    }

    if (!this.shadow) return

    const lag = 0.08
    this._shadowLagX += (this.x - this._shadowLagX) * lag
    this._shadowLagY += (this.y - this._shadowLagY) * lag
    this.shadow.setPosition(this._shadowLagX, this._shadowLagY)

    if (this.phase === PHASE.INCUBUS || this.phase === PHASE.BERSERK) {
      this.shadowAttackTimer -= delta
      if (this.shadowAttackTimer <= 0) {
        this._shadowStrike(scene)
        this.shadowAttackTimer = 2000
      }
    }
  }

  _shadowStrike(scene) {
    if (!scene.enemies) return
    const enemies = scene.enemies.getChildren().filter(e => e.alive !== false)
    if (enemies.length === 0) return

    let target
    if (this.phase === PHASE.BERSERK) {
      target = enemies[Math.floor(Math.random() * enemies.length)]
    } else {
      target = enemies.reduce((best, e) =>
        Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <
        Phaser.Math.Distance.Between(this.x, this.y, best.x, best.y) ? e : best
      )
      if (Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) > 80) return
    }

    const startX = this._shadowLagX
    const startY = this._shadowLagY

    scene.tweens.add({
      targets: this.shadow,
      x: target.x, y: target.y,
      duration: 150,
      onComplete: () => {
        if (target?.takeDamage) target.takeDamage(20)
        scene.tweens.add({ targets: this.shadow, x: startX, y: startY, duration: 400 })
      }
    })
  }

  _handleAttacks(scene, delta) {
    if (this.attackCooldown > 0) this.attackCooldown -= delta
    if (this.heavyCooldown > 0)  this.heavyCooldown  -= delta

    if (this._lmbDown && this.attackCooldown <= 0) {
      this._punch(scene)
      this.attackCooldown = 350
    }

    if (this._rmbDown && this.heavyCooldown <= 0) {
      this._secondaryAbility(scene)
      this.heavyCooldown = 1500
    }
  }

  _punch(scene) {
    if (!scene.enemies) return
    const reach = 30
    let aimX = this.facingX
    let aimY = this.facingY

    if (this.phase === PHASE.BERSERK) {
      const angle = Math.atan2(this.facingY, this.facingX) + (Math.random() - 0.5) * (Math.PI / 3)
      aimX = Math.cos(angle)
      aimY = Math.sin(angle)
    }

    const dmg = punchDamage(this.phase)
    scene.enemies.getChildren().forEach(enemy => {
      if (Phaser.Math.Distance.Between(this.x + aimX * reach, this.y + aimY * reach, enemy.x, enemy.y) < 25) {
        enemy.takeDamage(dmg)
        if (this.phase === PHASE.MINOR_DEMON) {
          enemy.x += aimX * 20
          enemy.y += aimY * 20
        }
        if (this.phase >= PHASE.INCUBUS) {
          this.reserve = Math.min(100, this.reserve + 10)
        }
      }
    })
  }

  _secondaryAbility(scene) {
    if (this.phase === PHASE.AWAKENING)  { this._heavyBlow(scene); return }
    if (this.phase === PHASE.MINOR_DEMON){ this.shadowParryActive = true; this.shadowParryTimer = 3000; return }
    if (this.phase === PHASE.INCUBUS || this.phase === PHASE.BERSERK) { this._shadowLash(scene) }
  }

  _heavyBlow(scene) {
    if (!scene.enemies) return
    const reach = 35
    scene.enemies.getChildren().forEach(enemy => {
      if (Phaser.Math.Distance.Between(this.x + this.facingX * reach, this.y + this.facingY * reach, enemy.x, enemy.y) < 28) {
        enemy.takeDamage(30)
      }
    })
  }

  _shadowLash(scene) {
    const pointer = scene.input.activePointer
    const dx = pointer.worldX - this.x
    const dy = pointer.worldY - this.y
    const len = Math.sqrt(dx * dx + dy * dy) || 1

    const proj = scene.add.rectangle(
      this.shadow ? this._shadowLagX : this.x,
      this.shadow ? this._shadowLagY : this.y,
      8, 8, 0x440066
    )
    scene.physics.add.existing(proj)
    proj.body.setVelocity((dx / len) * 450, (dy / len) * 450)
    proj.damage = 40
    this.projectiles.add(proj)
    scene.time.delayedCall(1200, () => { if (proj.active) proj.destroy() })
  }

  _updateVisual(scene) {
    this.fillColor = PHASE_COLOR[this.phase]

    if (this._traumaOverlay) { this._traumaOverlay.destroy(); this._traumaOverlay = null }
    if (this.phase === PHASE.TRAUMATIC && Math.sin(scene.time.now * 0.005) > 0) {
      this._traumaOverlay = scene.add.rectangle(this.x, this.y, 22, 30, 0xffffff, 0.25).setDepth(6)
    }
  }

  _updateIndicators() {
    const t = this.corruption / 100
    const r = Math.round(0x44 + t * (0xff - 0x44))
    const g = Math.round(0x44 + t * (0x22 - 0x44))
    const b = Math.round(0x44 + t * (0x00 - 0x44))
    this._corrIndicator.setPosition(this.x - 5, this.y - 20)
    this._corrIndicator.fillColor = (r << 16) | (g << 8) | b

    const blink = this.reserve < 20 && Math.floor(Date.now() / 300) % 2 === 0
    this._resIndicator.setPosition(this.x + 5, this.y - 20)
    this._resIndicator.fillColor = blink ? 0x110022 : 0x6600aa
  }

  _checkDeath(scene) {
    if (!this.alive) {
      this._corrIndicator.destroy()
      this._resIndicator.destroy()
      if (this.shadow) this.shadow.destroy()
      if (this._traumaOverlay) this._traumaOverlay.destroy()
      scene.scene.start('GameOverScene', { score: scene.scoreSystem?.getScore() ?? 0 })
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/characters/Damian.js
git commit -m "feat: Damian full implementation - phases, shadow, combat, indicators"
```

---

### Task 6: GameScene — wire Damian for testing

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Swap player to Damian**

Replace the Zeryth import:
```javascript
import { Zeryth } from '../characters/Zeryth.js'
```
with:
```javascript
import { Damian } from '../characters/Damian.js'
```

Replace instantiation in `create()`:
```javascript
this.player = new Zeryth(this, spawnX, spawnY)
```
with:
```javascript
this.player = new Damian(this, spawnX, spawnY)
```

- [ ] **Step 2: Full manual test in browser**

`npm run dev`, verify:

| Behaviour | Expected |
|---|---|
| Start | Grey rectangle + 2 indicator dots above |
| Press F (reserve > 20) | Color shifts: grey → amber → purple → dark red |
| Take damage | Corruption dot reddens, phase auto-escalates at thresholds 25/55/80 |
| Fase 2+ | Shadow rectangle appears with lag |
| Fase 3 | Shadow detaches every 2s to strike nearest enemy |
| Reserve < 10 in Fase 3 | Berserk (bright red), punch direction deviates |
| Reserve = 0 | Traumatic (grey+flicker), movement halved |
| Reserve reaches 30 in Traumatic | Returns to Base |
| Damage in Traumatic | Game Over |
| LMB | Punches enemies, damage scales per phase |
| RMB in Fase 1 | Heavy blow (30 dmg) |
| RMB in Fase 2 | Shadow parry (next hit absorbed) |
| RMB in Fase 3 | Shadow lash fires toward cursor |
| TAB | Settings shows 9 remappable keys |

- [ ] **Step 3: Run tests**

```
npm run test
```

Expected: 24 DamianPhase tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: GameScene wired to Damian for testing"
```
