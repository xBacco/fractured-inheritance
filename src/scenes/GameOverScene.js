import { UnlockStore } from '../systems/UnlockStore.js'
import { getCharacter } from '../config/CharacterRegistry.js'

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }) }

  init(data) {
    this.finalScore    = data?.score ?? 0
    this.characterId   = data?.characterId ?? 'aetherion'
    this.runMeta       = data?.runMeta ?? { floorReached: 1, completed: false, durationMs: 0 }
    this.newlyUnlocked = UnlockStore.recordRun(this.characterId, this.runMeta)
  }

  create() {
    const { width, height } = this.cameras.main

    this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      fontSize: '48px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 - 20, `Punteggio: ${this.finalScore}`, {
      fontSize: '24px', color: '#aaaaaa', fontFamily: 'monospace'
    }).setOrigin(0.5)

    if (this.newlyUnlocked.length > 0) {
      const id = this.newlyUnlocked[0]
      const entry = getCharacter(id)
      const celebration = this.add.text(width / 2, height / 2 + 30,
        `★ NUOVO PG SBLOCCATO: ${entry.name} ★`,
        { fontSize: '22px', color: entry.accentColor, fontFamily: 'monospace' }
      ).setOrigin(0.5)
      this.tweens.add({
        targets: celebration,
        scale: 1.08,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    this.add.text(width / 2, height / 2 + 90, 'R: riprova stesso PG', {
      fontSize: '16px', color: '#666666', fontFamily: 'monospace'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 120, 'Esc: torna a selezione PG', {
      fontSize: '16px', color: '#666666', fontFamily: 'monospace'
    }).setOrigin(0.5)

    this.input.keyboard.once('keydown-R', () => {
      this.scene.start('GameScene', { characterId: this.characterId })
    })
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.start('CharacterSelectScene')
    })
  }
}
