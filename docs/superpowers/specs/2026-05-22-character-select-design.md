# Character Select Screen — Design Spec

**Data:** 2026-05-22
**Stato:** Approvato (in attesa di review della spec)
**Modalità:** Solo roguelite (Story Mode separato, fuori scope)

---

## 1. Sommario

Schermata di selezione del personaggio pre-run nel roguelite. Sostituisce lo spawn hardcodato di Aetherion in `GameScene`. Tutti e 7 i PG implementati sono presenti, con sblocco progressivo achievement-style: Aetherion e Korvan sono disponibili dalla prima partita, gli altri 5 (Mira, Damian, Silas, Zeryth, Veyra) si sbloccano giocando.

**Persistenza locale:** `localStorage` con chiave `fi:unlocks`.

**Layout:** two-column — lista PG a sinistra, pannello dettaglio a destra.

**Punti aperti (TBD):**
- Criterio esatto di "run valido" per gli achievement (qualsiasi morte vs piano-2-raggiunto vs run-completato vs tempo-di-gioco)
- Mapping concreto "quale PG sblocca quale" (dipende dal criterio sopra)

I file di codice supportano già la struttura — popolare `UnlockRules.js` quando i criteri sono confermati senza refactor.

---

## 2. Requisiti

| Aspetto | Decisione |
|---|---|
| Scope | Solo roguelite |
| Roster | 7 PG (Aetherion, Korvan, Mira, Damian, Silas, Zeryth, Veyra) |
| Sbloccati all'inizio | Aetherion + Korvan |
| Criterio unlock | Achievement-style (gioca run per sbloccare altri PG) |
| Post-morte | GameOver con `R` = retry stesso PG, `Esc` = torna a select |
| Layout | Two-column (lista sinistra + dettaglio destra) |
| Tecnologia | Phaser scene + Graphics (no DOM) |
| Persistenza | localStorage |
| Polish | Cross-fade su cambio selezione, intro staggered, pulse su lock, flash su start |

**Principio guida (da memoria):** qualità del prodotto finale sopra velocità — UX polish, struttura pulita.

---

## 3. Architettura

### Scene flow

```
BootScene → CharacterSelectScene → GameScene → GameOverScene
                    ↑                              │
                    └── Esc da GameOver ───────────┘
                                                   │
                                          R da GameOver
                                                   ↓
                                              GameScene (stesso PG)
```

### File da creare

| File | Ruolo | LOC stimate |
|---|---|---|
| `src/scenes/CharacterSelectScene.js` | UI della select, interazione, polish | 300–380 |
| `src/config/CharacterRegistry.js` | Mappa centralizzata dei 7 PG | 120–150 |
| `src/systems/UnlockStore.js` | Persistenza unlock (classe statica) | 80–120 |
| `src/systems/UnlockRules.js` | Regole di unlock (array di rule pure) | 20–40 |
| `tests/UnlockStore.test.js` | Test della logica di store | 100–150 |

### File da modificare

| File | Modifica |
|---|---|
| `src/main.js` | Registra `CharacterSelectScene` nell'array `scene` |
| `src/scenes/BootScene.js` | `UnlockStore.load()`; target `CharacterSelectScene` invece di `GameScene` |
| `src/scenes/GameScene.js` | `init(data)` riceve `characterId`; spawn dal registry; tracking run meta; death → `GameOverScene` con meta |
| `src/scenes/GameOverScene.js` | `init(data)` riceve `characterId` + `runMeta`; chiama `UnlockStore.recordRun()`; mostra celebrazione unlock; due prompt `R`/`Esc` |

### Separazione delle responsabilità

- **`UnlockStore`** — puro (no Phaser, solo localStorage). Testabile.
- **`UnlockRules`** — puro (funzioni boolean). Tweakabile senza toccare lo store.
- **`CharacterRegistry`** — dati statici, no logica.
- **`CharacterSelectScene`** — orchestra. Legge da Registry + Store. Non scrive direttamente in localStorage.

---

## 4. CharacterRegistry

### Schema entry

```js
{
  id:                'aetherion',          // stable, lowercase
  name:              'AETHERION',          // display
  tagline:           'Melee AOE — alto rischio',
  playstyle:         "Burst di area con self-damage...",  // 2-3 frasi
  classRef:          Aetherion,            // import della classe
  abilities: {
    LMB: 'Paint Strike — melee veloce',
    RMB: 'Dissolve — cono, scioglie proiettili',
    Q:   'Burst — AOE 4s, self-damage',
    F:   'Spezza Metallo — su tile METAL',
  },
  unlockedByDefault: true,
  unlockHint:        null,                 // stringa quando locked, TBD
  accentColor:       '#c44',               // bordi/highlight
  cardImage:         'personaggi/giocabili/aetherion/card.jpg',  // optional, Polish phase
}
```

### File `src/config/CharacterRegistry.js`

```js
import { Aetherion } from '../characters/Aetherion.js'
import { Korvan }    from '../characters/Korvan.js'
import { Mira }      from '../characters/Mira.js'
import { Damian }    from '../characters/Damian.js'
import { Silas }     from '../characters/Silas.js'
import { Zeryth }    from '../characters/Zeryth.js'
import { Veyra }     from '../characters/Veyra.js'

export const CHARACTER_REGISTRY = [
  { id: 'aetherion', ..., unlockedByDefault: true  },
  { id: 'korvan',    ..., unlockedByDefault: true  },
  { id: 'mira',      ..., unlockedByDefault: false, unlockHint: '<TBD>' },
  { id: 'damian',    ..., unlockedByDefault: false, unlockHint: '<TBD>' },
  { id: 'silas',     ..., unlockedByDefault: false, unlockHint: '<TBD>' },
  { id: 'zeryth',    ..., unlockedByDefault: false, unlockHint: '<TBD>' },
  { id: 'veyra',     ..., unlockedByDefault: false, unlockHint: '<TBD>' },
]

export const getCharacter = (id) => CHARACTER_REGISTRY.find(c => c.id === id)
```

**Ordine in lista:** unlocked-by-default in cima, poi gli altri 5 nell'ordine di sblocco (definito quando i criteri sono confermati).

**Contenuto `playstyle`/`abilities`:** popolato in implementazione leggendo le schede in `personaggi/giocabili/<id>/scheda.html` (source-of-truth narrativa già esistente).

**`cardImage`:** campo opzionale nel registry. Prima versione del CharacterSelectScene è text-only. Le card si abilitano nella fase Polish quando arriva il todo "sprite reali" della memoria.

---

## 5. UnlockStore + UnlockRules

### UnlockStore — classe statica

Pattern allineato a `KeyBindings` (statico, `load()` in Boot, accesso globale via import).

**Schema localStorage** (chiave `fi:unlocks`):
```js
{
  version: 1,
  runs: {
    aetherion: { total: 5, floor2_reached: 3, completed: 1, time_ms: 1820000 },
    korvan:    { total: 2, floor2_reached: 0, completed: 0, time_ms: 320000 },
    // ... entry creata al primo recordRun per ogni PG
  },
  unlocked: ['aetherion', 'korvan']
}
```

**API:**

| Metodo | Descrizione |
|---|---|
| `UnlockStore.load()` | Legge localStorage; se vuoto/invalido carica default dal registry; chiamato in Boot |
| `UnlockStore.save()` | Scrive lo state corrente |
| `UnlockStore.isUnlocked(id)` | `→ boolean` |
| `UnlockStore.recordRun(id, meta)` | meta = `{ floorReached, completed, durationMs }`. Incrementa counters, valuta `UNLOCK_RULES`, salva. **Ritorna** array di id appena sbloccati (per celebrazione in GameOver) |
| `UnlockStore.unlock(id)` | Forza unlock (dev/debug, futuri trigger narrativi) |
| `UnlockStore.reset()` | Wipe → ricarica default |
| `UnlockStore.getRunStats(id)` | `→ { total, floor2_reached, completed, time_ms }` |
| `UnlockStore.getAllUnlocked()` | `→ ['aetherion','korvan',...]` |
| `UnlockStore._setStateForTest(state)` | Solo per i test |

**Bootstrap su prima esecuzione:** se localStorage vuoto, default = `unlocked` con tutti gli id con `unlockedByDefault: true` letti dal Registry. Aggiungere in futuro un PG con `unlockedByDefault: true` lo rende disponibile senza migrazione.

**Versioning:** `version: 1` nel JSON. Se `loaded.version !== VERSION`, fallback ai default senza crash. Migrazioni complesse non necessarie a v1.

### UnlockRules — file separato

```js
// src/systems/UnlockRules.js

// Ogni regola: { unlocks: 'id', requires: (runs) => boolean }
// `runs` è l'oggetto runs DOPO l'incremento del run appena finito.
// TBD — criterio del "run valido" non confermato. Esempi commentati:
//
// export const UNLOCK_RULES = [
//   { unlocks: 'mira',   requires: (runs) => (runs.aetherion?.total ?? 0) >= 3 },
//   { unlocks: 'silas',  requires: (runs) => (runs.korvan?.total ?? 0) >= 3 },
//   ...
// ]

export const UNLOCK_RULES = []
```

**Finché vuoto:** `recordRun()` registra le statistiche ma non sblocca nulla. Quando i criteri sono confermati, si popola questo file — niente refactor altrove.

### Test (`tests/UnlockStore.test.js`)

Mock di `localStorage` (jsdom o manuale: `global.localStorage = { getItem, setItem, removeItem }`).

Casi:
1. Fresh load (localStorage vuoto) → `unlocked` = ids con `unlockedByDefault: true` dal registry
2. `recordRun('aetherion', { floorReached: 2, completed: false, durationMs: 60000 })` → `runs.aetherion.total === 1`, `floor2_reached === 1`
3. `recordRun` con meta che soddisfa una mock rule (iniettata nel test) → `getAllUnlocked()` include il nuovo id, il return value contiene quell'id
4. `save()` + nuova istanza con `load()` → state identico (roundtrip)
5. localStorage con `version` diversa → carica defaults senza crash
6. `reset()` → torna a default
7. `recordRun` con id già unlocked + regola già sparata → non duplica nell'array `unlocked`

Le rules iniettabili nei test (es: parametro a un metodo `_evalRules(state, rules)`) per non dipendere dal contenuto di `UnlockRules.js`.

---

## 6. CharacterSelectScene

### Layout (canvas 1280×720)

```
y=0   ┌────────────────────────────────────────┐
      │  FRACTURED INHERITANCE                 │  Header (80px)
      │  ── SELECT CHARACTER ──                │
y=80  ├────────────────┬───────────────────────┤
      │                │                       │
      │  > AETHERION   │   AETHERION           │
      │    Melee AOE   │   Melee AOE risk      │  Body (560px)
      │                │   ─────────────────   │  Left: 440px (x=80→520)
      │    KORVAN      │                       │  Right: 660px (x=540→1200)
      │    Tank        │   [playstyle text]    │
      │                │                       │
      │  🔒 MIRA       │   Abilities:          │
      │    Alchemy     │     LMB  Paint Strike │
      │                │     RMB  Dissolve     │
      │  🔒 DAMIAN     │     Q    Burst        │
      │    ...         │     F    Spezza Metal │
      │                │                       │
y=640 ├────────────────┴───────────────────────┤
      │  ↑↓ navigate · ENTER start · TAB settings │  Footer (80px)
      └────────────────────────────────────────┘
y=720
```

### Lista (sinistra)

Per ogni entry del registry, una riga 400×60px con stride 70px (7 righe × 70 = 490px, sta nei 560px del body).

**Composizione riga:**
- Quadratino accent 4×40px in `entry.accentColor` (più visibile se selezionata)
- Nome (font 22px monospace, weight 700)
- Tagline (font 14px, color `0xaaaaaa`) sotto al nome
- Icona lucchetto (`🔒`) a destra se `!isUnlocked(id)`

**Stati:**
| Stato | Background | Nome | Tagline |
|---|---|---|---|
| default unlocked | `0x14141f` | `0xffffff` | `0xaaaaaa` |
| default locked | `0x14141f` | `0x666677` | `0x555566` |
| hover | `0x1c1c2a` | (invariato) | (invariato) |
| selected | `accentColor @ alpha 0.18` + bordo sx 4px in accentColor | (invariato) | (invariato) |

### Pannello dettaglio (destra)

Cross-fade 150ms su cambio selezione (alpha 1→0 vecchi text + destroy + nuovi 0→1).

**Se unlocked:**
- Nome grande (font 48px, color `accentColor`)
- Tagline (font 22px, `0xcccccc`)
- Linea divisoria (Graphics 1px, `0x333344`, larga ~500px)
- `playstyle` (font 16px, `0xaaaaaa`, word-wrap 600px, max 4 righe)
- Sezione "ABILITIES" (header 14px, `0x777777`)
- Tabella key→label (font 16px monospace, key in `accentColor`, label in `0xeeeeee`)
- Spazio riservato 200×280 per `cardImage` (in alto a destra del pannello) — vuoto in v1, popolato nella Polish phase

**Se locked:**
- Nome grande in `0x444455` (smorzato)
- Box centrato al posto di abilities:
  ```
  🔒 BLOCCATO
  ─────────────
  <entry.unlockHint>
  ```
  Bordo tratteggiato `0x555566`.

### Interazione

| Input | Effetto |
|---|---|
| ↑/↓ o W/S | Sposta selezione (wrap top/bottom) |
| ENTER o Space | Unlocked → start run. Locked → shake orizzontale 200ms detail panel + flash 🔒 |
| Click su riga | Seleziona quella riga |
| Double-click su riga unlocked | Start run |
| TAB | `scene.launch('SettingsScene')` |

Selezione iniziale: primo PG unlocked dalla cima (di norma Aetherion).

### Polish UX

- **Intro:** alpha 0 → 1 in 250ms (header, list, detail staggered 80ms)
- **Indicatore selezione:** un singolo `Rectangle` 4px che fa tween in 120ms (Cubic.easeOut) tra le righe quando cambia indice
- **Pulse lock icons:** scale tween 1.0 ↔ 1.1 in 1200ms loop yoyo (sottile)
- **Start feedback:** ENTER su unlocked → camera flash bianco 100ms + 200ms fade-to-black → `scene.start('GameScene', { characterId: entry.id })`
- **Locked feedback:** ENTER su locked → shake del pannello destro + flash 🔒

### Struttura classe

```js
export class CharacterSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'CharacterSelectScene' }) }

  create() {
    this._buildHeader()
    this._buildList()       // crea this.rows[], this.selectionIndicator
    this._buildDetail()     // crea this.detailContainer
    this._buildFooter()
    this._setSelection(this._firstUnlockedIndex())
    this._wireInput()
    this._playIntro()
  }

  _setSelection(index)      // anima indicatore + cross-fade detail
  _renderDetail(entry, locked)  // ricostruisce contenuto pannello
  _startRun()               // valida unlocked, transition → GameScene
  _firstUnlockedIndex()
  _onKeyDown(key)
}
```

Niente test unitari per la scena (la logica testabile è nello Store). La scena è view-layer.

---

## 7. Modifiche scene esistenti

### `src/main.js`

```js
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js'
// ...
scene: [BootScene, CharacterSelectScene, GameScene, GameOverScene, SettingsScene]
```

### `src/scenes/BootScene.js`

```js
import { UnlockStore } from '../systems/UnlockStore.js'

create() {
  KeyBindings.load()
  UnlockStore.load()                              // nuovo
  this.game.canvas.addEventListener('contextmenu', e => e.preventDefault())
  this.scene.start('CharacterSelectScene')        // cambiato
}
```

### `src/scenes/GameScene.js`

```js
import { getCharacter } from '../config/CharacterRegistry.js'

init(data) {
  this.characterId     = data?.characterId ?? 'aetherion'
  this.runStartTime    = Date.now()
  this.runHighestFloor = 1
}

create() {
  // ... esistente fino al calcolo di spawnX/spawnY ...
  const entry = getCharacter(this.characterId)
  this.player = new entry.classRef(this, spawnX, spawnY)
  // ... resto esistente ...
}
```

**Rimuovi imports diretti dei PG** (`Mira`, `Korvan`, `Veyra`, `Aetherion`) — ora vengono via registry.

**Death → GameOver handoff** (da implementare se non esiste già; verificare con grep di `GameOverScene` durante implementazione):

```js
update(time, delta) {
  // ... esistente ...
  if (this.player && !this.player.alive && !this._gameOverFired) {
    this._gameOverFired = true
    this.scene.start('GameOverScene', {
      score: 0,
      characterId: this.characterId,
      runMeta: {
        floorReached: this.runHighestFloor,
        completed:    false,
        durationMs:   Date.now() - this.runStartTime,
      }
    })
  }
}
```

### `src/scenes/GameOverScene.js`

```js
import { UnlockStore } from '../systems/UnlockStore.js'
import { getCharacter } from '../config/CharacterRegistry.js'

init(data) {
  this.finalScore   = data?.score ?? 0
  this.characterId  = data?.characterId ?? 'aetherion'
  this.runMeta      = data?.runMeta ?? { floorReached: 1, completed: false, durationMs: 0 }
  this.newlyUnlocked = UnlockStore.recordRun(this.characterId, this.runMeta)
}

create() {
  const { width, height } = this.cameras.main

  this.add.text(width/2, height/2 - 80, 'GAME OVER', { fontSize:'48px', color:'#fff', fontFamily:'monospace' }).setOrigin(0.5)
  this.add.text(width/2, height/2 - 20, `Punteggio: ${this.finalScore}`, { fontSize:'24px', color:'#aaa', fontFamily:'monospace' }).setOrigin(0.5)

  if (this.newlyUnlocked.length > 0) {
    const id = this.newlyUnlocked[0]
    const entry = getCharacter(id)
    const txt = this.add.text(width/2, height/2 + 30,
      `★ NUOVO PG SBLOCCATO: ${entry.name} ★`,
      { fontSize: '22px', color: entry.accentColor, fontFamily: 'monospace' }
    ).setOrigin(0.5)
    this.tweens.add({ targets: txt, scale: 1.08, duration: 600, yoyo: true, repeat: -1 })
  }

  this.add.text(width/2, height/2 + 90,  'R: riprova stesso PG',           { fontSize:'16px', color:'#666', fontFamily:'monospace' }).setOrigin(0.5)
  this.add.text(width/2, height/2 + 120, 'Esc: torna a selezione PG',       { fontSize:'16px', color:'#666', fontFamily:'monospace' }).setOrigin(0.5)

  this.input.keyboard.once('keydown-R',   () => this.scene.start('GameScene', { characterId: this.characterId }))
  this.input.keyboard.once('keydown-ESC', () => this.scene.start('CharacterSelectScene'))
}
```

---

## 8. Punti aperti (TBD)

Tutti pianificati come "popolare config, no refactor":

1. **Criterio "run valido"** — quale soglia conta per gli achievement? (Qualsiasi morte / piano-2 raggiunto / run completato / tempo di gioco). Impatto: contenuto di `UnlockRules.js`.
2. **Mapping unlock** — quale PG sblocca quale? Es: Aetherion → Mira, Korvan → Silas, ecc. Impatto: contenuto di `UnlockRules.js` + ordine in `CHARACTER_REGISTRY`.
3. **Run completato** — definizione (boss kill / escape / floor finale). Non c'è ancora boss nel gioco; per ora `completed: false` sempre.
4. **`unlockHint` testi** — frasi per il pannello "🔒 BLOCCATO" (es: "Sblocca con 3 run di Aetherion"). Definite quando i criteri sono confermati.

Questi punti **non bloccano** l'implementazione: la struttura li accoglie tutti senza refactor. Lo Store registra le statistiche fin da subito, così quando i criteri sono confermati gli sblocchi possono retroattivamente scattare al primo recordRun successivo.

---

## 9. Successo

La feature è completa quando:

- [ ] Avviando il gioco la prima volta vedo Aetherion e Korvan sbloccati, gli altri 5 col 🔒
- [ ] Posso navigare la lista con frecce/WASD/mouse e vedere i dettagli aggiornati a destra
- [ ] ENTER su PG unlocked avvia il run con quel PG (verificato via spawn corretto in GameScene)
- [ ] ENTER su PG locked dà feedback visivo (shake + flash) e non avvia
- [ ] Alla morte vado a GameOver; R rilancia stesso PG, Esc torna a select
- [ ] Lo state unlock persiste tra refresh del browser
- [ ] `tests/UnlockStore.test.js` passa
- [ ] Niente regressioni: tutti i test esistenti continuano a passare

Quando i criteri TBD sono confermati e popolati in `UnlockRules.js`:
- [ ] Giocare i run prescritti sblocca il PG atteso
- [ ] GameOver mostra la celebrazione "NUOVO PG SBLOCCATO" quando appropriato
