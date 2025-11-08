import { EnemyBase } from './EnemyBase.js';

export class GhostEnemy extends EnemyBase {
    constructor(scene, x, y) {
        console.log('[GhostEnemy] constructor called with', x, y);
        super(scene, x, y, 'ghost');
        this.setScale(1.0);
        this.setAlpha(0.8);
        this.body.setSize(160, 200);
        this.body.setAllowGravity(false);
        this.body.setOffset(30, 30);
        this.play('ghost-float');
        this.patrol({ fromX: x - 100, toX: x + 100 });
    }

    static preload(scene) {
        scene.load.spritesheet('ghost', 'assets/enemy/gatito.png', {
            frameWidth: 128,
            frameHeight: 128
        });
    }

    static createAnimations(scene) {
        scene.anims.create({
            key: 'ghost-float',
            frames: scene.anims.generateFrameNumbers('ghost', { start: 0, end: 35 }),
            frameRate: 3,
            repeat: -1
        });
        
    }
    
}
