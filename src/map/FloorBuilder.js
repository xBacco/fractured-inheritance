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
        const sx = room.x + room.width - 1
        const sy = room.y + room.height - 1
        if (this._inBounds(sx, sy)) grid[sy][sx] = TILE.SHADOW
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
