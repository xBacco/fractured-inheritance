import { describe, it, expect } from 'vitest'
import { TILE } from '../../src/map/TileTypes.js'
import {
  TEMP_MAX, TEMP_DECAY_PER_S, TEMP_HIGH_THRESHOLD, TEMP_LOCKOUT_MS,
  GLOVES_MAX, GLOVES_REBOUND_COST,
  MAT, materialForTile, abilityCost, wallDuration, rmbDamage,
  tempAfterDecay, tempWithCost, isOverheat, isHighHeat,
  reboundResult,
  REBOUND_STUN_MS, REBOUND_BLEED_DPS, REBOUND_BLEED_MS,
  REBOUND_AGG_DAMAGE, REBOUND_AGG_STUN_MS, TEMP_REBOUND_RECOVERY,
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

describe('tempAfterDecay', () => {
  it('decreases by 4 per second at full delta', () =>
    expect(tempAfterDecay(50, 1000)).toBeCloseTo(46))
  it('scales with delta (500ms = -2)', () =>
    expect(tempAfterDecay(50, 500)).toBeCloseTo(48))
  it('does not go below 0', () =>
    expect(tempAfterDecay(1, 1000)).toBe(0))
  it('starts at 0 → stays 0', () =>
    expect(tempAfterDecay(0, 1000)).toBe(0))
})

describe('tempWithCost', () => {
  it('adds base cost at temp < 80', () =>
    expect(tempWithCost(40, 6)).toBe(46))
  it('applies 1.5x surcharge at temp >= 80 (80 + 6*1.5 = 89)', () =>
    expect(tempWithCost(80, 6)).toBe(89))
  it('caps at 100', () =>
    expect(tempWithCost(98, 10)).toBe(100))
  it('at temp 79: no surcharge (79 + 8 = 87)', () =>
    expect(tempWithCost(79, 8)).toBe(87))
})

describe('isOverheat / isHighHeat', () => {
  it('isOverheat true at 100',  () => expect(isOverheat(100)).toBe(true))
  it('isOverheat false at 99',  () => expect(isOverheat(99)).toBe(false))
  it('isHighHeat true at 80',   () => expect(isHighHeat(80)).toBe(true))
  it('isHighHeat false at 79',  () => expect(isHighHeat(79)).toBe(false))
  it('isHighHeat true at 100',  () => expect(isHighHeat(100)).toBe(true))
})

describe('reboundResult', () => {
  describe('normal (guanti > 0)', () => {
    const r = reboundResult(100, 100)
    it('temp drops by TEMP_REBOUND_RECOVERY',  () => expect(r.newTemp).toBe(70))
    it('gloves drop by GLOVES_REBOUND_COST',   () => expect(r.newGloves).toBe(75))
    it('not aggravated',                        () => expect(r.aggravated).toBe(false))
    it('stunMs = REBOUND_STUN_MS (800)',        () => expect(r.stunMs).toBe(REBOUND_STUN_MS))
    it('bleedDmg = REBOUND_BLEED_DPS (10)',    () => expect(r.bleedDmg).toBe(REBOUND_BLEED_DPS))
    it('bleedMs = REBOUND_BLEED_MS (3000)',    () => expect(r.bleedMs).toBe(REBOUND_BLEED_MS))
    it('directDmg = 0',                        () => expect(r.directDmg).toBe(0))
  })

  describe('aggravated (guanti = 0)', () => {
    const r = reboundResult(100, 0)
    it('aggravated = true',                     () => expect(r.aggravated).toBe(true))
    it('stunMs = REBOUND_AGG_STUN_MS (1000)',   () => expect(r.stunMs).toBe(REBOUND_AGG_STUN_MS))
    it('directDmg = REBOUND_AGG_DAMAGE (40)',   () => expect(r.directDmg).toBe(REBOUND_AGG_DAMAGE))
    it('bleedDmg = 0',                          () => expect(r.bleedDmg).toBe(0))
    it('bleedMs = 0',                           () => expect(r.bleedMs).toBe(0))
    it('newGloves stays at 0',                  () => expect(r.newGloves).toBe(0))
  })

  it('gloves clamp: 10 gloves → 0 after rebound',    () =>
    expect(reboundResult(100, 10).newGloves).toBe(0))
  it('temp clamp: 20 temp → 0 after rebound',         () =>
    expect(reboundResult(20, 100).newTemp).toBe(0))
  it('third rebound: gloves 50 → 25',                 () =>
    expect(reboundResult(100, 50).newGloves).toBe(25))
})
