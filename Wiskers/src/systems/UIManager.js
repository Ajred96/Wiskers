// systems/UIManager.js
export class UIManager {
    constructor(scene) {
        this.scene = scene;

        // --- Contenedor donde guardamos todos los elementos del HUD ---
        this.ui = {};

        // 🔹 Grupo raíz para la UI
        this.container = scene.add.container(0, 0).setScrollFactor(0);

        // 🔹 Crear textos básicos
        this.ui.keysText = this.createText(12, 12, "Llaves: 0/0");
        //this.ui.livesText = this.createText(120, 12, "Vidas: 3");

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

    // --- Actualizar vidas ---
    setLives(lives) {
        this.ui.livesText.setText(`Vidas: ${lives}`);
    }

    // --- Actualizar llaves ---
    setKeys(collected, total) {
        this.ui.keysText.setText(`Llaves: ${collected}/${total}`);
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
