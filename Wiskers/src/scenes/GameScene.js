import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { preloadEnemies, createEnemies } from '../enemies/index.js'; // tu módulo

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.totalKeys = 3;
        this.keysCollected = 0;
    }

    preload() {
        // Si tus enemigos necesitan assets:
        preloadEnemies?.(this);
        this.load.image('floorTexture', '/assets/background/textures/floor.png');
        this.load.image('roomTexture', '/assets/background/fondo3.png');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Fondo y mundo alto (5 pisos)
        const totalFloors = 5;
        const floorHeight = 200;
        const worldHeight = totalFloors * floorHeight;

        //this.add.image(width / 2, height / 2, 'background').setDisplaySize(width, height).setScrollFactor(0);
        this.physics.world.setBounds(0, 0, width, worldHeight);
        //PISOS
        this.rooms = [];
        this.platforms = [];
        // Plataformas
        for (let i = 0; i < totalFloors; i++) {
            const yTop = worldHeight - (i * floorHeight);
            const yBottom = yTop - floorHeight;
            const yCenter = (yTop + yBottom) / 2;

            // Fondo del piso
            /*const bg = this.add.image(width / 2, yCenter, roomBackgrounds[i])
                .setDisplaySize(width, floorHeight)
                .setDepth(-6);*/
            const roomBg = this.add.tileSprite(
                width / 2, yCenter,
                width, floorHeight,
                'roomTexture'
            )
            .setDepth(-1)
            .setScrollFactor(1);
            // --- Piso con textura visible ---
            const tileFloor = this.add.tileSprite(
                width / 2,      // posición X centrada
                yTop - 10,      // posición Y
                width,          // ancho total
                60,             // alto visible de la textura
                'floorTexture'  // textura
            )
            .setOrigin(0.5, 1)
            .setDepth(-4);

            // --- Cuerpo físico invisible (colisionable) ---
            const solidFloor = this.add.rectangle(
                width / 2,
                yTop - 10,
                width,
                20,
                0x000000,
                0 // invisible
            );
            this.physics.add.existing(solidFloor, true); // cuerpo estático
            solidFloor.visible = false;

            this.rooms.push({ roomBg, tileFloor, solidFloor });
            this.platforms.push(solidFloor);
        }
        // Jugador
        const startY = this.rooms[this.rooms.length-1].solidFloor.y + worldHeight;
        this.player = new Player(this, 80, startY);
        this.physics.add.collider(this.player, this.platforms);

        // Escaleras
        this.ladders = this.physics.add.staticGroup();
        [500, 270, 700, 360].forEach((x, i) => {
            const floor = this.rooms[i].solidFloor;
            const ladder = this.ladders.create(x,floor.y - floorHeight /2, 'ladder');
            ladder.isLadder = true;
            ladder.setDisplaySize(ladder.width, floorHeight-18);
            ladder.refreshBody();
        });

        this.keysGroup = this.physics.add.group({ allowGravity: false, immovable: true });
        [
            { x: 820, y: this.rooms[0].solidFloor.y - 20 },
            { x: 300, y: this.rooms[2].solidFloor.y - 20 },
            { x: 900, y: this.rooms[3].solidFloor.y - 20 }
        ].forEach(p => this.keysGroup.create(p.x, p.y, 'key'));


        // Puerta (ático)
        this.doorOpen = false;
        this.door = this.physics.add.staticSprite(width - 60, this.rooms[4].solidFloor.y - 27, 'door');

        // Enemigos
        this.enemies = createEnemies?.(this) || [];
        this.enemies.forEach(enemy => {
            this.platforms.forEach(floor => {
                this.physics.add.collider(enemy, floor);
            });
        });

        // Overlaps
        this.physics.add.overlap(this.player, this.ladders, () => this.onLadder = true);
        this.physics.add.overlap(this.player, this.keysGroup, this.collectKey, null, this);
        // Si tu módulo crea `this.ghost`, aún puedes usarlo:
        if (this.ghost) this.physics.add.overlap(this.player, this.ghost, this.hitGhost, null, this);
        this.physics.add.overlap(this.player, this.door, this.tryFinish, null, this);

        // Cámara
        this.cameras.main.setBounds(0, 0, width, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // UI
        this.ui = this.add.text(12, 12, `Llaves: 0/${this.totalKeys}`, { fontFamily: 'Arial', fontSize: 18, color: '#fff' }).setScrollFactor(0);
        this.msg = this.add.text(width / 2, 40, '', { fontFamily: 'Arial', fontSize: 22, color: '#ffeb3b' }).setOrigin(0.5, 0).setScrollFactor(0);

        // Escaleras
        this.onLadder = false;

        // Resize
        this.scale.on('resize', (gameSize) => {
            const w = gameSize.width;
            const h = gameSize.height;
            this.cameras.main.setBounds(0, 0, w, worldHeight);
            this.msg.setPosition(w / 2, 40);
            this.door.setPosition(w - 60, floorsY[4] - 27);
        });
    }

    update() {
        const wasOnLadder = this.onLadder;
        this.onLadder = false;

        // Escaleras simples: si está dentro y pulsa up/down, escalar
        const up = this.input.keyboard.createCursorKeys().up.isDown;
        const down = this.input.keyboard.createCursorKeys().down.isDown;

        if (wasOnLadder && (up || down)) {
            this.player.body.allowGravity = false;
            this.player.setVelocityY(up ? -110 : (down ? 110 : 0));
        } else {
            this.player.body.allowGravity = true;
        }
    }

    collectKey = (_, key) => {
        key.destroy();
        this.keysCollected++;
        this.ui.setText(`Llaves: ${this.keysCollected}/${this.totalKeys}`);
        if (this.keysCollected >= this.totalKeys && !this.doorOpen) {
            this.doorOpen = true;
            this.msg.setText('¡La ventana del ático está abierta!');
            this.door.disableBody(true, true);
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
            this.scene.pause();
            this.msg.setText('¡Ganaste! Abriste la ventana del ático 🎉');
        }
    };
}