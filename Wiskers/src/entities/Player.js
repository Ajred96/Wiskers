import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'gatoIdle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.lives = 3;
        this.speed = 200;
        this.jumpVel = -360;
        this.isCrouching = false;

        // === Escalado base ===
        const BASE_SCALE = 0.2;

        this.setTexture('gatoIdle');
        this.setScale(BASE_SCALE);

        // Alturas visuales objetivo (constantes)
        this.standDisplayH = this.displayHeight;
        this.crouchDisplayH = this.standDisplayH * 0.75;

        this.refreshHitbox();
        this.playIdle();
    }

    // === Animaciones básicas ===

    playIdle() {
        if (this.isCrouching) return;

        if (this.anims.currentAnim?.key !== 'player-idle') {
            const feetY = this.getBottomCenter().y;
            this.setTexture('gatoIdle');
            this._applyStandScale();
            this.anims.play('player-idle');
            this._setBottom(feetY);
            this.refreshHitbox();
        }
    }

    playWalk() {
        if (this.isCrouching) return;

        if (this.anims.currentAnim?.key !== 'player-walk') {
            const feetY = this.getBottomCenter().y;
            this.setTexture('gatoWalk_0');
            this.anims.play('player-walk', true);
            this._applyStandScale();
            this._setBottom(feetY);
            this.refreshHitbox();
        }
    }

    // === Cambio de estado agachado ===

    setCrouchState(shouldCrouch) {
        if (shouldCrouch === this.isCrouching) return;

        const feetY = this.getBottomCenter().y;
        this.isCrouching = shouldCrouch;

        if (shouldCrouch) {
            if (this.anims.isPlaying) this.anims.stop();
            this.setTexture('gatoCrouch');
            this._applyCrouchScale();
        } else {
            this.setTexture('gatoIdle');
            this._applyStandScale();
            this.anims.play('player-idle');
        }

        this._setBottom(feetY);
        this.refreshHitbox();
    }

    // === Hitbox ===

    refreshHitbox() {
        const body = this.body;
        if (!body) return;

        const fw = this.frame?.realWidth ?? this.width;
        const fh = this.frame?.realHeight ?? this.height;

        const targetH = this.isCrouching ? fh * 0.40 : fh * 0.60;
        const targetW = fw * 0.40;

        body.setSize(targetW, targetH, false);
        body.setOffset(fw * 0.30, fh - targetH);

        body.updateFromGameObject();
    }

    // === Lógica por frame ===

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        const { left, right, down, space } = this.cursors;

        const onFloor = this.body.blocked.down;
        this.isOnFloor = onFloor;

        const wantsToMoveHoriz = left.isDown || right.isDown;

        // --- ESTADO DE AGACHADO ---
        if (this.isCrouching) {

            if (!down.isDown) {
                this.setCrouchState(false);
            } else {
                this.setVelocityX(0);
                this.setVelocityY(0);
                return;
            }

        } else {

            if (down.isDown && onFloor && !wantsToMoveHoriz) {
                this.setCrouchState(true);
                this.setVelocityX(0);
                this.setVelocityY(0);
                return;
            }
        }

        // --- MOVIMIENTO NORMAL ---
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

        // --- SALTO ---
        if (onFloor && Phaser.Input.Keyboard.JustDown(space)) {
            this.setVelocityY(this.jumpVel);
        }
    }

    // === Escalado consistente ===

    _applyDisplayHeight(targetH) {
        const naturalH = this.frame?.realHeight ?? this.height;
        const s = targetH / naturalH;
        this.setScale(s);
    }

    _applyStandScale() {
        this._applyDisplayHeight(this.standDisplayH);
    }

    _applyCrouchScale() {
        this._applyDisplayHeight(this.crouchDisplayH);
    }

    _setBottom(feetY) {
        const currentBottom = this.getBottomCenter().y;
        const offset = feetY - currentBottom;
        this.setY(this.y + offset);
        if (this.body) {
            this.body.updateFromGameObject();
        }
    }
}
