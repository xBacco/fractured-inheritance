import { TILE } from '../map/TileTypes.js'

export const TEMP_MAX = 100
export const TEMP_MIN = 0
export const TEMP_DRAIN_HIT       = 20
export const TEMP_DRAIN_BIND      = 15
export const TEMP_DRAIN_TELEPORT  = 25
export const TEMP_DRAIN_FUSION    = 5
export const TEMP_REGEN_SHADOW    = 8
export const TEMP_REGEN_BASE      = 3

// Net temperature change per delta ms.
// Fusion drain only applies when in shadow (suspended outside shadow).
export function tempDelta(inShadow, fusionActive, delta) {
  const regen = inShadow ? TEMP_REGEN_SHADOW : TEMP_REGEN_BASE
  const drain = (fusionActive && inShadow) ? TEMP_DRAIN_FUSION : 0
  return (regen - drain) * (delta / 1000)
}

export function isFrozen(temp) {
  return temp <= TEMP_MIN
}

export function speedMultiplier(temp) {
  return isFrozen(temp) ? 0.5 : 1.0
}

export function powersEnabled(temp) {
  return temp > TEMP_MIN
}

// Returns true if the tile at (tileX, tileY) counts as shadow for Silas.
// Shadow = SHADOW tile, CORRIDOR tile, or FLOOR tile adjacent to a WALL.
// LIGHT tiles are never shadow even if adjacent to WALL.
export function isShadowTile(grid, tileX, tileY) {
  const tile = grid[tileY]?.[tileX]
  if (tile === undefined) return false
  if (tile === TILE.WALL || tile === TILE.LIGHT) return false
  if (tile === TILE.SHADOW || tile === TILE.CORRIDOR) return true
  // FLOOR: check if any orthogonal neighbor is WALL
  return [[-1, 0], [1, 0], [0, -1], [0, 1]].some(
    ([dx, dy]) => grid[tileY + dy]?.[tileX + dx] === TILE.WALL
  )
}
