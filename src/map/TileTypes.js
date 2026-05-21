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
  WATER: 10,
}

export const WALKABLE = new Set([
  TILE.FLOOR, TILE.CORRIDOR, TILE.SHADOW,
  TILE.LIGHT, TILE.TRAP, TILE.ALTAR,
  TILE.BLOOD_POOL, TILE.METAL, TILE.WATER,
])

export const TILE_EFFECTS = {
  [TILE.SHADOW]: { zerythRegenMult: 2.5, damageReduction: 0.25, enemyVisibility: 0.5 },
  [TILE.LIGHT]:  { hunterDamageMult: 1.3, hunterSpeedMult: 1.2, regenBlocked: true },
  [TILE.BLOOD_POOL]: { zerythRegenMult: 4.0 },
  [TILE.TRAP]:   { damage: 15 },
}
