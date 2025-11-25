import Phaser from 'phaser';
import Player from '../entities/Player.js';
import {createEnemies, preloadEnemies} from '../enemies/index.js';
import {createFloors} from '../systems/floorManager.js';
import {createWindow} from '../objects/WindowPrefab.js';
import {createDesk} from '../objects/DeskPrefab.js';
import {createEctoplasm} from '../objects/EctoplasmPrefab.js';
import {LifeManager} from '../systems/lifeManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.totalKeys = 3;
        this.keysCollected = 0;
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

        //Sonidos
        this.load.audio('angryCat', 'assets/sounds/angry-cat.mp3');
        this.load.audio('generalSound', 'assets/sounds/spooky.mp3');
        this.load.audio('collectedKeys', 'assets/sounds/collectkeys.mp3');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        this.catHurtSound = this.sound.add('angryCat');
        this.generalSound = this.sound.add('generalSound');
        this.collectedKeys = this.sound.add('collectedKeys');

        this.generalSound.play({loop: true, volume: 0.1});

        // Pisos y fondos
        const {rooms, platforms, worldHeight, floorHeight} = createFloors(this, width, height);
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
            createWindow(this, 100, this.rooms[1].solidFloor.y),
            createWindow(this, 550, this.rooms[2].solidFloor.y),
            createWindow(this, 290, this.rooms[3].solidFloor.y)
        ];

        this.windows.forEach(w => {
            this.physics.add.collider(this.player, w);
        });

        // Escritorio
        this.desk = createDesk(this, 1000, floorY);
        this.physics.add.collider(this.player, this.desk);

        // Llaves
        this.keysGroup = this.physics.add.group({allowGravity: false, immovable: true});
        [
            {x: 1200, y: this.rooms[0].solidFloor.y - 40},
            {x: 1100, y: this.rooms[2].solidFloor.y - 100},
            {x: 900, y: this.rooms[3].solidFloor.y - 40}
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
            {x: 600, floor: this.rooms[1].solidFloor.y},
            {x: 1050, floor: this.rooms[2].solidFloor.y},
            {x: 800, floor: this.rooms[3].solidFloor.y}
        ].forEach(({x, floor}) => {
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

        // Overlaps
        this.physics.add.overlap(this.player, this.keysGroup, this.collectKey, null, this);
        if (this.ghost) this.physics.add.overlap(this.player, this.ghost, this.hitGhost, null, this);
        this.physics.add.overlap(this.player, this.door, this.tryFinish, null, this);

        // Cámara
        this.cameras.main.setBounds(0, 0, width, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // UI
        this.ui = this.add.text(12, 12, `Llaves: 0/${this.totalKeys}`, {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#fff'
        }).setScrollFactor(0);
        this.msg = this.add.text(width / 2, 40, '', {
            fontFamily: 'Arial',
            fontSize: 22,
            color: '#ffeb3b'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        const keyboard = this.input.keyboard;
        this.keyE = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.add.text(160, 160, "Presiona E para salir de la casa", {
            fontSize: "16px",
            color: "#fff"
        }).setScrollFactor(1);
    }

    update() {
        const player = this.player;

        // === COLLIDER DINÁMICO ===
        const playerBottom = player.getBottomCenter().y;

        let closestFloor = null;
        let minDistance = Infinity;

        this.platforms.forEach(f => {
            const floorY = f.y;
            const distance = Math.abs(floorY - playerBottom);

            const isBelow = floorY >= playerBottom - 20;
            const isClose = distance < 100;

            if (isBelow && isClose && distance < minDistance) {
                minDistance = distance;
                closestFloor = f;
            }
        });

        // Protección especial al agacharse
        if (player.isCrouching) {
            if (this.activeCollider && this.activeCollider.active) {
                const currentFloor = this.lastValidFloor;

                if (currentFloor && currentFloor.active) {
                    const currentDistance = currentFloor.y - playerBottom;

                    if (currentDistance >= -30 && currentDistance < 150) {
                        // Mantener collider actual
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

        // 🔍 Debug de colisiones
        if (!this.debugGraphics) {
            this.debugGraphics = this.add.graphics();
        }

        this.debugGraphics.clear();
        this.debugGraphics.lineStyle(2, 0xff0000, 0.5);

        // Hitbox del jugador
        if (player.body) {
            const b = player.body;
            this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);

            this.debugGraphics.fillStyle(0x00ff00, 1);
            this.debugGraphics.fillCircle(player.getBottomCenter().x, playerBottom, 4);
        }

        // Hitboxes del ectoplasma
        if (this.ectoplasmGroup) {
            this.ectoplasmGroup.children.iterate(trap => {
                if (!trap || !trap.body) return;
                const b = trap.body;
                this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
            });
        }

        // Rango de enemigos
        if (this.enemies) {
            this.enemies.forEach(enemy => {
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
                                enemy.isAttacking = false;
                                enemy.play('evilCat-float', true);
                            }
                        );
                    }
                }
            });
        }
    }

    collectKey = (_, key) => {
        key.destroy();
        this.keysCollected++;
        this.ui.setText(`Llaves: ${this.keysCollected}/${this.totalKeys}`);
        this.collectedKeys.play({loop: false, volume: 0.8});
        if (this.keysCollected >= this.totalKeys && !this.doorOpen) {
            this.doorOpen = true;
            this.msg.setText('¡La ventana del ático está abierta!');
            this.time.delayedCall(1200, () => this.msg.setText(''));
        }
    };

    hitGhost = () => {
        this.player.setVelocity(-200 * Math.sign(this.player.body.velocity.x || 1), -150);
        this.cameras.main.shake(120, 0.004);
        this.msg.setText('¡Ay! El gato fantasma te golpeó');
        this.time.delayedCall(1000, () => this.msg.setText(''));
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
        this.msg.setText('¡Auch! El ectoplasma te quemó las patitas 💥');
        this.catHurtSound.play();
        this.player.lives--;
        this.lifeManager.takeDamage(1);
        this.time.delayedCall(900, () => {
            this.msg.setText('');
            this.ectoplasmHurt = false;
        });
    };
}
