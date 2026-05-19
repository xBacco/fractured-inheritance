import { TACTICAL_TIME_SCALE } from '../config/GameConfig.js'

export class TacticalPause {
  constructor(scene) {
    this.scene = scene
    this.active = false
    this.totalTacticalMs = 0
    scene.game.loop.timeScale = 1
  }

  activate() {
    if (this.active) return
    this.active = true
    this.scene.game.loop.timeScale = TACTICAL_TIME_SCALE
  }

  deactivate() {
    if (!this.active) return
    this.active = false
    this.scene.game.loop.timeScale = 1
  }

  toggle() {
    this.active ? this.deactivate() : this.activate()
  }

  update(deltaMs) {
    if (this.active) this.totalTacticalMs += deltaMs
  }

  getTacticalSeconds() {
    return this.totalTacticalMs / 1000
  }
}
