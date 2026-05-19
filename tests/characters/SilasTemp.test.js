import { describe, it, expect } from 'vitest'
import { TILE } from '../../src/map/TileTypes.js'
import {
  TEMP_MAX, TEMP_MIN,
  TEMP_DRAIN_HIT, TEMP_DRAIN_BIND, TEMP_DRAIN_TELEPORT, TEMP_DRAIN_FUSION,
  TEMP_REGEN_SHADOW, TEMP_REGEN_BASE,
  tempDelta, isFrozen, speedMultiplier, powersEnabled, isShadowTile,
} from '../../src/characters/SilasTemp.js'

describe('constants', () => {
  it('TEMP_MAX is 100', () => expect(TEMP_MAX).toBe(100))
  it('TEMP_MIN is 0',   () => expect(TEMP_MIN).toBe(0))
  it('TEMP_DRAIN_HIT is 20',       () => expect(TEMP_DRAIN_HIT).toBe(20))
  it('TEMP_DRAIN_BIND is 15',      () => expect(TEMP_DRAIN_BIND).toBe(15))
  it('TEMP_DRAIN_TELEPORT is 25',  () => expect(TEMP_DRAIN_TELEPORT).toBe(25))
  it('TEMP_DRAIN_FUSION is 5',     () => expect(TEMP_DRAIN_FUSION).toBe(5))
  it('TEMP_REGEN_SHADOW is 8',     () => expect(TEMP_REGEN_SHADOW).toBe(8))
  it('TEMP_REGEN_BASE is 3',       () => expect(TEMP_REGEN_BASE).toBe(3))
})

describe('tempDelta', () => {
  it('in shadow, no fusion: +8/s', () =>
    expect(tempDelta(true, false, 1000)).toBeCloseTo(8))
  it('out of shadow, no fusion: +3/s', () =>
    expect(tempDelta(false, false, 1000)).toBeCloseTo(3))
  it('in shadow, fusion active: +8-5=+3/s', () =>
    expect(tempDelta(true, true, 1000)).toBeCloseTo(3))
  it('out of shadow, fusion active (suspended): +3/s', () =>
    expect(tempDelta(false, true, 1000)).toBeCloseTo(3))
  it('scales with delta (500ms = half)', () =>
    expect(tempDelta(true, false, 500)).toBeCloseTo(4))
})

describe('isFrozen', () => {
  it('returns true at 0',    () => expect(isFrozen(0)).toBe(true))
  it('returns false at 1',   () => expect(isFrozen(1)).toBe(false))
  it('returns false at 100', () => expect(isFrozen(100)).toBe(false))
})

describe('speedMultiplier', () => {
  it('0.5 when frozen',    () => expect(speedMultiplier(0)).toBe(0.5))
  it('1.0 when not frozen',() => expect(speedMultiplier(50)).toBe(1.0))
})

describe('powersEnabled', () => {
  it('false at temp 0',   () => expect(powersEnabled(0)).toBe(false))
  it('true at temp 1',    () => expect(powersEnabled(1)).toBe(true))
  it('true at temp 100',  () => expect(powersEnabled(100)).toBe(true))
})

describe('isShadowTile', () => {
  // Grid: 5x5, WALL border, FLOOR inside
  //   col: 0 1 2 3 4
  // row 0: W W W W W
  // row 1: W F F F W
  // row 2: W F F F W
  // row 3: W F F F W
  // row 4: W W W W W
  const W = TILE.WALL
  const F = TILE.FLOOR
  const S = TILE.SHADOW
  const C = TILE.CORRIDOR
  const L = TILE.LIGHT
  const grid = [
    [W, W, W, W, W],
    [W, F, F, F, W],
    [W, F, F, F, W],
    [W, F, F, F, W],
    [W, W, W, W, W],
  ]

  it('SHADOW tile → true', () => {
    const g = grid.map(r => [...r])
    g[1][1] = S
    expect(isShadowTile(g, 1, 1)).toBe(true)
  })

  it('CORRIDOR tile → true', () => {
    const g = grid.map(r => [...r])
    g[2][2] = C
    expect(isShadowTile(g, 2, 2)).toBe(true)
  })

  it('FLOOR at perimeter (adjacent to WALL) → true', () =>
    expect(isShadowTile(grid, 1, 1)).toBe(true))

  it('FLOOR at center (no WALL neighbor) → false', () =>
    expect(isShadowTile(grid, 2, 2)).toBe(false))

  it('LIGHT tile adjacent to WALL → false', () => {
    const g = grid.map(r => [...r])
    g[1][1] = L
    expect(isShadowTile(g, 1, 1)).toBe(false)
  })

  it('WALL tile → false', () =>
    expect(isShadowTile(grid, 0, 0)).toBe(false))

  it('out of bounds → false', () =>
    expect(isShadowTile(grid, -1, 0)).toBe(false))
})
