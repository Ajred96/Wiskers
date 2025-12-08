import Phaser from 'phaser';
import BootScene from './src/scenes/BootScene.js';
import GameScene from './src/scenes/GameScene.js';
import EndScene from './src/scenes/EndScene.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#1f3c5b',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 960,
        height: 540
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 },
            debug: false
        }
    },
    scene: [BootScene, GameScene, EndScene]
};

new Phaser.Game(config);
