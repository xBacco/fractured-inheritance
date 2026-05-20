import { EsecutoreComune } from './EsecutoreComune.js'

export class EsecutoreLeader extends EsecutoreComune {
  constructor(scene, x, y) {
    // Call parent with Leader stats: size 22x22, color 0x3a4050, hp 108, damage 15, speed 85
    super(scene, x, y)

    // Override base properties from parent
    this.setSize(22, 22)
    this.setFillStyle(0x3a4050)
    this.hp = 108
    this.maxHp = 108
    this.damage = 15
    this.speed = 85

    // Update physics body to match new size
    if (this.body) {
      this.body.setSize(22, 22)
    }

    // Mark as leader and force slot
    this._isLeader = true
    this._slot = 'fronte'

    // Replace decorations with Leader-sized versions
    this._eyeL.destroy()
    this._eyeR.destroy()
    this._seal.destroy()

    // Leader eye positions: left at (x-6, y-6), right at (x+3, y-6)
    // Seal at (x, y+4), size 4x4
    this._eyeL = scene.add.rectangle(x - 6, y - 6, 2, 2, 0xffffff).setDepth(1)
    this._eyeR = scene.add.rectangle(x + 3, y - 6, 2, 2, 0xffffff).setDepth(1)
    this._seal = scene.add.rectangle(x, y + 4, 4, 4, 0x9090c0).setDepth(1)

    this._updateDegradation()
  }

  _syncDecorations() {
    this._eyeL.setPosition(this.x - 6, this.y - 6)
    this._eyeR.setPosition(this.x + 3, this.y - 6)
    this._seal.setPosition(this.x, this.y + 4)
  }

  _updateDegradation() {
    const pct = this.hp / this.maxHp
    // Leader thresholds: >70% Operativo, 41-70% Degrado, 1-40% Critico
    if (pct > 0.7) {
      // Operativo: both eyes white, seal blue
      this._eyeL.fillColor = 0xffffff
      this._eyeR.fillColor = 0xffffff
      this._seal.fillColor = 0x9090c0
    } else if (pct > 0.4) {
      // Degrado: left eye dark, right eye white, seal blue
      this._eyeL.fillColor = 0x222222
      this._eyeR.fillColor = 0xffffff
      this._seal.fillColor = 0x9090c0
    } else {
      // Critico: both eyes dark, seal darker
      this._eyeL.fillColor = 0x222222
      this._eyeR.fillColor = 0x222222
      this._seal.fillColor = 0x333333
    }
  }
}
