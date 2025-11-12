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
        this.isCrouching = false;

        // === Escalado base ===
        const walkFrame = scene.textures.get('gatoWalk_0').getSourceImage();
        const idleImg = scene.textures.get('gatoIdle').getSourceImage();
        const sizeRatio = walkFrame.height / idleImg.height;
        const BASE_SCALE = 0.2;

        this.setScale(BASE_SCALE * sizeRatio);
        this.baseScale = BASE_SCALE;
        this.sizeRatio = sizeRatio;

        this.refreshHitbox();
        this.playIdle();
    }

    playIdle() {
        if (this.isCrouching) return;
        if (this.anims.currentAnim?.key !== 'player-idle') {
            this.setTexture('gatoIdle');
            this.setScale(this.baseScale * this.sizeRatio);
            this.anims.play('player-idle');
            this.refreshHitbox();
        }
    }

    playWalk() {
        if (this.isCrouching) return;
        if (this.anims.currentAnim?.key !== 'player-walk') {
            this.setTexture('gatoWalk_0');
            this.setScale(this.baseScale);
            this.anims.play('player-walk', true);
            this.refreshHitbox();
        }
    }

    playCrouch() {
        if (this.anims.currentAnim?.key === 'player-crouch') return;

        this.isCrouching = true;
        this.setTexture('gatoCrouch'); 
        this.setScale(this.baseScale * this.sizeRatio * 0.6 ); // más pequeño visualmente
        //this.anims.play('player-crouch'); // define esta a nimación en tu escena
        this.body.setSize(this.width * 0.4, this.height * 0.4); // hitbox más baja
        this.body.setOffset(this.width * 0.3, this.height * 0.6);
    }

    stopCrouch() {
        if (!this.isCrouching) return;
        this.isCrouching = false;
        this.playIdle();
        this.refreshHitbox();
    }

    refreshHitbox() {
        const w = this.width;
        const h = this.height;
        this.body.setSize(w * 0.4, h * 0.6);
        this.body.setOffset(w * 0.3, h * 0.35);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        const { left, right, down, space } = this.cursors;

        // ↓ Agacharse
        if (down.isDown) {
            this.setVelocityX(0);
            this.playCrouch();
            return; // no moverse mientras está agachado
        } else {
            this.stopCrouch();
        }

        // ← / → movimiento
        if (left.isDown) {
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
            this.playWalk();
        } else if (right.isDown) {
            this.setVelocityX(this.speed);
            this.setFlipX(false);
            this.playWalk();
        } else {
            this.setVelocityX(0);
            this.playIdle();
        }

        const onFloor = this.body.blocked.down;
        this.isOnFloor = onFloor;

        // Espacio para saltar
        if (onFloor && Phaser.Input.Keyboard.JustDown(space)) {
            this.setVelocityY(this.jumpVel);
        }
    }
}
