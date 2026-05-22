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
    this._buildDetail()
    this._buildFooter()

    this.selectedIndex = this._firstUnlockedIndex()
    this._buildSelectionIndicator()
    this._setSelection(this.selectedIndex)
    this._wireInput()
  }

  _firstUnlockedIndex() {
    return CHARACTER_REGISTRY.findIndex(e => UnlockStore.isUnlocked(e.id))
  }

  _buildSelectionIndicator() {
    // Bordo sx 4px che scorre tra le righe
    this.selectionIndicator = this.add.rectangle(LIST_X - 6, LIST_TOP_Y, 4, ROW_HEIGHT, 0xffffff)
      .setOrigin(0, 0)
      .setAlpha(0.9)
    // Anche un overlay sottile per la riga selezionata
    this.selectionBg = this.add.rectangle(LIST_X, LIST_TOP_Y, LIST_WIDTH, ROW_HEIGHT, 0xffffff, 0.08)
      .setOrigin(0, 0)
  }

  _setSelection(index) {
    if (index < 0 || index >= CHARACTER_REGISTRY.length) return

    // ripristina background delle altre righe
    this.rows.forEach((r, i) => {
      if (i !== index) r.bg.setFillStyle(COLOR_ROW_DEFAULT)
    })

    this.selectedIndex = index
    const row = this.rows[index]
    const entry = row.entry
    const accent = hexToNumber(entry.accentColor)

    this.selectionIndicator.setFillStyle(accent)
    this.selectionIndicator.y = row.y
    this.selectionBg.y = row.y
    this.selectionBg.setFillStyle(accent, 0.18)

    this._renderDetail(entry)
  }

  _wireInput() {
    this.input.keyboard.on('keydown-UP',    () => this._move(-1))
    this.input.keyboard.on('keydown-DOWN',  () => this._move(+1))
    this.input.keyboard.on('keydown-W',     () => this._move(-1))
    this.input.keyboard.on('keydown-S',     () => this._move(+1))
    this.input.keyboard.on('keydown-ENTER', () => this._startRun())
    this.input.keyboard.on('keydown-SPACE', () => this._startRun())
    this.input.keyboard.on('keydown-TAB',   (e) => {
      e.preventDefault?.()
      if (!this.scene.isActive('SettingsScene')) {
        this.scene.pause()
        this.scene.launch('SettingsScene')
      }
    })
  }

  _move(delta) {
    const n = CHARACTER_REGISTRY.length
    const next = (this.selectedIndex + delta + n) % n
    this._setSelection(next)
  }

  _startRun() {
    const entry = CHARACTER_REGISTRY[this.selectedIndex]
    if (!UnlockStore.isUnlocked(entry.id)) {
      // feedback "locked" — Task 13
      return
    }
    this.scene.start('GameScene', { characterId: entry.id })
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

  _buildDetail() {
    // Container vuoto — i contenuti vengono ricostruiti in _renderDetail
    this.detailObjects = []
  }

  _renderDetail(entry) {
    // Distruggi i text objects precedenti
    this.detailObjects.forEach(o => o.destroy())
    this.detailObjects = []

    const unlocked = UnlockStore.isUnlocked(entry.id)
    const accent = entry.accentColor
    let y = LIST_TOP_Y

    // Nome grande
    const name = this.add.text(DETAIL_X, y, entry.name, {
      fontSize: '48px',
      color: unlocked ? accent : '#444455',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    })
    this.detailObjects.push(name)
    y += 60

    // Tagline
    const tagline = this.add.text(DETAIL_X, y, entry.tagline, {
      fontSize: '20px',
      color: unlocked ? '#cccccc' : '#666677',
      fontFamily: 'monospace',
    })
    this.detailObjects.push(tagline)
    y += 36

    // Divisoria
    const divider = this.add.rectangle(DETAIL_X, y, 500, 1, 0x333344).setOrigin(0, 0)
    this.detailObjects.push(divider)
    y += 16

    if (unlocked) {
      // Playstyle (word-wrapped)
      const playstyle = this.add.text(DETAIL_X, y, entry.playstyle, {
        fontSize: '15px',
        color: COLOR_TEXT_SECONDARY,
        fontFamily: 'monospace',
        wordWrap: { width: 600 },
      })
      this.detailObjects.push(playstyle)
      y += playstyle.height + 24

      // Abilities header
      const header = this.add.text(DETAIL_X, y, 'ABILITIES', {
        fontSize: '13px',
        color: '#777777',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      this.detailObjects.push(header)
      y += 24

      // Abilities table
      for (const [key, label] of Object.entries(entry.abilities)) {
        const keyText = this.add.text(DETAIL_X, y, key.padEnd(5, ' '), {
          fontSize: '15px',
          color: accent,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        const labelText = this.add.text(DETAIL_X + 60, y, label, {
          fontSize: '15px',
          color: '#eeeeee',
          fontFamily: 'monospace',
        })
        this.detailObjects.push(keyText, labelText)
        y += 22
      }
    } else {
      // Box bloccato
      y += 40
      const lockBox = this.add.rectangle(DETAIL_X + 250, y, 400, 100, 0x000000, 0)
        .setStrokeStyle(1, 0x555566)
        .setOrigin(0.5, 0)
      this.detailObjects.push(lockBox)

      const lockTitle = this.add.text(DETAIL_X + 250, y + 24, '🔒  BLOCCATO', {
        fontSize: '20px',
        color: '#888899',
        fontFamily: 'monospace',
      }).setOrigin(0.5, 0)
      this.detailObjects.push(lockTitle)

      const hint = this.add.text(DETAIL_X + 250, y + 60, entry.unlockHint ?? 'Sblocca giocando.', {
        fontSize: '14px',
        color: '#777788',
        fontFamily: 'monospace',
        wordWrap: { width: 380 },
        align: 'center',
      }).setOrigin(0.5, 0)
      this.detailObjects.push(hint)
    }
  }

  _buildList() {
    this.rows = []

    CHARACTER_REGISTRY.forEach((entry, i) => {
      const y = LIST_TOP_Y + i * ROW_STRIDE
      const unlocked = UnlockStore.isUnlocked(entry.id)
      const accent = hexToNumber(entry.accentColor)

      const bg = this.add.rectangle(LIST_X, y, LIST_WIDTH, ROW_HEIGHT, COLOR_ROW_DEFAULT)
        .setOrigin(0, 0)

      bg.setInteractive({ useHandCursor: true })

      bg.on('pointerover', () => {
        if (this.selectedIndex !== i) bg.setFillStyle(COLOR_ROW_HOVER)
      })

      bg.on('pointerout', () => {
        if (this.selectedIndex !== i) bg.setFillStyle(COLOR_ROW_DEFAULT)
      })

      bg.on('pointerdown', (pointer) => {
        this._setSelection(i)
        if (pointer.button === 0 && this._lastClickIndex === i && Date.now() - (this._lastClickTime ?? 0) < 350) {
          // double-click
          this._startRun()
        }
        this._lastClickIndex = i
        this._lastClickTime = Date.now()
      })

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
