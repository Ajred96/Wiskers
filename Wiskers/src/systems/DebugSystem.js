import Phaser from 'phaser';

export class DebugSystem {
    constructor(scene, player, enemies, ectoplasmGroup) {
        this.scene = scene;
        this.player = player;
        this.enemies = enemies;
        this.ectoplasmGroup = ectoplasmGroup;
        this.debugGraphics = scene.add.graphics();
        this.isEnabled = false; // Default to false
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled) {
            this.debugGraphics.clear();
        }
    }

    update() {
        if (!this.isEnabled) return;

        this.debugGraphics.clear();
        this.debugGraphics.lineStyle(2, 0xff0000, 0.5);

        // Player
        if (this.player.body) {
            const b = this.player.body;
            this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
            this.debugGraphics.fillStyle(0x00ff00, 1);
            this.debugGraphics.fillCircle(this.player.getBottomCenter().x, this.player.getBottomCenter().y, 4);
        }

        // Ectoplasm
        if (this.ectoplasmGroup) {
            this.ectoplasmGroup.children.iterate(trap => {
                if (!trap || !trap.body) return;
                const b = trap.body;
                this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
            });
        }

        // Enemies
        if (this.enemies) {
            this.enemies.forEach(enemy => {
                if (!enemy || !enemy.active) return;
                const ATTACK_RANGE = 90;
                this.debugGraphics.strokeCircle(enemy.x, enemy.y, ATTACK_RANGE);
            });
        }
    }
}
