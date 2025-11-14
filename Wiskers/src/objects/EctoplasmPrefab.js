// prefabs/EctoplasmPrefab.js
export function createEctoplasm(scene, x, floorY) {
    const trap = scene.physics.add.staticSprite(x, floorY, 'ectoplasm');

    trap.setOrigin(0.5, 1);     // apoyado en el piso
    trap.setScale(0.2);         // ajusta según tamaño de tu PNG
    trap.refreshBody();

    // Ajustar hitbox reducido
    const w = trap.width;
    const h = trap.height;

    trap.body.setSize(w * 0.15, h * 0.2, true);
    trap.body.offset.y += h * 0.3;  // bajar un poco el hitbox

    trap.setDepth(5);

    return trap;  // importante
}
