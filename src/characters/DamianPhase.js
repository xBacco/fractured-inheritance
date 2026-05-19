export const PHASE = Object.freeze({ BASE: 0, AWAKENING: 1, MINOR_DEMON: 2, INCUBUS: 3, BERSERK: 4, TRAUMATIC: 5 })

export const PHASE_COLOR = Object.freeze([0x222233, 0x886600, 0x440066, 0x880022, 0xff0000, 0x555566])

const RESERVE_DRAIN_RATE = [0, 2, 5, 12, 12, 0]
const DAMAGE_TABLE        = [15, 20, 22, 75, 75, 15]

export function phaseFromCorruption(corruption) {
  if (corruption >= 80) return PHASE.INCUBUS
  if (corruption >= 55) return PHASE.MINOR_DEMON
  if (corruption >= 25) return PHASE.AWAKENING
  return PHASE.BASE
}

export function reserveDrain(phase, delta) {
  return (RESERVE_DRAIN_RATE[phase] ?? 0) * (delta / 1000)
}

export function canEscalate(phase, reserve) {
  return phase < PHASE.INCUBUS && reserve > 20
}

export function punchDamage(phase) {
  return DAMAGE_TABLE[phase] ?? 15
}

export function speedMultiplier(phase) {
  if (phase === PHASE.TRAUMATIC) return 0.5
  if (phase === PHASE.MINOR_DEMON) return 1.2
  return 1.0
}
