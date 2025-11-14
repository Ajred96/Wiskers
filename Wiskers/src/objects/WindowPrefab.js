// prefabs/WindowPrefab.js
export function createWindow(scene, x, y) {
    const windowSprite = scene.physics.add.staticSprite(x, y, 'window');

    // Origen y escala como los tenías
    windowSprite.setOrigin(-5.7, 1.6);
    windowSprite.setScale(0.11);

    // Actualizar hitbox
    windowSprite.refreshBody();

    const windowW = windowSprite.body.width;
    const windowH = windowSprite.body.height;

    // Hitbox ajustada
    windowSprite.body.setSize(windowW * 0.9, windowH * 0.11);
    windowSprite.body.setOffset(windowW * 0.11, windowH * 0.9);

    windowSprite.setDepth(2);

    return windowSprite;
}
