import { TILE } from '../map/TileTypes.js'

// --- Temperatura ---
export const TEMP_MAX              = 100
export const TEMP_DECAY_PER_S     = 4
export const TEMP_HIGH_THRESHOLD  = 80
export const TEMP_SURCHARGE_MULT  = 1.5
export const TEMP_LOCKOUT_MS      = 2000
export const TEMP_REBOUND_RECOVERY = 30

// --- Guanti ---
export const GLOVES_MAX          = 100
export const GLOVES_REBOUND_COST = 25

// --- Rebound ---
export const REBOUND_STUN_MS       = 800
export const REBOUND_INVINCIBLE_MS = 400
export const REBOUND_VIGNETTE_MS   = 1500
export const REBOUND_BLEED_DPS     = 10
export const REBOUND_BLEED_MS      = 3000
export const REBOUND_AGG_DAMAGE    = 40
export const REBOUND_AGG_STUN_MS   = 1000

// --- Materiali ---
export const MAT = Object.freeze({
  EARTH: 'EARTH', STONE: 'STONE', METAL: 'METAL', LIQUID: 'LIQUID',
})

const TILE_MAT = {
  [TILE.FLOOR]:       MAT.EARTH,
  [TILE.CORRIDOR]:    MAT.EARTH,
  [TILE.SHADOW]:      MAT.EARTH,
  [TILE.DESTRUCTIBLE]:MAT.STONE,
  [TILE.METAL]:       MAT.METAL,
  [TILE.BLOOD_POOL]:  MAT.LIQUID,
}

export function materialForTile(tileType) {
  return TILE_MAT[tileType] ?? null
}

const COST = {
  LMB: { [MAT.EARTH]: 6, [MAT.STONE]: 8, [MAT.METAL]: 10, [MAT.LIQUID]: 8 },
  RMB: { [MAT.EARTH]: 6, [MAT.STONE]: 10, [MAT.METAL]: 10, [MAT.LIQUID]: 8 },
  F: 15,
}

export function abilityCost(ability, material) {
  if (ability === 'F') return COST.F
  return COST[ability]?.[material] ?? 0
}

const WALL_DUR = {
  [MAT.EARTH]: 1500, [MAT.STONE]: 3000, [MAT.METAL]: 4000, [MAT.LIQUID]: 2000,
}
export function wallDuration(material) { return WALL_DUR[material] ?? null }

const RMB_DMG = { [MAT.EARTH]: 0, [MAT.STONE]: 30, [MAT.METAL]: 35, [MAT.LIQUID]: 25 }
export function rmbDamage(material) { return RMB_DMG[material] ?? 0 }
