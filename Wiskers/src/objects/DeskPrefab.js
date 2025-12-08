// prefabs/DeskPrefab.js
export function createDesk(scene, x, y) {
    const desk = scene.physics.add.staticSprite(x, y, 'desk');

    desk.setOrigin(0.5, 1);
    desk.setScale(0.15);

    // Actualizar el cuerpo real después de escalar
    desk.refreshBody();

    const bw = desk.body.width;
    const bh = desk.body.height;

    // Ajustar hitbox útil
    desk.body.setSize(bw * 0.8, bh * 0.25);
    desk.body.setOffset(bw * 0.1, bh * 0.25);

    desk.setDepth(3);

    return desk; // importantísimo
}
