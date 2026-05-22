import { KeyBindings } from '../config/KeyBindings.js'

const ACTIONS = [
  { action: 'up',       label: 'Sali' },
  { action: 'down',     label: 'Scendi' },
  { action: 'left',     label: 'Sinistra' },
  { action: 'right',    label: 'Destra' },
  { action: 'ability1', label: 'Abilità 1 (Q)' },
  { action: 'ability2', label: 'Abilità 2 (R)' },
  { action: 'ability3', label: 'Fase / Trasf. (F)' },
  { action: 'interact', label: 'Interagisci (E)' },
  { action: 'pause',    label: 'Pausa Tattica' },
]

export class SettingsScene extends Phaser.Scene {
  constructor() { super({ key: 'SettingsScene' }) }

  init(data) {
    this._launcherKey = data?.from ?? 'GameScene'
  }

  create() {
    this._pending = KeyBindings.all()
    this._listening = null
    this._keyBtns = {}
    this._buildUI()
    this.input.keyboard.on('keydown', this._onKey, this)
  }

  _buildUI() {
    const W = this.cameras.main.width
    const H = this.cameras.main.height
    const PW = 440, PH = 460
    const PX = W / 2, PY = H / 2

    this.add.rectangle(PX, PY, W, H, 0x000000, 0.72).setScrollFactor(0)
    this.add.rectangle(PX, PY, PW, PH, 0x0a0a18).setScrollFactor(0)
      .setStrokeStyle(1, 0x33334a)

    this.add.text(PX, PY - PH / 2 + 24, 'CONTROLLI', {
      fontSize: '15px', color: '#9999cc', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0)

    this.add.text(PX, PY - PH / 2 + 46, 'TAB — chiudi  |  click su un tasto per rimappare', {
      fontSize: '10px', color: '#444466', fontFamily: 'monospace'
    }).setOrigin(0.5, 0.5).setScrollFactor(0)

    const rowStart = PY - PH / 2 + 82
    ACTIONS.forEach(({ action, label }, i) => {
      const ry = rowStart + i * 32
      this.add.text(PX - 100, ry, label, {
        fontSize: '12px', color: '#7777aa', fontFamily: 'monospace'
      }).setOrigin(0, 0.5).setScrollFactor(0)

      const btn = this.add.rectangle(PX + 90, ry, 110, 22, 0x1a1a32)
        .setScrollFactor(0).setInteractive({ useHandCursor: true })
      const btnTxt = this.add.text(PX + 90, ry, this._pending[action] ?? '', {
        fontSize: '11px', color: '#bbbbee', fontFamily: 'monospace'
      }).setOrigin(0.5, 0.5).setScrollFactor(0)

      btn.on('pointerdown', () => this._startListen(action))
      btn.on('pointerover', () => { if (this._listening !== action) btn.setFillStyle(0x252545) })
      btn.on('pointerout',  () => { if (this._listening !== action) btn.setFillStyle(0x1a1a32) })
      this._keyBtns[action] = { btn, txt: btnTxt }
    })

    const resetBtn = this.add.rectangle(PX - 80, PY + PH / 2 - 30, 130, 26, 0x2a0e0e)
      .setScrollFactor(0).setInteractive({ useHandCursor: true })
    this.add.text(PX - 80, PY + PH / 2 - 30, 'Ripristina', {
      fontSize: '11px', color: '#cc6666', fontFamily: 'monospace'
    }).setOrigin(0.5, 0.5).setScrollFactor(0)
    resetBtn.on('pointerdown', () => this._reset())
    resetBtn.on('pointerover', () => resetBtn.setFillStyle(0x3a1414))
    resetBtn.on('pointerout',  () => resetBtn.setFillStyle(0x2a0e0e))

    const saveBtn = this.add.rectangle(PX + 80, PY + PH / 2 - 30, 130, 26, 0x0e2a0e)
      .setScrollFactor(0).setInteractive({ useHandCursor: true })
    this.add.text(PX + 80, PY + PH / 2 - 30, 'Salva e Chiudi', {
      fontSize: '11px', color: '#66cc66', fontFamily: 'monospace'
    }).setOrigin(0.5, 0.5).setScrollFactor(0)
    saveBtn.on('pointerdown', () => this._saveAndClose())
    saveBtn.on('pointerover', () => saveBtn.setFillStyle(0x143a14))
    saveBtn.on('pointerout',  () => saveBtn.setFillStyle(0x0e2a0e))
  }

  _startListen(action) {
    if (this._listening) this._cancelListen()
    this._listening = action
    const { btn, txt } = this._keyBtns[action]
    btn.setFillStyle(0x2a2a0a)
    txt.setText('...')
  }

  _cancelListen() {
    if (!this._listening) return
    const action = this._listening
    this._listening = null
    const { btn, txt } = this._keyBtns[action]
    btn.setFillStyle(0x1a1a32)
    txt.setText(this._pending[action] ?? '')
  }

  _onKey(event) {
    if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.TAB) {
      this._saveAndClose()
      return
    }
    if (!this._listening) return
    if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) {
      this._cancelListen()
      return
    }
    const name = _keyCodeToName(event.keyCode)
    if (!name) return
    const action = this._listening
    this._listening = null
    this._pending[action] = name
    const { btn, txt } = this._keyBtns[action]
    btn.setFillStyle(0x1a1a32)
    txt.setText(name)
  }

  _reset() {
    this._cancelListen()
    this._pending = KeyBindings.defaults()
    ACTIONS.forEach(({ action }) => {
      this._keyBtns[action].btn.setFillStyle(0x1a1a32)
      this._keyBtns[action].txt.setText(this._pending[action] ?? '')
    })
  }

  _saveAndClose() {
    this._cancelListen()
    ACTIONS.forEach(({ action }) => KeyBindings.set(action, this._pending[action]))
    KeyBindings.save()
    const game = this.scene.get('GameScene')
    if (game) game.events.emit('keybindings-updated')
    this.scene.resume(this._launcherKey)
    this.scene.stop()
  }
}

function _keyCodeToName(keyCode) {
  const codes = Phaser.Input.Keyboard.KeyCodes
  for (const [name, code] of Object.entries(codes)) {
    if (code === keyCode) return name
  }
  return null
}
