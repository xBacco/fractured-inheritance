const SLOT_DIST = 64
const SLOT_ORDER = ['fronte', 'fianco_sx', 'fianco_dx', 'retro']
const SLOT_ROTATION = { fronte: 0, fianco_sx: Math.PI / 2, fianco_dx: -Math.PI / 2, retro: Math.PI }

export class FormationSystem {
  constructor() {
    this._units = []       // [{ unit, slot }]
    this.leaderless = false
    this._paused = false
    this._pauseTimer = 0
  }

  /** Call once per unit when spawning the group. */
  addUnit(unit, slot) {
    this._units.push({ unit, slot })
    unit._formation = this
    unit._slot = slot
  }

  /** Called by a unit inside its _die(). */
  onUnitDied(deadUnit) {
    this._units = this._units.filter(u => u.unit !== deadUnit)
    if (deadUnit._isLeader) this.leaderless = true
    this._paused = true
    this._pauseTimer = this.leaderless ? 800 : 600
    this._reassignSlots()
  }

  isPaused() { return this._paused }

  /** Returns the world-space target position for a slot this frame. */
  getSlotTarget(slot, playerX, playerY) {
    const c = this._centroid()
    const angle = Math.atan2(c.y - playerY, c.x - playerX)
    const rot = SLOT_ROTATION[slot] ?? 0
    return {
      x: playerX + Math.cos(angle + rot) * SLOT_DIST,
      y: playerY + Math.sin(angle + rot) * SLOT_DIST
    }
  }

  /** Must be called each frame from GameScene.update(). */
  update(delta) {
    if (!this._paused) return
    this._pauseTimer -= delta
    if (this._pauseTimer <= 0) this._paused = false
  }

  _centroid() {
    const alive = this._units.filter(u => u.unit.alive)
    if (alive.length === 0) return { x: 0, y: 0 }
    const sum = alive.reduce((a, u) => ({ x: a.x + u.unit.x, y: a.y + u.unit.y }), { x: 0, y: 0 })
    return { x: sum.x / alive.length, y: sum.y / alive.length }
  }

  _reassignSlots() {
    const alive = this._units.filter(u => u.unit.alive)
    const leaderEntry = alive.find(u => u.unit._isLeader)
    if (leaderEntry) {
      leaderEntry.slot = 'fronte'
      leaderEntry.unit._slot = 'fronte'
    }
    alive.filter(u => !u.unit._isLeader).forEach((entry, i) => {
      const slot = SLOT_ORDER[leaderEntry ? i + 1 : i] ?? 'fianco_sx'
      entry.slot = slot
      entry.unit._slot = slot
    })
  }
}
