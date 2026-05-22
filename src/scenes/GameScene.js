import { BSPGenerator } from '../map/BSPGenerator.js'
import { FloorBuilder } from '../map/FloorBuilder.js'
import { TILE, WALKABLE } from '../map/TileTypes.js'
import { TILE_COLORS, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../config/GameConfig.js'
import { getCharacter } from '../config/CharacterRegistry.js'
import { TacticalPause } from '../systems/TacticalPause.js'
import { EsecutoreComune } from '../enemies/EsecutoreComune.js'
import { EsecutoreLeader } from '../enemies/EsecutoreLeader.js'
import { FormationSystem } from '../systems/FormationSystem.js'
import { LeSignore } from '../enemies/LeSignore.js'
import { SkravAlpha } from '../enemies/SkravAlpha.js'
import { SkravMembro } from '../enemies/SkravMembro.js'
import { Anghiato } from '../enemies/Anghiato.js'
import { Sussurro } from '../enemies/Sussurro.js'
import { AlberoRichiusa } from '../enemies/AlberoRichiusa.js'
import { KeyBindings } from '../config/KeyBindings.js'

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }) }

  init(data) {
    this.characterId     = data?.characterId ?? 'aetherion'
    this.runStartTime    = Date.now()
    this.runHighestFloor = 1
    this._gameOverFired  = false
  }

  create() {
    this.grid = this._generateMap()
    this._renderMap()
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)

    const spawn = this.rooms[0]
    const spawnX = (spawn.x + Math.floor(spawn.width / 2)) * TILE_SIZE
    const spawnY = (spawn.y + Math.floor(spawn.height / 2)) * TILE_SIZE
    const entry = getCharacter(this.characterId)
    const PGClass = entry.classRef
    this.player = new PGClass(this, spawnX, spawnY)
    this.floor = 1
    this._formations = []

    this.tacticalPause = new TacticalPause(this)
    this.spaceKey = this.input.keyboard.addKey(KeyBindings.keyCode('pause'))
    this.spaceKey.on('down', () => this.tacticalPause.toggle())

    this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB)
    this.tabKey.on('down', () => {
      if (!this.scene.isActive('SettingsScene')) {
        this.scene.pause()
        this.scene.launch('SettingsScene')
      }
    })

    this.events.on('keybindings-updated', () => {
      this.input.keyboard.removeKey(this.spaceKey)
      this.spaceKey = this.input.keyboard.addKey(KeyBindings.keyCode('pause'))
      this.spaceKey.on('down', () => this.tacticalPause.toggle())
      this.player.rebindMovement(this)
      this.player.rebindActions(this)
    })

    this.pauseOverlay = this.add.rectangle(0, 0, 1, 1, 0x0000ff, 0.08)
      .setScrollFactor(0)
      .setVisible(false)
      .setDepth(10)

    this.enemies = this.add.group()
    this.enemyProjectiles = this.physics.add.group()
    this._spawnEnemies()

    this.physics.add.overlap(
      this.player.projectiles,
      this.enemies,
      (proj, enemy) => { proj.destroy(); enemy.takeDamage(proj.damage) }
    )
    this.physics.add.overlap(
      this.enemyProjectiles,
      this.player,
      (proj, player) => { player.takeDamage(proj.damage); proj.destroy() }
    )
  }

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
        const key = Object.keys(TILE).find(k => TILE[k] === tile)
        const color = TILE_COLORS[key] ?? TILE_COLORS.WALL
        gfx.fillStyle(color, 1)
        gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      }
    }
  }

  _spawnEnemies() {
    const enemyRooms = this.rooms.slice(1)
    const sixth = Math.max(1, Math.floor(enemyRooms.length / 6))
    enemyRooms.forEach((room, i) => {
      const cx = (room.x + Math.floor(room.width / 2)) * TILE_SIZE
      const cy = (room.y + Math.floor(room.height / 2)) * TILE_SIZE
      if (i < sixth) {
        this._spawnEsecutoriGroup(cx, cy)
      } else if (i < sixth * 2) {
        this._spawnSignoreGroup(cx, cy)
      } else if (i < sixth * 3) {
        this._spawnSkravPack(cx, cy)
      } else if (i < sixth * 4) {
        this._spawnAnghiatiZone(room, cx, cy)
      } else if (i < sixth * 5) {
        this._spawnForestGroup(cx, cy)
      } else {
        this._spawnSussurriPack(cx, cy)
      }
    })
  }

  _spawnSignoreGroup(cx, cy) {
    const count = Phaser.Math.Between(1, 3)
    const OFFSETS = [[0, 0], [-30, -20], [30, -20]]
    for (let i = 0; i < count; i++) {
      const [ox, oy] = OFFSETS[i]
      this.enemies.add(new LeSignore(this, cx + ox, cy + oy))
    }
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

  _spawnSkravPack(cx, cy) {
    const alpha = new SkravAlpha(this, cx, cy, this.enemyProjectiles)
    this.enemies.add(alpha)
    const memberOffsets = [[-30, -20], [30, -20], [0, 30]]
    memberOffsets.forEach(([ox, oy]) => {
      this.enemies.add(new SkravMembro(this, cx + ox, cy + oy, alpha))
    })
  }

  _spawnForestGroup(cx, cy) {
    const count = Phaser.Math.Between(2, 3)
    const OFFSETS = [[0, 0], [-40, 20], [40, -20]]
    for (let i = 0; i < count; i++) {
      const [ox, oy] = OFFSETS[i]
      this.enemies.add(new AlberoRichiusa(this, cx + ox, cy + oy))
    }
  }

  _spawnSussurriPack(cx, cy) {
    const count = Phaser.Math.Between(2, 4)
    for (let i = 0; i < count; i++) {
      const ox = Phaser.Math.Between(-50, 50)
      const oy = Phaser.Math.Between(-50, 50)
      this.enemies.add(new Sussurro(this, cx + ox, cy + oy))
    }
  }

  _spawnAnghiatiZone(room, cx, cy) {
    this._floodRoomWithWater(room)
    this.enemies.add(new Anghiato(this, cx, cy, this.enemyProjectiles))

    this.time.delayedCall(15000, () => {
      if (!this.scene.isActive('GameScene')) return
      const offsets = [[-40, -20], [40, 20]]
      offsets.forEach(([ox, oy]) => {
        this.enemies.add(new Anghiato(this, cx + ox, cy + oy, this.enemyProjectiles))
      })
    })

    this.time.delayedCall(40000, () => {
      if (!this.scene.isActive('GameScene')) return
      const offsets = [[-55, 0], [55, 0], [0, -40], [0, 40]]
      offsets.forEach(([ox, oy]) => {
        this.enemies.add(new Anghiato(this, cx + ox, cy + oy, this.enemyProjectiles))
      })
    })
  }

  _floodRoomWithWater(room) {
    const gfx = this.add.graphics().setDepth(1)
    gfx.fillStyle(TILE_COLORS.WATER, 1)
    for (let ty = room.y; ty < room.y + room.height; ty++) {
      for (let tx = room.x; tx < room.x + room.width; tx++) {
        if (this.grid[ty]?.[tx] === TILE.FLOOR) {
          this.grid[ty][tx] = TILE.WATER
          gfx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        }
      }
    }
  }

  _placeBloodPool(worldX, worldY) {
    const tx = Math.floor(worldX / TILE_SIZE)
    const ty = Math.floor(worldY / TILE_SIZE)
    if (this.grid?.[ty]?.[tx] !== undefined) {
      this.grid[ty][tx] = TILE.BLOOD_POOL
      const gfx = this.add.graphics()
      gfx.fillStyle(TILE_COLORS.BLOOD_POOL, 1)
      gfx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE)
    }
  }

  isWalkable(tileX, tileY) {
    if (tileY < 0 || tileY >= this.grid.length) return false
    if (tileX < 0 || tileX >= this.grid[0].length) return false
    return WALKABLE.has(this.grid[tileY][tileX])
  }

}
