export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }) }

  preload() {
    // nessun asset esterno — usiamo Graphics
  }

  create() {
    this.scene.start('GameScene')
  }
}
