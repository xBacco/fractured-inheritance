# Fractured Inheritance — Piano 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Demo grigia giocabile — mappa BSP procedurale, Zeryth controllabile con WASD, pausa tattica, zoom camera, un nemico che ti insegue, sistema integrità corporea visivo.

**Architecture:** Phaser 3 con Arcade Physics. La mappa BSP viene generata a runtime e renderizzata con Graphics objects. I personaggi sono sprite con physics bodies. La pausa tattica congela il mondo fisico e sblocca il mouse. La logica pura (BSP, score, pausa) viene testata con Vitest.

**Tech Stack:** Phaser 3.80, Vite 5, Vitest 1, JavaScript ES modules

---

## Struttura file

```
fractured-inheritance/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js                        # Entry point, config Phaser
│   ├── config/
│   │   └── GameConfig.js              # Costanti globali (tile size, colori, dimensioni)
│   ├── map/
│   │   ├── BSPGenerator.js            # Generazione procedurale rooms + corridors
│   │   ├── TileTypes.js               # Costanti tile e effetti
│   │   └── FloorBuilder.js            # Costruisce grid 2D da output BSP
│   ├── scenes/
│   │   ├── BootScene.js               # Preload assets
│   │   ├── GameScene.js               # Scena principale
│   │   └── GameOverScene.js           # Punteggio finale
│   ├── characters/
│   │   ├── BaseCharacter.js           # WASD, camera, pausa tattica
│   │   └── Zeryth.js                  # Integrità corporea, attacchi
│   ├── enemies/
│   │   ├── BaseEnemy.js               # AI base (insegue giocatore)
│   │   └── HunterCommon.js            # Cacciatore comune
│   ├── systems/
│   │   ├── TacticalPause.js           # Slow-motion + sblocco mouse
│   │   └── ScoreSystem.js             # Calcolo punteggio
│   └── ui/
│       └── CharacterHUD.js            # HUD senza barra salute
├── tests/
│   ├── map/
│   │   ├── BSPGenerator.test.js
│   │   └── FloorBuilder.test.js
│   └── systems/
│       ├── TacticalPause.test.js
│       └── ScoreSystem.test.js
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

---

## Task 1: Project setup

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `src/main.js`
- Create: `src/config/GameConfig.js`

- [ ] **Step 1: Crea package.json**

```json
{
  "name": "fractured-inheritance",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "^3.80.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Installa dipendenze**

```bash
cd "C:\Users\TomasCoro\Desktop\PERSONAL\fractured-inheritance"
npm install
```

Output atteso: `node_modules/` creata, nessun errore.

- [ ] **Step 3: Crea index.html**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Fractured Inheritance</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
    </style>
  </head>
  <body>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Crea vite.config.js**

```js
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node'
  }
})
```

- [ ] **Step 5: Crea src/config/GameConfig.js**

```js
export const TILE_SIZE = 32
export const MAP_WIDTH = 80   // tiles
export const MAP_HEIGHT = 60  // tiles
export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720
export const PLAYER_SPEED = 200
export const MIN_ZOOM = 0.4
export const MAX_ZOOM = 2.0
export const TACTICAL_TIME_SCALE = 0.08

export const TILE_COLORS = {
  WALL: 0x0d0d1a,
  FLOOR: 0x1a1a2e,
  CORRIDOR: 0x161628,
  SHADOW: 0x05050f,
  LIGHT: 0x3a3520,
  TRAP: 0x1a1500,
  ALTAR: 0x1a0a2e,
  DESTRUCTIBLE: 0x2a1f14,
  BLOOD_POOL: 0x3a0000,
  METAL: 0x1a2530,
}
```

- [ ] **Step 6: Crea src/main.js (placeholder — scena reale nel Task 4)**

```js
import Phaser from 'phaser'
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
  scene: []
}

new Phaser.Game(config)
```

- [ ] **Step 7: Verifica dev server**

```bash
npm run dev
```

Output atteso: URL locale (es. `http://localhost:5173`). Browser mostra schermo nero — corretto, nessuna scena ancora.

- [ ] **Step 8: Commit**

```bash
git init
git add package.json index.html vite.config.js src/main.js src/config/GameConfig.js
git commit -m "feat: project setup with Phaser 3, Vite, Vitest"
```

---

## Task 2: BSP Map Generator

**Files:**
- Create: `src/map/BSPGenerator.js`
- Create: `tests/map/BSPGenerator.test.js`

- [ ] **Step 1: Scrivi il test prima dell'implementazione**

Crea `tests/map/BSPGenerator.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { BSPGenerator } from '../../src/map/BSPGenerator.js'

describe('BSPGenerator', () => {
  it('genera almeno una stanza', () => {
    const gen = new BSPGenerator(80, 60)
    const { rooms } = gen.generate()
    expect(rooms.length).toBeGreaterThan(0)
  })

  it('tutte le stanze hanno dimensioni positive', () => {
    const gen = new BSPGenerator(80, 60)
    const { rooms } = gen.generate()
    for (const room of rooms) {
      expect(room.width).toBeGreaterThan(0)
      expect(room.height).toBeGreaterThan(0)
    }
  })

  it('i corridoi collegano centri di stanze', () => {
    const gen = new BSPGenerator(80, 60)
    const { corridors } = gen.generate()
    expect(corridors.length).toBeGreaterThan(0)
    for (const c of corridors) {
      expect(c.from).toHaveProperty('x')
      expect(c.from).toHaveProperty('y')
      expect(c.to).toHaveProperty('x')
      expect(c.to).toHaveProperty('y')
    }
  })

  it('le stanze restano nei limiti della mappa', () => {
    const gen = new BSPGenerator(80, 60)
    const { rooms } = gen.generate()
    for (const room of rooms) {
      expect(room.x).toBeGreaterThanOrEqual(0)
      expect(room.y).toBeGreaterThanOrEqual(0)
      expect(room.x + room.width).toBeLessThanOrEqual(80)
      expect(room.y + room.height).toBeLessThanOrEqual(60)
    }
  })
})
```

- [ ] **Step 2: Esegui i test — devono fallire**

```bash
npm test
```

Output atteso: FAIL — `Cannot find module '../../src/map/BSPGenerator.js'`

- [ ] **Step 3: Implementa BSPGenerator**

Crea `src/map/BSPGenerator.js`:

```js
class BSPNode {
  constructor(x, y, width, height) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.left = null
    this.right = null
    this.room = null
  }
}

export class BSPGenerator {
  constructor(mapWidth, mapHeight, minRoomSize = 8, maxDepth = 5) {
    this.mapWidth = mapWidth
    this.mapHeight = mapHeight
    this.minRoomSize = minRoomSize
    this.maxDepth = maxDepth
  }

  generate() {
    const root = new BSPNode(0, 0, this.mapWidth, this.mapHeight)
    this._split(root, 0)
    const rooms = []
    this._collectRooms(root, rooms)
    const corridors = []
    this._buildCorridors(root, corridors)
    return { rooms, corridors }
  }

  _split(node, depth) {
    if (depth >= this.maxDepth) return
    const splitHorizontal = node.width < node.height
    const minSplit = this.minRoomSize * 2 + 2
    if (splitHorizontal && node.height < minSplit) return
    if (!splitHorizontal && node.width < minSplit) return

    if (splitHorizontal) {
      const split = this.minRoomSize + Math.floor(Math.random() * (node.height - minSplit + 1))
      node.left = new BSPNode(node.x, node.y, node.width, split)
      node.right = new BSPNode(node.x, node.y + split, node.width, node.height - split)
    } else {
      const split = this.minRoomSize + Math.floor(Math.random() * (node.width - minSplit + 1))
      node.left = new BSPNode(node.x, node.y, split, node.height)
      node.right = new BSPNode(node.x + split, node.y, node.width - split, node.height)
    }

    this._split(node.left, depth + 1)
    this._split(node.right, depth + 1)
  }

  _collectRooms(node, rooms) {
    if (!node.left && !node.right) {
      const pad = 2
      node.room = {
        x: node.x + pad,
        y: node.y + pad,
        width: node.width - pad * 2,
        height: node.height - pad * 2
      }
      rooms.push(node.room)
      return
    }
    if (node.left) this._collectRooms(node.left, rooms)
    if (node.right) this._collectRooms(node.right, rooms)
  }

  _getCenter(node) {
    if (node.room) {
      return {
        x: Math.floor(node.room.x + node.room.width / 2),
        y: Math.floor(node.room.y + node.room.height / 2)
      }
    }
    const l = node.left ? this._getCenter(node.left) : null
    const r = node.right ? this._getCenter(node.right) : null
    return l || r
  }

  _buildCorridors(node, corridors) {
    if (!node.left || !node.right) return
    const a = this._getCenter(node.left)
    const b = this._getCenter(node.right)
    if (a && b) corridors.push({ from: a, to: b })
    this._buildCorridors(node.left, corridors)
    this._buildCorridors(node.right, corridors)
  }
}
```

- [ ] **Step 4: Esegui i test — devono passare**

```bash
npm test
```

Output atteso: PASS — 4 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/map/BSPGenerator.js tests/map/BSPGenerator.test.js
git commit -m "feat: BSP map generator with tests"
```

---

## Task 3: TileTypes e FloorBuilder

**Files:**
- Create: `src/map/TileTypes.js`
- Create: `src/map/FloorBuilder.js`
- Create: `tests/map/FloorBuilder.test.js`

- [ ] **Step 1: Scrivi i test**

Crea `tests/map/FloorBuilder.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { FloorBuilder } from '../../src/map/FloorBuilder.js'
import { TILE } from '../../src/map/TileTypes.js'

describe('FloorBuilder', () => {
  const rooms = [{ x: 2, y: 2, width: 10, height: 8 }]
  const corridors = [{ from: { x: 7, y: 6 }, to: { x: 30, y: 6 } }]

  it('costruisce una grid delle dimensioni corrette', () => {
    const builder = new FloorBuilder(40, 30)
    const grid = builder.build(rooms, corridors)
    expect(grid.length).toBe(30)
    expect(grid[0].length).toBe(40)
  })

  it('i tile delle stanze sono FLOOR', () => {
    const builder = new FloorBuilder(40, 30)
    const grid = builder.build(rooms, [])
    expect(grid[2][2]).toBe(TILE.FLOOR)
    expect(grid[5][7]).toBe(TILE.FLOOR)
  })

  it('i tile fuori dalle stanze sono WALL', () => {
    const builder = new FloorBuilder(40, 30)
    const grid = builder.build(rooms, [])
    expect(grid[0][0]).toBe(TILE.WALL)
  })

  it('i corridoi creano tile percorribili', () => {
    const builder = new FloorBuilder(40, 30)
    const grid = builder.build([], corridors)
    expect(grid[6][7]).toBe(TILE.CORRIDOR)
  })
})
```

- [ ] **Step 2: Esegui i test — devono fallire**

```bash
npm test
```

Output atteso: FAIL — moduli non trovati.

- [ ] **Step 3: Crea TileTypes.js**

```js
export const TILE = {
  WALL: 0,
  FLOOR: 1,
  CORRIDOR: 2,
  SHADOW: 3,
  LIGHT: 4,
  TRAP: 5,
  ALTAR: 6,
  DESTRUCTIBLE: 7,
  BLOOD_POOL: 8,
  METAL: 9,
}

export const WALKABLE = new Set([
  TILE.FLOOR, TILE.CORRIDOR, TILE.SHADOW,
  TILE.LIGHT, TILE.TRAP, TILE.ALTAR,
  TILE.BLOOD_POOL, TILE.METAL,
])

export const TILE_EFFECTS = {
  [TILE.SHADOW]: { zerythRegenMult: 2.5, damageReduction: 0.25, enemyVisibility: 0.5 },
  [TILE.LIGHT]:  { hunterDamageMult: 1.3, hunterSpeedMult: 1.2, regenBlocked: true },
  [TILE.BLOOD_POOL]: { zerythRegenMult: 4.0 },
  [TILE.TRAP]:   { damage: 15 },
}
```

- [ ] **Step 4: Crea FloorBuilder.js**

```js
import { TILE } from './TileTypes.js'

export class FloorBuilder {
  constructor(mapWidth, mapHeight) {
    this.mapWidth = mapWidth
    this.mapHeight = mapHeight
  }

  build(rooms, corridors) {
    const grid = Array.from({ length: this.mapHeight }, () =>
      Array(this.mapWidth).fill(TILE.WALL)
    )
    for (const room of rooms) this._carveRoom(grid, room)
    for (const c of corridors) this._carveCorridor(grid, c.from, c.to)
    this._placeFeatures(grid, rooms)
    return grid
  }

  _carveRoom(grid, room) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (this._inBounds(x, y)) grid[y][x] = TILE.FLOOR
      }
    }
  }

  _carveCorridor(grid, from, to) {
    let x = from.x
    let y = from.y
    while (x !== to.x) {
      if (this._inBounds(x, y)) grid[y][x] = TILE.CORRIDOR
      x += x < to.x ? 1 : -1
    }
    while (y !== to.y) {
      if (this._inBounds(x, y)) grid[y][x] = TILE.CORRIDOR
      y += y < to.y ? 1 : -1
    }
    if (this._inBounds(x, y)) grid[y][x] = TILE.CORRIDOR
  }

  _placeFeatures(grid, rooms) {
    if (rooms.length > 2) {
      const mid = rooms[Math.floor(rooms.length / 2)]
      const cx = Math.floor(mid.x + mid.width / 2)
      const cy = Math.floor(mid.y + mid.height / 2)
      if (this._inBounds(cx, cy)) grid[cy][cx] = TILE.ALTAR
    }
    for (const room of rooms) {
      if (Math.random() > 0.4) {
        if (this._inBounds(room.x, room.y)) grid[room.y][room.x] = TILE.SHADOW
      }
      if (Math.random() > 0.7) {
        const lx = room.x + Math.floor(room.width / 2)
        const ly = room.y + Math.floor(room.height / 2)
        if (this._inBounds(lx, ly)) grid[ly][lx] = TILE.LIGHT
      }
    }
  }

  _inBounds(x, y) {
    return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight
  }
}
```

- [ ] **Step 5: Esegui i test — devono passare**

```bash
npm test
```

Output atteso: PASS — tutti i test verdi.

- [ ] **Step 6: Commit**

```bash
git add src/map/TileTypes.js src/map/FloorBuilder.js tests/map/FloorBuilder.test.js
git commit -m "feat: tile types and floor builder with tests"
```

---

## Task 4: Scene skeleton e rendering mappa

**Files:**
- Create: `src/scenes/BootScene.js`
- Create: `src/scenes/GameScene.js`
- Create: `src/scenes/GameOverScene.js`
- Modify: `src/main.js`

- [ ] **Step 1: Crea BootScene.js**

```js
export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }) }

  preload() {
    // nessun asset esterno — usiamo Graphics
  }

  create() {
    this.scene.start('GameScene')
  }
}
```

- [ ] **Step 2: Crea GameScene.js (rendering mappa)**

```js
import { BSPGenerator } from '../map/BSPGenerator.js'
import { FloorBuilder } from '../map/FloorBuilder.js'
import { TILE, WALKABLE } from '../map/TileTypes.js'
import { TILE_COLORS, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../config/GameConfig.js'

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }) }

  create() {
    this.grid = this._generateMap()
    this._renderMap()
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
  }

  _generateMap() {
    const gen = new BSPGenerator(MAP_WIDTH, MAP_HEIGHT)
    const { rooms, corridors } = gen.generate()
    this.rooms = rooms
    const builder = new FloorBuilder(MAP_WIDTH, MAP_HEIGHT)
    return builder.build(rooms, corridors)
  }

  _renderMap() {
    const gfx = this.add.graphics()
    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        const tile = this.grid[y][x]
        const color = TILE_COLORS[Object.keys(TILE).find(k => TILE[k] === tile)] ?? TILE_COLORS.WALL
        gfx.fillStyle(color, 1)
        gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      }
    }
  }

  isWalkable(tileX, tileY) {
    if (tileY < 0 || tileY >= this.grid.length) return false
    if (tileX < 0 || tileX >= this.grid[0].length) return false
    return WALKABLE.has(this.grid[tileY][tileX])
  }
}
```

- [ ] **Step 3: Crea GameOverScene.js**

```js
export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }) }

  init(data) {
    this.finalScore = data.score ?? 0
  }

  create() {
    const { width, height } = this.cameras.main
    this.add.text(width / 2, height / 2 - 40, 'GAME OVER', {
      fontSize: '48px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 20, `Punteggio: ${this.finalScore}`, {
      fontSize: '24px', color: '#aaaaaa', fontFamily: 'monospace'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 70, 'Premi R per riprovare', {
      fontSize: '16px', color: '#666666', fontFamily: 'monospace'
    }).setOrigin(0.5)

    this.input.keyboard.once('keydown-R', () => {
      this.scene.start('GameScene')
    })
  }
}
```

- [ ] **Step 4: Aggiorna main.js con le scene**

```js
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { GameScene } from './scenes/GameScene.js'
import { GameOverScene } from './scenes/GameOverScene.js'
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
  scene: [BootScene, GameScene, GameOverScene]
}

new Phaser.Game(config)
```

- [ ] **Step 5: Verifica nel browser**

```bash
npm run dev
```

Apri `http://localhost:5173`. Atteso: mappa tile colorata visibile — stanze scure con blu/viola, muri neri, corridoi, zone speciali (altar viola scuro, shadow quasi nero, light ambra).

- [ ] **Step 6: Fix TILE_COLORS in GameConfig.js — chiavi devono matchare nomi TILE**

Il rendering usa `Object.keys(TILE).find(k => TILE[k] === tile)` per trovare il nome. Verifica che `TILE_COLORS` usi le stesse chiavi di `TILE`. Aggiorna `GameConfig.js`:

```js
export const TILE_COLORS = {
  WALL:        0x0d0d1a,
  FLOOR:       0x1a1a2e,
  CORRIDOR:    0x161628,
  SHADOW:      0x05050f,
  LIGHT:       0x3a3520,
  TRAP:        0x1a1500,
  ALTAR:       0x1a0a2e,
  DESTRUCTIBLE:0x2a1f14,
  BLOOD_POOL:  0x3a0000,
  METAL:       0x1a2530,
}
```

- [ ] **Step 7: Commit**

```bash
git add src/scenes/BootScene.js src/scenes/GameScene.js src/scenes/GameOverScene.js src/main.js
git commit -m "feat: scene setup and BSP map rendering"
```

---

## Task 5: BaseCharacter — movimento WASD e camera

**Files:**
- Create: `src/characters/BaseCharacter.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Crea BaseCharacter.js**

```js
import { TILE_SIZE, PLAYER_SPEED, MIN_ZOOM, MAX_ZOOM } from '../config/GameConfig.js'

export class BaseCharacter extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, width, height, color) {
    super(scene, x, y, width, height, color)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setCollideWorldBounds(false)

    this.wasd = {
      up:    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }

    this._setupCamera(scene)
    this._setupZoom(scene)
    this.speed = PLAYER_SPEED
    this.facingX = 1
    this.facingY = 0
  }

  _setupCamera(scene) {
    scene.cameras.main.startFollow(this, true, 0.1, 0.1)
  }

  _setupZoom(scene) {
    scene.input.on('wheel', (_pointer, _objs, _dx, deltaY) => {
      const cam = scene.cameras.main
      cam.zoom = Phaser.Math.Clamp(cam.zoom - deltaY * 0.001, MIN_ZOOM, MAX_ZOOM)
    })
  }

  handleMovement(scene) {
    const body = this.body
    let vx = 0
    let vy = 0

    if (this.wasd.left.isDown)  vx -= 1
    if (this.wasd.right.isDown) vx += 1
    if (this.wasd.up.isDown)    vy -= 1
    if (this.wasd.down.isDown)  vy += 1

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy)
      vx = (vx / len) * this.speed
      vy = (vy / len) * this.speed
      this.facingX = vx > 0 ? 1 : vx < 0 ? -1 : this.facingX
      this.facingY = vy > 0 ? 1 : vy < 0 ? -1 : this.facingY
    }

    // Wall collision via tile grid
    const nextX = this.x + vx * (1 / 60)
    const nextY = this.y + vy * (1 / 60)
    const tileX = Math.floor(nextX / TILE_SIZE)
    const tileY = Math.floor(nextY / TILE_SIZE)

    if (scene.isWalkable(tileX, tileY)) {
      body.setVelocity(vx, vy)
    } else {
      const tileXOnly = Math.floor(nextX / TILE_SIZE)
      const tileYCurr = Math.floor(this.y / TILE_SIZE)
      const tileCurrX = Math.floor(this.x / TILE_SIZE)
      const tileYOnly = Math.floor(nextY / TILE_SIZE)

      body.setVelocityX(scene.isWalkable(tileXOnly, tileYCurr) ? vx : 0)
      body.setVelocityY(scene.isWalkable(tileCurrX, tileYOnly) ? vy : 0)
    }
  }

  update(scene) {
    this.handleMovement(scene)
  }
}
```

- [ ] **Step 2: Aggiungi il giocatore a GameScene**

Modifica `src/scenes/GameScene.js`, aggiungi alla fine di `create()`:

```js
// Trova la prima stanza disponibile come spawn
const spawn = this.rooms[0]
const spawnX = (spawn.x + Math.floor(spawn.width / 2)) * TILE_SIZE
const spawnY = (spawn.y + Math.floor(spawn.height / 2)) * TILE_SIZE

this.player = new BaseCharacter(this, spawnX, spawnY, 20, 20, 0x888888)
```

Aggiungi l'import in cima a GameScene.js:
```js
import { BaseCharacter } from '../characters/BaseCharacter.js'
```

Aggiungi il metodo `update()` a GameScene:
```js
update() {
  if (this.player) this.player.update(this)
}
```

- [ ] **Step 3: Verifica nel browser**

Apri `http://localhost:5173`. Atteso: quadrato grigio al centro della prima stanza, WASD lo muove, la camera lo segue, la rotella del mouse fa zoom in/out. Il personaggio non attraversa le mura.

- [ ] **Step 4: Commit**

```bash
git add src/characters/BaseCharacter.js src/scenes/GameScene.js
git commit -m "feat: BaseCharacter with WASD movement, camera follow, zoom"
```

---

## Task 6: Tactical Pause System

**Files:**
- Create: `src/systems/TacticalPause.js`
- Create: `tests/systems/TacticalPause.test.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Scrivi i test**

Crea `tests/systems/TacticalPause.test.js`:

```js
import { describe, it, expect, vi } from 'vitest'
import { TacticalPause } from '../../src/systems/TacticalPause.js'

const mockScene = () => ({
  physics: { world: { timeScale: 1 } },
  input: { activePointer: { x: 0, y: 0 } },
  cameras: { main: { zoom: 1, scrollX: 0, scrollY: 0 } }
})

describe('TacticalPause', () => {
  it('inizia inattiva', () => {
    const tp = new TacticalPause(mockScene())
    expect(tp.active).toBe(false)
  })

  it('activate imposta timeScale a TACTICAL_TIME_SCALE', () => {
    const scene = mockScene()
    const tp = new TacticalPause(scene)
    tp.activate()
    expect(tp.active).toBe(true)
    expect(scene.physics.world.timeScale).toBe(0.08)
  })

  it('deactivate ripristina timeScale a 1', () => {
    const scene = mockScene()
    const tp = new TacticalPause(scene)
    tp.activate()
    tp.deactivate()
    expect(tp.active).toBe(false)
    expect(scene.physics.world.timeScale).toBe(1)
  })

  it('tiene traccia del tempo totale in pausa tattica', () => {
    const scene = mockScene()
    const tp = new TacticalPause(scene)
    tp.activate()
    tp.update(500) // 500ms
    tp.update(300) // altri 300ms
    tp.deactivate()
    expect(tp.totalTacticalMs).toBe(800)
  })

  it('non accumula tempo quando inattiva', () => {
    const scene = mockScene()
    const tp = new TacticalPause(scene)
    tp.update(1000)
    expect(tp.totalTacticalMs).toBe(0)
  })
})
```

- [ ] **Step 2: Esegui i test — devono fallire**

```bash
npm test
```

Output atteso: FAIL — modulo non trovato.

- [ ] **Step 3: Implementa TacticalPause.js**

```js
import { TACTICAL_TIME_SCALE } from '../config/GameConfig.js'

export class TacticalPause {
  constructor(scene) {
    this.scene = scene
    this.active = false
    this.totalTacticalMs = 0
  }

  activate() {
    if (this.active) return
    this.active = true
    this.scene.physics.world.timeScale = TACTICAL_TIME_SCALE
  }

  deactivate() {
    if (!this.active) return
    this.active = false
    this.scene.physics.world.timeScale = 1
  }

  toggle() {
    this.active ? this.deactivate() : this.activate()
  }

  update(deltaMs) {
    if (this.active) this.totalTacticalMs += deltaMs
  }

  getTacticalSeconds() {
    return this.totalTacticalMs / 1000
  }
}
```

- [ ] **Step 4: Esegui i test — devono passare**

```bash
npm test
```

Output atteso: PASS — tutti i test verdi.

- [ ] **Step 5: Integra TacticalPause in GameScene**

Aggiungi in `GameScene.create()`:

```js
import { TacticalPause } from '../systems/TacticalPause.js'

// in create(), dopo il player:
this.tacticalPause = new TacticalPause(this)
this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
this.spaceKey.on('down', () => this.tacticalPause.toggle())

// Overlay visivo pausa tattica
this.pauseOverlay = this.add.rectangle(0, 0, 1, 1, 0x0000ff, 0.08)
  .setScrollFactor(0)
  .setVisible(false)
  .setDepth(10)
```

Aggiorna `GameScene.update(time, delta)`:

```js
update(time, delta) {
  if (this.player) this.player.update(this)
  if (this.tacticalPause) {
    this.tacticalPause.update(delta)
    this.pauseOverlay.setVisible(this.tacticalPause.active)

    // Ridimensiona overlay alla dimensione della camera
    const cam = this.cameras.main
    this.pauseOverlay
      .setPosition(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2)
      .setSize(cam.width, cam.height)
  }
}
```

- [ ] **Step 6: Verifica nel browser**

Premi Spazio. Atteso: leggero overlay blu, il personaggio rallenta drasticamente. Spazio di nuovo: tutto torna normale.

- [ ] **Step 7: Commit**

```bash
git add src/systems/TacticalPause.js tests/systems/TacticalPause.test.js src/scenes/GameScene.js
git commit -m "feat: tactical pause with time scale and visual overlay"
```

---

## Task 7: Zeryth — Integrità Corporea

**Files:**
- Create: `src/characters/Zeryth.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Crea Zeryth.js**

```js
import { BaseCharacter } from './BaseCharacter.js'
import { TILE_SIZE, PLAYER_SPEED } from '../config/GameConfig.js'
import { TILE, TILE_EFFECTS, WALKABLE } from '../map/TileTypes.js'

const MAX_INTEGRITY = 100
const REGEN_RATE = 4          // per secondo base
const REGEN_FAST = 12         // in ombra / fermo
const INTEGRITY_COLORS = [0x8888aa, 0x6666aa, 0xff4444, 0xff0000]

export class Zeryth extends BaseCharacter {
  constructor(scene, x, y) {
    super(scene, x, y, 20, 28, 0x8888aa)
    this.integrity = MAX_INTEGRITY
    this.maxIntegrity = MAX_INTEGRITY
    this.regenRate = REGEN_RATE
    this.alive = true
    this._prevX = x
    this._prevY = y
  }

  update(scene, delta) {
    super.update(scene)
    if (!this.alive) return
    this._handleRegen(scene, delta)
    this._updateVisual()
    this._checkDeath(scene)
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.integrity = Math.max(0, this.integrity - amount)
  }

  _handleRegen(scene, delta) {
    const tileX = Math.floor(this.x / TILE_SIZE)
    const tileY = Math.floor(this.y / TILE_SIZE)
    const tile = scene.grid?.[tileY]?.[tileX] ?? TILE.FLOOR
    const effects = TILE_EFFECTS[tile]

    const isMoving = Math.abs(this.x - this._prevX) > 0.1 || Math.abs(this.y - this._prevY) > 0.1
    this._prevX = this.x
    this._prevY = this.y

    if (effects?.regenBlocked) return

    let rate = isMoving ? this.regenRate : REGEN_FAST
    if (effects?.zerythRegenMult) rate *= effects.zerythRegenMult

    this.integrity = Math.min(this.maxIntegrity, this.integrity + rate * (delta / 1000))
  }

  _updateVisual() {
    const pct = this.integrity / this.maxIntegrity
    if (pct > 0.6)      this.fillColor = INTEGRITY_COLORS[0]
    else if (pct > 0.35) this.fillColor = INTEGRITY_COLORS[1]
    else if (pct > 0.15) this.fillColor = INTEGRITY_COLORS[2]
    else                 this.fillColor = INTEGRITY_COLORS[3]

    // Rallenta sotto il 20% di integrità
    this.speed = pct < 0.2 ? PLAYER_SPEED * 0.5 : PLAYER_SPEED
  }

  _checkDeath(scene) {
    if (this.integrity <= 0) {
      this.alive = false
      scene.scene.start('GameOverScene', { score: scene.scoreSystem?.getScore() ?? 0 })
    }
  }
}
```

- [ ] **Step 2: Sostituisci BaseCharacter con Zeryth in GameScene**

Modifica `GameScene.create()`:

```js
import { Zeryth } from '../characters/Zeryth.js'

// sostituisci: this.player = new BaseCharacter(...)
this.player = new Zeryth(this, spawnX, spawnY)
```

Aggiorna `GameScene.update(time, delta)`:

```js
update(time, delta) {
  if (this.player) this.player.update(this, delta)
  // ... resto invariato
}
```

- [ ] **Step 3: Verifica nel browser**

Il personaggio è grigio-blu. Stando fermo si rigenera visibilmente (colore più chiaro). Nelle zone shadow il colore rimane stabile. Non c'è ancora modo di prendere danno — lo aggiungeremo con i nemici.

- [ ] **Step 4: Commit**

```bash
git add src/characters/Zeryth.js src/scenes/GameScene.js
git commit -m "feat: Zeryth with integrity system, regen, visual feedback"
```

---

## Task 8: Zeryth — Attacchi

**Files:**
- Modify: `src/characters/Zeryth.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Aggiungi attacchi a Zeryth.js**

Aggiungi alla fine del costruttore di Zeryth:

```js
this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J)
this.bloodKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K)
this.swordHeld = false
this.swordTimer = 0
this.swordActive = false
this.swordGfx = null
this.projectiles = scene.physics.add.group()
this.attackCooldown = 0
```

Aggiungi in `Zeryth.update()` dopo `super.update(scene)`:

```js
this._handleAttacks(scene, delta)
```

Aggiungi il metodo alla classe:

```js
_handleAttacks(scene, delta) {
  if (this.attackCooldown > 0) this.attackCooldown -= delta

  // J — Strike fisico
  if (this.attackKey.isDown && this.attackCooldown <= 0) {
    this._strikeAttack(scene)
    this.attackCooldown = 300
  }

  // K hold — Spada di sangue, release — proiettile sangue
  if (this.bloodKey.isDown) {
    if (!this.swordHeld) {
      this.swordHeld = true
      this.swordTimer = 0
    }
    this.swordTimer += delta
    this._showSword(scene)
  } else if (this.swordHeld) {
    this.swordHeld = false
    this._hideSword()
    if (this.swordTimer > 400) {
      this._swordSlash(scene)
    } else {
      this._bloodProjectile(scene)
    }
  }
}

_strikeAttack(scene) {
  // Damage hitbox nella direzione corrente
  const reach = 30
  const hx = this.x + this.facingX * reach
  const hy = this.y + this.facingY * reach
  if (scene.enemies) {
    scene.enemies.getChildren().forEach(enemy => {
      const dist = Phaser.Math.Distance.Between(hx, hy, enemy.x, enemy.y)
      if (dist < 25) enemy.takeDamage(20)
    })
  }
}

_bloodProjectile(scene) {
  const cost = 8
  if (this.integrity - cost < 5) return
  this.takeDamage(cost)

  const proj = scene.add.rectangle(this.x, this.y, 6, 6, 0xcc0000)
  scene.physics.add.existing(proj)
  proj.body.setVelocity(this.facingX * 400, this.facingY * 400)
  proj.damage = 25
  proj.piercing = true
  this.projectiles.add(proj)

  // Distruggi dopo 1.5s
  scene.time.delayedCall(1500, () => proj.destroy())
}

_showSword(scene) {
  if (!this.swordGfx) {
    this.swordGfx = scene.add.rectangle(
      this.x + this.facingX * 20,
      this.y + this.facingY * 20,
      8, 28, 0xaa0000
    ).setDepth(5)
  }
  const cost = 0.05
  this.integrity = Math.max(5, this.integrity - cost)
  this.swordGfx.setPosition(
    this.x + this.facingX * 20,
    this.y + this.facingY * 20
  )
}

_hideSword() {
  if (this.swordGfx) { this.swordGfx.destroy(); this.swordGfx = null }
}

_swordSlash(scene) {
  // Area attack in arco davanti
  if (scene.enemies) {
    scene.enemies.getChildren().forEach(enemy => {
      const dx = enemy.x - this.x
      const dy = enemy.y - this.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 50) enemy.takeDamage(40)
    })
  }
  // Flash rosso
  const flash = scene.add.rectangle(this.x, this.y, 60, 60, 0xff0000, 0.3).setDepth(5)
  scene.time.delayedCall(150, () => flash.destroy())
}
```

- [ ] **Step 2: Verifica nel browser**

- Premi J: nessun nemico ancora, ma nessun errore
- Tieni premuto K: appare un rettangolo rosso (spada)
- Rilascia K dopo meno di 0.4s: parte un proiettile rosso
- Rilascia K dopo più di 0.4s: flash rosso intorno (slash)

- [ ] **Step 3: Commit**

```bash
git add src/characters/Zeryth.js
git commit -m "feat: Zeryth attacks - strike, blood projectile, blood sword slash"
```

---

## Task 9: HunterCommon — primo nemico

**Files:**
- Create: `src/enemies/BaseEnemy.js`
- Create: `src/enemies/HunterCommon.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Crea BaseEnemy.js**

```js
import { TILE_SIZE } from '../config/GameConfig.js'

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
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.hp -= amount
    // Flash bianco
    const prev = this.fillColor
    this.fillColor = 0xffffff
    this.scene.time.delayedCall(80, () => { if (this.alive) this.fillColor = prev })
    if (this.hp <= 0) this._die()
  }

  _die() {
    this.alive = false
    // Lascia pozza di sangue sulla grid
    this.scene._placeBloodPool(this.x, this.y)
    this.destroy()
  }

  chasePlayer(player, delta) {
    if (!this.alive || !player?.alive) return
    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 5) return
    this.body.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed)
  }

  attackPlayer(player, delta) {
    if (!this.alive || !player?.alive) return
    this.attackCooldown -= delta
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    if (dist < 25 && this.attackCooldown <= 0) {
      player.takeDamage(this.damage)
      this.attackCooldown = 1000
    }
  }

  update(player, delta) {
    this.chasePlayer(player, delta)
    this.attackPlayer(player, delta)
  }
}
```

- [ ] **Step 2: Crea HunterCommon.js**

```js
import { BaseEnemy } from './BaseEnemy.js'

export class HunterCommon extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 18, 18, 0xaa6633, 60, 10, 90)
  }
}
```

- [ ] **Step 3: Aggiungi spawning nemici in GameScene**

Aggiungi imports a GameScene.js:
```js
import { HunterCommon } from '../enemies/HunterCommon.js'
import { TILE } from '../map/TileTypes.js'
```

Aggiungi in `GameScene.create()` dopo il player:

```js
this.enemies = this.add.group()
this._spawnEnemies()

// Proiettili di Zeryth contro nemici
this.physics.add.overlap(
  this.player.projectiles,
  this.enemies,
  (proj, enemy) => { enemy.takeDamage(proj.damage); }
)
```

Aggiungi i metodi a GameScene:

```js
_spawnEnemies() {
  // Spawna un nemico in ogni stanza tranne la prima (spawn del player)
  for (let i = 1; i < this.rooms.length; i++) {
    const room = this.rooms[i]
    const ex = (room.x + Math.floor(room.width / 2)) * TILE_SIZE
    const ey = (room.y + Math.floor(room.height / 2)) * TILE_SIZE
    const enemy = new HunterCommon(this, ex, ey)
    this.enemies.add(enemy)
  }
}

_placeBloodPool(worldX, worldY) {
  const tx = Math.floor(worldX / TILE_SIZE)
  const ty = Math.floor(worldY / TILE_SIZE)
  if (this.grid?.[ty]?.[tx] !== undefined) {
    this.grid[ty][tx] = TILE.BLOOD_POOL
    // Ridisegna quel tile
    const gfx = this.add.graphics()
    gfx.fillStyle(TILE_COLORS.BLOOD_POOL, 1)
    gfx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE)
  }
}
```

Aggiorna `GameScene.update()`:

```js
update(time, delta) {
  if (this.player) this.player.update(this, delta)
  if (this.enemies) {
    this.enemies.getChildren().forEach(e => e.update(this.player, delta))
  }
  if (this.tacticalPause) {
    this.tacticalPause.update(delta)
    this.pauseOverlay.setVisible(this.tacticalPause.active)
    const cam = this.cameras.main
    this.pauseOverlay
      .setPosition(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2)
      .setSize(cam.width, cam.height)
  }
}
```

- [ ] **Step 4: Aggiungi import TILE_COLORS in GameScene**

```js
import { TILE_COLORS, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../config/GameConfig.js'
```

- [ ] **Step 5: Verifica nel browser**

Ogni stanza (tranne la prima) ha un nemico marrone. I nemici inseguono Zeryth. Zeryth prende danno (cambia colore), si rigenera nelle zone scure. Colpire un nemico con J o K lo uccide, lascia una pozza rossa. Ridurre l'integrità a 0 porta al Game Over.

- [ ] **Step 6: Commit**

```bash
git add src/enemies/BaseEnemy.js src/enemies/HunterCommon.js src/scenes/GameScene.js
git commit -m "feat: HunterCommon enemy with chase AI, combat, blood pool on death"
```

---

## Task 10: Score System

**Files:**
- Create: `src/systems/ScoreSystem.js`
- Create: `tests/systems/ScoreSystem.test.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Scrivi i test**

Crea `tests/systems/ScoreSystem.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { ScoreSystem } from '../../src/systems/ScoreSystem.js'

describe('ScoreSystem', () => {
  it('parte da 0', () => {
    const s = new ScoreSystem()
    expect(s.getScore()).toBe(0)
  })

  it('aggiunge punti per nemico eliminato', () => {
    const s = new ScoreSystem()
    s.onEnemyKilled()
    s.onEnemyKilled()
    expect(s.kills).toBe(2)
  })

  it('aggiunge punti per piano completato', () => {
    const s = new ScoreSystem()
    s.onFloorCleared()
    expect(s.floors).toBe(1)
  })

  it('calcola punteggio con penalità tattica', () => {
    const s = new ScoreSystem()
    s.onFloorCleared()
    s.onEnemyKilled()
    s.onEnemyKilled()
    // floor(1) * 500 + kills(2) * 100 = 700, tattica 0s = mult 1.0
    expect(s.getScore()).toBe(700)
  })

  it('applica penalità per secondi tattici', () => {
    const s = new ScoreSystem()
    s.onFloorCleared()
    s.addTacticalPenalty(10) // 10 secondi di pausa
    // 500 - (10 * 5) = 450, moltiplicatore 0.9
    const score = s.getScore()
    expect(score).toBeLessThan(500)
  })
})
```

- [ ] **Step 2: Esegui test — fallisce**

```bash
npm test
```

- [ ] **Step 3: Implementa ScoreSystem.js**

```js
export class ScoreSystem {
  constructor() {
    this.kills = 0
    this.floors = 0
    this.tacticalPenaltySeconds = 0
  }

  onEnemyKilled() { this.kills++ }
  onFloorCleared() { this.floors++ }
  addTacticalPenalty(seconds) { this.tacticalPenaltySeconds += seconds }

  getScore() {
    const base = this.floors * 500 + this.kills * 100
    const penalty = Math.floor(this.tacticalPenaltySeconds * 5)
    const tacticalMult = Math.max(0.5, 1 - this.tacticalPenaltySeconds * 0.01)
    return Math.max(0, Math.floor((base - penalty) * tacticalMult))
  }
}
```

- [ ] **Step 4: Esegui test — passano**

```bash
npm test
```

- [ ] **Step 5: Integra ScoreSystem in GameScene**

```js
import { ScoreSystem } from '../systems/ScoreSystem.js'

// in create():
this.scoreSystem = new ScoreSystem()
```

Aggiorna `_placeBloodPool` per notificare il kill:

```js
_placeBloodPool(worldX, worldY) {
  this.scoreSystem?.onEnemyKilled()
  // ... resto invariato
}
```

Aggiorna `GameScene.update()` per passare il punteggio tattico al GameOver:

```js
// in _checkDeath di Zeryth già passa score — ma dobbiamo aggiornare la penalità tattica
// in update(), dopo tacticalPause.update(delta):
if (this.tacticalPause && this.scoreSystem) {
  this.scoreSystem.addTacticalPenalty(this.tacticalPause.getTacticalSeconds())
  this.tacticalPause.totalTacticalMs = 0 // reset per evitare doppio conteggio
}
```

- [ ] **Step 6: Commit**

```bash
git add src/systems/ScoreSystem.js tests/systems/ScoreSystem.test.js src/scenes/GameScene.js
git commit -m "feat: score system with kill/floor tracking and tactical penalty"
```

---

## Task 11: Basic HUD

**Files:**
- Create: `src/ui/CharacterHUD.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Crea CharacterHUD.js**

```js
export class CharacterHUD {
  constructor(scene) {
    this.scene = scene

    // Integrità — barra visiva (nessuna barra salute tradizionale: usa icone)
    this.integrityText = scene.add.text(16, 16, '', {
      fontSize: '14px', color: '#8888aa', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(20)

    this.scoreText = scene.add.text(16, 36, '', {
      fontSize: '14px', color: '#666688', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(20)

    this.tacticalText = scene.add.text(16, 56, '', {
      fontSize: '12px', color: '#3333aa', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(20)

    this.statusText = scene.add.text(16, 80, '', {
      fontSize: '11px', color: '#555566', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(20)
  }

  update(player, scoreSystem, tacticalPause) {
    if (!player) return

    const pct = player.integrity / player.maxIntegrity
    const bars = Math.round(pct * 10)
    const bar = '█'.repeat(bars) + '░'.repeat(10 - bars)
    this.integrityText.setText(`ZERYTH  ${bar}  ${Math.round(player.integrity)}`)

    this.scoreText.setText(`DISTANZA  ${scoreSystem?.getScore() ?? 0}`)

    if (tacticalPause?.active) {
      this.tacticalText.setText(`[ SECONDO FRATTURATO ]`)
    } else {
      this.tacticalText.setText(`SPAZIO — pausa tattica`)
    }

    const status = pct < 0.2 ? '⚠ CRITICO' : pct < 0.5 ? 'DANNEGGIATO' : ''
    this.statusText.setText(status)
  }
}
```

- [ ] **Step 2: Aggiungi HUD a GameScene**

```js
import { CharacterHUD } from '../ui/CharacterHUD.js'

// in create():
this.hud = new CharacterHUD(this)
```

In `update()`:
```js
if (this.hud) this.hud.update(this.player, this.scoreSystem, this.tacticalPause)
```

- [ ] **Step 3: Verifica nel browser**

In alto a sinistra: barra █ che decresce quando Zeryth prende danno, punteggio, indicatore pausa tattica.

- [ ] **Step 4: Commit**

```bash
git add src/ui/CharacterHUD.js src/scenes/GameScene.js
git commit -m "feat: basic HUD with integrity display and score"
```

---

## Task 12: Pulizia finale e test completi

- [ ] **Step 1: Esegui tutti i test**

```bash
npm test
```

Output atteso: tutti i test verdi. Se qualcuno fallisce, correggi prima di continuare.

- [ ] **Step 2: Verifica gameplay completo**

```bash
npm run dev
```

Checklist:
- [ ] Mappa BSP generata diversa ogni refresh
- [ ] Zeryth si muove con WASD
- [ ] Camera segue Zeryth
- [ ] Rotella mouse: zoom in/out
- [ ] Spazio: overlay blu, tutto rallenta drasticamente
- [ ] Spazio di nuovo: tutto torna normale
- [ ] J: attacco corpo a corpo (i nemici vicini perdono HP)
- [ ] K breve: proiettile rosso che attraversa i nemici
- [ ] K lungo + rilascio: flash slash in area
- [ ] Nemici inseguono Zeryth e infliggono danno
- [ ] Zeryth cambia colore in base all'integrità
- [ ] In zone SHADOW: Zeryth si rigenera più velocemente
- [ ] Nemico ucciso: lascia pozza rossa, punteggio sale
- [ ] Integrità a 0: schermata Game Over con punteggio
- [ ] R nel Game Over: nuova run con mappa diversa

- [ ] **Step 3: Commit finale Piano 1**

```bash
git add -A
git commit -m "feat: Plan 1 complete — playable grey-box demo with Zeryth, BSP map, tactical pause"
```

---

## Prossimi piani

- **Piano 2:** Damian (sistema Croce dell'Incubo, fasi, berserk), Mira (Sintesi Somatica, manipolazione terreno, rebound), Silas (Tessitura d'Ombra, invisibilità, teletrasporto shadow, sangue congelato)
- **Piano 3:** Meta-progressione missioni, Supabase leaderboard, UI finale, audio
