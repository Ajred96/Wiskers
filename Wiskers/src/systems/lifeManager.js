// systems/LifeManager.js
export class LifeManager {
    constructor(scene, player, initialLives = 3) {
        this.scene = scene;
        this.player = player;
        this.lives = initialLives;
        this.invulnerable = false;

        // dibujar HUD de vidas al inicio (si la escena ya tiene el método)
        if (this.scene.redrawLivesHUD) {
            this.scene.redrawLivesHUD();
        }
    }

    takeDamage(amount = 1) {
        if (this.invulnerable) return;

        this.lives -= amount;
        this.updateUI();

        this.player.setTint(0xff0000);
        this.invulnerable = true;

        this.scene.time.delayedCall(1000, () => {
            this.player.clearTint();
            this.invulnerable = false;
        });

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    updateUI() {
        if (this.scene.redrawLivesHUD) {
            this.scene.redrawLivesHUD();
        }
    }

    gameOver() {
        this.player.setVelocity(0, 0);
        this.player.setTint(0x000000);

        this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            'GAME OVER',
            {fontFamily: 'Arial', fontSize: 48, color: '#ff0000'}
        ).setOrigin(0.5);

        this.scene.time.delayedCall(2000, () => {
            this.scene.scene.restart();
        });

        this.scene.generalSound.stop();
    }
}