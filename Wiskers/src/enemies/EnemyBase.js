import Phaser from 'phaser';

export class EnemyBase extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        console.log('[EnemyBase] added enemy', texture, 'at', x, y);

        this.setCollideWorldBounds(true);
    }

    patrol({ fromX, toX, duration = 2500 }) {
        this.scene.tweens.add({
            targets: this,
            x: { from: fromX, to: toX },
            duration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }
}
