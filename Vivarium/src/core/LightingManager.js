import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

export class LightingManager {
  constructor(scene) {
    this.scene = scene;
    this.directionalLight = null;
    this.ambientLight = null;
  }

  init() {
    // ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);
    console.log('Ambient light added');

    // directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(50, 50, 50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(this.directionalLight);
    console.log('Directional light added');
  }

  getDirectionalLight() {
    return this.directionalLight;
  }

  getAmbientLight() {
    return this.ambientLight;
  }
}