import { describe, it, expect } from 'vitest'
import {
  BURST_DURATION_MS,
  BURST_AOE_RADIUS,
  BURST_AOE_DPS,
  BURST_SELF_DAMAGE_PER_SEC,
  BURST_KILL_REBATE_MS,
  BURST_COOLDOWN_MS,
  BURST_MAX_REBATE_MS,
  burstTick,
  applyKillRebate,
} from '../../src/characters/AetherionBurst.js'

describe('AetherionBurst — costanti', () => {
  it('BURST_DURATION_MS è 4000',           () => expect(BURST_DURATION_MS).toBe(4000))
  it('BURST_AOE_RADIUS è 60',              () => expect(BURST_AOE_RADIUS).toBe(60))
  it('BURST_AOE_DPS è 15',                 () => expect(BURST_AOE_DPS).toBe(15))
  it('BURST_SELF_DAMAGE_PER_SEC è 6',      () => expect(BURST_SELF_DAMAGE_PER_SEC).toBe(6))
  it('BURST_KILL_REBATE_MS è 1000',        () => expect(BURST_KILL_REBATE_MS).toBe(1000))
  it('BURST_COOLDOWN_MS è 15000',          () => expect(BURST_COOLDOWN_MS).toBe(15000))
  it('BURST_MAX_REBATE_MS è 4000',         () => expect(BURST_MAX_REBATE_MS).toBe(4000))
})

describe('burstTick — gestisce un tick del Burst', () => {
  it('decrementa burstMs di delta', () => {
    const r = burstTick({ burstMs: 4000, selfDamageOffsetMs: 0, hp: 100, delta: 100 })
    expect(r.burstMs).toBe(3900)
  })

  it('applica self-damage HP quando selfDamageOffsetMs <= 0', () => {
    const r = burstTick({ burstMs: 4000, selfDamageOffsetMs: 0, hp: 100, delta: 100 })
    expect(r.hp).toBeCloseTo(99.4, 5)
  })

  it('NON applica self-damage HP quando selfDamageOffsetMs > 0', () => {
    const r = burstTick({ burstMs: 4000, selfDamageOffsetMs: 1000, hp: 100, delta: 100 })
    expect(r.hp).toBe(100)
  })

  it('decrementa selfDamageOffsetMs quando > 0', () => {
    const r = burstTick({ burstMs: 4000, selfDamageOffsetMs: 1000, hp: 100, delta: 100 })
    expect(r.selfDamageOffsetMs).toBe(900)
  })

  it('selfDamageOffsetMs non scende sotto 0', () => {
    const r = burstTick({ burstMs: 4000, selfDamageOffsetMs: 50, hp: 100, delta: 100 })
    expect(r.selfDamageOffsetMs).toBe(0)
  })

  it('hp non scende sotto 0', () => {
    const r = burstTick({ burstMs: 4000, selfDamageOffsetMs: 0, hp: 0.3, delta: 100 })
    expect(r.hp).toBe(0)
  })

  it('burstMs non scende sotto 0', () => {
    const r = burstTick({ burstMs: 50, selfDamageOffsetMs: 0, hp: 100, delta: 100 })
    expect(r.burstMs).toBe(0)
  })
})

describe('applyKillRebate — aggiunge rebate per kill durante Burst', () => {
  it('aggiunge 1000ms per ogni kill', () => {
    expect(applyKillRebate(0, 1)).toBe(1000)
    expect(applyKillRebate(0, 3)).toBe(3000)
  })

  it('si somma al rebate corrente', () => {
    expect(applyKillRebate(500, 1)).toBe(1500)
  })

  it('cap al BURST_MAX_REBATE_MS (4000)', () => {
    expect(applyKillRebate(3500, 2)).toBe(4000)
    expect(applyKillRebate(0, 10)).toBe(4000)
  })
})
