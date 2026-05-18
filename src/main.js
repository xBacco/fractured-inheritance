import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from './config/GameConfig.js'

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: []
}

new Phaser.Game(config)
