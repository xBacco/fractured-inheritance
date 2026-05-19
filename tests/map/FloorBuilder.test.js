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

  it('aggiunge patch di ombra nelle stanze grandi (> 4x4)', () => {
    const builder = new FloorBuilder(40, 30)
    const room = { x: 2, y: 2, width: 12, height: 10 }
    // start with a fully-FLOOR grid so we can count only the new patches
    const grid = Array.from({ length: 30 }, () => Array(40).fill(TILE.FLOOR))

    builder._placeRandomShadowPatches(grid, room)

    let shadowCount = 0
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (grid[y][x] === TILE.SHADOW) shadowCount++
      }
    }
    // 2–3 patches of 2 tiles each → at least 4 shadow tiles
    expect(shadowCount).toBeGreaterThanOrEqual(4)
  })

  it('non aggiunge patch nelle stanze piccole (width o height ≤ 4)', () => {
    const builder = new FloorBuilder(40, 30)
    const room = { x: 2, y: 2, width: 4, height: 4 }
    const grid = Array.from({ length: 30 }, () => Array(40).fill(TILE.FLOOR))

    builder._placeRandomShadowPatches(grid, room)

    let shadowCount = 0
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (grid[y][x] === TILE.SHADOW) shadowCount++
      }
    }
    expect(shadowCount).toBe(0)
  })
})
