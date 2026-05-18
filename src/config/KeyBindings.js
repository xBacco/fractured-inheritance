const DEFAULTS = {
  up:     'W',
  down:   'S',
  left:   'A',
  right:  'D',
  attack: 'J',
  blood:  'K',
  pause:  'SPACE',
}

const STORAGE_KEY = 'fi_keybindings'

export const KeyBindings = {
  _bindings: null,

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      this._bindings = stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS }
    } catch {
      this._bindings = { ...DEFAULTS }
    }
    return this
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._bindings))
  },

  get(action) {
    if (!this._bindings) this.load()
    return this._bindings[action] ?? DEFAULTS[action]
  },

  set(action, keyName) {
    if (!this._bindings) this.load()
    this._bindings[action] = keyName
  },

  keyCode(action) {
    return Phaser.Input.Keyboard.KeyCodes[this.get(action)]
  },

  all() {
    if (!this._bindings) this.load()
    return { ...this._bindings }
  },

  defaults() {
    return { ...DEFAULTS }
  },
}
