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

        // === Escalado base según la animación caminando ===
        // Calculamos la proporción real del gatoIdle vs gatoWalk para igualarlos visualmente
        const walkFrame = scene.textures.get('gatoWalk_0').getSourceImage();
        const idleImg = scene.textures.get('gatoIdle').getSourceImage();

        const walkH = walkFrame.height;
        const idleH = idleImg.height;

        // Compensamos diferencia de tamaño entre los dos assets
        const sizeRatio = (walkH / idleH);

        // Escala base (ajusta si lo ves muy grande o pequeño)
        const BASE_SCALE = 0.2;

        // Aplicamos la escala corregida al gato quieto
        this.setScale(BASE_SCALE * sizeRatio);

        // Guardamos escala base para el resto de animaciones
        this.baseScale = BASE_SCALE;
        this.sizeRatio = sizeRatio;

        this.refreshHitbox();
        this.playIdle();
    }

    playIdle() {
        if (this.anims.currentAnim?.key !== 'player-idle') {
            this.setTexture('gatoIdle');
            this.setScale(this.baseScale * this.sizeRatio); // igualar tamaño con "walk"
            this.anims.play('player-idle');
            this.refreshHitbox();
        }
    }

    playWalk() {
        if (this.anims.currentAnim?.key !== 'player-walk') {
            this.setTexture('gatoWalk_0');
            this.setScale(this.baseScale); // tamaño original de los frames caminando
            this.anims.play('player-walk', true);
            this.refreshHitbox();
        }
    }

    refreshHitbox() {
        const w = this.width;
        const h = this.height;
        this.body.setSize(w * 0.4, h * 0.6);
        this.body.setOffset(w * 0.3, h * 0.35);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        const {left, right, space} = this.cursors;

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
        if (onFloor && Phaser.Input.Keyboard.JustDown(space)) {
            this.setVelocityY(this.jumpVel);
        }
    }
}
