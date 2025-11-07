import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'gatoIdle');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.cursors = scene.input.keyboard.createCursorKeys();

        this.speed = 200;
        this.jumpVel = -360;

        // ====== ESCALADO AUTOMÁTICO ======
        const idleImg = scene.textures.get('gatoIdle').getSourceImage();
        const walkFrame0 = scene.textures.get('gatoWalk').get(0);

        // Ajuste base
        const BASE_SCALE = 0.2;

        // Ajuste automático según proporción real
        const idleHeight = 1024;
        const walkFrameHeight = 929 / 4; // 4 filas
        const ratio = walkFrameHeight / idleHeight;

        // Compensación pequeña para igualar márgenes visuales
        const COMPENSATION = 4.4; // según cálculo real
        this.setScale(BASE_SCALE * ratio * COMPENSATION);


        this.refreshHitbox();

        this.playIdle();
    }

    playIdle() {
        if (this.anims.currentAnim?.key !== 'player-idle') {
            this.setTexture('gatoIdle');
            this.anims.play('player-idle');
            this.refreshHitbox();
        }
    }

    playWalk() {
        if (this.anims.currentAnim?.key !== 'player-walk') {
            this.setTexture('gatoWalk', 0); // fuerza el sheet correcto
            this.anims.play('player-walk', true);
            this.refreshHitbox();
        }
    }

    refreshHitbox() {
        this.body.setSize(this.width * 0.4, this.height * 0.6);
        this.body.setOffset(this.width * 0.3, this.height * 0.35);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        const left = this.cursors.left.isDown;
        const right = this.cursors.right.isDown;

        if (left) {
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
            this.playWalk();
        } else if (right) {
            this.setVelocityX(this.speed);
            this.setFlipX(false);
            this.playWalk();
        } else {
            this.setVelocityX(0);
            this.playIdle();
        }

        const onFloor = this.body.blocked.down;
        if (onFloor && Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.setVelocityY(this.jumpVel);
        }
    }
}
