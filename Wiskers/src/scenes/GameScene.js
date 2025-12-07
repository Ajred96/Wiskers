import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { createEnemies, preloadEnemies } from '../enemies/index.js';
import { createFloors } from '../systems/floorManager.js';
import { createWindow } from '../objects/WindowPrefab.js';
import { createDesk } from '../objects/DeskPrefab.js';
import { createEctoplasm } from '../objects/EctoplasmPrefab.js';
import { LifeManager } from '../systems/lifeManager.js';
import { UIManager } from '../systems/UIManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        preloadEnemies?.(this);
        // Texturas necesarias por el floorManager
        this.load.image('floorTexture', '/assets/background/textures/floor.png');
        this.load.image('roomTexture', '/assets/background/textures/wall2.png');
        this.load.image('key', '/assets/others/llave.png');
        this.load.image('ectoplasm', '/assets/others/ectoplasma.png');
        this.load.image('desk', '/assets/others/escritorio.png');
        this.load.image('window', '/assets/others/ventana.png');
        this.load.image('door', '/assets/others/puerta.png');
        this.load.image('yarn', '/assets/others/bola.png');

        // Iconos HUD
        this.load.image('iconKey', '/assets/others/iconLlave.png');
        this.load.image('iconHeart', '/assets/others/iconVida.png');
        this.load.image('iconYarn', '/assets/others/iconBola.png');

        //Sonidos
        this.load.audio('angryCat', 'assets/sounds/angry-cat.mp3');
        this.load.audio('generalSound', 'assets/sounds/spooky.mp3');
        this.load.audio('collectedKeys', 'assets/sounds/collectkeys.mp3');
        this.load.audio('falling', 'assets/sounds/falling.mp3');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.totalKeys = 3;
        this.keysCollected = 0;

        this.catHurtSound = this.sound.add('angryCat');
        this.generalSound = this.sound.add('generalSound');
        this.collectedKeys = this.sound.add('collectedKeys');
        this.fallSound = this.sound.add('falling');

        // 🔄 RESET DE ESTADO DE LA PARTIDA
        this.keysCollected = 0;   // muy importante: se resetea aquí
        this.yarnCount = 0;       // también reiniciamos el estambre
        this.isFalling = false;   // por si veníamos de una caída anterior

        this.generalSound.play({ loop: true, volume: 0.1 });

        // Pisos y fondos
        const { rooms, platforms, worldHeight } = createFloors(this, width, height);
        this.rooms = rooms;
        this.platforms = platforms;

        // Collider dinámico
        this.activeCollider = null;
        this.lastValidFloor = null;

        // Jugador
        const startRoom = this.rooms[0];
        const startY = startRoom.solidFloor.y - 50;
        this.player = new Player(this, 80, startY);
        this.player.setDepth(10);
        this.lifeManager = new LifeManager(this, this.player, 3);

        const floorY = this.rooms[1].solidFloor.y;

        // Ventanas
        this.windows = [
            createWindow(this, 70, this.rooms[1].solidFloor.y),
            createWindow(this, 900, this.rooms[2].solidFloor.y),
            createWindow(this, 1090, this.rooms[3].solidFloor.y)
        ];

        this.windows.forEach(w => {
            this.physics.add.collider(this.player, w);
        });

        // Escritorio
        this.desk = createDesk(this, 1250, floorY);
        this.physics.add.collider(this.player, this.desk);

        // === PROYECTILES DE ESTAMBRE (bolas lanzadas) ===
        this.yarnGroup = this.physics.add.group({
            allowGravity: true,
            bounceX: 0.2,
            bounceY: 0.2
        });

        // Tecla para lanzar estambre (X)
        this.keyThrow = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

        // === PICKUPS DE ESTAMBRE EN EL MAPA ===
        this.yarnPickups = this.physics.add.staticGroup();

        [
            { x: 400, floorIndex: 0 },
            { x: 1400, floorIndex: 1 },
            { x: 300, floorIndex: 2 },
            { x: 1600, floorIndex: 3 }
        ].forEach(({ x, floorIndex }) => {
            const y = this.rooms[floorIndex].solidFloor.y - 40;
            const yarn = this.yarnPickups.create(x, y, 'yarn');
            yarn.setScale(0.08);
            yarn.refreshBody();
        });

        // Llaves
        this.keysGroup = this.physics.add.group({ allowGravity: false, immovable: true });
        [
            { x: 300, y: this.rooms[1].solidFloor.y - 40 },
            { x: 500, y: this.rooms[2].solidFloor.y - 100 },
            { x: 50, y: this.rooms[3].solidFloor.y - 40 }
        ].forEach(p => {
            const key = this.keysGroup.create(p.x, p.y, 'key');
            key.setScale(0.1);
            if (key.body) {
                key.body.setSize(key.width, key.height, true);
            }
        });

        // Ectoplasma
        this.ectoplasmGroup = this.physics.add.staticGroup();
        [
            { x: 500, floor: this.rooms[1].solidFloor.y },
            { x: 300, floor: this.rooms[2].solidFloor.y },
            { x: 1250, floor: this.rooms[3].solidFloor.y }
        ].forEach(({ x, floor }) => {
            const trap = createEctoplasm(this, x, floor);
            this.ectoplasmGroup.add(trap);
        });
        this.physics.add.overlap(this.player, this.ectoplasmGroup, this.hitEctoplasm, null, this);

        // tween flotante en llaves
        this.keysGroup.children.iterate(key => {
            this.tweens.add({
                targets: key,
                y: key.y - 10,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // Puerta (ático)
        this.doorOpen = false;
        this.door = this.physics.add.staticSprite(
            width - 60,
            this.rooms[4].solidFloor.y - 27,
            'door'
        );
        this.door.setScale(0.15);
        this.door.refreshBody();

        // Enemigos
        this.enemies = createEnemies?.(this) || [];
        this.enemies.forEach(enemy => {
            this.platforms.forEach(floor => {
                this.physics.add.collider(enemy, floor);
            });
        });

        this.platforms.forEach(floor => {
            this.physics.add.collider(this.yarnGroup, floor);
        });

        // Overlaps / colliders
        this.physics.add.collider(this.yarnGroup, this.enemies, this.hitEnemyWithYarn, null, this);
        this.physics.add.overlap(this.player, this.keysGroup, this.collectKey, null, this);
        if (this.ghost) this.physics.add.overlap(this.player, this.ghost, this.hitGhost, null, this);
        this.physics.add.overlap(this.player, this.door, this.tryFinish, null, this);
        this.physics.add.overlap(this.player, this.yarnPickups, this.collectYarn, null, this);

        // Cámara
        this.cameras.main.setBounds(0, 0, width, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // === HUD (fondo y contenedores) ===

        // Fondo del HUD (barra arriba-izquierda)
        this.hudBg = this.add.rectangle(
            8,          // x
            8,          // y
            370,        // ancho
            130,         // alto (3 filas de iconos)
            0x000000,
            0.45        // alpha
        )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1000);
        // this.redrawYarnHUD(); // Delegado a UIManager

        this.ui = new UIManager(this);
        this.ui.updateKeys(this.keysCollected, this.totalKeys);
        this.ui.updateLives(this.lifeManager.lives);
        this.ui.updateYarn(this.yarnCount);




        // Tecla para la puerta
        const keyboard = this.input.keyboard;
        this.keyE = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.add.text(160, 160, "Presiona E para salir de la casa", {
            fontSize: "16px",
            color: "#fff"
        }).setScrollFactor(1);

        // === Tutorial visual inicial ===
        this.tutorialText = this.add.text(
            width / 2,
            20,
            '← / → moverse   ↑ saltar   X lanzar estambre',
            {
                fontFamily: 'Arial',
                fontSize: 18,
                color: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0.4)'
            }
        )
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(1100);

        // Desaparece suavemente después de unos segundos
        this.tweens.add({
            targets: this.tutorialText,
            alpha: 0,
            delay: 4000,
            duration: 800,
            onComplete: () => {
                this.tutorialText.destroy();
            }
        });

    }

    update() {
        const player = this.player;

        // === COLLIDER DINÁMICO ===
        const playerBottom = player.getBottomCenter().y;
        const playerX = player.x;

        let closestFloor = null;
        let minDistance = Infinity;

        this.platforms.forEach(f => {
            if (!f.body) return;

            const body = f.body;

            const withinX =
                playerX >= body.left - 4 &&
                playerX <= body.right + 4;
            if (!withinX) return;

            const surfaceY = body.top;
            const distance = Math.abs(surfaceY - playerBottom);

            const isBelow = surfaceY >= playerBottom - 10;
            const isClose = distance < 180;

            if (isBelow && isClose && distance < minDistance) {
                minDistance = distance;
                closestFloor = f;
            }
        });

        if (player.isCrouching) {
            if (this.activeCollider && this.activeCollider.active) {
                const currentFloor = this.lastValidFloor;

                if (currentFloor && currentFloor.active && currentFloor.body) {
                    const surfaceY = currentFloor.body.top;
                    const currentDistance = surfaceY - playerBottom;

                    if (currentDistance >= -40 && currentDistance < 180) {
                        // mantiene collider
                    } else {
                        if (closestFloor) {
                            this.activeCollider.destroy();
                            this.activeCollider = this.physics.add.collider(player, closestFloor);
                            this.lastValidFloor = closestFloor;
                        }
                    }
                }
            } else {
                if (closestFloor) {
                    this.activeCollider = this.physics.add.collider(player, closestFloor);
                    this.lastValidFloor = closestFloor;
                }
            }
        } else {
            const shouldUpdateCollider = (
                !this.activeCollider ||
                !this.activeCollider.active ||
                (closestFloor && this.lastValidFloor !== closestFloor)
            );

            if (shouldUpdateCollider && closestFloor) {
                if (this.activeCollider) {
                    this.activeCollider.destroy();
                }
                this.activeCollider = this.physics.add.collider(player, closestFloor);
                this.lastValidFloor = closestFloor;
            }
        }

        // 🔍 Debug
        if (!this.debugGraphics) {
            this.debugGraphics = this.add.graphics();
        }

        this.debugGraphics.clear();
        this.debugGraphics.lineStyle(2, 0xff0000, 0.5);

        if (player.body) {
            const b = player.body;
            this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
            this.debugGraphics.fillStyle(0x00ff00, 1);
            this.debugGraphics.fillCircle(player.getBottomCenter().x, playerBottom, 4);
        }

        if (this.ectoplasmGroup) {
            this.ectoplasmGroup.children.iterate(trap => {
                if (!trap || !trap.body) return;
                const b = trap.body;
                this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
            });
        }

        if (this.enemies) {
            this.enemies.forEach(enemy => {
                if (!enemy || !enemy.active) return;

                const distToPlayer = Phaser.Math.Distance.Between(
                    this.player.x,
                    this.player.y,
                    enemy.x,
                    enemy.y
                );

                const ATTACK_RANGE = 90;
                this.debugGraphics.strokeCircle(enemy.x, enemy.y, ATTACK_RANGE);

                if (distToPlayer < ATTACK_RANGE) {
                    if (!enemy.isAttacking) {
                        enemy.isAttacking = true;

                        enemy.setFlipX(this.player.x < enemy.x);
                        enemy.play('evilCat-attack', true);

                        if (typeof this.hitGhost === 'function') {
                            this.hitGhost();
                        }

                        enemy.once(
                            Phaser.Animations.Events.ANIMATION_COMPLETE,
                            () => {
                                if (!enemy || !enemy.active) return;
                                enemy.isAttacking = false;
                                enemy.play('evilCat-float', true);
                            }
                        );
                    }
                }
            });
        }

        // === CAÍDA INFINITA ===
        const bottomFloorY = this.rooms[0].solidFloor.y;

        if (player.y > bottomFloorY + 150 && !this.isFalling) {
            this.isFalling = true;

            this.fallSound.play({ volume: 0.7 });

            this.fallSound.once('complete', () => {
                this.resetLevel();
            });

            return;
        }

        // Lanzar estambre
        if (Phaser.Input.Keyboard.JustDown(this.keyThrow)) {
            this.throwYarn();
        }
    }

    // === HUD HELPERS ===

    // === HUD HELPERS ===

    // redrawKeysHUD movido a UIManager


    // redrawLivesHUD movido a UIManager


    // redrawYarnHUD movido a UIManager


    // === LÓGICA DE JUEGO ===

    collectKey = (_, key) => {
        // 👇 si ya está deshabilitada, no repetimos
        if (!key.body || !key.body.enable) return;

        // desactivar collider para que no se llame varias veces
        key.body.enable = false;

        this.tweens.add({
            targets: key,
            scale: key.scale * 1.3,
            y: key.y - 10,
            duration: 120,
            yoyo: true,
            onComplete: () => {
                key.destroy();

                this.keysCollected++;
                this.ui.updateKeys(this.keysCollected, this.totalKeys);
                this.collectedKeys.play({ loop: false, volume: 0.8 });


                if (this.keysCollected >= this.totalKeys && !this.doorOpen) {
                    this.doorOpen = true;
                    this.onDoorUnlocked();
                }
            }
        });
    };

    hitGhost = () => {
        this.player.setVelocity(-200 * Math.sign(this.player.body.velocity.x || 1), -150);
        this.cameras.main.shake(120, 0.004);

        // 👇 aquí le quitamos 1 vida usando el LifeManager
        this.lifeManager.takeDamage(1);
        this.ui.updateLives(this.lifeManager.lives);

        this.ui.showMessage('¡Ay! El gato fantasma te golpeó');

        this.time.delayedCall(1000, () => this.ui.showMessage(''));
    };


    tryFinish = () => {
        if (this.doorOpen) {
            if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x,
                    this.player.y,
                    this.door.x,
                    this.door.y
                );
                if (dist < 100) {
                    // detener parpadeo si existe
                    if (this.doorBlinkTween) {
                        this.doorBlinkTween.stop();
                        this.door.setAlpha(1);
                    }

                    this.generalSound.stop();
                    this.scene.start('MultiFloorScene');
                }
            }
        }
    };

    hitEctoplasm = (player, trap) => {
        if (!player.isOnFloor) {
            return;
        }

        if (this.ectoplasmHurt) return;
        this.ectoplasmHurt = true;

        const dir = Math.sign(player.body.velocity.x || 1);
        player.setVelocity(-150 * dir, -220);

        this.cameras.main.shake(120, 0.004);
        this.ui.showMessage('¡Auch! El ectoplasma te quemó las patitas 💥');
        this.catHurtSound.play();
        this.lifeManager.takeDamage(1);
        this.ui.updateLives(this.lifeManager.lives);
        this.time.delayedCall(900, () => {
            //this.msg.setText('');
            this.ectoplasmHurt = false;
        });
    };

    resetLevel() {
        if (this.generalSound) {
            this.generalSound.stop();
        }
        this.scene.restart();
    }

    collectYarn = (player, yarnPickup) => {
        // 👇 si ya está deshabilitado, no hacemos nada
        if (!yarnPickup.body || !yarnPickup.body.enable) return;

        // desactivar collider inmediatamente para que no se repita el overlap
        yarnPickup.body.enable = false;

        this.tweens.add({
            targets: yarnPickup,
            scale: yarnPickup.scale * 1.3,
            y: yarnPickup.y - 10,
            duration: 120,
            yoyo: true,
            onComplete: () => {
                yarnPickup.destroy();

                this.yarnCount += 1;
                this.ui.updateYarn(this.yarnCount);

                this.ui.showMessage('¡Has recogido una bola de estambre! 🧶');
            }
        });
    };

    throwYarn() {
        if (this.yarnCount <= 0) {
            this.ui.showMessage('No tienes estambre 😿');
            this.time.delayedCall(800, () => this.ui.showMessage(''));
            return;
        }

        const player = this.player;

        const yarn = this.yarnGroup.create(player.x, player.y - 10, 'yarn');
        yarn.setScale(0.1);
        yarn.setDepth(5);
        if (yarn.body) {
            yarn.body.setSize(yarn.width, yarn.height, true);
        }

        const direction = player.flipX ? -1 : 1;

        yarn.setVelocity(350 * direction, -200);
        yarn.setAngularVelocity(400 * direction);
        yarn.body.allowGravity = true;

        this.yarnCount -= 1;
        this.ui.updateYarn(this.yarnCount);

        this.time.delayedCall(3000, () => {

            if (yarn && yarn.active) yarn.destroy();
        });
    }

    hitEnemyWithYarn(yarn, enemy) {
        if (!enemy || !enemy.active) return;

        enemy.destroy();
        yarn.destroy();

        this.enemies = this.enemies.filter(e => e !== enemy);

        this.ui.showMessage('¡Fantasma derrotado! 👻🧶');
        this.time.delayedCall(1000, () => this.ui.showMessage(''));
    }

    onDoorUnlocked() {
        // mensaje
        this.ui.showMessage('¡La puerta del ático está abierta! Presiona E cerca para salir');
        this.time.delayedCall(1800, () => this.ui.showMessage(''));

        // tinte dorado
        this.door.setTint(0xfff176);

        // parpadeo suave
        this.doorBlinkTween = this.tweens.add({
            targets: this.door,
            alpha: 0.4,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

}
