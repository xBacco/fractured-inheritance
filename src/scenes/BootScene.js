import { KeyBindings } from '../config/KeyBindings.js'
import { UnlockStore } from '../systems/UnlockStore.js'

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }) }

  preload() {
    // nessun asset esterno — usiamo Graphics
  }

  create() {
    KeyBindings.load()
    UnlockStore.load()
    this.game.canvas.addEventListener('contextmenu', e => e.preventDefault())
    this.scene.start('CharacterSelectScene')
  }
}
