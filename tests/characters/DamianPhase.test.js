import { describe, it, expect } from 'vitest'
import { PHASE, phaseFromCorruption, reserveDrain, canEscalate, punchDamage, speedMultiplier } from '../../src/characters/DamianPhase.js'

describe('phaseFromCorruption', () => {
  it('returns BASE at 0',        () => expect(phaseFromCorruption(0)).toBe(PHASE.BASE))
  it('returns BASE at 24',       () => expect(phaseFromCorruption(24)).toBe(PHASE.BASE))
  it('returns AWAKENING at 25',  () => expect(phaseFromCorruption(25)).toBe(PHASE.AWAKENING))
  it('returns AWAKENING at 54',  () => expect(phaseFromCorruption(54)).toBe(PHASE.AWAKENING))
  it('returns MINOR_DEMON at 55',() => expect(phaseFromCorruption(55)).toBe(PHASE.MINOR_DEMON))
  it('returns INCUBUS at 80',    () => expect(phaseFromCorruption(80)).toBe(PHASE.INCUBUS))
  it('returns INCUBUS at 100',   () => expect(phaseFromCorruption(100)).toBe(PHASE.INCUBUS))
})

describe('reserveDrain', () => {
  it('no drain in BASE',          () => expect(reserveDrain(PHASE.BASE, 1000)).toBe(0))
  it('2/s in AWAKENING',          () => expect(reserveDrain(PHASE.AWAKENING, 1000)).toBe(2))
  it('5/s in MINOR_DEMON',        () => expect(reserveDrain(PHASE.MINOR_DEMON, 1000)).toBe(5))
  it('12/s in INCUBUS',           () => expect(reserveDrain(PHASE.INCUBUS, 1000)).toBe(12))
  it('12/s in BERSERK',           () => expect(reserveDrain(PHASE.BERSERK, 1000)).toBe(12))
  it('no drain in TRAUMATIC',     () => expect(reserveDrain(PHASE.TRAUMATIC, 1000)).toBe(0))
  it('scales with delta at 500ms',() => expect(reserveDrain(PHASE.AWAKENING, 500)).toBe(1))
})

describe('canEscalate', () => {
  it('allows BASE with full reserve',     () => expect(canEscalate(PHASE.BASE, 100)).toBe(true))
  it('allows AWAKENING with 50 reserve',  () => expect(canEscalate(PHASE.AWAKENING, 50)).toBe(true))
  it('allows MINOR_DEMON with 50',        () => expect(canEscalate(PHASE.MINOR_DEMON, 50)).toBe(true))
  it('blocks at INCUBUS',                 () => expect(canEscalate(PHASE.INCUBUS, 100)).toBe(false))
  it('blocks at BERSERK',                 () => expect(canEscalate(PHASE.BERSERK, 100)).toBe(false))
  it('blocks at reserve = 20',            () => expect(canEscalate(PHASE.BASE, 20)).toBe(false))
  it('allows at reserve = 21',            () => expect(canEscalate(PHASE.BASE, 21)).toBe(true))
})

describe('punchDamage', () => {
  it('15 in BASE',        () => expect(punchDamage(PHASE.BASE)).toBe(15))
  it('20 in AWAKENING',   () => expect(punchDamage(PHASE.AWAKENING)).toBe(20))
  it('22 in MINOR_DEMON', () => expect(punchDamage(PHASE.MINOR_DEMON)).toBe(22))
  it('75 in INCUBUS',     () => expect(punchDamage(PHASE.INCUBUS)).toBe(75))
  it('75 in BERSERK',     () => expect(punchDamage(PHASE.BERSERK)).toBe(75))
})

describe('speedMultiplier', () => {
  it('1.0 in BASE',       () => expect(speedMultiplier(PHASE.BASE)).toBe(1.0))
  it('1.0 in AWAKENING',  () => expect(speedMultiplier(PHASE.AWAKENING)).toBe(1.0))
  it('1.2 in MINOR_DEMON',() => expect(speedMultiplier(PHASE.MINOR_DEMON)).toBe(1.2))
  it('1.0 in INCUBUS',    () => expect(speedMultiplier(PHASE.INCUBUS)).toBe(1.0))
  it('0.5 in TRAUMATIC',  () => expect(speedMultiplier(PHASE.TRAUMATIC)).toBe(0.5))
})
