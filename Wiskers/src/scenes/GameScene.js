import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { preloadEnemies, createEnemies } from '../enemies/index.js';
import { createFloors } from '../systems/floorManager.js'; 

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
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 🔹 Llamada al manager para crear pisos y fondos
        const { rooms, platforms, worldHeight,floorHeight } = createFloors(this, width, height);
        this.rooms = rooms;
        this.platforms = platforms;

        // Jugador
        const startY = this.rooms[this.rooms.length - 1].solidFloor.y + worldHeight;
        this.player = new Player(this, 80, startY);

        // Escaleras
        this.ladders = this.physics.add.staticGroup();
        [500, 270, 700, 360].forEach((x, i) => {
            const floor = this.rooms[i].solidFloor;
            const ladder = this.ladders.create(x, floor.y - 13 - floorHeight / 2, 'ladder');
            ladder.isLadder = true;
            ladder.setDisplaySize(ladder.width, floorHeight - 10);
            ladder.refreshBody();
        });

        // Llaves
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
        /*this.scale.on('resize', (gameSize) => {
            const w = gameSize.width;
            const h = gameSize.height;
            this.cameras.main.setBounds(0, 0, w, worldHeight);
            this.msg.setPosition(w / 2, 40);
            this.door.setPosition(w - 60, floorsY[4] - 27);
        });*/
        const keyboard = this.input.keyboard;
        this.keyE = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.add.text(160,  160, "Presiona E para salir de la casa", {
            fontSize: "16px",
            color: "#fff"
        }).setScrollFactor(1);
    }

    update() {
        const cursors = this.input.keyboard.createCursorKeys();
        const up = cursors.up.isDown;
        const down = cursors.down.isDown;
        const player = this.player;

        // Resetear bandera de escalera
        this.onLadder = false;
        this.physics.overlap(player, this.ladders, () => { this.onLadder = true; });

        // Piso más cercano
        const closestFloor = this.platforms.find(f => f.y >= player.y && (f.y - player.y) < 120);

        // Collider dinámico
        if ((!this.activeCollider && closestFloor) ||
            (this.activeCollider && this.activeCollider.object2 !== closestFloor)) {
            if (this.activeCollider) this.activeCollider.destroy();
            if (closestFloor) {
                this.activeCollider = this.physics.add.collider(player, closestFloor);
            } else {
                this.activeCollider = null;
            }
        }
        const nearbyLadder = this.ladders.getChildren().find(l => {
            const dx = Math.abs(l.x - player.x);
            const dy = Math.abs(l.y - player.y);
            return dx < 30 && dy < 180; // rango razonable de cercanía
        });

        // BAJAR si hay escalera debajo y presiona ↓
        if (!this.onLadder && down  &&nearbyLadder&& !this.isTransitioning) {
            this.startClimb(nearbyLadder, 'down');
            return;
        }

        // Si está sobre una escalera y sube o baja
        if (this.onLadder) {
            player.body.allowGravity = false;
            if (this.activeCollider) this.activeCollider.active = false;

            if (up) player.setVelocityY(-110);
            else if (down) player.setVelocityY(110);
            else player.setVelocityY(0);

            const upperFloor = this.platforms.filter(f => f.y < player.y).sort((a, b) => b.y - a.y)[0];
            if (up && upperFloor && player.y <= upperFloor.y + 8) this.moveToFloor(upperFloor, -1);

            const lowerFloor = this.platforms.filter(f => f.y > player.y).sort((a, b) => a.y - b.y)[0];
            if (down && lowerFloor && player.y >= lowerFloor.y - 40) this.moveToFloor(lowerFloor, 1);
        } else {
            player.body.allowGravity = true;
            if (this.activeCollider) this.activeCollider.active = true;
        }
        // salida de la casa
        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
            const dist = Phaser.Math.Distance.Between(
                player.x,
                player.y,
                this.door.x,
                this.door.y
            );
            if (dist < 100) {
                this.scene.start('MultiFloorScene');
            }
        }
    }
    
    startClimb(ladder, direction) {
        this.isTransitioning = true;
        this.player.body.allowGravity = false;
        if (this.activeCollider) this.activeCollider.active = false;

        // Movimiento suave de entrada a la escalera
        this.tweens.add({
            targets: this.player,
            x: ladder.x, // centrar con escalera
            y: this.player.y + (direction === 'down' ? 50 : -50),
            duration: 400,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.isTransitioning = false;
                this.onLadder = true;
            }
        });
    }

    moveToFloor(targetFloor, direction) {
        this.isTransitioning = true;
        this.player.setVelocityY(0);
        this.player.body.allowGravity = true;
        if (this.activeCollider) this.activeCollider.active = true;

        // Ajustar posición final
        const targetY = direction < 0
            ? targetFloor.y - (this.player.displayHeight || this.player.height) - 2
            : targetFloor.y ;

        this.tweens.add({
            targets: this.player,
            y: targetY,
            duration: 350,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.isTransitioning = false;
                this.onLadder = false;
            }
        });

        // Movimiento de cámara
        const targetScrollY = Math.max(0, targetFloor.y - this.scale.height / 1.4);
        this.tweens.add({
            targets: this.cameras.main,
            scrollY: targetScrollY,
            duration: 420,
            ease: 'Cubic.easeOut'
        });
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
