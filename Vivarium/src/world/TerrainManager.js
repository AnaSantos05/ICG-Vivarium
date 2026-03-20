import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { TERRAIN_CONFIG } from '../config/gameConfig.js';

export class TerrainManager {
  constructor(scene) {
    this.scene = scene;
    this.terrain = null;
  }

  init() {
    // create simple plane
    const geometry = new THREE.PlaneGeometry(
      TERRAIN_CONFIG.SIZE,
      TERRAIN_CONFIG.SIZE,
      TERRAIN_CONFIG.SEGMENTS,
      TERRAIN_CONFIG.SEGMENTS
    );

    // create material
    const material = new THREE.MeshStandardMaterial({
      color: 0x7cb342,
      roughness: 0.8,
      metalness: 0.2
    });

    this.terrain = new THREE.Mesh(geometry, material);
    this.terrain.rotation.x = -Math.PI / 2; // rotate to flatten
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
    console.log('Terrain created');
  }

  getTerrain() {
    return this.terrain;
  }
}