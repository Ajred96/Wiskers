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
        this.crouchStartFeetY = null; // Guardar posición de pies al empezar a agacharse

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
        // Guardar la posición original de los pies para restaurarla al levantarse
        this.crouchStartFeetY = feetY;

        // 🐛 DEBUG: Guarda posición antes
        console.log('🔽 ANTES DE AGACHARSE:');
        console.log('  - Posición Y:', this.y);
        console.log('  - Pies Y:', feetY);
        console.log('  - Display Height:', this.displayHeight);
        console.log('  - Hitbox Height:', this.body?.height);

        this._withPhysicsLock(() => {
            this.setTexture('gatoCrouch');
            this._applyCrouchScale();
            // Actualizar el body después de cambiar la escala para que getBottomCenter sea preciso
            if (this.body) this.body.updateFromGameObject();
            this._setBottom(feetY);
            this.refreshHitbox();
        });
        // 🐛 DEBUG: Verifica posición después (en el siguiente frame)
        this.scene.time.delayedCall(50, () => {
            console.log('🔽 DESPUÉS DE AGACHARSE:');
            console.log('  - Posición Y:', this.y);
            console.log('  - Pies Y:', this.getBottomCenter().y);
            console.log('  - Display Height:', this.displayHeight);
            console.log('  - Hitbox Height:', this.body?.height);
            console.log('  - ¿Tocando suelo?:', this.body?.blocked.down);
        });
    }

    stopCrouch() {
        if (!this.isCrouching) return;
        this.isCrouching = false;

        // Usar la posición original de los pies guardada al agacharse
        // en lugar de la posición actual (que puede estar incorrecta)
        const targetFeetY = this.crouchStartFeetY !== null ? this.crouchStartFeetY : this.getBottomCenter().y;
        const currentFeetY = this.getBottomCenter().y;

        console.log('🔼 ANTES DE LEVANTARSE:');
        console.log('  - Posición Y:', this.y);
        console.log('  - Pies Y actual:', currentFeetY);
        console.log('  - Pies Y objetivo:', targetFeetY);

        this._withPhysicsLock(() => {
            // Aplica frame/anim primero y escala inmediatamente (sin esperar a UPDATE)
            this.setTexture('gatoIdle');
            this.anims.play('player-idle');
            this._applyStandScale();
            // Actualizar el body después de cambiar la escala para que getBottomCenter sea preciso
            if (this.body) this.body.updateFromGameObject();
            // Restaurar la posición original de los pies
            this._setBottom(targetFeetY);
            this.refreshHitbox();
        });

        // Limpiar la posición guardada
        this.crouchStartFeetY = null;
        this.scene.time.delayedCall(50, () => {
            console.log('🔼 DESPUÉS DE LEVANTARSE:');
            console.log('  - Posición Y:', this.y);
            console.log('  - Pies Y:', this.getBottomCenter().y);
            console.log('  - ¿Tocando suelo?:', this.body?.blocked.down);
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

        const {left, right, down, space} = this.cursors;

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
            this.setVelocityY(0); // También congelar movimiento vertical
            // Mantener la posición de los pies en la posición guardada
            if (this.crouchStartFeetY !== null) {
                const currentFeetY = this.getBottomCenter().y;
                // Si los pies se han movido, corregirlos
                if (Math.abs(currentFeetY - this.crouchStartFeetY) > 1) {
                    this._setBottom(this.crouchStartFeetY);
                }
            }
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
        // Usar getBottomCenter para calcular correctamente el offset
        // Esto es más preciso que calcular manualmente con displayHeight
        const currentBottom = this.getBottomCenter().y;
        const offset = feetY - currentBottom;
        this.setY(this.y + offset);
        // Asegurar que el body se actualice inmediatamente
        if (this.body) {
            this.body.updateFromGameObject();
        }
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
