// systems/floorManager.js
export function createFloors(scene, width, height) {
    const totalFloors = 5;        // número de pisos
    const floorHeight = 200;      // altura de cada piso
    const worldHeight = totalFloors * floorHeight;

    // Límite del mundo físico
    scene.physics.world.setBounds(0, 0, width, worldHeight);

    const rooms = [];
    const platforms = [];

    for (let i = 0; i < totalFloors; i++) {
        const yTop = worldHeight - (i * floorHeight);
        const yBottom = yTop - floorHeight;
        const yCenter = (yTop + yBottom) / 2;

        // --- Fondo del piso ---
        const roomBg = scene.add.tileSprite(
            width / 2,
            yCenter,
            width,
            floorHeight,
            'roomTexture'
        )
        .setDepth(-5)
        .setScrollFactor(1);

        // --- Piso visible (textura del suelo) ---
        const tileFloor = scene.add.tileSprite(
            width / 2,
            yTop - 10,
            width,
            60,
            'floorTexture'
        )
        .setOrigin(0.5, 1)
        .setDepth(-4);

        // --- Piso invisible (colisionable) ---
        const solidFloor = scene.add.rectangle(
            width / 2,
            yTop - 10,
            width,
            20,
            0x000000,
            0 // invisible
        );
        scene.physics.add.existing(solidFloor, true); // cuerpo estático
        solidFloor.visible = false;

        // Guardamos referencias
        rooms.push({ roomBg, tileFloor, solidFloor });
        platforms.push(solidFloor);
    }

    // Retornamos todo lo necesario para usar en la escena
    return { rooms, platforms, worldHeight,floorHeight };
}
