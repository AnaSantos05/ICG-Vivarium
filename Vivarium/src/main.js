import './style.css';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { SceneManager } from './core/SceneManager.js';
import { LightingManager } from './core/LightingManager.js';
import { TerrainManager } from './world/TerrainManager.js';
import { VegetationManager } from './world/VegetationManager.js';
import { CameraController } from './camera/CameraController.js';
import { PlayerManager } from './entities/PlayerManager.js';
import { InputManager } from './input/InputManager.js';
import { LoadingScreen } from './ui/LoadingScreen.js';

// set body background
document.body.style.backgroundColor = '#000000';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

// loading screen while main assets load
const loadingScreen = new LoadingScreen();
let game_started = false;

let assets_to_load = 2; // player and vegetation
let assets_loaded = 0;

function onAssetLoaded() {
  assets_loaded++;
  const progress = assets_loaded / assets_to_load;
  loadingScreen.updateProgress(progress);

  if (assets_loaded >= assets_to_load) {
    setTimeout(() => {
      loadingScreen.onGameReady(() => {
        game_started = true;
        console.log('game start after loading screen');
      });
    }, 300);
  }
}

// initialize core systems
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

// add trees and bushes on top of the terrain
const vegetationManager = new VegetationManager(scene, terrainManager, sceneManager);
vegetationManager.init(onAssetLoaded);

// initialize input and player
const inputManager = new InputManager();
const playerManager = new PlayerManager(scene, terrainManager);
playerManager.init(onAssetLoaded);

// initialize camera controller
const cameraController = new CameraController(camera);

// animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  if (!game_started) {
    // while waiting for the player to start the game,
    // keep rendering a static frame so there is no black screen
    sceneManager.render();
    return;
  }

  const delta = Math.min(clock.getDelta(), 0.1);

  playerManager.update(delta, inputManager, vegetationManager);

  // update camera (looking at world center)
  const playerPosition = playerManager.get_position();
  const playerRotation = playerManager.get_rotation_y();
  const target = playerPosition || new THREE.Vector3(0, 0, 0);
  cameraController.update(target, playerRotation, inputManager, terrainManager);

  // render
  sceneManager.render();
}

animate();
console.log('Game started successfully');