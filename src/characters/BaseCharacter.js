import { TILE_SIZE, PLAYER_SPEED, MIN_ZOOM, MAX_ZOOM } from '../config/GameConfig.js'
import { KeyBindings } from '../config/KeyBindings.js'

export class BaseCharacter extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, width, height, color) {
    super(scene, x, y, width, height, color)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setCollideWorldBounds(false)

    this.wasd = {
      up:    scene.input.keyboard.addKey(KeyBindings.keyCode('up')),
      down:  scene.input.keyboard.addKey(KeyBindings.keyCode('down')),
      left:  scene.input.keyboard.addKey(KeyBindings.keyCode('left')),
      right: scene.input.keyboard.addKey(KeyBindings.keyCode('right')),
    }

    this._setupCamera(scene)
    this._setupZoom(scene)
    this.speed = PLAYER_SPEED
    this.facingX = 1
    this.facingY = 0
    this._lmbDown = false
    this._rmbDown = false
    this._setupMouseInput(scene)
  }

  _setupCamera(scene) {
    scene.cameras.main.startFollow(this, true, 0.1, 0.1)
  }

  _setupZoom(scene) {
    scene.input.on('wheel', (_pointer, _objs, _dx, deltaY) => {
      const cam = scene.cameras.main
      cam.zoom = Phaser.Math.Clamp(cam.zoom - deltaY * 0.001, MIN_ZOOM, MAX_ZOOM)
    })
  }

  _setupMouseInput(scene) {
    scene.game.canvas.addEventListener('contextmenu', e => e.preventDefault())
    scene.input.on('pointerdown', (pointer) => {
      if (pointer.button === 0) this._lmbDown = true
      if (pointer.button === 2) this._rmbDown = true
    })
    scene.input.on('pointerup', (pointer) => {
      if (pointer.button === 0) this._lmbDown = false
      if (pointer.button === 2) this._rmbDown = false
    })
  }

  handleMovement(scene) {
    const body = this.body
    let vx = 0
    let vy = 0

    if (this.wasd.left.isDown)  vx -= 1
    if (this.wasd.right.isDown) vx += 1
    if (this.wasd.up.isDown)    vy -= 1
    if (this.wasd.down.isDown)  vy += 1

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy)
      vx = (vx / len) * this.speed
      vy = (vy / len) * this.speed
      this.facingX = vx > 0 ? 1 : vx < 0 ? -1 : this.facingX
      this.facingY = vy > 0 ? 1 : vy < 0 ? -1 : this.facingY
    }

    // Wall collision via tile grid
    const nextX = this.x + vx * (1 / 60)
    const nextY = this.y + vy * (1 / 60)
    const tileX = Math.floor(nextX / TILE_SIZE)
    const tileY = Math.floor(nextY / TILE_SIZE)

    if (scene.isWalkable(tileX, tileY)) {
      body.setVelocity(vx, vy)
    } else {
      const tileXOnly = Math.floor(nextX / TILE_SIZE)
      const tileYCurr = Math.floor(this.y / TILE_SIZE)
      const tileCurrX = Math.floor(this.x / TILE_SIZE)
      const tileYOnly = Math.floor(nextY / TILE_SIZE)

      body.setVelocityX(scene.isWalkable(tileXOnly, tileYCurr) ? vx : 0)
      body.setVelocityY(scene.isWalkable(tileCurrX, tileYOnly) ? vy : 0)
    }
  }

  rebindMovement(scene) {
    Object.values(this.wasd).forEach(k => scene.input.keyboard.removeKey(k))
    this.wasd = {
      up:    scene.input.keyboard.addKey(KeyBindings.keyCode('up')),
      down:  scene.input.keyboard.addKey(KeyBindings.keyCode('down')),
      left:  scene.input.keyboard.addKey(KeyBindings.keyCode('left')),
      right: scene.input.keyboard.addKey(KeyBindings.keyCode('right')),
    }
  }

  update(scene) {
    this.handleMovement(scene)
  }
}
