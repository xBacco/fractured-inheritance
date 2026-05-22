# Character Select Screen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire lo spawn hardcodato di Aetherion in GameScene con una schermata di selezione PG (`CharacterSelectScene`). Implementa unlock progressivo achievement-style con persistenza localStorage. Aetherion + Korvan starter; gli altri 5 PG sbloccabili.

**Architecture:**
- 3 nuovi moduli puri (Registry, Store, Rules) + 1 nuova Phaser scene
- Death transition refactored: GameScene rileva morte player, non i singoli PG
- Persistenza via localStorage chiave `fi:unlocks` (pattern di KeyBindings)
- TDD su UnlockStore; scene Phaser verificate manualmente

**Tech Stack:** Phaser 3.80, vitest 1.6, localStorage. Spec di riferimento: `docs/superpowers/specs/2026-05-22-character-select-design.md`.

---

## Pre-flight: Verifica baseline

- [ ] **Step 0.1: Run tutti i test correnti per stabilire baseline**

Run: `npm test`
Expected: tutti i test esistenti passano (eccetto 5 TacticalPause pre-esistenti che falliscono per mock mancante — non bloccanti, documentati in memoria).

Annotare il numero di test totali e i test che falliscono. Alla fine del piano, lo stesso set deve essere verde.

---

## Task 1: CharacterRegistry — file dati + helper

**Files:**
- Create: `src/config/CharacterRegistry.js`
- Test: `tests/config/CharacterRegistry.test.js`

- [ ] **Step 1.1: Scrivi i test (failing)**

Crea `tests/config/CharacterRegistry.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { CHARACTER_REGISTRY, getCharacter } from '../../src/config/CharacterRegistry.js'

describe('CharacterRegistry — struttura', () => {
  it('contiene 7 PG', () => {
    expect(CHARACTER_REGISTRY).toHaveLength(7)
  })

  it('tutti gli id sono univoci', () => {
    const ids = CHARACTER_REGISTRY.map(e => e.id)
    expect(new Set(ids).size).toBe(7)
  })

  it('ogni entry ha campi obbligatori', () => {
    for (const e of CHARACTER_REGISTRY) {
      expect(typeof e.id).toBe('string')
      expect(typeof e.name).toBe('string')
      expect(typeof e.tagline).toBe('string')
      expect(typeof e.playstyle).toBe('string')
      expect(typeof e.classRef).toBe('function')
      expect(typeof e.abilities).toBe('object')
      expect(typeof e.unlockedByDefault).toBe('boolean')
      expect(typeof e.accentColor).toBe('string')
    }
  })

  it('aetherion e korvan sono unlockedByDefault', () => {
    expect(getCharacter('aetherion').unlockedByDefault).toBe(true)
    expect(getCharacter('korvan').unlockedByDefault).toBe(true)
  })

  it('gli altri 5 non sono unlockedByDefault e hanno unlockHint non-null', () => {
    const lockedIds = ['mira', 'damian', 'silas', 'zeryth', 'veyra']
    for (const id of lockedIds) {
      const e = getCharacter(id)
      expect(e.unlockedByDefault).toBe(false)
      expect(typeof e.unlockHint).toBe('string')
    }
  })

  it('getCharacter ritorna undefined per id sconosciuto', () => {
    expect(getCharacter('nonesiste')).toBeUndefined()
  })
})
```

- [ ] **Step 1.2: Run test, verifica failing**

Run: `npm test -- tests/config/CharacterRegistry.test.js`
Expected: FAIL con "Cannot find module '../../src/config/CharacterRegistry.js'"

- [ ] **Step 1.3: Crea il file Registry**

Crea `src/config/CharacterRegistry.js`:

```js
import { Aetherion } from '../characters/Aetherion.js'
import { Korvan }    from '../characters/Korvan.js'
import { Mira }      from '../characters/Mira.js'
import { Damian }    from '../characters/Damian.js'
import { Silas }     from '../characters/Silas.js'
import { Zeryth }    from '../characters/Zeryth.js'
import { Veyra }     from '../characters/Veyra.js'

export const CHARACTER_REGISTRY = [
  {
    id: 'aetherion',
    name: 'AETHERION',
    tagline: 'Melee AOE — alto rischio',
    playstyle: "Burst di area con self-damage. Strike rapidi a contatto, cono che dissolve i proiettili, burst di 4 secondi che ti consuma HP ma rebate sui kill. HP visibile come barra principale.",
    classRef: Aetherion,
    abilities: {
      LMB: 'Paint Strike — melee 8 dmg, CD 300ms',
      RMB: 'Dissolve — cono 80px, scioglie proiettili',
      Q:   'Crack/Burst — AOE 60px, 15 dps, self-damage 6/s',
      F:   'Spezza Metallo — AOE 30 dmg + 3 shard su tile METAL',
    },
    unlockedByDefault: true,
    unlockHint: null,
    accentColor: '#c44',
    cardImage: 'personaggi/giocabili/aetherion/card.jpg',
  },
  {
    id: 'korvan',
    name: 'KORVAN',
    tagline: 'Tank stoico — difensivo',
    playstyle: "Tank con 200 HP e riduzione danno 20%. Cleave melee, parry counter-attack, danno crescente quando combatte da solo. Resistenza alle status 50%.",
    classRef: Korvan,
    abilities: {
      LMB: 'Cleave — 18 dmg, range 42, CD 500ms',
      RMB: 'Parry — finestra 300ms, counter 28 dmg',
      Q:   'Taunt — range 180, attira nemici, +difesa 2.5s',
      F:   'Alone Damage — fino a 50 dmg quando isolato',
    },
    unlockedByDefault: true,
    unlockHint: null,
    accentColor: '#888',
    cardImage: 'personaggi/giocabili/korvan/card.jpg',
  },
  {
    id: 'mira',
    name: 'MIRA',
    tagline: 'Alchimia ambientale',
    playstyle: "Manipolazione del terreno via Sintesi Somatica. Crea muri, modifica tile, lancia/scuda, distrugge ostacoli. Limitata dal calore dei tatuaggi.",
    classRef: Mira,
    abilities: {
      LMB: 'Muro alchemico (consuma temperatura)',
      RMB: 'Trasmutazione terreno',
      Q:   'Lancia (tap) / Scudo (hold)',
      F:   'Distruzione tile DESTRUCTIBLE',
    },
    unlockedByDefault: false,
    unlockHint: 'Criterio di sblocco da definire',
    accentColor: '#d44e0a',
    cardImage: 'personaggi/giocabili/mira/card.jpg',
  },
  {
    id: 'damian',
    name: 'DAMIAN',
    tagline: 'Cross — fasi corruttive',
    playstyle: "Combattente a fasi con riserva demoniaca. Avanza nelle fasi, l'ombra cresce. In Fase 3 l'ombra attacca da sola. La riserva si esaurisce.",
    classRef: Damian,
    abilities: {
      LMB: 'Attacco base (cambia con la fase)',
      RMB: 'Avanza fase / scarica corruzione',
      Q:   'Shadow attack (Fase 2+)',
      F:   'Auto-cura demoniaca',
    },
    unlockedByDefault: false,
    unlockHint: 'Criterio di sblocco da definire',
    accentColor: '#6a1d4a',
    cardImage: 'personaggi/giocabili/damian/card.jpg',
  },
  {
    id: 'silas',
    name: 'SILAS',
    tagline: 'Eliminazione silenziosa',
    playstyle: "Stealth attraverso le ombre. Shadow Bind, Shadow Teleport, Shadow Fusion. Limite: temperatura del sangue.",
    classRef: Silas,
    abilities: {
      LMB: 'Backstab dall\\'ombra',
      RMB: 'Shadow Bind',
      Q:   'Shadow Teleport (tile SHADOW)',
      F:   'Shadow Fusion (invisibilità)',
    },
    unlockedByDefault: false,
    unlockHint: 'Criterio di sblocco da definire',
    accentColor: '#3a3060',
    cardImage: 'personaggi/giocabili/silas/card.jpg',
  },
  {
    id: 'zeryth',
    name: 'ZERYTH',
    tagline: 'Broken Second — distorsione tempo',
    playstyle: "Rallenta il tempo intorno a sé. Spada di sangue, Blood Weapons. Protagonista originale del progetto.",
    classRef: Zeryth,
    abilities: {
      LMB: 'Blood Strike',
      RMB: 'Blood Weapon / Spada di sangue',
      Q:   'Broken Second (rallentamento)',
      F:   'Auto-cura (sistema integrità)',
    },
    unlockedByDefault: false,
    unlockHint: 'Criterio di sblocco da definire',
    accentColor: '#8a0a0a',
    cardImage: 'personaggi/giocabili/zeryth/card.jpg',
  },
  {
    id: 'veyra',
    name: 'VEYRA',
    tagline: 'TBD',
    playstyle: "TBD — vedere personaggi/giocabili/veyra/scheda.html",
    classRef: Veyra,
    abilities: {
      LMB: 'TBD',
      RMB: 'TBD',
      Q:   'TBD',
      F:   'TBD',
    },
    unlockedByDefault: false,
    unlockHint: 'Criterio di sblocco da definire',
    accentColor: '#5a8a40',
    cardImage: 'personaggi/giocabili/veyra/card.jpg',
  },
]

export const getCharacter = (id) => CHARACTER_REGISTRY.find(c => c.id === id)
```

**Nota per l'engineer:** i campi `playstyle` e `abilities` di Veyra sono marcati `TBD`. Prima di committare questo task, leggi `personaggi/giocabili/veyra/scheda.html` e `personaggi/giocabili/veyra/lore.md` per estrarre i contenuti corretti (stesso pattern degli altri 6). Se la scheda è incompleta, lascia `TBD` e annota nel commit message.

Per Damian/Silas/Zeryth: ho usato sintesi ragionevoli dai nomi di file in `src/characters/`. Verifica leggendo le rispettive `personaggi/giocabili/<id>/scheda.html` e correggi i label se le abilità reali differiscono. Anche qui, prima di committare.

- [ ] **Step 1.4: Verifica/aggiusta contenuti registry leggendo le schede**

Leggi questi file e correggi le entry corrispondenti se le abilità o tagline non matchano:
- `personaggi/giocabili/aetherion/scheda.html`
- `personaggi/giocabili/korvan/scheda.html`
- `personaggi/giocabili/mira/scheda.html`
- `personaggi/giocabili/damian/scheda.html`
- `personaggi/giocabili/silas/scheda.html`
- `personaggi/giocabili/zeryth/scheda.html`
- `personaggi/giocabili/veyra/scheda.html`

Per ogni PG, aggiorna `tagline`, `playstyle`, e `abilities` con i contenuti reali. Mantieni la stessa struttura.

- [ ] **Step 1.5: Run test, verifica passing**

Run: `npm test -- tests/config/CharacterRegistry.test.js`
Expected: PASS, 6 test verdi.

- [ ] **Step 1.6: Commit**

```bash
git add src/config/CharacterRegistry.js tests/config/CharacterRegistry.test.js
git commit -m "feat(character-select): CharacterRegistry con 7 PG + helper getCharacter

Registry centralizzato con id, name, tagline, playstyle, abilities,
unlockedByDefault, accentColor. Aetherion + Korvan come unlocked-by-default.
Contenuti playstyle/abilities estratti dalle schede in personaggi/giocabili/."
```

---

## Task 2: UnlockStore — TDD del modulo puro

**Files:**
- Create: `src/systems/UnlockStore.js`
- Create: `src/systems/UnlockRules.js`
- Test: `tests/systems/UnlockStore.test.js`

- [ ] **Step 2.1: Crea il file UnlockRules con array vuoto**

Crea `src/systems/UnlockRules.js`:

```js
// Regole di sblocco. Ogni regola: { unlocks: 'id', requires: (runs) => boolean }
// `runs` è l'oggetto runs dello store DOPO l'incremento del run appena finito.
//
// Criterio del "run valido" e mapping degli unlock sono TBD nella spec.
// Popolare questo array quando confermati — niente refactor altrove.
//
// Esempio:
// export const UNLOCK_RULES = [
//   { unlocks: 'mira',   requires: (runs) => (runs.aetherion?.total ?? 0) >= 3 },
//   { unlocks: 'silas',  requires: (runs) => (runs.korvan?.total ?? 0) >= 3 },
// ]

export const UNLOCK_RULES = []
```

- [ ] **Step 2.2: Scrivi i test (failing)**

Crea `tests/systems/UnlockStore.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { UnlockStore } from '../../src/systems/UnlockStore.js'

// Mock localStorage
const memoryStorage = {
  store: {},
  getItem(k) { return this.store[k] ?? null },
  setItem(k, v) { this.store[k] = String(v) },
  removeItem(k) { delete this.store[k] },
  clear() { this.store = {} },
}
globalThis.localStorage = memoryStorage

beforeEach(() => {
  memoryStorage.clear()
  UnlockStore.reset()
})

describe('UnlockStore — load fresh', () => {
  it('al primo load (localStorage vuoto), unlocked = ids unlockedByDefault dal registry', () => {
    UnlockStore.load()
    const unlocked = UnlockStore.getAllUnlocked()
    expect(unlocked).toContain('aetherion')
    expect(unlocked).toContain('korvan')
    expect(unlocked).not.toContain('mira')
  })

  it('al primo load, runs è oggetto vuoto', () => {
    UnlockStore.load()
    expect(UnlockStore.getRunStats('aetherion')).toEqual({
      total: 0, floor2_reached: 0, completed: 0, time_ms: 0
    })
  })
})

describe('UnlockStore — recordRun', () => {
  beforeEach(() => UnlockStore.load())

  it('incrementa total di 1', () => {
    UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 })
    expect(UnlockStore.getRunStats('aetherion').total).toBe(1)
  })

  it('incrementa floor2_reached quando floorReached >= 2', () => {
    UnlockStore.recordRun('aetherion', { floorReached: 2, completed: false, durationMs: 60000 })
    expect(UnlockStore.getRunStats('aetherion').floor2_reached).toBe(1)
  })

  it('NON incrementa floor2_reached quando floorReached < 2', () => {
    UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 })
    expect(UnlockStore.getRunStats('aetherion').floor2_reached).toBe(0)
  })

  it('incrementa completed quando completed=true', () => {
    UnlockStore.recordRun('aetherion', { floorReached: 5, completed: true, durationMs: 120000 })
    expect(UnlockStore.getRunStats('aetherion').completed).toBe(1)
  })

  it('accumula time_ms', () => {
    UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 })
    UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 45000 })
    expect(UnlockStore.getRunStats('aetherion').time_ms).toBe(75000)
  })

  it('ritorna array vuoto se nessuna regola scatta', () => {
    const newly = UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 })
    expect(newly).toEqual([])
  })

  it('valuta regole iniettate e sblocca quando matchano', () => {
    const rules = [
      { unlocks: 'mira', requires: (runs) => (runs.aetherion?.total ?? 0) >= 2 },
    ]
    UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 }, rules)
    let newly = UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 }, rules)
    expect(newly).toEqual(['mira'])
    expect(UnlockStore.getAllUnlocked()).toContain('mira')
  })

  it('non duplica unlock già sbloccati', () => {
    const rules = [
      { unlocks: 'mira', requires: (runs) => (runs.aetherion?.total ?? 0) >= 1 },
    ]
    UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 }, rules)
    const newly = UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 }, rules)
    expect(newly).toEqual([])  // mira già sbloccata
    expect(UnlockStore.getAllUnlocked().filter(id => id === 'mira')).toHaveLength(1)
  })
})

describe('UnlockStore — persistenza', () => {
  it('save + load preserva lo state (roundtrip)', () => {
    UnlockStore.load()
    UnlockStore.recordRun('aetherion', { floorReached: 2, completed: true, durationMs: 50000 })
    UnlockStore.unlock('mira')

    UnlockStore.reset()
    UnlockStore.load()

    expect(UnlockStore.getAllUnlocked()).toContain('mira')
    const stats = UnlockStore.getRunStats('aetherion')
    expect(stats.total).toBe(1)
    expect(stats.floor2_reached).toBe(1)
    expect(stats.completed).toBe(1)
  })

  it('version mismatch in localStorage carica defaults senza crash', () => {
    memoryStorage.setItem('fi:unlocks', JSON.stringify({ version: 999, runs: {}, unlocked: ['mira'] }))
    UnlockStore.load()
    expect(UnlockStore.getAllUnlocked()).toContain('aetherion')
    expect(UnlockStore.getAllUnlocked()).toContain('korvan')
    expect(UnlockStore.getAllUnlocked()).not.toContain('mira')  // fallback ai default
  })

  it('JSON invalido in localStorage carica defaults senza crash', () => {
    memoryStorage.setItem('fi:unlocks', 'not-json-{{}')
    expect(() => UnlockStore.load()).not.toThrow()
    expect(UnlockStore.getAllUnlocked()).toContain('aetherion')
  })
})

describe('UnlockStore — isUnlocked e unlock', () => {
  beforeEach(() => UnlockStore.load())

  it('isUnlocked ritorna true per default', () => {
    expect(UnlockStore.isUnlocked('aetherion')).toBe(true)
    expect(UnlockStore.isUnlocked('mira')).toBe(false)
  })

  it('unlock(id) aggiunge id agli unlocked e salva', () => {
    UnlockStore.unlock('mira')
    expect(UnlockStore.isUnlocked('mira')).toBe(true)
    // verifica persistenza
    const raw = memoryStorage.getItem('fi:unlocks')
    expect(JSON.parse(raw).unlocked).toContain('mira')
  })

  it('unlock(id) idempotente', () => {
    UnlockStore.unlock('mira')
    UnlockStore.unlock('mira')
    expect(UnlockStore.getAllUnlocked().filter(id => id === 'mira')).toHaveLength(1)
  })
})

describe('UnlockStore — reset', () => {
  it('reset wipes lo state e localStorage', () => {
    UnlockStore.load()
    UnlockStore.unlock('mira')
    UnlockStore.reset()
    expect(UnlockStore.getAllUnlocked()).toEqual([])
    expect(memoryStorage.getItem('fi:unlocks')).toBeNull()
  })
})
```

- [ ] **Step 2.3: Run test, verifica failing**

Run: `npm test -- tests/systems/UnlockStore.test.js`
Expected: FAIL con "Cannot find module"

- [ ] **Step 2.4: Implementa UnlockStore**

Crea `src/systems/UnlockStore.js`:

```js
import { CHARACTER_REGISTRY } from '../config/CharacterRegistry.js'
import { UNLOCK_RULES } from './UnlockRules.js'

const KEY = 'fi:unlocks'
const VERSION = 1

function defaultState() {
  const unlocked = CHARACTER_REGISTRY
    .filter(e => e.unlockedByDefault)
    .map(e => e.id)
  return { version: VERSION, runs: {}, unlocked }
}

function defaultRunStats() {
  return { total: 0, floor2_reached: 0, completed: 0, time_ms: 0 }
}

export class UnlockStore {
  static _state = null

  static load() {
    let parsed = null
    try {
      const raw = localStorage.getItem(KEY)
      if (raw !== null) parsed = JSON.parse(raw)
    } catch {
      parsed = null
    }

    if (parsed && parsed.version === VERSION && Array.isArray(parsed.unlocked) && typeof parsed.runs === 'object') {
      UnlockStore._state = {
        version: VERSION,
        runs: parsed.runs,
        unlocked: parsed.unlocked.slice(),
      }
    } else {
      UnlockStore._state = defaultState()
    }
  }

  static save() {
    if (UnlockStore._state === null) return
    localStorage.setItem(KEY, JSON.stringify(UnlockStore._state))
  }

  static reset() {
    UnlockStore._state = null
    try { localStorage.removeItem(KEY) } catch {}
  }

  static isUnlocked(id) {
    if (UnlockStore._state === null) return false
    return UnlockStore._state.unlocked.includes(id)
  }

  static unlock(id) {
    if (UnlockStore._state === null) UnlockStore.load()
    if (!UnlockStore._state.unlocked.includes(id)) {
      UnlockStore._state.unlocked.push(id)
      UnlockStore.save()
    }
  }

  static getAllUnlocked() {
    if (UnlockStore._state === null) return []
    return UnlockStore._state.unlocked.slice()
  }

  static getRunStats(id) {
    if (UnlockStore._state === null) return defaultRunStats()
    return { ...defaultRunStats(), ...(UnlockStore._state.runs[id] ?? {}) }
  }

  static recordRun(id, meta, rules = UNLOCK_RULES) {
    if (UnlockStore._state === null) UnlockStore.load()
    const state = UnlockStore._state
    if (!state.runs[id]) state.runs[id] = defaultRunStats()
    const r = state.runs[id]
    r.total += 1
    if ((meta?.floorReached ?? 1) >= 2) r.floor2_reached += 1
    if (meta?.completed) r.completed += 1
    r.time_ms += (meta?.durationMs ?? 0)

    const newlyUnlocked = []
    for (const rule of rules) {
      if (state.unlocked.includes(rule.unlocks)) continue
      try {
        if (rule.requires(state.runs)) {
          state.unlocked.push(rule.unlocks)
          newlyUnlocked.push(rule.unlocks)
        }
      } catch {
        // regola malformata — ignora silenziosamente, non bloccare il run
      }
    }

    UnlockStore.save()
    return newlyUnlocked
  }
}
```

- [ ] **Step 2.5: Run test, verifica passing**

Run: `npm test -- tests/systems/UnlockStore.test.js`
Expected: PASS, tutti i test verdi (≈18 test).

- [ ] **Step 2.6: Run TUTTI i test per verificare niente regressione**

Run: `npm test`
Expected: tutti i test esistenti + i nuovi UnlockStore + Registry passano. Lo stesso baseline di Step 0.1 + i nuovi test.

- [ ] **Step 2.7: Commit**

```bash
git add src/systems/UnlockStore.js src/systems/UnlockRules.js tests/systems/UnlockStore.test.js
git commit -m "feat(character-select): UnlockStore + UnlockRules

Classe statica per persistenza unlock su localStorage chiave fi:unlocks.
API: load/save/isUnlocked/unlock/recordRun/getRunStats/reset.
UnlockRules.js parte vuoto — popolare quando i criteri sono confermati.
18 test vitest coprono fresh load, recordRun con/senza regole,
roundtrip, version mismatch, idempotenza, reset."
```

---

## Task 3: Wire UnlockStore.load() in BootScene

**Files:**
- Modify: `src/scenes/BootScene.js`

- [ ] **Step 3.1: Modifica BootScene**

Sostituisci il contenuto di `src/scenes/BootScene.js`:

```js
import { KeyBindings } from '../config/KeyBindings.js'
import { UnlockStore } from '../systems/UnlockStore.js'

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }) }

  preload() {
    // nessun asset esterno — usiamo Graphics
  }

  create() {
    KeyBindings.load()
    UnlockStore.load()
    this.game.canvas.addEventListener('contextmenu', e => e.preventDefault())
    this.scene.start('GameScene')   // resta GameScene per ora; cambierà in Task 8
  }
}
```

**Importante:** `this.scene.start('GameScene')` resta invariato in questo task. Cambierà a `'CharacterSelectScene'` solo dopo aver creato la scena (Task 8). Così il gioco resta runnabile in ogni task intermedio.

- [ ] **Step 3.2: Run test (regressione)**

Run: `npm test`
Expected: tutto verde, niente regressione.

- [ ] **Step 3.3: Commit**

```bash
git add src/scenes/BootScene.js
git commit -m "feat(character-select): carica UnlockStore in BootScene"
```

---

## Task 4: Refactor death → GameOver — sposta da PG a GameScene

I 7 PG hanno tutti la stessa riga `scene.scene.start('GameOverScene', { score: ... })` nel death handler. Sposto la transizione su GameScene per disaccoppiare i PG dalla scene flow e permettere a GameScene di assemblare il runMeta completo.

**Files:**
- Modify: `src/scenes/GameScene.js`
- Modify: `src/characters/Aetherion.js:437`
- Modify: `src/characters/Damian.js:266`
- Modify: `src/characters/Korvan.js:309`
- Modify: `src/characters/Mira.js:439`
- Modify: `src/characters/Silas.js:226`
- Modify: `src/characters/Veyra.js:378`
- Modify: `src/characters/Zeryth.js:162`

- [ ] **Step 4.1: Rimuovi la chiamata da ogni PG**

Per ognuno dei 7 file, trova la riga (numero approssimativo dato sopra; cerca con grep `scene.scene.start('GameOverScene'` se la numerazione è cambiata) e **rimuovila completamente**. Il death handler resta — solo la transizione cambia di posto.

Esempio Aetherion.js — prima:
```js
// dentro il death handler:
this.alive = false
this.scene.cameras.main.fade(800, 0, 0, 0)
scene.scene.start('GameOverScene', { score: scene.scoreSystem?.getScore() ?? 0 })
```

Dopo:
```js
this.alive = false
this.scene.cameras.main.fade(800, 0, 0, 0)
// transizione a GameOverScene è gestita da GameScene.update()
```

Ripeti per Damian, Korvan, Mira, Silas, Veyra, Zeryth (7 file totali).

- [ ] **Step 4.2: Aggiungi rilevamento morte in GameScene.update()**

Modifica `src/scenes/GameScene.js`. Aggiorna il metodo `update()` (attualmente alle righe 77-94):

```js
update(time, delta) {
  if (this.player) this.player.update(this, delta)
  if (this.enemies) {
    this.enemies.getChildren().forEach(e => e.update(this.player, delta))
  }
  if (this._formations) {
    this._formations = this._formations.filter(f => !f.isEmpty)
    this._formations.forEach(f => f.update(delta))
  }
  if (this.tacticalPause) {
    this.tacticalPause.update(delta)
    this.pauseOverlay.setVisible(this.tacticalPause.active)
    const cam = this.cameras.main
    this.pauseOverlay
      .setPosition(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2)
      .setSize(cam.width, cam.height)
  }

  if (this.player && !this.player.alive && !this._gameOverFired) {
    this._gameOverFired = true
    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', {
        score: this.scoreSystem?.getScore() ?? 0,
        characterId: this.characterId ?? 'aetherion',
        runMeta: {
          floorReached: this.runHighestFloor ?? 1,
          completed:    false,
          durationMs:   Date.now() - (this.runStartTime ?? Date.now()),
        }
      })
    })
  }
}
```

**Nota:** `delayedCall(800, ...)` ricalca il fade 800ms che faceva il PG nel suo handler, così la transizione visiva non cambia rispetto a prima. `characterId` ha fallback ad `'aetherion'` per quando si avvia GameScene direttamente (es: hot-reload in dev) — verrà sovrascritto in Task 6.

- [ ] **Step 4.3: Run il gioco manualmente per verificare**

Run: `npm run dev`
Apri il browser, gioca, fatti uccidere. Verifica:
- Il fade-to-black avviene (~800ms)
- Vai a GameOverScene
- Premendo R torna a GameScene

Niente di nuovo visivamente — solo refactor interno. Chiudi il dev server (Ctrl+C).

- [ ] **Step 4.4: Run tutti i test (regressione)**

Run: `npm test`
Expected: tutto verde.

- [ ] **Step 4.5: Commit**

```bash
git add src/characters/Aetherion.js src/characters/Damian.js src/characters/Korvan.js src/characters/Mira.js src/characters/Silas.js src/characters/Veyra.js src/characters/Zeryth.js src/scenes/GameScene.js
git commit -m "refactor(scenes): sposta death → GameOver da PG a GameScene

I 7 PG smettono di chiamare scene.scene.start('GameOverScene'); GameScene
rileva player.alive===false in update() e assembla il runMeta (floor,
durata, completed) per passarlo a GameOverScene. Preparazione per
character select + unlock tracking."
```

---

## Task 5: GameScene riceve characterId via init() e spawna dal Registry

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 5.1: Modifica GameScene per accettare characterId**

In `src/scenes/GameScene.js`:

**Aggiungi import** in cima al file (insieme agli altri):
```js
import { getCharacter } from '../config/CharacterRegistry.js'
```

**Rimuovi gli import diretti dei PG** che non servono più:
```js
// RIMUOVI queste righe:
import { Mira } from '../characters/Mira.js'
import { Korvan } from '../characters/Korvan.js'
import { Veyra } from '../characters/Veyra.js'
import { Aetherion } from '../characters/Aetherion.js'
```

**Aggiungi `init(data)` PRIMA di `create()`** (subito dopo il `constructor`):

```js
init(data) {
  this.characterId     = data?.characterId ?? 'aetherion'
  this.runStartTime    = Date.now()
  this.runHighestFloor = 1
  this._gameOverFired  = false
}
```

**Sostituisci la riga 32** (`this.player = new Aetherion(...)`):

Prima:
```js
this.player = new Aetherion(this, spawnX, spawnY)
```

Dopo:
```js
const entry = getCharacter(this.characterId)
const PGClass = entry.classRef
this.player = new PGClass(this, spawnX, spawnY)
```

- [ ] **Step 5.2: Run il gioco manualmente**

Run: `npm run dev`
Verifica: il gioco parte con Aetherion (fallback default — non passiamo ancora characterId da BootScene). Tutto funziona come prima. Chiudi (Ctrl+C).

- [ ] **Step 5.3: Run test (regressione)**

Run: `npm test`
Expected: tutto verde.

- [ ] **Step 5.4: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat(character-select): GameScene.init(data) + spawn da Registry

init() riceve characterId via scene.start data, costruisce il PG dal
CharacterRegistry invece di hardcodare Aetherion. Fallback ad 'aetherion'
se characterId mancante (es: hot-reload dev)."
```

---

## Task 6: GameOverScene chiama recordRun e mostra due prompt

**Files:**
- Modify: `src/scenes/GameOverScene.js`

- [ ] **Step 6.1: Sostituisci GameOverScene**

Sostituisci il contenuto di `src/scenes/GameOverScene.js`:

```js
import { UnlockStore } from '../systems/UnlockStore.js'
import { getCharacter } from '../config/CharacterRegistry.js'

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }) }

  init(data) {
    this.finalScore   = data?.score ?? 0
    this.characterId  = data?.characterId ?? 'aetherion'
    this.runMeta      = data?.runMeta ?? { floorReached: 1, completed: false, durationMs: 0 }
    this.newlyUnlocked = UnlockStore.recordRun(this.characterId, this.runMeta)
  }

  create() {
    const { width, height } = this.cameras.main

    this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      fontSize: '48px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 - 20, `Punteggio: ${this.finalScore}`, {
      fontSize: '24px', color: '#aaaaaa', fontFamily: 'monospace'
    }).setOrigin(0.5)

    if (this.newlyUnlocked.length > 0) {
      const id = this.newlyUnlocked[0]
      const entry = getCharacter(id)
      const celebration = this.add.text(width / 2, height / 2 + 30,
        `★ NUOVO PG SBLOCCATO: ${entry.name} ★`,
        { fontSize: '22px', color: entry.accentColor, fontFamily: 'monospace' }
      ).setOrigin(0.5)
      this.tweens.add({
        targets: celebration,
        scale: 1.08,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    this.add.text(width / 2, height / 2 + 90, 'R: riprova stesso PG', {
      fontSize: '16px', color: '#666666', fontFamily: 'monospace'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 120, 'Esc: torna a selezione PG', {
      fontSize: '16px', color: '#666666', fontFamily: 'monospace'
    }).setOrigin(0.5)

    this.input.keyboard.once('keydown-R', () => {
      this.scene.start('GameScene', { characterId: this.characterId })
    })
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.start('CharacterSelectScene')
    })
  }
}
```

**Nota:** `keydown-ESC` rimanda a `CharacterSelectScene` che non esiste ancora (la creiamo in Task 7). Finché non esiste, premere Esc farà silenziosamente fallire il `scene.start` (Phaser logga warning ma non crasha). È accettabile per ora — il path R funziona.

- [ ] **Step 6.2: Run il gioco manualmente**

Run: `npm run dev`
Verifica:
- Muori in game → GameOver appare con score
- Premi R → riparti con Aetherion (default)
- Premi Esc → niente di visibile, ok
- Apri DevTools → Console → digita `localStorage.getItem('fi:unlocks')` → vedi le statistiche del run appena finito

Chiudi (Ctrl+C).

- [ ] **Step 6.3: Run test (regressione)**

Run: `npm test`
Expected: tutto verde.

- [ ] **Step 6.4: Commit**

```bash
git add src/scenes/GameOverScene.js
git commit -m "feat(character-select): GameOverScene chiama recordRun + 2 prompt

init() riceve characterId + runMeta, chiama UnlockStore.recordRun().
Se newlyUnlocked non vuoto, mostra celebrazione 'NUOVO PG SBLOCCATO'
con accentColor + tween scale yoyo. Due prompt: R retry stesso PG,
Esc torna a CharacterSelectScene (scena che verrà creata in Task 7)."
```

---

## Task 7: CharacterSelectScene — skeleton + Boot redirect

In questo task creo la scena vuota, la registro in main.js, e BootScene punta a lei. Le UI vere arrivano nei task seguenti.

**Files:**
- Create: `src/scenes/CharacterSelectScene.js`
- Modify: `src/main.js`
- Modify: `src/scenes/BootScene.js`

- [ ] **Step 7.1: Crea CharacterSelectScene skeleton**

Crea `src/scenes/CharacterSelectScene.js`:

```js
import { CHARACTER_REGISTRY, getCharacter } from '../config/CharacterRegistry.js'
import { UnlockStore } from '../systems/UnlockStore.js'

const HEADER_HEIGHT = 80
const FOOTER_HEIGHT = 80
const LIST_X        = 80
const LIST_WIDTH    = 440
const DETAIL_X      = 540
const DETAIL_WIDTH  = 660
const ROW_HEIGHT    = 60
const ROW_STRIDE    = 70

export class CharacterSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'CharacterSelectScene' }) }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0d1a)

    // Placeholder header — definitivo in Task 8
    this.add.text(this.cameras.main.width / 2, 40,
      'FRACTURED INHERITANCE — SELECT CHARACTER',
      { fontSize: '20px', color: '#ffffff', fontFamily: 'monospace' }
    ).setOrigin(0.5)

    // Placeholder: avvia GameScene con il primo unlocked al press di SPACE
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2,
      '[ CharSelect placeholder — premi SPACE per Aetherion ]',
      { fontSize: '16px', color: '#666666', fontFamily: 'monospace' }
    ).setOrigin(0.5)

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { characterId: 'aetherion' })
    })
  }
}
```

- [ ] **Step 7.2: Registra la scena in main.js**

Modifica `src/main.js`:

```js
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js'
import { GameScene } from './scenes/GameScene.js'
import { GameOverScene } from './scenes/GameOverScene.js'
import { SettingsScene } from './scenes/SettingsScene.js'
import { GAME_WIDTH, GAME_HEIGHT } from './config/GameConfig.js'

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [BootScene, CharacterSelectScene, GameScene, GameOverScene, SettingsScene]
}

window.__game = new Phaser.Game(config)
```

- [ ] **Step 7.3: Punta BootScene a CharacterSelectScene**

In `src/scenes/BootScene.js`, cambia l'ultima riga del `create()`:

```js
// prima:
this.scene.start('GameScene')

// dopo:
this.scene.start('CharacterSelectScene')
```

- [ ] **Step 7.4: Run il gioco manualmente**

Run: `npm run dev`
Verifica:
- All'avvio appare la schermata placeholder con il testo "FRACTURED INHERITANCE — SELECT CHARACTER"
- Premi SPACE → parte il run con Aetherion
- Muori → GameOver → Esc → torna alla CharSelectScene placeholder
- Premi SPACE di nuovo → riparte

Chiudi (Ctrl+C).

- [ ] **Step 7.5: Run test (regressione)**

Run: `npm test`
Expected: tutto verde.

- [ ] **Step 7.6: Commit**

```bash
git add src/scenes/CharacterSelectScene.js src/main.js src/scenes/BootScene.js
git commit -m "feat(character-select): CharacterSelectScene skeleton + scene flow

Scena placeholder con un solo prompt SPACE→Aetherion. Registrata in
main.js. BootScene ora punta a CharacterSelectScene invece di GameScene.
GameOverScene Esc → CharacterSelectScene ora funziona. UI completa nei
task successivi."
```

---

## Task 8: CharacterSelectScene — header, footer, layout

**Files:**
- Modify: `src/scenes/CharacterSelectScene.js`

- [ ] **Step 8.1: Sostituisci CharacterSelectScene con layout completo header+footer**

Sostituisci `src/scenes/CharacterSelectScene.js`:

```js
import { CHARACTER_REGISTRY, getCharacter } from '../config/CharacterRegistry.js'
import { UnlockStore } from '../systems/UnlockStore.js'

const HEADER_HEIGHT = 80
const FOOTER_HEIGHT = 80
const LIST_X        = 80
const LIST_WIDTH    = 440
const DETAIL_X      = 540
const DETAIL_WIDTH  = 660
const ROW_HEIGHT    = 60
const ROW_STRIDE    = 70

const COLOR_BG          = 0x0d0d1a
const COLOR_TEXT_PRIMARY   = '#ffffff'
const COLOR_TEXT_SECONDARY = '#aaaaaa'
const COLOR_TEXT_MUTED     = '#666666'

export class CharacterSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'CharacterSelectScene' }) }

  create() {
    this.cameras.main.setBackgroundColor(COLOR_BG)
    this._buildHeader()
    this._buildFooter()

    // Placeholder body — i task 9-13 lo riempiono
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2,
      '[ list + detail vengono nel prossimo task ]',
      { fontSize: '14px', color: COLOR_TEXT_MUTED, fontFamily: 'monospace' }
    ).setOrigin(0.5)

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { characterId: 'aetherion' })
    })
  }

  _buildHeader() {
    const cx = this.cameras.main.width / 2

    this.add.text(cx, 28, 'FRACTURED INHERITANCE', {
      fontSize: '28px',
      color: COLOR_TEXT_PRIMARY,
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(cx, 58, '── SELECT CHARACTER ──', {
      fontSize: '14px',
      color: COLOR_TEXT_SECONDARY,
      fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  _buildFooter() {
    const cx = this.cameras.main.width / 2
    const cy = this.cameras.main.height - FOOTER_HEIGHT / 2

    this.add.text(cx, cy,
      '↑/↓  navigate     ENTER  start     TAB  settings',
      { fontSize: '14px', color: COLOR_TEXT_MUTED, fontFamily: 'monospace' }
    ).setOrigin(0.5)
  }
}
```

- [ ] **Step 8.2: Run manualmente**

Run: `npm run dev`
Verifica: vedi header in cima ("FRACTURED INHERITANCE" + "── SELECT CHARACTER ──"), placeholder al centro, footer in fondo ("↑/↓ navigate · ENTER start · TAB settings"). SPACE avvia ancora il gioco. Chiudi.

- [ ] **Step 8.3: Commit**

```bash
git add src/scenes/CharacterSelectScene.js
git commit -m "feat(character-select): header + footer della CharSelect screen"
```

---

## Task 9: CharacterSelectScene — lista PG a sinistra

**Files:**
- Modify: `src/scenes/CharacterSelectScene.js`

- [ ] **Step 9.1: Aggiungi rendering della lista**

In `src/scenes/CharacterSelectScene.js`, sostituisci il `create()` e aggiungi nuovi metodi privati. La nuova versione completa:

```js
import { CHARACTER_REGISTRY, getCharacter } from '../config/CharacterRegistry.js'
import { UnlockStore } from '../systems/UnlockStore.js'

const HEADER_HEIGHT = 80
const FOOTER_HEIGHT = 80
const LIST_X        = 80
const LIST_WIDTH    = 440
const DETAIL_X      = 540
const DETAIL_WIDTH  = 660
const ROW_HEIGHT    = 60
const ROW_STRIDE    = 70
const LIST_TOP_Y    = HEADER_HEIGHT + 20

const COLOR_BG               = 0x0d0d1a
const COLOR_ROW_DEFAULT      = 0x14141f
const COLOR_ROW_HOVER        = 0x1c1c2a
const COLOR_TEXT_PRIMARY     = '#ffffff'
const COLOR_TEXT_SECONDARY   = '#aaaaaa'
const COLOR_TEXT_MUTED       = '#666666'
const COLOR_TEXT_LOCKED      = '#666677'
const COLOR_TEXT_LOCKED_SUB  = '#555566'

function hexToNumber(hex) {
  // '#c44' → 0xcc4444  ;  '#ffeeaa' → 0xffeeaa
  let s = hex.replace('#', '')
  if (s.length === 3) s = s.split('').map(c => c + c).join('')
  return parseInt(s, 16)
}

export class CharacterSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'CharacterSelectScene' }) }

  create() {
    this.cameras.main.setBackgroundColor(COLOR_BG)
    this._buildHeader()
    this._buildList()
    this._buildFooter()

    // Placeholder detail (Task 10)
    this.add.text(DETAIL_X + 20, LIST_TOP_Y,
      '[ detail panel nel prossimo task ]',
      { fontSize: '14px', color: COLOR_TEXT_MUTED, fontFamily: 'monospace' }
    )

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { characterId: 'aetherion' })
    })
  }

  _buildHeader() {
    const cx = this.cameras.main.width / 2
    this.add.text(cx, 28, 'FRACTURED INHERITANCE', {
      fontSize: '28px', color: COLOR_TEXT_PRIMARY, fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.add.text(cx, 58, '── SELECT CHARACTER ──', {
      fontSize: '14px', color: COLOR_TEXT_SECONDARY, fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  _buildFooter() {
    const cx = this.cameras.main.width / 2
    const cy = this.cameras.main.height - FOOTER_HEIGHT / 2
    this.add.text(cx, cy,
      '↑/↓  navigate     ENTER  start     TAB  settings',
      { fontSize: '14px', color: COLOR_TEXT_MUTED, fontFamily: 'monospace' }
    ).setOrigin(0.5)
  }

  _buildList() {
    this.rows = []

    CHARACTER_REGISTRY.forEach((entry, i) => {
      const y = LIST_TOP_Y + i * ROW_STRIDE
      const unlocked = UnlockStore.isUnlocked(entry.id)
      const accent = hexToNumber(entry.accentColor)

      const bg = this.add.rectangle(LIST_X, y, LIST_WIDTH, ROW_HEIGHT, COLOR_ROW_DEFAULT)
        .setOrigin(0, 0)

      const accentStripe = this.add.rectangle(LIST_X, y + 10, 4, ROW_HEIGHT - 20, accent)
        .setOrigin(0, 0)
        .setAlpha(0.5)

      const nameColor = unlocked ? COLOR_TEXT_PRIMARY : COLOR_TEXT_LOCKED
      const taglineColor = unlocked ? COLOR_TEXT_SECONDARY : COLOR_TEXT_LOCKED_SUB

      const nameText = this.add.text(LIST_X + 20, y + 10, entry.name, {
        fontSize: '20px',
        color: nameColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })

      const taglineText = this.add.text(LIST_X + 20, y + 34, entry.tagline, {
        fontSize: '13px',
        color: taglineColor,
        fontFamily: 'monospace',
      })

      let lockIcon = null
      if (!unlocked) {
        lockIcon = this.add.text(LIST_X + LIST_WIDTH - 30, y + ROW_HEIGHT / 2, '🔒', {
          fontSize: '20px',
        }).setOrigin(0.5)
      }

      this.rows.push({ entry, unlocked, bg, accentStripe, nameText, taglineText, lockIcon, y })
    })
  }
}
```

- [ ] **Step 9.2: Run manualmente**

Run: `npm run dev`
Verifica:
- All'avvio vedi 7 righe a sinistra
- Le prime 2 (Aetherion, Korvan) hanno nome in bianco, tagline in grigio chiaro
- Le altre 5 hanno nome smorzato + icona 🔒 a destra
- Lo stripe colorato a sinistra di ogni riga è visibile
- SPACE avvia il gioco con Aetherion

Chiudi.

- [ ] **Step 9.3: Commit**

```bash
git add src/scenes/CharacterSelectScene.js
git commit -m "feat(character-select): rendering della lista PG con stati locked/unlocked"
```

---

## Task 10: CharacterSelectScene — pannello dettaglio

**Files:**
- Modify: `src/scenes/CharacterSelectScene.js`

- [ ] **Step 10.1: Aggiungi rendering del pannello dettaglio**

In `src/scenes/CharacterSelectScene.js`, modifica:

**1.** Aggiungi al `create()` (sostituendo il placeholder detail):
```js
create() {
  this.cameras.main.setBackgroundColor(COLOR_BG)
  this._buildHeader()
  this._buildList()
  this._buildDetail()
  this._buildFooter()

  this.selectedIndex = 0
  this._renderDetail(CHARACTER_REGISTRY[0])

  this.input.keyboard.once('keydown-SPACE', () => {
    this.scene.start('GameScene', { characterId: 'aetherion' })
  })
}
```

**2.** Aggiungi i metodi `_buildDetail()` e `_renderDetail(entry)`:

```js
_buildDetail() {
  // Container vuoto — i contenuti vengono ricostruiti in _renderDetail
  this.detailObjects = []
}

_renderDetail(entry) {
  // Distruggi i text objects precedenti
  this.detailObjects.forEach(o => o.destroy())
  this.detailObjects = []

  const unlocked = UnlockStore.isUnlocked(entry.id)
  const accent = entry.accentColor
  let y = LIST_TOP_Y

  // Nome grande
  const name = this.add.text(DETAIL_X, y, entry.name, {
    fontSize: '48px',
    color: unlocked ? accent : '#444455',
    fontFamily: 'monospace',
    fontStyle: 'bold',
  })
  this.detailObjects.push(name)
  y += 60

  // Tagline
  const tagline = this.add.text(DETAIL_X, y, entry.tagline, {
    fontSize: '20px',
    color: unlocked ? '#cccccc' : '#666677',
    fontFamily: 'monospace',
  })
  this.detailObjects.push(tagline)
  y += 36

  // Divisoria
  const divider = this.add.rectangle(DETAIL_X, y, 500, 1, 0x333344).setOrigin(0, 0)
  this.detailObjects.push(divider)
  y += 16

  if (unlocked) {
    // Playstyle (word-wrapped)
    const playstyle = this.add.text(DETAIL_X, y, entry.playstyle, {
      fontSize: '15px',
      color: COLOR_TEXT_SECONDARY,
      fontFamily: 'monospace',
      wordWrap: { width: 600 },
    })
    this.detailObjects.push(playstyle)
    y += playstyle.height + 24

    // Abilities header
    const header = this.add.text(DETAIL_X, y, 'ABILITIES', {
      fontSize: '13px',
      color: '#777777',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    })
    this.detailObjects.push(header)
    y += 24

    // Abilities table
    for (const [key, label] of Object.entries(entry.abilities)) {
      const keyText = this.add.text(DETAIL_X, y, key.padEnd(5, ' '), {
        fontSize: '15px',
        color: accent,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      const labelText = this.add.text(DETAIL_X + 60, y, label, {
        fontSize: '15px',
        color: '#eeeeee',
        fontFamily: 'monospace',
      })
      this.detailObjects.push(keyText, labelText)
      y += 22
    }
  } else {
    // Box bloccato
    y += 40
    const lockBox = this.add.rectangle(DETAIL_X + 250, y, 400, 100, 0x000000, 0)
      .setStrokeStyle(1, 0x555566)
      .setOrigin(0.5, 0)
    this.detailObjects.push(lockBox)

    const lockTitle = this.add.text(DETAIL_X + 250, y + 24, '🔒  BLOCCATO', {
      fontSize: '20px',
      color: '#888899',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0)
    this.detailObjects.push(lockTitle)

    const hint = this.add.text(DETAIL_X + 250, y + 60, entry.unlockHint ?? 'Sblocca giocando.', {
      fontSize: '14px',
      color: '#777788',
      fontFamily: 'monospace',
      wordWrap: { width: 380 },
      align: 'center',
    }).setOrigin(0.5, 0)
    this.detailObjects.push(hint)
  }
}
```

- [ ] **Step 10.2: Run manualmente**

Run: `npm run dev`
Verifica:
- Il pannello destro mostra Aetherion (nome grande in rosso, tagline, divisoria, playstyle, abilities con LMB/RMB/Q/F)
- Non hai ancora navigazione — solo Aetherion visibile
- SPACE avvia ancora il gioco

Chiudi.

- [ ] **Step 10.3: Commit**

```bash
git add src/scenes/CharacterSelectScene.js
git commit -m "feat(character-select): pannello dettaglio con playstyle + abilities

Mostra nome grande, tagline, divisoria, playstyle word-wrapped, tabella
abilities. Stato locked: box centrato con 🔒 + unlockHint."
```

---

## Task 11: CharacterSelectScene — selezione + navigazione tastiera

**Files:**
- Modify: `src/scenes/CharacterSelectScene.js`

- [ ] **Step 11.1: Aggiungi selezione + nav tastiera**

In `src/scenes/CharacterSelectScene.js`, fai le seguenti modifiche:

**1.** Rimuovi il placeholder `keydown-SPACE` dal `create()` e sostituiscilo con setup completo. Il nuovo `create()` diventa:

```js
create() {
  this.cameras.main.setBackgroundColor(COLOR_BG)
  this._buildHeader()
  this._buildList()
  this._buildDetail()
  this._buildFooter()

  this.selectedIndex = this._firstUnlockedIndex()
  this._buildSelectionIndicator()
  this._setSelection(this.selectedIndex)
  this._wireInput()
}
```

**2.** Aggiungi i metodi:

```js
_firstUnlockedIndex() {
  return CHARACTER_REGISTRY.findIndex(e => UnlockStore.isUnlocked(e.id))
}

_buildSelectionIndicator() {
  // Bordo sx 4px che scorre tra le righe
  this.selectionIndicator = this.add.rectangle(LIST_X - 6, LIST_TOP_Y, 4, ROW_HEIGHT, 0xffffff)
    .setOrigin(0, 0)
    .setAlpha(0.9)
  // Anche un overlay sottile per la riga selezionata
  this.selectionBg = this.add.rectangle(LIST_X, LIST_TOP_Y, LIST_WIDTH, ROW_HEIGHT, 0xffffff, 0.08)
    .setOrigin(0, 0)
}

_setSelection(index) {
  if (index < 0 || index >= CHARACTER_REGISTRY.length) return
  this.selectedIndex = index
  const row = this.rows[index]
  const entry = row.entry
  const accent = hexToNumber(entry.accentColor)

  this.selectionIndicator.setFillStyle(accent)
  this.selectionIndicator.y = row.y
  this.selectionBg.y = row.y
  this.selectionBg.setFillStyle(accent, 0.18)

  this._renderDetail(entry)
}

_wireInput() {
  this.input.keyboard.on('keydown-UP',    () => this._move(-1))
  this.input.keyboard.on('keydown-DOWN',  () => this._move(+1))
  this.input.keyboard.on('keydown-W',     () => this._move(-1))
  this.input.keyboard.on('keydown-S',     () => this._move(+1))
  this.input.keyboard.on('keydown-ENTER', () => this._startRun())
  this.input.keyboard.on('keydown-SPACE', () => this._startRun())
  this.input.keyboard.on('keydown-TAB',   (e) => {
    e.preventDefault?.()
    if (!this.scene.isActive('SettingsScene')) {
      this.scene.pause()
      this.scene.launch('SettingsScene')
    }
  })
}

_move(delta) {
  const n = CHARACTER_REGISTRY.length
  const next = (this.selectedIndex + delta + n) % n
  this._setSelection(next)
}

_startRun() {
  const entry = CHARACTER_REGISTRY[this.selectedIndex]
  if (!UnlockStore.isUnlocked(entry.id)) {
    // feedback "locked" — Task 13
    return
  }
  this.scene.start('GameScene', { characterId: entry.id })
}
```

- [ ] **Step 11.2: Run manualmente**

Run: `npm run dev`
Verifica:
- All'avvio: Aetherion selezionato (indicatore + bg colorati), pannello mostra Aetherion
- ↓ scorre a Korvan, pannello aggiorna
- ↓ scorre a Mira (locked), pannello mostra "🔒 BLOCCATO" + hint
- ↑ torna indietro, wrapping in cima e in fondo
- W/S funzionano come ↑/↓
- ENTER su Aetherion → avvia GameScene con Aetherion
- ENTER su Mira → niente (silenziosamente bloccato, Task 13 aggiunge feedback)
- TAB apre SettingsScene
- Muori → GameOver → Esc → torna a CharSelect col PG che hai giocato selezionato? No, sempre Aetherion. Va bene per ora.

Chiudi.

- [ ] **Step 11.3: Commit**

```bash
git add src/scenes/CharacterSelectScene.js
git commit -m "feat(character-select): selezione + navigazione tastiera

Frecce/WASD per scorrere lista (con wrap), ENTER/SPACE per avviare,
TAB per Settings. Indicatore di selezione (bordo sx + bg) si muove
tra le righe e prende l'accentColor del PG selezionato."
```

---

## Task 12: CharacterSelectScene — interazione mouse

**Files:**
- Modify: `src/scenes/CharacterSelectScene.js`

- [ ] **Step 12.1: Aggiungi mouse hover + click su righe**

In `src/scenes/CharacterSelectScene.js`, modifica `_buildList()` per rendere ogni riga interattiva. **Aggiungi DENTRO il `forEach` di `_buildList()`, dopo aver creato `bg`:**

```js
bg.setInteractive({ useHandCursor: true })

bg.on('pointerover', () => {
  if (this.selectedIndex !== i) bg.setFillStyle(COLOR_ROW_HOVER)
})

bg.on('pointerout', () => {
  if (this.selectedIndex !== i) bg.setFillStyle(COLOR_ROW_DEFAULT)
})

bg.on('pointerdown', (pointer) => {
  this._setSelection(i)
  if (pointer.button === 0 && this._lastClickIndex === i && Date.now() - (this._lastClickTime ?? 0) < 350) {
    // double-click
    this._startRun()
  }
  this._lastClickIndex = i
  this._lastClickTime = Date.now()
})
```

Aggiorna anche `_setSelection()` per ripristinare il bg delle righe non-selezionate al COLOR_ROW_DEFAULT (altrimenti l'hover precedente rimane appeso). Sostituisci il metodo:

```js
_setSelection(index) {
  if (index < 0 || index >= CHARACTER_REGISTRY.length) return

  // ripristina background delle altre righe
  this.rows.forEach((r, i) => {
    if (i !== index) r.bg.setFillStyle(COLOR_ROW_DEFAULT)
  })

  this.selectedIndex = index
  const row = this.rows[index]
  const entry = row.entry
  const accent = hexToNumber(entry.accentColor)

  this.selectionIndicator.setFillStyle(accent)
  this.selectionIndicator.y = row.y
  this.selectionBg.y = row.y
  this.selectionBg.setFillStyle(accent, 0.18)

  this._renderDetail(entry)
}
```

- [ ] **Step 12.2: Run manualmente**

Run: `npm run dev`
Verifica:
- Hover su una riga → cambia colore di background (subtle)
- Click su una riga → la seleziona (indicatore si sposta, pannello aggiorna)
- Double-click su una riga unlocked → avvia il run
- Double-click su una riga locked → nulla (Task 13 darà feedback)

Chiudi.

- [ ] **Step 12.3: Commit**

```bash
git add src/scenes/CharacterSelectScene.js
git commit -m "feat(character-select): mouse hover + click + double-click su righe"
```

---

## Task 13: CharacterSelectScene — feedback locked + transizione start

**Files:**
- Modify: `src/scenes/CharacterSelectScene.js`

- [ ] **Step 13.1: Aggiungi feedback su ENTER/click locked + flash bianco su start**

In `src/scenes/CharacterSelectScene.js`, sostituisci `_startRun()` con:

```js
_startRun() {
  const entry = CHARACTER_REGISTRY[this.selectedIndex]

  if (!UnlockStore.isUnlocked(entry.id)) {
    this._playLockedFeedback()
    return
  }

  // Flash bianco breve + fade-to-black, poi start scene
  this.cameras.main.flash(100, 255, 255, 255)
  this.cameras.main.fade(200, 0, 0, 0)
  this.time.delayedCall(220, () => {
    this.scene.start('GameScene', { characterId: entry.id })
  })
}

_playLockedFeedback() {
  // shake orizzontale del pannello destro (10px in 200ms)
  const targets = this.detailObjects
  this.tweens.add({
    targets,
    x: '+=8',
    duration: 50,
    yoyo: true,
    repeat: 3,
    ease: 'Sine.easeInOut',
  })

  // flash sull'icona lucchetto della riga corrente
  const row = this.rows[this.selectedIndex]
  if (row.lockIcon) {
    this.tweens.add({
      targets: row.lockIcon,
      scale: 1.4,
      duration: 100,
      yoyo: true,
      ease: 'Cubic.easeOut',
    })
  }
}
```

- [ ] **Step 13.2: Run manualmente**

Run: `npm run dev`
Verifica:
- ENTER su PG unlocked → flash bianco + fade-to-black → GameScene
- ENTER su PG locked (es: Mira) → pannello destro fa shake orizzontale + 🔒 nella lista pulsa una volta
- Double-click su locked → stesso shake

Chiudi.

- [ ] **Step 13.3: Commit**

```bash
git add src/scenes/CharacterSelectScene.js
git commit -m "feat(character-select): feedback locked (shake + lock pulse) + start flash"
```

---

## Task 14: CharacterSelectScene — polish (intro + lock pulse loop + tween indicatore)

**Files:**
- Modify: `src/scenes/CharacterSelectScene.js`

- [ ] **Step 14.1: Aggiungi intro staggered, pulse loop su 🔒, tween indicatore selezione**

In `src/scenes/CharacterSelectScene.js`:

**1.** Modifica `_buildList()` aggiungendo il pulse loop alle lock icon. Subito dopo `if (!unlocked) { lockIcon = ... }`, aggiungi:

```js
if (!unlocked) {
  lockIcon = this.add.text(LIST_X + LIST_WIDTH - 30, y + ROW_HEIGHT / 2, '🔒', {
    fontSize: '20px',
  }).setOrigin(0.5)

  // pulse loop sottile
  this.tweens.add({
    targets: lockIcon,
    scale: 1.1,
    duration: 1200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })
}
```

**2.** Modifica `_setSelection(index)` per animare l'indicatore invece di teletrasportarlo. Sostituisci il metodo:

```js
_setSelection(index) {
  if (index < 0 || index >= CHARACTER_REGISTRY.length) return

  this.rows.forEach((r, i) => {
    if (i !== index) r.bg.setFillStyle(COLOR_ROW_DEFAULT)
  })

  this.selectedIndex = index
  const row = this.rows[index]
  const entry = row.entry
  const accent = hexToNumber(entry.accentColor)

  // colore accent e bg selezione (immediato)
  this.selectionIndicator.setFillStyle(accent)
  this.selectionBg.setFillStyle(accent, 0.18)

  // animazione posizione su indicator + bg
  this.tweens.add({
    targets: [this.selectionIndicator, this.selectionBg],
    y: row.y,
    duration: 120,
    ease: 'Cubic.easeOut',
  })

  this._renderDetail(entry)
}
```

**3.** Modifica `_renderDetail(entry)` per cross-fade. Wrappa la distruzione e ricostruzione in una transizione. Sostituisci l'inizio del metodo:

```js
_renderDetail(entry) {
  const oldObjects = this.detailObjects
  this.detailObjects = []

  // fade-out vecchi (se ci sono)
  if (oldObjects.length > 0) {
    this.tweens.add({
      targets: oldObjects,
      alpha: 0,
      duration: 80,
      onComplete: () => oldObjects.forEach(o => o.destroy()),
    })
  }

  // build nuovi a alpha 0 → 1
  const newObjects = this._buildDetailObjects(entry)
  newObjects.forEach(o => o.setAlpha(0))
  this.detailObjects = newObjects
  this.tweens.add({
    targets: newObjects,
    alpha: 1,
    duration: 150,
    delay: 80,
  })
}
```

Poi rinomina il vecchio corpo di `_renderDetail` in `_buildDetailObjects` (che ritorna l'array di text objects creati, senza distruggere quelli vecchi):

```js
_buildDetailObjects(entry) {
  const created = []
  const unlocked = UnlockStore.isUnlocked(entry.id)
  const accent = entry.accentColor
  let y = LIST_TOP_Y

  const name = this.add.text(DETAIL_X, y, entry.name, {
    fontSize: '48px',
    color: unlocked ? accent : '#444455',
    fontFamily: 'monospace',
    fontStyle: 'bold',
  })
  created.push(name)
  y += 60

  const tagline = this.add.text(DETAIL_X, y, entry.tagline, {
    fontSize: '20px',
    color: unlocked ? '#cccccc' : '#666677',
    fontFamily: 'monospace',
  })
  created.push(tagline)
  y += 36

  const divider = this.add.rectangle(DETAIL_X, y, 500, 1, 0x333344).setOrigin(0, 0)
  created.push(divider)
  y += 16

  if (unlocked) {
    const playstyle = this.add.text(DETAIL_X, y, entry.playstyle, {
      fontSize: '15px',
      color: COLOR_TEXT_SECONDARY,
      fontFamily: 'monospace',
      wordWrap: { width: 600 },
    })
    created.push(playstyle)
    y += playstyle.height + 24

    const header = this.add.text(DETAIL_X, y, 'ABILITIES', {
      fontSize: '13px',
      color: '#777777',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    })
    created.push(header)
    y += 24

    for (const [key, label] of Object.entries(entry.abilities)) {
      const keyText = this.add.text(DETAIL_X, y, key.padEnd(5, ' '), {
        fontSize: '15px',
        color: accent,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      const labelText = this.add.text(DETAIL_X + 60, y, label, {
        fontSize: '15px',
        color: '#eeeeee',
        fontFamily: 'monospace',
      })
      created.push(keyText, labelText)
      y += 22
    }
  } else {
    y += 40
    const lockBox = this.add.rectangle(DETAIL_X + 250, y, 400, 100, 0x000000, 0)
      .setStrokeStyle(1, 0x555566)
      .setOrigin(0.5, 0)
    created.push(lockBox)

    const lockTitle = this.add.text(DETAIL_X + 250, y + 24, '🔒  BLOCCATO', {
      fontSize: '20px',
      color: '#888899',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0)
    created.push(lockTitle)

    const hint = this.add.text(DETAIL_X + 250, y + 60, entry.unlockHint ?? 'Sblocca giocando.', {
      fontSize: '14px',
      color: '#777788',
      fontFamily: 'monospace',
      wordWrap: { width: 380 },
      align: 'center',
    }).setOrigin(0.5, 0)
    created.push(hint)
  }

  return created
}
```

**Nota:** il nuovo `_renderDetail()` chiama `_buildDetailObjects()` che a sua volta chiama `this.add.text(...)`. Il `_buildDetail()` originale (vuoto) può essere rimosso oppure semplificato a:

```js
_buildDetail() {
  this.detailObjects = []
}
```

**4.** Aggiungi intro staggered. Modifica `create()`:

```js
create() {
  this.cameras.main.setBackgroundColor(COLOR_BG)
  this._buildHeader()
  this._buildList()
  this._buildDetail()
  this._buildFooter()

  this.selectedIndex = this._firstUnlockedIndex()
  this._buildSelectionIndicator()
  this._setSelection(this.selectedIndex)
  this._wireInput()
  this._playIntro()
}

_playIntro() {
  // Tutti i text/Graphics partono ad alpha 0 e fade-in staggered
  const headerObjs = this.children.list.filter(o => o.y < HEADER_HEIGHT)
  const footerObjs = this.children.list.filter(o => o.y > this.cameras.main.height - FOOTER_HEIGHT)
  const listObjs = this.rows.flatMap(r => [r.bg, r.accentStripe, r.nameText, r.taglineText, r.lockIcon].filter(Boolean))
  const detailObjs = this.detailObjects
  const indicatorObjs = [this.selectionIndicator, this.selectionBg]

  ;[...headerObjs, ...listObjs, ...detailObjs, ...footerObjs, ...indicatorObjs].forEach(o => o.setAlpha(0))

  this.tweens.add({ targets: headerObjs,    alpha: 1, duration: 250, delay: 0   })
  this.tweens.add({ targets: listObjs,      alpha: 1, duration: 250, delay: 80  })
  this.tweens.add({ targets: indicatorObjs, alpha: 1, duration: 250, delay: 160 })
  this.tweens.add({ targets: detailObjs,    alpha: 1, duration: 250, delay: 160 })
  this.tweens.add({ targets: footerObjs,    alpha: 1, duration: 250, delay: 240 })
}
```

**Nota sul pattern children.list:** è un po' fragile (dipende dall'ordine di creazione). Una versione più robusta tiene riferimenti espliciti agli oggetti header/footer. Se la fragility crea problemi, fattorizza `_buildHeader()` e `_buildFooter()` per ritornare l'array degli oggetti creati e usali direttamente in `_playIntro()`.

Sostituisci `_buildHeader()` e `_buildFooter()`:

```js
_buildHeader() {
  const cx = this.cameras.main.width / 2
  this.headerObjs = []

  this.headerObjs.push(this.add.text(cx, 28, 'FRACTURED INHERITANCE', {
    fontSize: '28px', color: COLOR_TEXT_PRIMARY, fontFamily: 'monospace',
  }).setOrigin(0.5))

  this.headerObjs.push(this.add.text(cx, 58, '── SELECT CHARACTER ──', {
    fontSize: '14px', color: COLOR_TEXT_SECONDARY, fontFamily: 'monospace',
  }).setOrigin(0.5))
}

_buildFooter() {
  const cx = this.cameras.main.width / 2
  const cy = this.cameras.main.height - FOOTER_HEIGHT / 2
  this.footerObjs = []

  this.footerObjs.push(this.add.text(cx, cy,
    '↑/↓  navigate     ENTER  start     TAB  settings',
    { fontSize: '14px', color: COLOR_TEXT_MUTED, fontFamily: 'monospace' }
  ).setOrigin(0.5))
}
```

E aggiorna `_playIntro()` di conseguenza:

```js
_playIntro() {
  const listObjs = this.rows.flatMap(r => [r.bg, r.accentStripe, r.nameText, r.taglineText, r.lockIcon].filter(Boolean))
  const indicatorObjs = [this.selectionIndicator, this.selectionBg]

  ;[...this.headerObjs, ...listObjs, ...this.detailObjects, ...this.footerObjs, ...indicatorObjs].forEach(o => o.setAlpha(0))

  this.tweens.add({ targets: this.headerObjs,  alpha: 1, duration: 250, delay: 0   })
  this.tweens.add({ targets: listObjs,         alpha: 1, duration: 250, delay: 80  })
  this.tweens.add({ targets: indicatorObjs,    alpha: 1, duration: 250, delay: 160 })
  this.tweens.add({ targets: this.detailObjects, alpha: 1, duration: 250, delay: 160 })
  this.tweens.add({ targets: this.footerObjs,  alpha: 1, duration: 250, delay: 240 })
}
```

- [ ] **Step 14.2: Run manualmente**

Run: `npm run dev`
Verifica:
- All'avvio: header appare prima, poi lista, poi indicatore+detail, poi footer (staggered ~250ms ciascuno)
- Le 🔒 pulsano dolcemente (loop continuo, scale 1.0↔1.1 ogni 1.2s)
- ↓/↑ → l'indicatore (4px stripe + bg) scorre tra le righe in 120ms con easing
- Detail panel cross-fade quando cambia selezione (fade-out 80ms + fade-in 150ms)

Chiudi.

- [ ] **Step 14.3: Commit**

```bash
git add src/scenes/CharacterSelectScene.js
git commit -m "feat(character-select): polish UX

Intro staggered (header → list → indicator+detail → footer in 250ms cad).
Pulse loop su icone 🔒 (scale yoyo 1.2s).
Tween indicatore selezione tra righe (Cubic.easeOut 120ms).
Cross-fade su detail panel quando cambia PG (80ms out + 150ms in)."
```

---

## Task 15: Smoke test finale + Esc-back

**Files:**
- nessun file (solo verifica)

- [ ] **Step 15.1: Smoke test manuale completo**

Run: `npm run dev`

**Checklist comportamentale:**
1. [ ] All'avvio vedo CharSelect con intro animata
2. [ ] Aetherion + Korvan unlocked, gli altri 5 con 🔒
3. [ ] ↓/↑/W/S scorrono la selezione (con wrap)
4. [ ] Hover col mouse colora il bg della riga
5. [ ] Click seleziona; double-click su unlocked avvia il run
6. [ ] Detail panel aggiorna correttamente (playstyle, abilities oppure box locked)
7. [ ] ENTER su unlocked → flash bianco + fade nero → GameScene col PG giusto
8. [ ] ENTER su locked → shake del pannello + lock icon pulsa
9. [ ] In GameScene, il PG è quello scelto (verificare visivamente la palette colore del Rectangle del player)
10. [ ] Muori → GameOver con score
11. [ ] R → torna a GameScene col **stesso** PG
12. [ ] Esc → torna a CharSelect; il PG appena giocato ha contatore +1 (verificare in DevTools: `localStorage.getItem('fi:unlocks')`)
13. [ ] Refresh del browser → unlock e stats persistono
14. [ ] TAB da CharSelect → SettingsScene apre

**Se qualche punto fallisce**, identifica il task responsabile e correggi prima di proseguire.

- [ ] **Step 15.2: Run tutti i test**

Run: `npm test`
Expected: **stesso baseline di Step 0.1** (i 5 test TacticalPause pre-esistenti continuano a fallire — non bloccanti, documentati) + tutti i nuovi test verdi:
- `tests/config/CharacterRegistry.test.js` — 6 test PASS
- `tests/systems/UnlockStore.test.js` — ~18 test PASS

- [ ] **Step 15.3: Verifica niente console error in dev**

Run: `npm run dev`. Apri DevTools → Console. Naviga tra le scene (CharSelect → GameScene → GameOverScene → CharSelect). Verifica: nessun error/warn rosso. Phaser può loggare warning informativi (es: "Scene Manager... 'X' is sleeping") — accettabili. Chiudi.

- [ ] **Step 15.4: Commit di marker (opzionale)**

Se hai fatto fix nel corso dello smoke test, commitali con messaggi chiari. Altrimenti, niente commit qui.

---

## Task 16: Aggiornamento memoria + cleanup

**Files:**
- Modify: `C:\Users\TomasCoro\.claude\projects\C--Users-TomasCoro-Desktop-PERSONAL-siti-app-fractured-inheritance\memory\project_specs_status.md`
- Modify: `C:\Users\TomasCoro\.claude\projects\C--Users-TomasCoro-Desktop-PERSONAL-siti-app-fractured-inheritance\memory\MEMORY.md`

- [ ] **Step 16.1: Aggiorna memoria project_specs_status**

Apri `memory/project_specs_status.md`. Aggiungi alla sezione "Spec scritte e approvate — implementate" una nuova riga:

```
| Character Select | `docs/superpowers/specs/2026-05-22-character-select-design.md` + plan | ✅ Implementato (Aetherion + Korvan starter, 7 PG, unlock progressivo localStorage, layout two-column) |
```

Aggiorna la sezione "Da fare nelle prossime sessioni" rimuovendo:
- "Character select screen" (fatto)

Aggiungi nelle note implementative:
```
- UnlockRules.js è vuoto — criterio "run valido" e mapping unlock TBD
  (decisione futura: aprire UnlockRules.js e popolare con regole tipo
   `{ unlocks: 'mira', requires: (runs) => (runs.aetherion?.total ?? 0) >= N }`)
- `personaggi/giocabili/veyra/scheda.html` da rivedere se incompleta —
  il registry ha placeholder TBD per Veyra
```

- [ ] **Step 16.2: Verifica MEMORY.md index aggiornato**

`MEMORY.md` non ha bisogno di nuove entry (la spec è documentata in `project_specs_status.md` già linkato).

---

## Self-Review checklist (post-piano)

Prima di considerare il piano completo, verifica:

1. [ ] **Spec coverage**: ogni sezione della spec ha almeno un task associato?
   - §3 architettura → Task 1 (Registry), Task 2 (Store + Rules), Task 7 (CharSelect), Task 3+5+6 (mods scene)
   - §4 Registry → Task 1
   - §5 Store + Rules → Task 2
   - §6 CharSelectScene → Task 7, 8, 9, 10, 11, 12, 13, 14
   - §7 mods scene → Task 3 (Boot), Task 4 (refactor death), Task 5 (GameScene), Task 6 (GameOver)
   - §8 punti TBD → restano TBD per design, nessun task necessario (UnlockRules.js parte vuoto)
   - §9 successo → Task 15

2. [ ] **Placeholder scan**: cerca "TODO", "TBD" nelle azioni del piano. I `TBD` nei dati di Veyra registry sono espliciti e documentati, accettabili. Niente TODO sui passi di implementazione.

3. [ ] **Type consistency**: nomi di metodi/proprietà costanti tra task?
   - `UnlockStore.recordRun(id, meta, rules?)` — usato consistentemente
   - `CharacterRegistry.getCharacter(id)` — sempre stesso nome
   - `this.characterId` — passato tra GameScene/GameOverScene/CharSelect coerentemente
   - `this.runHighestFloor` / `this.runStartTime` — definiti in GameScene.init() e usati in update()
   - `this.detailObjects` (CharSelect) — array di Phaser objects, gestito in `_buildDetailObjects` / `_renderDetail`

Niente fix necessari.

---

## Note finali

- **TBD aperti** (dalla spec §8): criterio "run valido" + mapping unlock + run "completato" + testi `unlockHint`. Si chiudono popolando `src/systems/UnlockRules.js` e aggiornando `unlockHint` nel Registry. Niente refactor altrove.
- **Polish phase futura** (todo "sprite reali" della memoria): aggiungere `cardImage` rendering nel pannello destro della CharSelect. Il campo è già presente nel Registry — basta caricare l'asset in BootScene e usarlo in `_buildDetailObjects`.
- **Test coverage finale**: ~24 nuovi test (6 Registry + 18 UnlockStore). Le scene Phaser sono coperte solo via smoke test manuale (Task 15).
