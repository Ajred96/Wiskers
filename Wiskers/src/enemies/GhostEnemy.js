import {EnemyBase} from './EnemyBase.js';

export class GhostEnemy extends EnemyBase {
    constructor(scene, x, y) {
        super(scene, x, y, 'evilCat_0'); // primer frame del gato malo

        // === ESCALADO AUTOMÁTICO RESPECTO AL PLAYER ===
        const playerTex = scene.textures.get('gatoWalk_0').getSourceImage();
        const ghostTex = scene.textures.get('evilCat_0').getSourceImage();

        const playerH = playerTex.height;
        const ghostH = ghostTex.height;

        // Ajusta este multiplicador si lo quieres más grande/pequeño
        const RELATIVE_TO_PLAYER = 0.225; // 1 = igual tamaño, >1 = más grande

        const ghostScale = (playerH / ghostH) * RELATIVE_TO_PLAYER;
        this.setScale(ghostScale);

        // === Apariencia y físicas ===
        this.setAlpha(0.9);
        this.body.setAllowGravity(false);
        this.body.setSize(this.width * 0.6, this.height * 0.8);
        this.body.setOffset(this.width * 0.2, this.height * 0.1);

        // Animación y movimiento
        this.play('evilCat-float');

        // Movimiento horizontal
        this.patrol({fromX: x - 100, toX: x + 100});

        // Movimiento vertical tipo "flotación"
        scene.tweens.add({
            targets: this,
            y: y - 15,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    static preload(scene) {
        // Cargar todos los frames gatoMaloFlotando_0...19
        for (let i = 0; i < 20; i++) {
            scene.load.image(`evilCat_${i}`, `/assets/enemy/GatoMaloFlotando/gatoFlotando_${i}.png`);
        }
    }

    static createAnimations(scene) {
        scene.anims.create({
            key: 'evilCat-float',
            frames: Array.from({length: 20}, (_, i) => ({key: `evilCat_${i}`})),
            frameRate: 10,
            repeat: -1
        });
    }
}
