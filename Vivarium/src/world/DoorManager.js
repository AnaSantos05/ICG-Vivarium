import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import { DOOR_CONFIG } from '../config/gameConfig.js';

export class DoorManager {
  constructor(scene, terrainManager) {
    this.scene = scene;
    this.terrainManager = terrainManager;

    this.door = null;
    this.prompt = null;
    this.isSpawned = false;
    this.isUnlocked = false;
    this.onUnlocked = null;
  }

  setOnUnlocked(callback) {
    this.onUnlocked = typeof callback === 'function' ? callback : null;
  }

  spawn() {
    if (this.isSpawned || !this.scene) return;
    this.isSpawned = true;

    const loader = new GLTFLoader();
    loader.load(DOOR_CONFIG.model, (gltf) => {
      this.door = gltf.scene;
      this.door.scale.setScalar(DOOR_CONFIG.scale || 1);

      const pos = DOOR_CONFIG.position || { x: 0, z: 0 };
      const y = this.terrainManager && typeof this.terrainManager.getTerrainHeight === 'function'
        ? this.terrainManager.getTerrainHeight(pos.x, pos.z)
        : 0;

      this.door.position.set(pos.x, y, pos.z);
      this.door.rotation.y = DOOR_CONFIG.rotation_y || 0;

      this.door.traverse((child) => {
        if (!child || !child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
      });

      this.scene.add(this.door);
      this.ensurePrompt();
    });
  }

  ensurePrompt() {
    if (this.prompt) return;

    const prompt = document.createElement('div');
    prompt.style.position = 'fixed';
    prompt.style.left = '50%';
    prompt.style.top = '50%';
    prompt.style.transform = 'translate(-50%, 130px)';
    prompt.style.padding = '10px 16px';
    prompt.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    prompt.style.color = 'white';
    prompt.style.fontFamily = 'Arial, sans-serif';
    prompt.style.fontSize = '16px';
    prompt.style.fontWeight = 'bold';
    prompt.style.borderRadius = '10px';
    prompt.style.border = '2px solid #ffd700';
    prompt.style.zIndex = '2000';
    prompt.style.display = 'none';
    prompt.innerHTML = 'press <span style="color: #ffd700;">[e]</span> to unlock the door';

    document.body.appendChild(prompt);
    this.prompt = prompt;
  }

  update(playerPosition, inputManager, hasKey) {
    if (!this.door || this.isUnlocked || !playerPosition) return;

    const dx = playerPosition.x - this.door.position.x;
    const dz = playerPosition.z - this.door.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const inRange = dist < (DOOR_CONFIG.interaction_distance || 5);

    if (this.prompt) {
      this.prompt.style.display = inRange && hasKey ? 'block' : 'none';
    }

    if (!inRange || !hasKey) return;

    const pressedInteract = inputManager && typeof inputManager.was_key_just_pressed === 'function'
      ? inputManager.was_key_just_pressed('e')
      : false;

    if (pressedInteract) {
      this.unlock();
    }
  }

  check_collision(x, z) {
    if (!this.door || this.isUnlocked) return false;
    if (!Number.isFinite(x) || !Number.isFinite(z)) return false;

    const dx = x - this.door.position.x;
    const dz = z - this.door.position.z;
    const radius = DOOR_CONFIG.collision_radius || 3;
    return Math.sqrt(dx * dx + dz * dz) < radius;
  }

  unlock() {
    if (this.isUnlocked) return;
    this.isUnlocked = true;

    if (this.prompt) {
      this.prompt.style.display = 'none';
    }

    if (this.onUnlocked) {
      this.onUnlocked();
    }
  }
}
