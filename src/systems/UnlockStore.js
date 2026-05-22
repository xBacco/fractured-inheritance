import { CHARACTER_REGISTRY } from '../config/CharacterRegistry.js'
import { UNLOCK_RULES } from './UnlockRules.js'

const KEY = 'fi:unlocks'
const VERSION = 1

function defaultState() {
  const unlocked = CHARACTER_REGISTRY
    .filter(e => e.unlockedByDefault)
    .map(e => e.id)
  return { version: VERSION, runs: {}, unlocked }
}

function defaultRunStats() {
  return { total: 0, floor2_reached: 0, completed: 0, time_ms: 0 }
}

export class UnlockStore {
  static _state = null

  static load() {
    let parsed = null
    try {
      const raw = localStorage.getItem(KEY)
      if (raw !== null) parsed = JSON.parse(raw)
    } catch {
      parsed = null
    }

    if (parsed && parsed.version === VERSION && Array.isArray(parsed.unlocked) && parsed.runs !== null && typeof parsed.runs === 'object') {
      UnlockStore._state = {
        version: VERSION,
        runs: parsed.runs,
        unlocked: parsed.unlocked.slice(),
      }
    } else {
      UnlockStore._state = defaultState()
    }
  }

  static save() {
    if (UnlockStore._state === null) return
    try {
      localStorage.setItem(KEY, JSON.stringify(UnlockStore._state))
    } catch {
      // localStorage non disponibile (Safari Private, quota piena) — ignora silenziosamente
    }
  }

  static reset() {
    UnlockStore._state = null
    try { localStorage.removeItem(KEY) } catch {}
  }

  static isUnlocked(id) {
    if (UnlockStore._state === null) UnlockStore.load()
    return UnlockStore._state.unlocked.includes(id)
  }

  static unlock(id) {
    if (UnlockStore._state === null) UnlockStore.load()
    if (!UnlockStore._state.unlocked.includes(id)) {
      UnlockStore._state.unlocked.push(id)
      UnlockStore.save()
    }
  }

  static getAllUnlocked() {
    if (UnlockStore._state === null) UnlockStore.load()
    return UnlockStore._state.unlocked.slice()
  }

  static getRunStats(id) {
    if (UnlockStore._state === null) UnlockStore.load()
    return { ...defaultRunStats(), ...(UnlockStore._state.runs[id] ?? {}) }
  }

  static recordRun(id, meta, rules = UNLOCK_RULES) {
    if (UnlockStore._state === null) UnlockStore.load()
    const state = UnlockStore._state
    if (!state.runs[id]) state.runs[id] = defaultRunStats()
    const r = state.runs[id]
    r.total += 1
    if ((meta?.floorReached ?? 1) >= 2) r.floor2_reached += 1
    if (meta?.completed) r.completed += 1
    r.time_ms += (meta?.durationMs ?? 0)

    const newlyUnlocked = []
    for (const rule of rules) {
      if (state.unlocked.includes(rule.unlocks)) continue
      try {
        if (rule.requires(state.runs)) {
          state.unlocked.push(rule.unlocks)
          newlyUnlocked.push(rule.unlocks)
        }
      } catch {
        // regola malformata — ignora silenziosamente, non bloccare il run
      }
    }

    UnlockStore.save()
    return newlyUnlocked
  }

  // Test helper — simula riavvio app (cancella state in memoria, localStorage sopravvive)
  static _clearMemoryStateForTest() {
    UnlockStore._state = null
  }
}
