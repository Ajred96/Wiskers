import { GhostEnemy } from './GhostEnemy.js';

export function preloadEnemies(scene) {
    console.log('[enemies] preloadEnemies');
    GhostEnemy.preload(scene);
}

export function createEnemies(scene) {
    console.log('[enemies] createEnemies');
    GhostEnemy.createAnimations(scene);
    const ghost = new GhostEnemy(scene, 500, 320); // sensible default (x,y)
    console.log('[enemies] created ghost', ghost);
    return [ghost];
}
