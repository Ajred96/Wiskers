import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { UIManager } from '../systems/UIManager.js';

export default class EndScene extends Phaser.Scene {
    constructor() {
        super('EndScene');
    }

    preload() {
        this.load.audio('win', 'assets/sounds/win.mp3');
        this.load.audio('cat', 'assets/sounds/cat.mp3');
        this.load.image('background', 'assets/background/fondo1.png');
        this.load.image('floorTexture', '/assets/background/textures/floor.png');
        this.load.image('roomTexture', '/assets/background/textures/wall2.png');
        this.load.image('yarn', '/assets/others/bola.png');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        this.winSound = this.sound.add('win');
        this.catSound = this.sound.add('cat');

        this.winSound.play({ loop: false, volume: 0.8 });
        this.catSound.play({ loop: false, volume: 1 });

        this.physics.world.setBounds(0, 0, width, height - 30);

        // Pared (Wall 2)
        this.add.image(width / 2, height / 2, 'roomTexture')
            .setDisplaySize(width, height * 2)
            .setTint(0x7b5ba0);

        // Suelo (Floor)
        this.add.tileSprite(width / 2, height - 15, width, 90, 'floorTexture').setAlpha(1);

        // Partículas de estambre (caen desde arriba)
        const emitter = this.add.particles(0, 0, 'yarn', {
            x: { min: 0, max: width },
            y: -20,
            lifespan: 5000,
            speedY: { min: 100, max: 250 },
            scale: { start: 0.05, end: 0.15 },
            rotate: { start: 0, end: 360 },
            angle: { min: 0, max: 360 },
            frequency: 200,
            quantity: 1
        });
        emitter.setDepth(100);

        // Crear jugador en la posición inicial (izquierda) y en el suelo
        this.player = new Player(this, width / 2, height - 50);
        this.physics.add.existing(this.player);
        this.player.setCollideWorldBounds(true);

        // Cámara sigue al jugador
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, width, height);

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // Letrero de Victoria (Centro)
        this.ui = new UIManager(this);
        this.ui.showSign('¡Ganaste!', 'Abriste la puerta del ático 🎉', width / 2, height / 2);


        // Texto de volver (abajo)
        this.msg = this.add.text(width / 2, height - 250, 'Presiona E o ESC para volver', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ffffff',
            backgroundColor: '#5d3954'
        }).setOrigin(0.5).setPadding(10);

    }

    update() {
        const speed = 200;

        // Movimiento básico del jugador
        if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
        else if (this.cursors.right.isDown) this.player.setVelocityX(speed);
        else this.player.setVelocityX(0);

        if (this.cursors.up.isDown) this.player.setVelocityY(-speed);
        else if (this.cursors.down.isDown) this.player.setVelocityY(speed);
        else this.player.setVelocityY(0);

        // Opción para volver a la escena anterior
        if (Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keyESC)) {
            this.scene.start('GameScene'); // cambia 'GameScene' por la escena a la que quieras regresar
        }
    }
}
