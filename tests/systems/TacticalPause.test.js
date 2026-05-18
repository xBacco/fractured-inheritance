import { describe, it, expect } from 'vitest'
import { TacticalPause } from '../../src/systems/TacticalPause.js'

const mockScene = () => ({
  physics: { world: { timeScale: 1 } },
  input: { activePointer: { x: 0, y: 0 } },
  cameras: { main: { zoom: 1, scrollX: 0, scrollY: 0 } }
})

describe('TacticalPause', () => {
  it('inizia inattiva', () => {
    const tp = new TacticalPause(mockScene())
    expect(tp.active).toBe(false)
  })

  it('activate imposta timeScale a TACTICAL_TIME_SCALE', () => {
    const scene = mockScene()
    const tp = new TacticalPause(scene)
    tp.activate()
    expect(tp.active).toBe(true)
    expect(scene.physics.world.timeScale).toBe(0.08)
  })

  it('deactivate ripristina timeScale a 1', () => {
    const scene = mockScene()
    const tp = new TacticalPause(scene)
    tp.activate()
    tp.deactivate()
    expect(tp.active).toBe(false)
    expect(scene.physics.world.timeScale).toBe(1)
  })

  it('tiene traccia del tempo totale in pausa tattica', () => {
    const scene = mockScene()
    const tp = new TacticalPause(scene)
    tp.activate()
    tp.update(500)
    tp.update(300)
    tp.deactivate()
    expect(tp.totalTacticalMs).toBe(800)
  })

  it('non accumula tempo quando inattiva', () => {
    const scene = mockScene()
    const tp = new TacticalPause(scene)
    tp.update(1000)
    expect(tp.totalTacticalMs).toBe(0)
  })
})
