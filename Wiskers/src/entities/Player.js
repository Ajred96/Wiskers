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

        this.baseScale = BASE_SCALE;
        this.sizeRatio = sizeRatio;

        this.setScale(this.baseScale * this.sizeRatio);

        // Alturas visuales objetivo
        this.standDisplayH = this.displayHeight;      // cómo se ve "de pie" ahora
        this.crouchDisplayH = this.standDisplayH * 0.75; // ajusta 0.75 a lo que quieras que mida agachado


        this.refreshHitbox();
        this.playIdle();
    }

    playIdle() {
        if (this.isCrouching) return;
        if (this.anims.currentAnim?.key !== 'player-idle') {
            const feetY = this.getBottomCenter().y;
            this.setTexture('gatoIdle');
            this._applyStandScale();
            this.anims.play('player-idle');
            this._setBottom(feetY);     // ← ancla pies
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
            this._setBottom(feetY);     // ← ancla pies
            this.refreshHitbox();
        }
    }

    playCrouch() {
        if (this.isCrouching) return;
        this.isCrouching = true;

        const feetY = this.getBottomCenter().y;

        this._withPhysicsLock(() => {
            this.setTexture('gatoCrouch');
            this._applyCrouchScale();
            this._setBottom(feetY);
            this.refreshHitbox();
        });
    }

    stopCrouch() {
        if (!this.isCrouching) return;
        this.isCrouching = false;

        const feetY = this.getBottomCenter().y;

        this._withPhysicsLock(() => {
            // Aplica frame/anim primero y escala inmediatamente (sin esperar a UPDATE)
            this.setTexture('gatoIdle');
            this.anims.play('player-idle');
            this._applyStandScale();
            this._setBottom(feetY);
            this.refreshHitbox();
        });
    }

    refreshHitbox() {
        const body = this.body;
        if (!body) return;

        // Medidas del frame sin escala (estables)
        const fw = this.frame?.realWidth ?? this.width;
        const fh = this.frame?.realHeight ?? this.height;

        // Tamaño del collider en espacio de frame (no display)
        const targetH = this.isCrouching ? fh * 0.40 : fh * 0.60;
        const targetW = fw * 0.40;

        body.setSize(targetW, targetH, false);
        body.setOffset(fw * 0.30, fh - targetH);   // mantiene el bottom alineado al frame

        // Sincroniza con el GameObject (que ya recolocaste con setBottom)
        body.updateFromGameObject();
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        const { left, right, down, space } = this.cursors;

        const onFloor = this.body.blocked.down;
        this.isOnFloor = onFloor;

        // --- AGACHARSE (flancos) ---
        if (Phaser.Input.Keyboard.JustDown(down) && !this.isCrouching) {
            this.playCrouch(); // entrar solo al presionar ↓
        } else if (Phaser.Input.Keyboard.JustUp(down) && this.isCrouching) {
            this.stopCrouch(); // salir solo al SOLTAR ↓
        }

        // Si está agachado, no mover ni saltar
        if (this.isCrouching) {
            this.setVelocityX(0);
            return;
        }

        // --- MOVIMIENTO ---
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

    _applyDisplayHeight(targetH) {
        // Usa el alto "natural" del frame actual para calcular el scale exacto
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
        const bottomOffset = this.displayHeight * (1 - this.originY);
        this.setY(Math.round(feetY - bottomOffset)); // redondea
        // No hace falta llamar siempre updateFromGameObject aquí
        // se hará dentro de refreshHitbox cuando cambie realmente
    }

    // Congela caída 1 frame mientras cambiamos textura/escala/hitbox
    _withPhysicsLock(applyChanges) {
        const body = this.body;
        if (!body) return;

        const prevAllow = body.allowGravity;
        const prevVy = body.velocity.y;

        body.setAllowGravity(false);
        body.setVelocityY(0);

        applyChanges();                // ← aquí haces setTexture/scale/_setBottom/refreshHitbox

        body.updateFromGameObject();

        // Rehabilita después del paso de física, evitando el “tirón” hacia abajo
        this.scene.physics.world.once('worldstep', () => {
            body.setAllowGravity(prevAllow);
            // No restauramos vy hacia abajo para no reintroducir el micro-caída
            if (prevVy < 0) body.setVelocityY(prevVy); else body.setVelocityY(0);
        });
    }


}
