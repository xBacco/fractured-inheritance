import { BSPGenerator } from '../map/BSPGenerator.js'
import { FloorBuilder } from '../map/FloorBuilder.js'
import { TILE, WALKABLE } from '../map/TileTypes.js'
import { TILE_COLORS, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../config/GameConfig.js'
import { Zeryth } from '../characters/Zeryth.js'
import { TacticalPause } from '../systems/TacticalPause.js'

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
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.spaceKey.on('down', () => this.tacticalPause.toggle())

    this.pauseOverlay = this.add.rectangle(0, 0, 1, 1, 0x0000ff, 0.08)
      .setScrollFactor(0)
      .setVisible(false)
      .setDepth(10)
  }

  update(time, delta) {
    if (this.player) this.player.update(this, delta)
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

  isWalkable(tileX, tileY) {
    if (tileY < 0 || tileY >= this.grid.length) return false
    if (tileX < 0 || tileX >= this.grid[0].length) return false
    return WALKABLE.has(this.grid[tileY][tileX])
  }
}
