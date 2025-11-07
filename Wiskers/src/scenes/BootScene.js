import Phaser from 'phaser';

// AJUSTA si tu sheet NO es 5x4:
const COLUMNS = 5;
const ROWS = 4;

// Si ya conoces el tamaño del frame, puedes ponerlo aquí y quitar el cálculo.
// const FRAME_W = 244;
// const FRAME_H = 251;

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.load.image('background', '/assets/background/fondo1.png');

        // Idle (imagen quieta)
        this.load.image('gatoIdle', '/assets/player/gatoBueno.png');

        // Walk (spritesheet 5x4)
        this.load.spritesheet('gatoWalk', '/assets/player/gatoBuenoCaminando.png', {
            frameWidth: 369,   // 1846 / 5
            frameHeight: 232,  //  929 / 4
        });

        // === Mundo (plataformas, escaleras, etc.) ===
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 0, 400, 16);
        g.generateTexture('platform', 400, 16);
        g.clear();

        g.fillStyle(0x9bb3d1, 1);
        g.fillRect(0, 0, 24, 120);
        for (let y = 10; y < 120; y += 14) {
            g.fillStyle(0x6e85a8, 1);
            g.fillRect(2, y, 20, 3);
        }
        g.generateTexture('ladder', 24, 120);
        g.clear();

        g.fillStyle(0xffdd57, 1);
        g.fillRect(0, 0, 12, 6);
        g.fillCircle(12, 3, 5);
        g.generateTexture('key', 18, 12);
        g.clear();

        g.fillStyle(0x6b3a2e, 1);
        g.fillRoundedRect(0, 0, 34, 54, 6);
        g.fillStyle(0x2b1813, 1);
        g.fillRect(6, 10, 22, 30);
        g.generateTexture('door', 34, 54);
        g.clear();
    }

    create() {
        this.anims.create({
            key: 'player-walk',
            frames: this.anims.generateFrameNumbers('gatoWalk', { start: 0, end: 19 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'player-idle',
            frames: [{ key: 'gatoIdle' }],
            frameRate: 1,
            repeat: -1
        });

        this.scene.start('GameScene');
    }

}
