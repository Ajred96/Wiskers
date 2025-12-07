import { GhostEnemy } from './GhostEnemy.js';

export function preloadEnemies(scene) {
    GhostEnemy.preload(scene);
}

export function createEnemies(scene) {
    GhostEnemy.createAnimations(scene);
    const ghost1 = new GhostEnemy(scene, 500, 320);

    // Enemigo en el piso 3 (índice 2)
    // Usamos la posición Y del suelo de esa habitación
    const floor3Y = scene.rooms[2].solidFloor.y;
    const ghost2 = new GhostEnemy(scene, 1149, floor3Y - 60);

    return [ghost1, ghost2];
}
