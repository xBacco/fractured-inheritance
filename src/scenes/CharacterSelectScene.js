import { CHARACTER_REGISTRY, getCharacter } from '../config/CharacterRegistry.js'
import { UnlockStore } from '../systems/UnlockStore.js'

const HEADER_HEIGHT = 80
const FOOTER_HEIGHT = 80
const LIST_X        = 80
const LIST_WIDTH    = 440
const DETAIL_X      = 540
const DETAIL_WIDTH  = 660
const ROW_HEIGHT    = 60
const ROW_STRIDE    = 70

export class CharacterSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'CharacterSelectScene' }) }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0d1a)

    // Placeholder header — definitivo in Task 8
    this.add.text(this.cameras.main.width / 2, 40,
      'FRACTURED INHERITANCE — SELECT CHARACTER',
      { fontSize: '20px', color: '#ffffff', fontFamily: 'monospace' }
    ).setOrigin(0.5)

    // Placeholder: avvia GameScene con il primo unlocked al press di SPACE
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2,
      '[ CharSelect placeholder — premi SPACE per Aetherion ]',
      { fontSize: '16px', color: '#666666', fontFamily: 'monospace' }
    ).setOrigin(0.5)

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { characterId: 'aetherion' })
    })
  }
}
