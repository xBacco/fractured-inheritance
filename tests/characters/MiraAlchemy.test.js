import { describe, it, expect } from 'vitest'
import { TILE } from '../../src/map/TileTypes.js'
import {
  TEMP_MAX, TEMP_DECAY_PER_S, TEMP_HIGH_THRESHOLD, TEMP_LOCKOUT_MS,
  GLOVES_MAX, GLOVES_REBOUND_COST,
  MAT, materialForTile, abilityCost, wallDuration, rmbDamage,
} from '../../src/characters/MiraAlchemy.js'

describe('MiraAlchemy — constants', () => {
  it('TEMP_MAX is 100',          () => expect(TEMP_MAX).toBe(100))
  it('TEMP_DECAY_PER_S is 4',   () => expect(TEMP_DECAY_PER_S).toBe(4))
  it('TEMP_HIGH_THRESHOLD is 80', () => expect(TEMP_HIGH_THRESHOLD).toBe(80))
  it('TEMP_LOCKOUT_MS is 2000', () => expect(TEMP_LOCKOUT_MS).toBe(2000))
  it('GLOVES_MAX is 100',       () => expect(GLOVES_MAX).toBe(100))
  it('GLOVES_REBOUND_COST is 25', () => expect(GLOVES_REBOUND_COST).toBe(25))
})

describe('materialForTile', () => {
  it('FLOOR → EARTH',        () => expect(materialForTile(TILE.FLOOR)).toBe(MAT.EARTH))
  it('CORRIDOR → EARTH',     () => expect(materialForTile(TILE.CORRIDOR)).toBe(MAT.EARTH))
  it('SHADOW → EARTH',       () => expect(materialForTile(TILE.SHADOW)).toBe(MAT.EARTH))
  it('DESTRUCTIBLE → STONE', () => expect(materialForTile(TILE.DESTRUCTIBLE)).toBe(MAT.STONE))
  it('METAL → METAL',        () => expect(materialForTile(TILE.METAL)).toBe(MAT.METAL))
  it('BLOOD_POOL → LIQUID',  () => expect(materialForTile(TILE.BLOOD_POOL)).toBe(MAT.LIQUID))
  it('WALL → null',          () => expect(materialForTile(TILE.WALL)).toBeNull())
  it('LIGHT → null',         () => expect(materialForTile(TILE.LIGHT)).toBeNull())
})

describe('abilityCost', () => {
  it('LMB EARTH = 6',  () => expect(abilityCost('LMB', MAT.EARTH)).toBe(6))
  it('LMB STONE = 8',  () => expect(abilityCost('LMB', MAT.STONE)).toBe(8))
  it('LMB METAL = 10', () => expect(abilityCost('LMB', MAT.METAL)).toBe(10))
  it('LMB LIQUID = 8', () => expect(abilityCost('LMB', MAT.LIQUID)).toBe(8))
  it('RMB EARTH = 6',  () => expect(abilityCost('RMB', MAT.EARTH)).toBe(6))
  it('RMB STONE = 10', () => expect(abilityCost('RMB', MAT.STONE)).toBe(10))
  it('RMB METAL = 10', () => expect(abilityCost('RMB', MAT.METAL)).toBe(10))
  it('RMB LIQUID = 8', () => expect(abilityCost('RMB', MAT.LIQUID)).toBe(8))
  it('F (flat) = 15',  () => expect(abilityCost('F', null)).toBe(15))
})

describe('wallDuration', () => {
  it('EARTH = 1500ms',  () => expect(wallDuration(MAT.EARTH)).toBe(1500))
  it('STONE = 3000ms',  () => expect(wallDuration(MAT.STONE)).toBe(3000))
  it('METAL = 4000ms',  () => expect(wallDuration(MAT.METAL)).toBe(4000))
  it('LIQUID = 2000ms', () => expect(wallDuration(MAT.LIQUID)).toBe(2000))
})

describe('rmbDamage', () => {
  it('EARTH = 0 (slow only)', () => expect(rmbDamage(MAT.EARTH)).toBe(0))
  it('STONE = 30',             () => expect(rmbDamage(MAT.STONE)).toBe(30))
  it('METAL = 35',             () => expect(rmbDamage(MAT.METAL)).toBe(35))
  it('LIQUID = 25',            () => expect(rmbDamage(MAT.LIQUID)).toBe(25))
})
