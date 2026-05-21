// --- Costanti Burst ---
export const BURST_DURATION_MS         = 4000
export const BURST_AOE_RADIUS          = 60
export const BURST_AOE_DPS             = 15
export const BURST_SELF_DAMAGE_PER_SEC = 6
export const BURST_KILL_REBATE_MS      = 1000
export const BURST_COOLDOWN_MS         = 15000
export const BURST_MAX_REBATE_MS       = 4000

/**
 * Calcola un tick del Burst.
 * @param {{ burstMs: number, selfDamageOffsetMs: number, hp: number, delta: number }} state
 * @returns {{ burstMs: number, selfDamageOffsetMs: number, hp: number }}
 */
export function burstTick({ burstMs, selfDamageOffsetMs, hp, delta }) {
  const newBurstMs = Math.max(0, burstMs - delta)

  if (selfDamageOffsetMs > 0) {
    const newOffset = Math.max(0, selfDamageOffsetMs - delta)
    return { burstMs: newBurstMs, selfDamageOffsetMs: newOffset, hp }
  }

  const dmg = BURST_SELF_DAMAGE_PER_SEC * (delta / 1000)
  const newHp = Math.max(0, hp - dmg)
  return { burstMs: newBurstMs, selfDamageOffsetMs: 0, hp: newHp }
}

/**
 * Applica il rebate kill al selfDamageOffsetMs.
 * @param {number} currentOffsetMs
 * @param {number} killCount
 * @returns {number} nuovo offset, capped a BURST_MAX_REBATE_MS
 */
export function applyKillRebate(currentOffsetMs, killCount) {
  return Math.min(BURST_MAX_REBATE_MS, currentOffsetMs + killCount * BURST_KILL_REBATE_MS)
}
