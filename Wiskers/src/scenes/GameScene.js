import Phaser from 'phaser';
import Player from '../entities/Player.js';
import {preloadEnemies, createEnemies} from '../enemies/index.js';
import {createFloors} from '../systems/floorManager.js';
import {createLadders, updateLadders} from '../systems/laddersManager.js';
import { createWindow } from '../objects/WindowPrefab.js';

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
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 🔹 Llamada al manager para crear pisos y fondos
        const {rooms, platforms, worldHeight, floorHeight} = createFloors(this, width, height);
        this.rooms = rooms;
        this.platforms = platforms;

        // Inicializar collider dinámico como null
        this.activeCollider = null;
        this.lastValidFloor = null; // 🔑 NUEVO: Guardar último piso válido

        // Jugador
        const startRoom = this.rooms[0];
        const startY = startRoom.solidFloor.y - 50;
        this.player = new Player(this, 80, startY);
        this.player.setDepth(10);

        // Escaleras
        this.ladders = createLadders(this, rooms, floorHeight);
        this.ladders.children.iterate(trap => {
            trap.setDepth(5);
        });

        // 💻 Trampas de ectoplasma
        this.ectoplasmGroup = this.physics.add.staticGroup();
        this.ectoplasmGroup.children.iterate(trap => {
            trap.setDepth(5);
        });

        [
            {x: 600, y: this.rooms[1].solidFloor.y},
            {x: 1050, y: this.rooms[2].solidFloor.y},
            {x: 800, y: this.rooms[3].solidFloor.y}
        ].forEach(p => {
            const trap = this.ectoplasmGroup.create(p.x, p.y, 'ectoplasm');

            trap.setOrigin(0.5, 1);  // apoyado en el piso
            trap.setScale(0.2);      // ajusta según lo grande que sea tu PNG

            // Actualizar el cuerpo al nuevo tamaño/posición
            trap.refreshBody();

            // ⚠️ Reducir el hitbox para que no pegue desde tan lejos
            const w = trap.width;
            const h = trap.height;

            // Caja más pequeña (solo la parte central)
            trap.body.setSize(w * 0.15, h * 0.2, true); // ancho 60%, alto 40%
            // Opcional: bajar un poco la caja, para que sea más "al ras del piso"
            trap.body.offset.y += h * 0.3;
        });

        const floorY = this.rooms[1].solidFloor.y;

        // 🪑 Escritorio
        this.desk = this.physics.add.staticSprite(1000, floorY, 'desk');
        this.desk.setOrigin(0.5, 1);   // origen abajo en las patas
        this.desk.setScale(0.15);      // tamaño visual

        // Actualizar el cuerpo después de origen/escala
        this.desk.refreshBody();

        // Usar el tamaño REAL del cuerpo (ya escalado)
        const bw = this.desk.body.width;
        const bh = this.desk.body.height;

        // Collider: franja en la parte superior, un poco hacia dentro
        this.desk.body.setSize(bw * 0.8, bh * 0.25);   // ancho 80%, alto 25%

        // Centrado horizontal y pegado a la parte superior
        this.desk.body.setOffset(bw * 0.1, bh * 0.25);

        this.desk.setDepth(2);

        //PREFACTS
        // Ventana (prefab)
        this.windows = [
            createWindow(this, 100, this.rooms[1].solidFloor.y),
            createWindow(this, 550, this.rooms[2].solidFloor.y),
            createWindow(this, 290, this.rooms[3].solidFloor.y)
        ];

        this.windows.forEach(w => {
            this.physics.add.collider(this.player, w);
        });


        

        // Llaves
        this.keysGroup = this.physics.add.group({allowGravity: false, immovable: true});
        [
            {x: 820, y: this.rooms[0].solidFloor.y - 40},
            {x: 300, y: this.rooms[2].solidFloor.y - 40},
            {x: 900, y: this.rooms[3].solidFloor.y - 40}
        ].forEach(p => {
            const key = this.keysGroup.create(p.x, p.y, 'key');

            key.setScale(0.1);      // para una imagen grande como la que pasaste

            // Opcional: ajustar hitbox según la escala
            if (key.body) {
                key.body.setSize(key.width, key.height, true);
            }
        });

        // tween flotante
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
        this.door = this.physics.add.staticSprite(width - 60, this.rooms[4].solidFloor.y - 27, 'door');

        // Enemigos
        this.enemies = createEnemies?.(this) || [];
        this.enemies.forEach(enemy => {
            this.platforms.forEach(floor => {
                this.physics.add.collider(enemy, floor);
            });
        });

        this.physics.add.collider(this.player, this.desk);

        // Overlaps
        // this.physics.add.overlap(this.player, this.ladders, () => this.onLadder = true);
        this.physics.add.overlap(this.player, this.keysGroup, this.collectKey, null, this);
        this.physics.add.overlap(this.player, this.ectoplasmGroup, this.hitEctoplasm, null, this);
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

        // Escaleras
        //sthis.onLadder = false;

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
        this.add.text(160, 160, "Presiona E para salir de la casa", {
            fontSize: "16px",
            color: "#fff"
        }).setScrollFactor(1);
    }

    update() {
        const cursors = this.input.keyboard.createCursorKeys();
        const player = this.player;

        // === 🔧 COLLIDER DINÁMICO MEJORADO ===
        const playerBottom = player.getBottomCenter().y;
        
        // 🎯 Encontrar piso más cercano con lógica mejorada
        let closestFloor = null;
        let minDistance = Infinity;

        this.platforms.forEach(f => {
            const floorY = f.y;
            const distance = Math.abs(floorY - playerBottom);
            
            // Solo considerar pisos que están debajo o muy cerca del jugador
            const isBelow = floorY >= playerBottom - 20;
            const isClose = distance < 100;
            
            if (isBelow && isClose && distance < minDistance) {
                minDistance = distance;
                closestFloor = f;
            }
        });

        // 🔒 PROTECCIÓN ESPECIAL AL AGACHARSE
        if (player.isCrouching) {
            // Si ya tenemos un collider válido, NO lo cambiamos durante el agachado
            if (this.activeCollider && this.activeCollider.active) {
                const currentFloor = this.lastValidFloor;
                
                if (currentFloor && currentFloor.active) {
                    const currentDistance = currentFloor.y - playerBottom;
                    
                    // Mantener el collider actual si el piso sigue siendo válido
                    // Rango más permisivo para evitar cambios durante el agachado
                    if (currentDistance >= -30 && currentDistance < 150) {
                        // No hacer nada, mantener el collider actual
                        // Importante: usar 'return' aquí causaría problemas con updateLadders
                        // En su lugar, simplemente no actualizamos el collider
                    } else {
                        // El piso actual ya no es válido, buscar uno nuevo
                        if (closestFloor) {
                            this.activeCollider.destroy();
                            this.activeCollider = this.physics.add.collider(player, closestFloor);
                            this.lastValidFloor = closestFloor;
                        }
                    }
                }
            } else {
                // No hay collider activo, crear uno nuevo si encontramos piso
                if (closestFloor) {
                    this.activeCollider = this.physics.add.collider(player, closestFloor);
                    this.lastValidFloor = closestFloor;
                }
            }
        } else {
            // 🔄 Collider dinámico normal (cuando no está agachado)
            const shouldUpdateCollider = (
                !this.activeCollider || 
                !this.activeCollider.active ||
                (closestFloor && this.lastValidFloor !== closestFloor)
            );

            if (shouldUpdateCollider && closestFloor) {
                // Destruir collider anterior
                if (this.activeCollider) {
                    this.activeCollider.destroy();
                }
                
                // Crear nuevo collider
                this.activeCollider = this.physics.add.collider(player, closestFloor);
                this.lastValidFloor = closestFloor;
            }
        }

        // Resetear bandera de escalera
        updateLadders(this, cursors);

        // Si aún no existe el gráfico, créalo una vez
        if (!this.debugGraphics) {
            this.debugGraphics = this.add.graphics();
        }

        // Limpiar lo que dibujó el frame anterior
        this.debugGraphics.clear();

        // Estilo del borde (rojo semi transparente)
        this.debugGraphics.lineStyle(2, 0xff0000, 0.5);

        // 🔳 Hitbox del jugador
        if (player.body) {
            const b = player.body;
            this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
            
            // Dibujar punto de los pies (verde)
            this.debugGraphics.fillStyle(0x00ff00, 1);
            this.debugGraphics.fillCircle(player.getBottomCenter().x, playerBottom, 4);
        }

        // 🔳 Colliders del ectoplasma
        if (this.ectoplasmGroup) {
            this.ectoplasmGroup.children.iterate(trap => {
                if (!trap || !trap.body) return;
                const b = trap.body;
                this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
            });
        }

        if (this.enemies) {
            this.enemies.forEach(enemy => {
                const distToPlayer = Phaser.Math.Distance.Between(
                    this.player.x,
                    this.player.y,
                    enemy.x,
                    enemy.y
                );

                const ATTACK_RANGE = 90; // distancia a la que el gato ataca

                // 🟡 Dibuja un círculo que representa el rango del enemigo
                this.debugGraphics.strokeCircle(enemy.x, enemy.y, ATTACK_RANGE);

                if (distToPlayer < ATTACK_RANGE) {
                    // Evitamos spamear la animación
                    if (!enemy.isAttacking) {
                        enemy.isAttacking = true;

                        // El gato mira hacia el jugador
                        enemy.setFlipX(this.player.x < enemy.x);

                        // Reproducir animación de ataque
                        enemy.play('evilCat-attack', true);

                        // Opcional: aplicar golpe al jugador
                        if (typeof this.hitGhost === 'function') {
                            this.hitGhost();
                        }

                        // Cuando termine la animación, volver a flotar
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

    hitEctoplasm = (player, trap) => {
        // Si está en el aire (saltando / cayendo), no recibe daño
        if (!player.isOnFloor) {
            return;
        }

        // Pequeño cooldown para que no te golpee cada frame
        if (this.ectoplasmHurt) return;
        this.ectoplasmHurt = true;

        // Empujón hacia atrás y arriba
        const dir = Math.sign(player.body.velocity.x || 1);
        player.setVelocity(-150 * dir, -220);

        this.cameras.main.shake(120, 0.004);
        this.msg.setText('¡Auch! El ectoplasma te quemó las patitas 💥');

        this.time.delayedCall(900, () => {
            this.msg.setText('');
            this.ectoplasmHurt = false;
        });
    };

}