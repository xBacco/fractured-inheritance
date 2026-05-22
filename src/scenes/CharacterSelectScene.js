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
const LIST_TOP_Y    = HEADER_HEIGHT + 20

const COLOR_BG               = 0x0d0d1a
const COLOR_ROW_DEFAULT      = 0x14141f
const COLOR_ROW_HOVER        = 0x1c1c2a
const COLOR_TEXT_PRIMARY     = '#ffffff'
const COLOR_TEXT_SECONDARY   = '#aaaaaa'
const COLOR_TEXT_MUTED       = '#666666'
const COLOR_TEXT_LOCKED      = '#666677'
const COLOR_TEXT_LOCKED_SUB  = '#555566'

function hexToNumber(hex) {
  // '#c44' → 0xcc4444  ;  '#ffeeaa' → 0xffeeaa
  let s = hex.replace('#', '')
  if (s.length === 3) s = s.split('').map(c => c + c).join('')
  return parseInt(s, 16)
}

export class CharacterSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'CharacterSelectScene' }) }

  create() {
    this.cameras.main.setBackgroundColor(COLOR_BG)
    this._buildHeader()
    this._buildList()
    this._buildFooter()

    // Placeholder detail (Task 10)
    this.add.text(DETAIL_X + 20, LIST_TOP_Y,
      '[ detail panel nel prossimo task ]',
      { fontSize: '14px', color: COLOR_TEXT_MUTED, fontFamily: 'monospace' }
    )

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { characterId: 'aetherion' })
    })
  }

  _buildHeader() {
    const cx = this.cameras.main.width / 2
    this.add.text(cx, 28, 'FRACTURED INHERITANCE', {
      fontSize: '28px', color: COLOR_TEXT_PRIMARY, fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.add.text(cx, 58, '── SELECT CHARACTER ──', {
      fontSize: '14px', color: COLOR_TEXT_SECONDARY, fontFamily: 'monospace',
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

  _buildList() {
    this.rows = []

    CHARACTER_REGISTRY.forEach((entry, i) => {
      const y = LIST_TOP_Y + i * ROW_STRIDE
      const unlocked = UnlockStore.isUnlocked(entry.id)
      const accent = hexToNumber(entry.accentColor)

      const bg = this.add.rectangle(LIST_X, y, LIST_WIDTH, ROW_HEIGHT, COLOR_ROW_DEFAULT)
        .setOrigin(0, 0)

      const accentStripe = this.add.rectangle(LIST_X, y + 10, 4, ROW_HEIGHT - 20, accent)
        .setOrigin(0, 0)
        .setAlpha(0.5)

      const nameColor = unlocked ? COLOR_TEXT_PRIMARY : COLOR_TEXT_LOCKED
      const taglineColor = unlocked ? COLOR_TEXT_SECONDARY : COLOR_TEXT_LOCKED_SUB

      const nameText = this.add.text(LIST_X + 20, y + 10, entry.name, {
        fontSize: '20px',
        color: nameColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })

      const taglineText = this.add.text(LIST_X + 20, y + 34, entry.tagline, {
        fontSize: '13px',
        color: taglineColor,
        fontFamily: 'monospace',
      })

      let lockIcon = null
      if (!unlocked) {
        lockIcon = this.add.text(LIST_X + LIST_WIDTH - 30, y + ROW_HEIGHT / 2, '🔒', {
          fontSize: '20px',
        }).setOrigin(0.5)
      }

      this.rows.push({ entry, unlocked, bg, accentStripe, nameText, taglineText, lockIcon, y })
    })
  }
}
