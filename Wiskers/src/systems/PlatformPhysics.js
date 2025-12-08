import Phaser from 'phaser';

export class PlatformPhysics {
    constructor(scene, player, platforms) {
        this.scene = scene;
        this.player = player;
        this.platforms = platforms;
        this.activeCollider = null;
        this.lastValidFloor = null;
    }

    update() {
        const player = this.player;
        const playerBottom = player.getBottomCenter().y;
        const playerX = player.x;

        let closestFloor = null;
        let minDistance = Infinity;

        this.platforms.forEach(f => {
            if (!f.body) return;

            const body = f.body;

            const withinX =
                playerX >= body.left - 4 &&
                playerX <= body.right + 4;
            if (!withinX) return;

            const surfaceY = body.top;
            const distance = Math.abs(surfaceY - playerBottom);

            const isBelow = surfaceY >= playerBottom - 10;
            const isClose = distance < 180;

            if (isBelow && isClose && distance < minDistance) {
                minDistance = distance;
                closestFloor = f;
            }
        });

        if (player.isCrouching) {
            if (this.activeCollider && this.activeCollider.active) {
                const currentFloor = this.lastValidFloor;

                if (currentFloor && currentFloor.active && currentFloor.body) {
                    const surfaceY = currentFloor.body.top;
                    const currentDistance = surfaceY - playerBottom;

                    if (currentDistance >= -40 && currentDistance < 180) {
                        // mantiene collider
                    } else {
                        if (closestFloor) {
                            this.activeCollider.destroy();
                            this.activeCollider = this.scene.physics.add.collider(player, closestFloor);
                            this.lastValidFloor = closestFloor;
                        }
                    }
                }
            } else {
                if (closestFloor) {
                    this.activeCollider = this.scene.physics.add.collider(player, closestFloor);
                    this.lastValidFloor = closestFloor;
                }
            }
        } else {
            const shouldUpdateCollider = (
                !this.activeCollider ||
                !this.activeCollider.active ||
                (closestFloor && this.lastValidFloor !== closestFloor)
            );

            if (shouldUpdateCollider && closestFloor) {
                if (this.activeCollider) {
                    this.activeCollider.destroy();
                }
                this.activeCollider = this.scene.physics.add.collider(player, closestFloor);
                this.lastValidFloor = closestFloor;
            }
        }
    }
}
