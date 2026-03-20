import './style.css';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { SceneManager } from './core/SceneManager.js';
import { LightingManager } from './core/LightingManager.js';
import { TerrainManager } from './world/TerrainManager.js';
import { CameraController } from './camera/CameraController.js';

// set body background
document.body.style.backgroundColor = '#000000';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

// Initialize core systems
const sceneManager = new SceneManager();
sceneManager.init();

const scene = sceneManager.getScene();
const camera = sceneManager.getCamera();
const renderer = sceneManager.getRenderer();

// initialize lighting
const lightingManager = new LightingManager(scene);
lightingManager.init();

// initialize terrain
const terrainManager = new TerrainManager(scene);
terrainManager.init();

// initialize camera controller
const cameraController = new CameraController(camera);

// animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // update camera (looking at world center)
  cameraController.update(new THREE.Vector3(0, 0, 0));

  // render
  sceneManager.render();
}

animate();
console.log('Game started successfully');