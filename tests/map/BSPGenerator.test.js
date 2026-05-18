import { describe, it, expect } from 'vitest'
import { BSPGenerator } from '../../src/map/BSPGenerator.js'

describe('BSPGenerator', () => {
  it('genera almeno una stanza', () => {
    const gen = new BSPGenerator(80, 60)
    const { rooms } = gen.generate()
    expect(rooms.length).toBeGreaterThan(0)
  })

  it('tutte le stanze hanno dimensioni positive', () => {
    const gen = new BSPGenerator(80, 60)
    const { rooms } = gen.generate()
    for (const room of rooms) {
      expect(room.width).toBeGreaterThan(0)
      expect(room.height).toBeGreaterThan(0)
    }
  })

  it('i corridoi collegano centri di stanze', () => {
    const gen = new BSPGenerator(80, 60)
    const { corridors } = gen.generate()
    expect(corridors.length).toBeGreaterThan(0)
    for (const c of corridors) {
      expect(c.from).toHaveProperty('x')
      expect(c.from).toHaveProperty('y')
      expect(c.to).toHaveProperty('x')
      expect(c.to).toHaveProperty('y')
    }
  })

  it('le stanze restano nei limiti della mappa', () => {
    const gen = new BSPGenerator(80, 60)
    const { rooms } = gen.generate()
    for (const room of rooms) {
      expect(room.x).toBeGreaterThanOrEqual(0)
      expect(room.y).toBeGreaterThanOrEqual(0)
      expect(room.x + room.width).toBeLessThanOrEqual(80)
      expect(room.y + room.height).toBeLessThanOrEqual(60)
    }
  })
})
