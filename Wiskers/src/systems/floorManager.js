// systems/floorManager.js
export function createFloors(scene, width, height) {
    const totalFloors = 5;        // número de pisos
    const floorHeight = 200;      // altura de cada piso
    const worldHeight = totalFloors * floorHeight;

    // Altura del mundo físico un poco más grande para que el gato pueda caer
    const physicsWorldHeight = worldHeight + 600;
    scene.physics.world.setBounds(0, 0, width, physicsWorldHeight);

    const rooms = [];
    const platforms = [];
    const colors = [0x7b5ba0, 0x9f73b5, 0x6f5fa8, 0x836ab5];

    // configuración de pisos partidos
    const segmentWidth = width * 0.38;         // ancho de cada mitad del piso
    const gapWidth = width - segmentWidth * 2; // hueco central
    const gapCenterX = width / 2;

    for (let i = 0; i < totalFloors; i++) {
        const yTop = worldHeight - (i * floorHeight);
        const yBottom = yTop - floorHeight;
        const yCenter = (yTop + yBottom) / 2;

        // --- Fondo del piso ---
        const scrollOffsetY = i * 30;
        const roomBg = scene.add.tileSprite(
            width / 2,
            yCenter,
            width,
            floorHeight + 5,
            'roomTexture'
        )
            .setDepth(-5)
            .setTint(colors[i % colors.length])
            .setScrollFactor(1)
            .setTilePosition(0, scrollOffsetY)
            .setAlpha(0.9);

        // === PISO IZQUIERDO (visible + colisión) ===
        const leftX = segmentWidth / 2;

        const tileFloorLeft = scene.add.tileSprite(
            leftX,
            yTop,
            segmentWidth,
            60,
            'floorTexture'
        )
            .setOrigin(0.5, 1)
            .setDepth(-4);

        const solidFloorLeft = scene.add.rectangle(
            leftX,
            yTop - 10,
            segmentWidth,
            20,
            0x000000,
            0
        );
        scene.physics.add.existing(solidFloorLeft, true);
        solidFloorLeft.visible = false;

        // === PISO DERECHO (visible + colisión) ===
        const rightX = width - segmentWidth / 2;

        const tileFloorRight = scene.add.tileSprite(
            rightX,
            yTop,
            segmentWidth,
            60,
            'floorTexture'
        )
            .setOrigin(0.5, 1)
            .setDepth(-4);

        const solidFloorRight = scene.add.rectangle(
            rightX,
            yTop - 10,
            segmentWidth,
            20,
            0x000000,
            0
        );
        scene.physics.add.existing(solidFloorRight, true);
        solidFloorRight.visible = false;

        rooms.push({
            roomBg,
            tileFloorLeft,
            tileFloorRight,
            solidFloorLeft,
            solidFloorRight,
            // GameScene usa .solidFloor.y → dejamos uno de referencia
            solidFloor: solidFloorLeft
        });

        platforms.push(solidFloorLeft, solidFloorRight);
    }

    // ===== PLATAFORMAS ASCENDENTES ENTRE PISOS =====
    const stepWidth = 110;
    const stepsPerGap = 4;
    const stepOffsetX = gapWidth * 0.20;

    for (let i = 0; i < totalFloors - 1; i++) {
        const bottomY = rooms[i].solidFloor.y;
        const topY = rooms[i + 1].solidFloor.y;

        for (let s = 1; s <= stepsPerGap; s++) {
            const t = s / (stepsPerGap + 1); // 0..1 entre pisos

            // puntos entre los que interpolamos
            const startY = bottomY - 2;    // casi pegado al piso de abajo
            const endY = topY + 10;      // un poco por debajo del piso de arriba

            const y = Phaser.Math.Linear(startY, endY, t);

            // zig-zag izquierda / derecha del hueco
            const dir = (s % 2 === 0) ? 1 : -1;
            const x = gapCenterX + dir * stepOffsetX;

            // Creamos la plataforma directamente como physics image
            const step = scene.physics.add.image(x, y, 'floorTexture');

            const stepHeight = 22; // lo que quieras

            step.setDisplaySize(stepWidth, stepHeight);
            step.setOrigin(0.5, 1);
            step.setDepth(-4);
            step.setImmovable(true);
            step.body.allowGravity = false;

            platforms.push(step);

            // === Hacemos que ALGUNAS se muevan ===
            // Elige las que quieras; aquí sólo son ejemplo:
            const mustMove =
                (i === 1 && s === 2) ||  // entre piso 2 y 3
                (i === 2 && s === 3);    // entre piso 3 y 4

            if (mustMove) {
                scene.tweens.add({
                    targets: step,
                    x: x + dir * 160,   // se desplaza hacia el hueco y vuelve
                    duration: 2000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.inOut',
                    onUpdate: () => {
                        // MUY IMPORTANTE: que el cuerpo físico siga al sprite
                        if (step.body) step.body.updateFromGameObject();
                    }
                });
            }
        }
    }

    return {rooms, platforms, worldHeight, floorHeight};
}
