// systems/UIManager.js
export class UIManager {
    constructor(scene) {
        this.scene = scene;

        // --- Contenedor donde guardamos todos los elementos del HUD ---
        this.ui = {};

        // 🔹 Grupo raíz para la UI
        this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);

        // Fondo del HUD (barra arriba-izquierda)
        this.hudBg = scene.add.rectangle(
            0,          // x
            0,          // y
            380,        // ancho
            80,         // alto (3 filas de iconos)
            0x333333,   // color: gris oscuro (más claro que negro)
            0.45        // alpha
        ).setOrigin(0, 0);
        this.container.add(this.hudBg);

        // 🔹 Crear textos básicos
        // this.ui.livesText = this.createText(120, 12, ""); // Ya no usamos texto para vidas

        // 🔹 Contenedor para llaves
        this.keyHUD = scene.add.container(250, 40).setScrollFactor(0);
        this.container.add(this.keyHUD);

        // 🔹 Contenedor para vidas
        this.lifeHUD = scene.add.container(40, 40).setScrollFactor(0);
        this.container.add(this.lifeHUD);

        // 🔹 Contenedor PRINCIPAL para estambre (derecha)
        // Lo posicionamos arriba a la derecha
        this.yarnHUD = scene.add.container(scene.scale.width - 320, 10).setScrollFactor(0);
        this.container.add(this.yarnHUD);

        // 1. Fondo (dentro del yarnHUD)
        this.yarnBg = scene.add.rectangle(
            0, 0,       // x, y relativos al yarnHUD
            310, 80,    // ancho, alto
            0x333333,
            0.45
        ).setOrigin(0, 0);
        this.yarnHUD.add(this.yarnBg);

        // 2. Contenedor para los iconos (dentro del yarnHUD)
        this.yarnIcons = scene.add.container(15, 40); // Un poco de margen x, centrado y
        this.yarnHUD.add(this.yarnIcons);

        // 🔹 Mensajes grandes al centro
        this.ui.centerMessage = this.createText(
            scene.scale.width / 2,
            50,
            "",
            28,
            "#ffeb3b"
        ).setOrigin(0.5);
    }

    // --- Método para crear texto estándar ---
    createText(x, y, text, size = 18, color = "#fff") {
        const t = this.scene.add.text(x, y, text, {
            fontFamily: "Arial",
            fontSize: size,
            color,
        });

        t.setScrollFactor(0);
        this.container.add(t);
        return t;
    }

    // --- Actualizar estambre (con iconos) ---
    updateYarn(count) {
        if (!this.yarnIcons) return;
        this.yarnIcons.removeAll(true);

        const n = Phaser.Math.Clamp(count || 0, 0, 6);
        const spacing = 55;

        for (let i = 0; i < n; i++) {
            // Ajustamos x con + 15 para correrlo a la derecha
            const icon = this.scene.add.image((i * spacing) + 15, 1, 'iconYarn')
                .setScale(0.08);
            this.yarnIcons.add(icon);
        }
    }

    // --- Actualizar vidas (con iconos) ---
    updateLives(lives) {
        if (!this.lifeHUD) return;
        this.lifeHUD.removeAll(true);

        const n = Phaser.Math.Clamp(lives || 0, 0, 6);
        const spacing = 50;

        for (let i = 0; i < n; i++) {
            const icon = this.scene.add.image(i * spacing, 0, 'iconHeart')
                .setScale(0.09)
                .setScrollFactor(0);
            this.lifeHUD.add(icon);
        }
    }

    // --- Actualizar llaves (con iconos) ---
    updateKeys(collected, total) {
        if (!this.keyHUD) return;
        this.keyHUD.removeAll(true);

        const n = Phaser.Math.Clamp(collected || 0, 0, total);
        const spacing = 50;

        for (let i = 0; i < n; i++) {
            const icon = this.scene.add.image(i * spacing, 0, 'iconKey')
                .setScale(0.09)
                .setScrollFactor(0);
            this.keyHUD.add(icon);
        }
    }

    // --- Mensaje temporal ---
    showMessage(text, duration = 1500) {
        this.ui.centerMessage.setText(text);
        this.ui.centerMessage.setAlpha(1);

        this.scene.tweens.add({
            targets: this.ui.centerMessage,
            alpha: 0,
            duration: 500,
            delay: duration,
            ease: "Power2",
        });
    }

    // --- Letrero FINAL ---
    showSign(titulo, descripcion, width, height) {
        // Letrero en el centro
        const signContainer = this.scene.add.container(width, height);

        // Fondo del letrero (rectángulo con borde)
        const signBg = this.scene.add.rectangle(0, 0, 400, 150, 0x5d3954, 0.7);
        signBg.setStrokeStyle(4, 0xffffff);

        // Texto
        const titleText = this.scene.add.text(0, -20, titulo, {
            fontFamily: 'Arial',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ff8d3bff',
            stroke: '#f8f3f3ff',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Descripción
        const subText = this.scene.add.text(0, 40, descripcion, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        signContainer.add([signBg, titleText, subText]);

        // Animación de entrada del letrero
        signContainer.setScale(0);
        this.scene.tweens.add({
            targets: signContainer,
            scale: 1,
            duration: 800,
            ease: 'Back.out'
        });

        return signContainer;
    }
}
