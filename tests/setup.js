// Minimal Phaser stub for vitest — character classes extend Phaser.GameObjects.Rectangle
// but the registry only stores their constructors; no instantiation happens during tests.
if (typeof globalThis.Phaser === 'undefined') {
  globalThis.Phaser = {
    GameObjects: {
      Rectangle: class Rectangle {
        constructor() {}
      },
    },
    Math: {
      Clamp: (v, min, max) => Math.min(Math.max(v, min), max),
    },
  }
}
