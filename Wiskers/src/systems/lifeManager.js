// systems/LifeManager.js
import { UIManager } from '../systems/UIManager.js';
export class LifeManager {
    constructor(scene, player, initialLives = 3) {
        this.scene = scene;
        this.player = player;
        this.lives = initialLives;
        this.invulnerable = false;
        this.ui = new UIManager(scene);
        this.ui.setLives(this.lives);
    }

    takeDamage(amount = 1) {
        if (this.invulnerable) return;

        this.lives -= amount;
        this.ui.setLives(this.lives);

        // feedback visual
        this.player.setTint(0xff0000);
        this.invulnerable = true;

        // Recuperar normalidad
        this.scene.time.delayedCall(1000, () => {
            this.player.clearTint();
            this.invulnerable = false;
        });

        if (this.lives <= 0) {
            this.gameOver();
        }
    }


    gameOver() {
        this.player.setVelocity(0, 0);
        this.player.setTint(0x000000);

        this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            'GAME OVER',
            { fontFamily: 'Arial', fontSize: 48, color: '#ff0000' }
        ).setOrigin(0.5);

         const fade = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.scale.width,
            this.scene.scale.height,
            0x000000,
            0.3
        ).setScrollFactor(0);

        this.scene.tweens.add({
            targets: fade,
            alpha: 0.7,
            duration: 3000,
            ease: "Power2",
        });

        this.scene.time.delayedCall(2000, () => {
            this.scene.scene.restart();
        });

        this.scene.generalSound.stop();
    }
}
