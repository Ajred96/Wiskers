// systems/ladderManager.js
export function createLadders(scene, rooms, floorHeight) {
    const ladders = scene.physics.add.staticGroup();

    // Ejemplo de posiciones por piso (ajusta según tu mapa)
    const ladderPositions = [500, 270, 700, 360];
    ladderPositions.forEach((x, i) => {
        const floor = rooms[i].solidFloor;
        const ladder = ladders.create(x, floor.y - 13 - floorHeight / 2, 'ladder');
        ladder.isLadder = true;
        ladder.setDisplaySize(ladder.width, floorHeight - 10);
        ladder.refreshBody();
    });

    return ladders;
}

export function updateLadders(scene, cursors) {
    const player = scene.player;

    const up = cursors.up.isDown;
    const down = cursors.down.isDown;

    // Resetear bandera
    scene.onLadder = false;
    scene.physics.overlap(player, scene.ladders, () => { scene.onLadder = true; });

    // Piso más cercano
    const closestFloor = scene.platforms.find(f => f.y >= player.y && (f.y - player.y) < 120);

    // Collider dinámico
    if ((!scene.activeCollider && closestFloor) ||
        (scene.activeCollider && scene.activeCollider.object2 !== closestFloor)) {
        if (scene.activeCollider) scene.activeCollider.destroy();
        if (closestFloor) {
            scene.activeCollider = scene.physics.add.collider(player, closestFloor);
        } else {
            scene.activeCollider = null;
        }
    }

    // Escalera más cercana
    const nearbyLadder = scene.ladders.getChildren().find(l => {
        const dx = Math.abs(l.x - player.x);
        const dy = Math.abs(l.y - player.y);
        return dx < 30 && dy < 180;
    });

    // --- BAJAR si hay escalera debajo ---
    if (!scene.onLadder && down && nearbyLadder && !scene.isTransitioning) {
        startClimb(scene, nearbyLadder, 'down');
        return;
    }

    // --- Movimiento mientras está en escalera ---
    if (scene.onLadder) {
        player.body.allowGravity = false;
        if (scene.activeCollider) scene.activeCollider.active = false;

        if (up) player.setVelocityY(-110);
        else if (down) player.setVelocityY(110);
        else player.setVelocityY(0);

        const upperFloor = scene.platforms.filter(f => f.y < player.y).sort((a, b) => b.y - a.y)[0];
        if (up && upperFloor && player.y <= upperFloor.y + 8) moveToFloor(scene, upperFloor, -1);

        const lowerFloor = scene.platforms.filter(f => f.y > player.y).sort((a, b) => a.y - b.y)[0];
        if (down && lowerFloor && player.y >= lowerFloor.y - 40) moveToFloor(scene, lowerFloor, 1);
    } else {
        player.body.allowGravity = true;
        if (scene.activeCollider) scene.activeCollider.active = true;
    }
}

function startClimb(scene, ladder, direction) {
    scene.isTransitioning = true;
    const player = scene.player;

    player.body.allowGravity = false;
    if (scene.activeCollider) scene.activeCollider.active = false;

    scene.tweens.add({
        targets: player,
        x: ladder.x,
        y: player.y + (direction === 'down' ? 50 : -50),
        duration: 400,
        ease: 'Sine.easeInOut',
        onComplete: () => {
            scene.isTransitioning = false;
            scene.onLadder = true;
        }
    });
}

function moveToFloor(scene, targetFloor, direction) {
    scene.isTransitioning = true;
    const player = scene.player;

    player.setVelocityY(0);
    player.body.allowGravity = true;
    if (scene.activeCollider) scene.activeCollider.active = true;

    const targetY = direction < 0
        ? targetFloor.y - (player.displayHeight || player.height) - 2
        : targetFloor.y;

    scene.tweens.add({
        targets: player,
        y: targetY,
        duration: 350,
        ease: 'Cubic.easeOut',
        onComplete: () => {
            scene.isTransitioning = false;
            scene.onLadder = false;
        }
    });

    const targetScrollY = Math.max(0, targetFloor.y - scene.scale.height / 1.4);
    scene.tweens.add({
        targets: scene.cameras.main,
        scrollY: targetScrollY,
        duration: 420,
        ease: 'Cubic.easeOut'
    });
}
