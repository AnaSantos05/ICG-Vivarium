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
import { CinematicManager } from './core/CinematicManager.js';
import { IntroScreen } from './ui/IntroScreen.js';

// set body background
document.body.style.backgroundColor = '#000000';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

// loading screen while main assets load
const loadingScreen = new LoadingScreen();
const introScreen = new IntroScreen();
let game_started = false;
let controls_enabled = false;
let cinematic_manager = null;

let assets_to_load = 2; // player and vegetation
let assets_loaded = 0;

function onAssetLoaded() {
  assets_loaded++;
  const progress = assets_loaded / assets_to_load;
  loadingScreen.updateProgress(progress);

  if (assets_loaded >= assets_to_load) {
    setTimeout(() => {
      loadingScreen.onGameReady(() => {
        // after loading screen, show intro transition from vivarium-vite
        introScreen.show(() => {
          game_started = true;
          console.log('game start after intro screen');

          if (cinematic_manager) {
            cinematic_manager.start(() => {
              controls_enabled = true;
              console.log('cinematic finished, controls enabled');
            });
          } else {
            controls_enabled = true;
          }
        });
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

// intro cinematic manager
cinematic_manager = new CinematicManager(camera, playerManager, vegetationManager, terrainManager);

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

  // play intro cinematic before giving control to the player
  if (cinematic_manager && cinematic_manager.isActive()) {
    cinematic_manager.update(delta);
    sceneManager.render();
    return;
  }

  if (controls_enabled) {
    playerManager.update(delta, inputManager, vegetationManager);
  }

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