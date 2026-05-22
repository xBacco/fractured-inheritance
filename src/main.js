import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js'
import { GameScene } from './scenes/GameScene.js'
import { GameOverScene } from './scenes/GameOverScene.js'
import { SettingsScene } from './scenes/SettingsScene.js'
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
  scene: [BootScene, CharacterSelectScene, GameScene, GameOverScene, SettingsScene]
}

window.__game = new Phaser.Game(config)
