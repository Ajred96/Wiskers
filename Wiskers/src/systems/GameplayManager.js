import Phaser from 'phaser';

export class GameplayManager {
    constructor(scene) {
        this.scene = scene;
        this.keysCollected = 0;
        this.totalKeys = 3;
        this.yarnCount = 0;
        this.doorOpen = false;
        this.ectoplasmHurt = false;
        this.doorBlinkTween = null;
    }

    collectKey(_, key) {
        if (!key.body || !key.body.enable) return;

        key.body.enable = false;

        this.scene.tweens.add({
            targets: key,
            scale: key.scale * 1.3,
            y: key.y - 10,
            duration: 120,
            yoyo: true,
            onComplete: () => {
                key.destroy();

                this.keysCollected++;
                this.scene.ui.updateKeys(this.keysCollected, this.totalKeys);
                this.scene.collectedKeys.play({ loop: false, volume: 0.8 });

                if (this.keysCollected >= this.totalKeys && !this.doorOpen) {
                    this.doorOpen = true;
                    this.onDoorUnlocked();
                }
            }
        });
    }

    hitGhost() {
        this.scene.player.setVelocity(-200 * Math.sign(this.scene.player.body.velocity.x || 1), -150);
        this.scene.cameras.main.shake(120, 0.004);

        this.scene.lifeManager.takeDamage(1);
        this.scene.ui.updateLives(this.scene.lifeManager.lives);

        this.scene.ui.showMessage('¡Ay! El gato fantasma te golpeó');
        this.scene.time.delayedCall(1000, () => this.scene.ui.showMessage(''));
    }

    tryFinish() {
        if (this.doorOpen) {
            if (Phaser.Input.Keyboard.JustDown(this.scene.keyE)) {
                const dist = Phaser.Math.Distance.Between(
                    this.scene.player.x,
                    this.scene.player.y,
                    this.scene.door.x,
                    this.scene.door.y
                );
                if (dist < 100) {
                    if (this.doorBlinkTween) {
                        this.doorBlinkTween.stop();
                        this.scene.door.setAlpha(1);
                    }

                    this.scene.generalSound.stop();
                    this.scene.scene.start('EndScene');
                }
            }
        }
    }

    hitEctoplasm(player, trap) {
        if (!player.isOnFloor) return;
        if (this.ectoplasmHurt) return;

        this.ectoplasmHurt = true;

        const dir = Math.sign(player.body.velocity.x || 1);
        player.setVelocity(-150 * dir, -220);

        this.scene.cameras.main.shake(120, 0.004);
        this.scene.ui.showMessage('¡Auch! El ectoplasma te quemó las patitas 💥');
        this.scene.catHurtSound.play();
        this.scene.lifeManager.takeDamage(1);
        this.scene.ui.updateLives(this.scene.lifeManager.lives);

        this.scene.time.delayedCall(900, () => {
            this.ectoplasmHurt = false;
        });
    }

    resetLevel() {
        if (this.scene.generalSound) {
            this.scene.generalSound.stop();
        }
        this.scene.scene.restart();
    }

    collectYarn(player, yarnPickup) {
        if (!yarnPickup.body || !yarnPickup.body.enable) return;

        yarnPickup.body.enable = false;

        this.scene.tweens.add({
            targets: yarnPickup,
            scale: yarnPickup.scale * 1.3,
            y: yarnPickup.y - 10,
            duration: 120,
            yoyo: true,
            onComplete: () => {
                yarnPickup.destroy();

                this.yarnCount += 1;
                this.scene.ui.updateYarn(this.yarnCount);
                this.scene.ui.showMessage('¡Has recogido una bola de estambre! 🧶');
            }
        });
    }

    throwYarn() {
        if (this.yarnCount <= 0) {
            this.scene.ui.showMessage('No tienes estambre 😿');
            this.scene.time.delayedCall(800, () => this.scene.ui.showMessage(''));
            return;
        }

        const player = this.scene.player;
        const yarn = this.scene.yarnGroup.create(player.x, player.y - 10, 'yarn');
        yarn.setScale(0.1);
        yarn.setDepth(5);
        if (yarn.body) {
            yarn.body.setSize(yarn.width, yarn.height, true);
        }

        const direction = player.flipX ? -1 : 1;
        yarn.setVelocity(350 * direction, -200);
        yarn.setAngularVelocity(400 * direction);
        yarn.body.allowGravity = true;

        this.yarnCount -= 1;
        this.scene.ui.updateYarn(this.yarnCount);

        this.scene.time.delayedCall(3000, () => {
            if (yarn && yarn.active) yarn.destroy();
        });
    }

    hitEnemyWithYarn(yarn, enemy) {
        if (!enemy || !enemy.active) return;

        enemy.destroy();
        yarn.destroy();

        this.scene.enemies = this.scene.enemies.filter(e => e !== enemy);

        this.scene.ui.showMessage('¡Fantasma derrotado! 👻🧶');
        this.scene.time.delayedCall(1000, () => this.scene.ui.showMessage(''));
    }

    onDoorUnlocked() {
        this.scene.ui.showMessage('¡La puerta del ático está abierta! Presiona E cerca para salir');
        this.scene.time.delayedCall(1800, () => this.scene.ui.showMessage(''));

        this.scene.door.setTint(0xfff176);

        this.doorBlinkTween = this.scene.tweens.add({
            targets: this.scene.door,
            alpha: 0.4,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }
}
