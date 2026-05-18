import { BSPGenerator } from '../map/BSPGenerator.js'
import { FloorBuilder } from '../map/FloorBuilder.js'
import { TILE, WALKABLE } from '../map/TileTypes.js'
import { TILE_COLORS, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../config/GameConfig.js'
import { Zeryth } from '../characters/Zeryth.js'
import { TacticalPause } from '../systems/TacticalPause.js'
import { EsecutoreIllyrium } from '../enemies/EsecutoreIllyrium.js'
import { SkravAlpha } from '../enemies/SkravAlpha.js'
import { SkravMembro } from '../enemies/SkravMembro.js'
import { KeyBindings } from '../config/KeyBindings.js'

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }) }

  create() {
    this.grid = this._generateMap()
    this._renderMap()
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)

    const spawn = this.rooms[0]
    const spawnX = (spawn.x + Math.floor(spawn.width / 2)) * TILE_SIZE
    const spawnY = (spawn.y + Math.floor(spawn.height / 2)) * TILE_SIZE
    this.player = new Zeryth(this, spawnX, spawnY)

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
      (proj, enemy) => { enemy.takeDamage(proj.damage) }
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
    if (this.tacticalPause) {
      this.tacticalPause.update(delta)
      this.pauseOverlay.setVisible(this.tacticalPause.active)
      const cam = this.cameras.main
      this.pauseOverlay
        .setPosition(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2)
        .setSize(cam.width, cam.height)
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
    const FLANK_OFFSETS = [0, Math.PI / 3, -Math.PI / 3, Math.PI * 2 / 3, -Math.PI * 2 / 3]
    const enemyRooms = this.rooms.slice(1)
    const splitAt = Math.ceil(enemyRooms.length / 2)

    enemyRooms.forEach((room, i) => {
      const cx = (room.x + Math.floor(room.width / 2)) * TILE_SIZE
      const cy = (room.y + Math.floor(room.height / 2)) * TILE_SIZE
      if (i < splitAt) {
        this.enemies.add(new EsecutoreIllyrium(this, cx, cy, FLANK_OFFSETS[i % FLANK_OFFSETS.length]))
      } else {
        this._spawnSkravPack(cx, cy)
      }
    })
  }

  _spawnSkravPack(cx, cy) {
    const alpha = new SkravAlpha(this, cx, cy, this.enemyProjectiles)
    this.enemies.add(alpha)
    const memberOffsets = [[-30, -20], [30, -20], [0, 30]]
    memberOffsets.forEach(([ox, oy]) => {
      this.enemies.add(new SkravMembro(this, cx + ox, cy + oy, alpha))
    })
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
