import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { LIGHT_CONFIG } from '../config/gameConfig.js';

export class LightingManager {
  constructor(scene) {
    this.scene = scene;
    this.directionalLight = null;
    this.ambientLight = null;
  }

  init() {
    // create a sun like light
    const dir = LIGHT_CONFIG.directional;
    this.directionalLight = new THREE.DirectionalLight(
      dir.color,
      dir.intensity
    );
    this.directionalLight.position.set(
      dir.position.x,
      dir.position.y,
      dir.position.z
    );
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = dir.shadow_map_size;
    this.directionalLight.shadow.mapSize.height = dir.shadow_map_size;
    this.directionalLight.shadow.camera.left = -dir.shadow_camera_size;
    this.directionalLight.shadow.camera.right = dir.shadow_camera_size;
    this.directionalLight.shadow.camera.top = dir.shadow_camera_size;
    this.directionalLight.shadow.camera.bottom = -dir.shadow_camera_size;
    this.scene.add(this.directionalLight);

    // soft light that fills dark areas
    const amb = LIGHT_CONFIG.ambient;
    this.ambientLight = new THREE.AmbientLight(
      amb.color,
      amb.intensity
    );
    this.scene.add(this.ambientLight);
  }

  getDirectionalLight() {
    return this.directionalLight;
  }

  getAmbientLight() {
    return this.ambientLight;
  }
}