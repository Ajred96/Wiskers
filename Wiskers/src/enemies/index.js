import {GhostEnemy} from './GhostEnemy.js';

export function preloadEnemies(scene) {
    GhostEnemy.preload(scene);
}

export function createEnemies(scene) {
    GhostEnemy.createAnimations(scene);
    const ghost = new GhostEnemy(scene, 500, 320);
    return [ghost];
}
