import Phaser from 'phaser';
import { preloadEnemies, createEnemies } from './src/enemies/index.js';

class MainScene extends Phaser.Scene {
    constructor() {
        super('main');
        this.keysCollected = 0;
        this.totalKeys = 3;
    }

    preload() {
        // Cargar el fondo y el enemigo
        this.load.image('background', 'src/assets/background/fondo2.png');
        // Delegar la carga del enemigo al módulo
        preloadEnemies(this);
        
        // Generar texturas simples (no necesitas imágenes)
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player (gato) naranja
        g.fillStyle(0xffa343, 1);
        g.fillRoundedRect(0, 0, 28, 28, 6);
        g.fillStyle(0x000000, 1);
        g.fillCircle(10, 10, 2);
        g.fillCircle(18, 10, 2);
        g.fillRect(9, 18, 10, 3);
        g.generateTexture('player', 28, 28);
        g.clear();

        // Plataforma
        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 0, 200, 16);
        g.generateTexture('platform', 200, 16);
        g.clear();

        // Escalera
        g.fillStyle(0x9bb3d1, 1);
        g.fillRect(0, 0, 24, 120);
        for (let y = 10; y < 120; y += 14) {
            g.fillStyle(0x6e85a8, 1);
            g.fillRect(2, y, 20, 3);
        }
        g.generateTexture('ladder', 24, 120);
        g.clear();

        // Llave
        g.fillStyle(0xffdd57, 1);
        g.fillRect(0, 0, 12, 6);
        g.fillCircle(12, 3, 5);
        g.generateTexture('key', 18, 12);
        g.clear();

        // Puerta
        g.fillStyle(0x6b3a2e, 1);
        g.fillRoundedRect(0, 0, 34, 54, 6);
        g.fillStyle(0x2b1813, 1);
        g.fillRect(6, 10, 22, 30);
        g.generateTexture('door', 34, 54);
        g.clear();
    }

    create() {
        // Usar el tamaño gestionado por Phaser (scale manager).
        const width = this.scale.width;
        const height = this.scale.height;

        // Mundo
        this.background = this.add.image(width/2, height/2, 'background').setDisplaySize(width, height);
        this.physics.world.setBounds(0, 0, width, height);

        // Plataformas (5 pisos de casa embrujada)
        this.platforms = this.physics.add.staticGroup();

        const floorsY = [500, 400, 300, 200, 100]; // de abajo a arriba
        floorsY.forEach((y) => {
            // 3 tramos con huecos (para escalera y saltos)
            this.platforms.create(120, y, 'platform').setScale(1, 1).refreshBody();
            this.platforms.create(480, y, 'platform').refreshBody();
            this.platforms.create(840, y, 'platform').refreshBody();
        });

        // Jugador
        this.player = this.physics.add.sprite(80, floorsY[0] - 40, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(20, 26).setOffset(4, 2);

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();

        // Colisión con plataformas
        this.physics.add.collider(this.player, this.platforms);

        // Escaleras (zonas de subida entre pisos)
        this.ladders = this.physics.add.staticGroup();
        // Posiciones de escaleras (ajusta a gusto)
        const ladderXs = [450, 270, 700, 360];
        ladderXs.forEach((x, i) => {
            const ladder = this.ladders.create(x, floorsY[i] - 60, 'ladder');
            ladder.isLadder = true; // marca
            ladder.refreshBody();
        });

        // Llaves
        this.keysGroup = this.physics.add.group({ allowGravity: false, immovable: true });
        const keySpots = [
            { x: 820, y: floorsY[0] - 20 },
            { x: 300, y: floorsY[2] - 20 },
            { x: 900, y: floorsY[3] - 20 }
        ];
        keySpots.forEach(p => {
            const k = this.keysGroup.create(p.x, p.y, 'key');
            k.setScale(1);
        });

    
        this.door = this.physics.add.staticSprite(width - 60, floorsY[4] - 27, 'door');
        this.doorOpen = false;

        this.enemies = createEnemies(this);
        // Colisiones/overlaps
        this.physics.add.overlap(this.player, this.ladders, this.onLadderOverlap, null, this);
        this.physics.add.overlap(this.player, this.keysGroup, this.collectKey, null, this);
        this.physics.add.overlap(this.player, this.ghost, this.hitGhost, null, this);
        this.physics.add.overlap(this.player, this.door, this.tryFinish, null, this);

        // Cámara
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setBounds(0, 0, width, height);

        // UI simple
        this.ui = this.add.text(12, 12, 'Llaves: 0/3', { fontFamily: 'Arial', fontSize: 18, color: '#ffffff' }).setScrollFactor(0);
        this.msg = this.add.text(width/2, 40, '', { fontFamily: 'Arial', fontSize: 22, color: '#ffeb3b' }).setOrigin(0.5,0).setScrollFactor(0);

        // Estado de escalera
        this.onLadder = false;

        // Manejar redimensionamiento gestionado por Phaser (FIT). Actualiza bounds y fondo.
        this.scale.on('resize', (gameSize) => {
            const w = gameSize.width;
            const h = gameSize.height;
            // actualizar background y bounds
            if (this.background) this.background.setDisplaySize(w, h).setPosition(w/2, h/2);
            if (this.cameras && this.cameras.main) this.cameras.main.setBounds(0, 0, w, h);
            if (this.physics && this.physics.world) this.physics.world.setBounds(0, 0, w, h);
            // ajustar UI
            if (this.msg) this.msg.setPosition(w/2, 40);
            // reposicionar puerta respecto al nuevo ancho
            if (this.door) this.door.setPosition(w - 60, floorsY[4] - 27);
        });
    }

    onLadderOverlap(player, ladder) {
        // Si el jugador está dentro de una escalera, habilitamos "modo escalada"
        this.onLadder = true;
    }

    collectKey(player, key) {
        key.destroy();
        this.keysCollected++;
        this.ui.setText(`Llaves: ${this.keysCollected}/${this.totalKeys}`);
        if (this.keysCollected >= this.totalKeys && !this.doorOpen) {
            this.doorOpen = true;
            this.msg.setText('¡La ventana/puerta del ático está abierta!');
            // “Abrir” la puerta: bajar un poco el colisionador (para que puedas pasar)
            this.door.disableBody(true, true); // simple: la quitamos
        }
    }

    hitGhost() {
        // Retroceso leve + mensaje
        this.player.setVelocity(-200 * Math.sign(this.player.body.velocity.x || 1), -150);
        this.cameras.main.shake(120, 0.004);
        this.msg.setText('¡Ay! El gato fantasma te golpeó');
        this.time.delayedCall(1000, ()=> this.msg.setText(''));
    }

    tryFinish() {
        if (this.doorOpen) {
            this.scene.pause();
            this.msg.setText('¡Ganaste! Abriste la ventana del ático 🎉');
        }
    }

    update() {
        // Reset del flag de escalera; si seguimos dentro, onLadderOverlap lo volverá a activar este frame
        const wasOnLadder = this.onLadder;
        this.onLadder = false;

        // Input
        const left = this.cursors.left.isDown;
        const right = this.cursors.right.isDown;
        const up = this.cursors.up.isDown;
        const down = this.cursors.down.isDown;

        // Movimiento horizontal
        const speed = 200;
        if (left) {
            this.player.setVelocityX(-speed);
            this.player.setFlipX(true);
        } else if (right) {
            this.player.setVelocityX(speed);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        // ¿está tocando suelo?
        const onFloor = this.player.body.blocked.down;

        // Lógica de escalera
        if (wasOnLadder && (up || down)) {
            // “Modo escalera”: anula gravedad y permite subir/bajar
            this.player.body.allowGravity = false;
            const climbSpeed = 110;
            if (up) this.player.setVelocityY(-climbSpeed);
            else if (down) this.player.setVelocityY(climbSpeed);
            else this.player.setVelocityY(0);
        } else {
            // Modo normal
            this.player.body.allowGravity = true;
            // Salto
            if (onFloor && Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
                this.player.setVelocityY(-320);
            }
        }
    }
}

const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE, // usar RESIZE para que la resolución del canvas se ajuste al contenedor
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game',
        width: BASE_WIDTH,
        height: BASE_HEIGHT
    },
    backgroundColor: '#1f3c5b',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 },
            debug: false
        }
    },
    scene: [MainScene]
};

const game = new Phaser.Game(config);

// Asegurarnos de que el canvas tenga la resolución del contenedor #game para evitar scaling CSS
function resizeGameToContainer() {
    const container = document.getElementById('game');
    if (!container || !game || !game.scale) return;
    const w = Math.max(1, Math.floor(container.clientWidth));
    const h = Math.max(1, Math.floor(container.clientHeight));
    game.scale.resize(w, h);
}

// Llamar al inicio y cuando cambie la ventana
window.addEventListener('load', () => resizeGameToContainer());
window.addEventListener('resize', () => resizeGameToContainer());
