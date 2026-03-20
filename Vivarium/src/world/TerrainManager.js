import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { TERRAIN_CONFIG } from '../config/gameConfig.js';

export class TerrainManager {
  constructor(scene) {
    this.scene = scene;
    this.terrain = null;
  }

  init() {
    // load grass texture for the ground
    const texture_loader = new THREE.TextureLoader();
    const grass_texture = texture_loader.load(TERRAIN_CONFIG.texture_path);
    grass_texture.wrapS = THREE.RepeatWrapping;
    grass_texture.wrapT = THREE.RepeatWrapping;
    grass_texture.repeat.set(
      TERRAIN_CONFIG.texture_repeat,
      TERRAIN_CONFIG.texture_repeat
    );

    // create a plane to act as the ground
    const geometry = new THREE.PlaneGeometry(
      TERRAIN_CONFIG.size,
      TERRAIN_CONFIG.size,
      TERRAIN_CONFIG.segments,
      TERRAIN_CONFIG.segments
    );

    const material = new THREE.MeshStandardMaterial({
      map: grass_texture,
      color: 0x244a27,
      roughness: 0.9,
      metalness: 0.0
    });

    this.terrain = new THREE.Mesh(geometry, material);
    this.terrain.rotation.x = -Math.PI / 2;
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
    console.log('terrain created');
  }

  getTerrain() {
    return this.terrain;
  }
}