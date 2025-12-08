import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { createEnemies, preloadEnemies } from '../enemies/index.js';
import { createFloors } from '../systems/floorManager.js';
import { createWindow } from '../objects/WindowPrefab.js';
import { createDesk } from '../objects/DeskPrefab.js';
import { createEctoplasm } from '../objects/EctoplasmPrefab.js';
import { LifeManager } from '../systems/lifeManager.js';
import { UIManager } from '../systems/UIManager.js';
import { PlatformPhysics } from '../systems/PlatformPhysics.js';
import { DebugSystem } from '../systems/DebugSystem.js';
import { GameplayManager } from '../systems/GameplayManager.js';

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

        // Gameplay Manager
        this.gameplayManager = new GameplayManager(this);
        this.isFalling = false;

        this.generalSound.play({ loop: true, volume: 0.1 });

        // Pisos y fondos
        const { rooms, platforms, worldHeight } = createFloors(this, width, height);
        this.rooms = rooms;
        this.platforms = platforms;

        // Jugador
        const startRoom = this.rooms[0];
        const startY = startRoom.solidFloor.y - 50;
        this.player = new Player(this, 80, startY);
        this.player.setDepth(10);
        this.lifeManager = new LifeManager(this, this.player, 3);

        // Collider dinámico (PlatformPhysics)
        this.platformPhysics = new PlatformPhysics(this, this.player, this.platforms);

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
            { x: 200, floorIndex: 2 },
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
            { x: 1200, y: this.rooms[2].solidFloor.y - 100 },
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
        this.physics.add.overlap(this.player, this.ectoplasmGroup, (p, t) => this.gameplayManager.hitEctoplasm(p, t), null, this);

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
        this.physics.add.collider(this.yarnGroup, this.enemies, (y, e) => this.gameplayManager.hitEnemyWithYarn(y, e), null, this);
        this.physics.add.overlap(this.player, this.keysGroup, (p, k) => this.gameplayManager.collectKey(p, k), null, this);
        if (this.ghost) this.physics.add.overlap(this.player, this.ghost, () => this.gameplayManager.hitGhost(), null, this);
        this.physics.add.overlap(this.player, this.door, () => this.gameplayManager.tryFinish(), null, this);
        this.physics.add.overlap(this.player, this.yarnPickups, (p, y) => this.gameplayManager.collectYarn(p, y), null, this);

        // Cámara
        this.cameras.main.setBounds(0, 0, width, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);


        this.ui = new UIManager(this);
        this.ui.updateKeys(this.gameplayManager.keysCollected, this.gameplayManager.totalKeys);
        this.ui.updateLives(this.lifeManager.lives);
        this.ui.updateYarn(this.gameplayManager.yarnCount);

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

        // Debug System
        this.debugSystem = new DebugSystem(this, this.player, this.enemies, this.ectoplasmGroup);

        // Toggle Debug con tecla P
        this.input.keyboard.on('keydown-P', () => {
            this.debugSystem.toggle();
        });

    }

    update() {
        const player = this.player;

        // === COLLIDER DINÁMICO (PlatformPhysics) ===
        this.platformPhysics.update();

        // Debug
        this.debugSystem.update();

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

                if (distToPlayer < ATTACK_RANGE) {
                    if (!enemy.isAttacking) {
                        enemy.isAttacking = true;

                        enemy.setFlipX(this.player.x < enemy.x);
                        enemy.play('evilCat-attack', true);

                        if (typeof this.gameplayManager.hitGhost === 'function') {
                            this.gameplayManager.hitGhost();
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
                this.gameplayManager.resetLevel();
            });

            return;
        }

        // Lanzar estambre
        if (Phaser.Input.Keyboard.JustDown(this.keyThrow)) {
            this.gameplayManager.throwYarn();
        }
    }
}
