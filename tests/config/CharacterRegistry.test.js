import { describe, it, expect } from 'vitest'
import { CHARACTER_REGISTRY, getCharacter } from '../../src/config/CharacterRegistry.js'

describe('CharacterRegistry — struttura', () => {
  it('contiene 7 PG', () => {
    expect(CHARACTER_REGISTRY).toHaveLength(7)
  })

  it('tutti gli id sono univoci', () => {
    const ids = CHARACTER_REGISTRY.map(e => e.id)
    expect(new Set(ids).size).toBe(7)
  })

  it('ogni entry ha campi obbligatori', () => {
    for (const e of CHARACTER_REGISTRY) {
      expect(typeof e.id).toBe('string')
      expect(typeof e.name).toBe('string')
      expect(typeof e.tagline).toBe('string')
      expect(typeof e.playstyle).toBe('string')
      expect(typeof e.classRef).toBe('function')
      expect(typeof e.abilities).toBe('object')
      expect(typeof e.unlockedByDefault).toBe('boolean')
      expect(typeof e.accentColor).toBe('string')
      expect(typeof e.cardImage).toBe('string')
    }
  })

  it('aetherion e korvan sono unlockedByDefault', () => {
    expect(getCharacter('aetherion').unlockedByDefault).toBe(true)
    expect(getCharacter('korvan').unlockedByDefault).toBe(true)
  })

  it('gli altri 5 non sono unlockedByDefault e hanno unlockHint non-null', () => {
    const lockedIds = ['mira', 'damian', 'silas', 'zeryth', 'veyra']
    for (const id of lockedIds) {
      const e = getCharacter(id)
      expect(e.unlockedByDefault).toBe(false)
      expect(typeof e.unlockHint).toBe('string')
    }
  })

  it('getCharacter ritorna undefined per id sconosciuto', () => {
    expect(getCharacter('nonesiste')).toBeUndefined()
  })
})
