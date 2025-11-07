import { EnemyBase } from './EnemyBase.js';

export class GhostEnemy extends EnemyBase {
    constructor(scene, x, y) {
        console.log('[GhostEnemy] constructor called with', x, y);
        super(scene, x, y, 'ghost');

        this.setScale(0.8);
        this.setAlpha(0.8);
        this.body.setSize(160, 160);
        this.body.setAllowGravity(false);
        this.body.setOffset(20, 20);

        this.play('ghost-float');
        this.patrol({ fromX: x - 100, toX: x + 100 });
    }

    static preload(scene) {
        scene.load.spritesheet('ghost', 'src/assets/enemy/gatoInvisibleFinal.png', {
            frameWidth: 200,
            frameHeight: 200
        });
    }

    static createAnimations(scene) {
        scene.anims.create({
            key: 'ghost-float',
            frames: scene.anims.generateFrameNumbers('ghost', { start: 0, end: 24 }),
            frameRate: 12,
            repeat: -1
        });
    }
}
