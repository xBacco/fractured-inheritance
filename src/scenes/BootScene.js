import { KeyBindings } from '../config/KeyBindings.js'

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }) }

  preload() {
    // nessun asset esterno — usiamo Graphics
  }

  create() {
    KeyBindings.load()
    this.scene.start('GameScene')
  }
}
