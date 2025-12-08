import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {

        // Imagen estática (quieto)
        this.load.image('gatoIdle', '/assets/player/gatoBueno.png');
        // Gato agachado
        this.load.image('gatoCrouch', '/assets/player/gatoAgachado.png');

        // Cargar cada frame del gato caminando exportado desde Unity
        for (let i = 0; i < 20; i++) {
            this.load.image(`gatoWalk_${i}`, `/assets/player/gatoBuenoCaminando/gatoBuenoCaminando_${i}.png`);
        }

        // === Mundo (plataformas, puerta) ===
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Plataforma
        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 0, 400, 16);
        g.generateTexture('platform', 400, 16);
        g.clear();

        // Puerta
        this.load.image('door', '/assets/others/puerta.png');
    }

    create() {
        // Animación caminando
        this.anims.create({
            key: 'player-walk',
            frames: Array.from({ length: 20 }, (_, i) => ({ key: `gatoWalk_${i}` })),
            frameRate: 10,
            repeat: -1
        });

        // Animación quieto
        this.anims.create({
            key: 'player-idle',
            frames: [{ key: 'gatoIdle' }],
            frameRate: 1,
            repeat: -1
        });

        // Ir a la escena del juego
        this.scene.start('EndScene');
    }
}
