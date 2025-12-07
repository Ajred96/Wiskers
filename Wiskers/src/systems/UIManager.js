// systems/UIManager.js
export class UIManager {
    constructor(scene) {
        this.scene = scene;

        // --- Contenedor donde guardamos todos los elementos del HUD ---
        this.ui = {};

        // 🔹 Grupo raíz para la UI
        this.container = scene.add.container(0, 0).setScrollFactor(0);

        // 🔹 Crear textos básicos
        // this.ui.livesText = this.createText(120, 12, ""); // Ya no usamos texto para vidas

        // 🔹 Contenedor para llaves
        this.keyHUD = scene.add.container(250, 50).setScrollFactor(0);
        this.container.add(this.keyHUD);

        // 🔹 Contenedor para vidas
        this.lifeHUD = scene.add.container(40, 40).setScrollFactor(0);
        this.container.add(this.lifeHUD);

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

    // --- Actualizar vidas (con iconos) ---
    updateLives(lives) {
        if (!this.lifeHUD) return;
        this.lifeHUD.removeAll(true);

        const n = Phaser.Math.Clamp(lives || 0, 0, 5);
        const spacing = 70;

        for (let i = 0; i < n; i++) {
            const icon = this.scene.add.image(i * spacing, 0, 'iconHeart')
                .setScale(0.1)
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
                .setScale(0.12)
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
}
