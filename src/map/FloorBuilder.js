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
      this._placeRandomShadowPatches(grid, room)
    }
  }

  _placeRandomShadowPatches(grid, room) {
    if (room.width <= 4 || room.height <= 4) return
    const count = 2 + Math.floor(Math.random() * 2)  // 2 or 3 patches
    const cx = room.x + Math.floor(room.width / 2)
    const cy = room.y + Math.floor(room.height / 2)
    const cornerX = room.x + room.width - 1
    const cornerY = room.y + room.height - 1

    let placed = 0
    let attempts = 0
    while (placed < count && attempts < 20) {
      attempts++
      const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2))
      const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2))

      // Avoid center (LIGHT territory) and existing corner SHADOW
      if (Math.abs(x - cx) < 2 && Math.abs(y - cy) < 2) continue
      if (x === cornerX && (y === cornerY || y === cornerY - 1)) continue

      if (!this._inBounds(x, y) || !this._inBounds(x, y + 1)) continue
      if (grid[y][x] !== TILE.FLOOR) continue
      if (grid[y + 1]?.[x] !== TILE.FLOOR) continue

      grid[y][x]     = TILE.SHADOW
      grid[y + 1][x] = TILE.SHADOW
      placed++
    }
  }

  _inBounds(x, y) {
    return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight
  }
}
