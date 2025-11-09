import Phaser from 'phaser';
import Player from '../entities/Player.js';

export default class MultiFloorScene extends Phaser.Scene {
    constructor() {
        super('MultiFloorScene');
    }

    preload() {
        
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        this.physics.world.setBounds(0, 0, width, height/2);
        // Fondo simple
        this.add.rectangle(width / 2, height / 2, width, height, 0x1d1f2a);

        // Crear jugador
        this.player = new Player(this, width / 2, height - 100);
        this.physics.add.existing(this.player);
        this.player.setCollideWorldBounds(true);

        // Cámara sigue al jugador
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, width, height);

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // Texto de volver
        this.add.text(width / 2, 30, 'Presiona E o ESC para volver', {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#ffffff'
        }).setOrigin(0.5, 0);
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
