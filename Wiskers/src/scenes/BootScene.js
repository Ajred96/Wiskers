import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Fondo
        this.load.image('background', '/assets/background/fondo1.png');

        // Imagen estática (quieto)
        this.load.image('gatoIdle', '/assets/player/gatoBueno.png');

        // Cargar cada frame del gato caminando exportado desde Unity
        for (let i = 0; i < 20; i++) { // Ajusta 20 al número real de frames exportados
            this.load.image(`gatoWalk_${i}`, `/assets/player/gatoBuenoCaminando/gatoBuenoCaminando_${i}.png`);
        }

        // === Mundo (plataformas, escaleras, llaves, puerta) ===
        const g = this.make.graphics({x: 0, y: 0, add: false});

        // Plataforma
        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 0, 400, 16);
        g.generateTexture('platform', 400, 16);
        g.clear();

        // Escalera
        g.fillStyle(0x9bb3d1, 1);
        g.fillRect(0, 0, 24, 120);
        for (let y = 10; y < 120; y += 14) {
            g.fillStyle(0x6e85a8, 1);
            g.fillRect(2, y, 20, 3);
        }
        g.generateTexture('ladder', 24, 120);
        g.clear();

        // Llave
        g.fillStyle(0xffdd57, 1);
        g.fillRect(0, 0, 12, 6);
        g.fillCircle(12, 3, 5);
        g.generateTexture('key', 18, 12);
        g.clear();

        // Puerta
        g.fillStyle(0x6b3a2e, 1);
        g.fillRoundedRect(0, 0, 34, 54, 6);
        g.fillStyle(0x2b1813, 1);
        g.fillRect(6, 10, 22, 30);
        g.generateTexture('door', 34, 54);
        g.clear();
    }

    create() {
        // Animación caminando (usa los 20 frames)
        this.anims.create({
            key: 'player-walk',
            frames: Array.from({length: 20}, (_, i) => ({key: `gatoWalk_${i}`})),
            frameRate: 10,
            repeat: -1
        });

        // Animación quieto (usa la imagen estática)
        this.anims.create({
            key: 'player-idle',
            frames: [{key: 'gatoIdle'}],
            frameRate: 1,
            repeat: -1
        });

        // Ir a la escena del juego
        this.scene.start('GameScene');
    }
}
