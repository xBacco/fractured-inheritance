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

const COLOR_BG               = 0x0d0d1a
const COLOR_TEXT_PRIMARY     = '#ffffff'
const COLOR_TEXT_SECONDARY   = '#aaaaaa'
const COLOR_TEXT_MUTED       = '#666666'

export class CharacterSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'CharacterSelectScene' }) }

  create() {
    this.cameras.main.setBackgroundColor(COLOR_BG)
    this._buildHeader()
    this._buildFooter()

    // Placeholder body — i task 9-13 lo riempiono
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2,
      '[ list + detail vengono nel prossimo task ]',
      { fontSize: '14px', color: COLOR_TEXT_MUTED, fontFamily: 'monospace' }
    ).setOrigin(0.5)

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { characterId: 'aetherion' })
    })
  }

  _buildHeader() {
    const cx = this.cameras.main.width / 2

    this.add.text(cx, 28, 'FRACTURED INHERITANCE', {
      fontSize: '28px',
      color: COLOR_TEXT_PRIMARY,
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(cx, 58, '── SELECT CHARACTER ──', {
      fontSize: '14px',
      color: COLOR_TEXT_SECONDARY,
      fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  _buildFooter() {
    const cx = this.cameras.main.width / 2
    const cy = this.cameras.main.height - FOOTER_HEIGHT / 2

    this.add.text(cx, cy,
      '↑/↓  navigate     ENTER  start     TAB  settings',
      { fontSize: '14px', color: COLOR_TEXT_MUTED, fontFamily: 'monospace' }
    ).setOrigin(0.5)
  }
}
