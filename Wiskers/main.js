import Phaser from 'phaser';
import BootScene from './src/scenes/BootScene.js';
import GameScene from './src/scenes/GameScene.js';
import MultiFloorScene from './src/scenes/MultiFloorScene.js';

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
            debug: true
        }
    },
    scene: [BootScene, GameScene,MultiFloorScene]
};

new Phaser.Game(config);
