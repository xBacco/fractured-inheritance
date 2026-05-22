import { describe, it, expect, beforeEach } from 'vitest'
import { UnlockStore } from '../../src/systems/UnlockStore.js'

// Mock localStorage
const memoryStorage = {
  store: {},
  getItem(k) { return this.store[k] ?? null },
  setItem(k, v) { this.store[k] = String(v) },
  removeItem(k) { delete this.store[k] },
  clear() { this.store = {} },
}
globalThis.localStorage = memoryStorage

beforeEach(() => {
  memoryStorage.clear()
  UnlockStore.reset()
})

describe('UnlockStore — load fresh', () => {
  it('al primo load (localStorage vuoto), unlocked = ids unlockedByDefault dal registry', () => {
    UnlockStore.load()
    const unlocked = UnlockStore.getAllUnlocked()
    expect(unlocked).toContain('aetherion')
    expect(unlocked).toContain('korvan')
    expect(unlocked).not.toContain('mira')
  })

  it('al primo load, runs è oggetto vuoto', () => {
    UnlockStore.load()
    expect(UnlockStore.getRunStats('aetherion')).toEqual({
      total: 0, floor2_reached: 0, completed: 0, time_ms: 0
    })
  })
})

describe('UnlockStore — recordRun', () => {
  beforeEach(() => UnlockStore.load())

  it('incrementa total di 1', () => {
    UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 })
    expect(UnlockStore.getRunStats('aetherion').total).toBe(1)
  })

  it('incrementa floor2_reached quando floorReached >= 2', () => {
    UnlockStore.recordRun('aetherion', { floorReached: 2, completed: false, durationMs: 60000 })
    expect(UnlockStore.getRunStats('aetherion').floor2_reached).toBe(1)
  })

  it('NON incrementa floor2_reached quando floorReached < 2', () => {
    UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 })
    expect(UnlockStore.getRunStats('aetherion').floor2_reached).toBe(0)
  })

  it('incrementa completed quando completed=true', () => {
    UnlockStore.recordRun('aetherion', { floorReached: 5, completed: true, durationMs: 120000 })
    expect(UnlockStore.getRunStats('aetherion').completed).toBe(1)
  })

  it('accumula time_ms', () => {
    UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 })
    UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 45000 })
    expect(UnlockStore.getRunStats('aetherion').time_ms).toBe(75000)
  })

  it('ritorna array vuoto se nessuna regola scatta', () => {
    const newly = UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 })
    expect(newly).toEqual([])
  })

  it('valuta regole iniettate e sblocca quando matchano', () => {
    const rules = [
      { unlocks: 'mira', requires: (runs) => (runs.aetherion?.total ?? 0) >= 2 },
    ]
    UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 }, rules)
    let newly = UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 }, rules)
    expect(newly).toEqual(['mira'])
    expect(UnlockStore.getAllUnlocked()).toContain('mira')
  })

  it('non duplica unlock già sbloccati', () => {
    const rules = [
      { unlocks: 'mira', requires: (runs) => (runs.aetherion?.total ?? 0) >= 1 },
    ]
    UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 }, rules)
    const newly = UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 30000 }, rules)
    expect(newly).toEqual([])  // mira già sbloccata
    expect(UnlockStore.getAllUnlocked().filter(id => id === 'mira')).toHaveLength(1)
  })

  it('regola che lancia non blocca il run né gli altri unlock', () => {
    const rules = [
      { unlocks: 'mira',  requires: () => { throw new Error('boom') } },
      { unlocks: 'silas', requires: () => true },
    ]
    const newly = UnlockStore.recordRun('aetherion', { floorReached: 1, completed: false, durationMs: 0 }, rules)
    expect(newly).toEqual(['silas'])
    expect(UnlockStore.isUnlocked('mira')).toBe(false)
  })
})

describe('UnlockStore — persistenza', () => {
  it('save + load preserva lo state (roundtrip)', () => {
    UnlockStore.load()
    UnlockStore.recordRun('aetherion', { floorReached: 2, completed: true, durationMs: 50000 })
    UnlockStore.unlock('mira')

    // Simula riavvio app: azzera solo la memoria, localStorage sopravvive
    UnlockStore._clearMemoryStateForTest()
    UnlockStore.load()

    expect(UnlockStore.getAllUnlocked()).toContain('mira')
    const stats = UnlockStore.getRunStats('aetherion')
    expect(stats.total).toBe(1)
    expect(stats.floor2_reached).toBe(1)
    expect(stats.completed).toBe(1)
  })

  it('version mismatch in localStorage carica defaults senza crash', () => {
    memoryStorage.setItem('fi:unlocks', JSON.stringify({ version: 999, runs: {}, unlocked: ['mira'] }))
    UnlockStore.load()
    expect(UnlockStore.getAllUnlocked()).toContain('aetherion')
    expect(UnlockStore.getAllUnlocked()).toContain('korvan')
    expect(UnlockStore.getAllUnlocked()).not.toContain('mira')  // fallback ai default
  })

  it('JSON invalido in localStorage carica defaults senza crash', () => {
    memoryStorage.setItem('fi:unlocks', 'not-json-{{}')
    expect(() => UnlockStore.load()).not.toThrow()
    expect(UnlockStore.getAllUnlocked()).toContain('aetherion')
  })
})

describe('UnlockStore — isUnlocked e unlock', () => {
  beforeEach(() => UnlockStore.load())

  it('isUnlocked ritorna true per default', () => {
    expect(UnlockStore.isUnlocked('aetherion')).toBe(true)
    expect(UnlockStore.isUnlocked('mira')).toBe(false)
  })

  it('unlock(id) aggiunge id agli unlocked e salva', () => {
    UnlockStore.unlock('mira')
    expect(UnlockStore.isUnlocked('mira')).toBe(true)
    // verifica persistenza
    const raw = memoryStorage.getItem('fi:unlocks')
    expect(JSON.parse(raw).unlocked).toContain('mira')
  })

  it('unlock(id) idempotente', () => {
    UnlockStore.unlock('mira')
    UnlockStore.unlock('mira')
    expect(UnlockStore.getAllUnlocked().filter(id => id === 'mira')).toHaveLength(1)
  })
})

describe('UnlockStore — reset', () => {
  it('reset wipes lo state e localStorage', () => {
    UnlockStore.load()
    UnlockStore.unlock('mira')
    UnlockStore.reset()
    // localStorage svuotato
    expect(memoryStorage.getItem('fi:unlocks')).toBeNull()
    // dopo reset, qualsiasi reader auto-load → ricostruisce dai default
    expect(UnlockStore.getAllUnlocked()).toEqual(['aetherion', 'korvan'])
  })
})
