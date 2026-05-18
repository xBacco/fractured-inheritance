export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }) }

  init(data) {
    this.finalScore = data.score ?? 0
  }

  create() {
    const { width, height } = this.cameras.main

    this.add.text(width / 2, height / 2 - 40, 'GAME OVER', {
      fontSize: '48px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 20, `Punteggio: ${this.finalScore}`, {
      fontSize: '24px', color: '#aaaaaa', fontFamily: 'monospace'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 70, 'Premi R per riprovare', {
      fontSize: '16px', color: '#666666', fontFamily: 'monospace'
    }).setOrigin(0.5)

    this.input.keyboard.once('keydown-R', () => {
      this.scene.start('GameScene')
    })
  }
}
