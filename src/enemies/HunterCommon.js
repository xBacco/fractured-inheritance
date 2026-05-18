import { BaseEnemy } from './BaseEnemy.js'

export class HunterCommon extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 18, 18, 0xaa6633, 60, 10, 90)
  }
}
