import './style.css';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { SceneManager } from './core/SceneManager.js';
import { LightingManager } from './core/LightingManager.js';
import { GameClock } from './core/GameClock.js';
import { TerrainManager } from './world/TerrainManager.js';
import { VegetationManager } from './world/VegetationManager.js';
import { SkyManager } from './world/SkyManager.js';
import { CameraController } from './camera/CameraController.js';
import { PlayerManager } from './entities/PlayerManager.js';
import { InputManager } from './input/InputManager.js';
import { LoadingScreen } from './ui/LoadingScreen.js';
import { CinematicManager } from './core/CinematicManager.js';
import { IntroScreen } from './ui/IntroScreen.js';
import { CreditsIntroScreen } from './ui/CreditsIntroScreen.js';
import { PlayScreen } from './ui/PlayScreen.js';
import { MainMenu } from './ui/MainMenu.js';
import { AudioManager } from './audio/AudioManager.js';
import { HUDManager } from './ui/HUDManager.js';

// set body background
document.body.style.backgroundColor = '#000000';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

// ui and audio
const audioManager = new AudioManager();
audioManager.init();

const creditsIntro = new CreditsIntroScreen();
const playScreen = new PlayScreen();
const mainMenu = new MainMenu();
const introOverlay = new IntroScreen();
let hudManager = null;

// game objects (lazy-initialized after play)
let loadingScreen = null;
let sceneManager = null;
let scene = null;
let camera = null;
let renderer = null;
let lightingManager = null;
let game_clock = null;
let sky_manager = null;
let terrainManager = null;
let vegetationManager = null;
let inputManager = null;
let playerManager = null;
let cameraController = null;
let cinematic_manager = null;

let game_started = false;
let controls_enabled = false;

let assets_to_load = 2; // player and vegetation
let assets_loaded = 0;

const clock = new THREE.Clock();

function onAssetLoaded() {
  assets_loaded++;

  if (loadingScreen) {
    const progress = assets_loaded / assets_to_load;
    loadingScreen.updateProgress(progress);
  }

  if (assets_loaded >= assets_to_load && loadingScreen) {
    setTimeout(() => {
      loadingScreen.onGameReady(() => {
        // after assets are ready and player presses a key,
        // fade from loading into the black intro overlay,
        // then start the cinematic and enable controls
        introOverlay.show(() => {
          game_started = true;
          audioManager.startGameplayAmbience();
          console.log('game start after loading');

          if (cinematic_manager) {
            cinematic_manager.start(() => {
              controls_enabled = true;
              console.log('cinematic finished, controls enabled');
              // only show the hud after the cinematic ends
              if (!hudManager) {
                hudManager = new HUDManager();
                hudManager.init();
              }
            });
          } else {
            controls_enabled = true;
            if (!hudManager) {
              hudManager = new HUDManager();
              hudManager.init();
            }
          }
        });
      });
    }, 300);
  }
}

function startCoreGame() {
  // start loading screen and core systems only after play
  loadingScreen = new LoadingScreen();
  assets_loaded = 0;

  sceneManager = new SceneManager();
  sceneManager.init();

  scene = sceneManager.getScene();
  camera = sceneManager.getCamera();
  renderer = sceneManager.getRenderer();

  lightingManager = new LightingManager(scene);
  lightingManager.init();

  // day/night cycle
  game_clock = new GameClock();

  // sky dome
  sky_manager = new SkyManager(scene);
  sky_manager.init();

  terrainManager = new TerrainManager(scene);
  terrainManager.init();

  vegetationManager = new VegetationManager(scene, terrainManager, sceneManager);
  vegetationManager.init(onAssetLoaded);

  inputManager = new InputManager();
  playerManager = new PlayerManager(scene, terrainManager);
  playerManager.init(onAssetLoaded);
  playerManager.attach_audio_manager(audioManager);

  cameraController = new CameraController(camera);

  cinematic_manager = new CinematicManager(camera, playerManager, vegetationManager, terrainManager);


  // small debug helper: allow testing fox sound from console
  window.debugFoxSound = () => {
    if (audioManager) {
      audioManager.playFoxSound();
    }
  };
}

// intro (name) -> play screen -> main menu -> loading/black intro -> animation
audioManager.playMenuMusic();

creditsIntro.show(() => {
  // after the name intro, show a simple play screen
  playScreen.show(() => {
    // when play is pressed, show the main menu exactly like vivarium-vite
    mainMenu.init();
    mainMenu.onNewGame = () => {
      // when new game is chosen, hide menu, stop menu music and start core game
      audioManager.stopMenuMusic();
      startCoreGame();
    };
  });
});

function animate() {
  requestAnimationFrame(animate);

  if (!sceneManager) {
    return;
  }

  const delta = Math.min(clock.getDelta(), 0.1);

  // keep day/night running even during menus / cinematic
  if (game_clock && lightingManager) {
    game_clock.update(delta);
    const nightAmount = game_clock.getNightAmount();
    lightingManager.updateDayNightCycle(nightAmount);
    if (sky_manager) sky_manager.updateDayNightCycle(nightAmount);
  }

  if (!game_started) {
    // while waiting for the player to start the game,
    // keep rendering a static frame so there is no black screen
    sceneManager.render();
    return;
  }

  // play intro cinematic before giving control to the player
  if (cinematic_manager && cinematic_manager.isActive()) {
    cinematic_manager.update(delta);

    const cinematicPlayerPos = playerManager ? playerManager.get_position() : null;
    if (cinematicPlayerPos) {
      if (lightingManager) lightingManager.updatePlayerLight(cinematicPlayerPos);
      if (sky_manager) sky_manager.update(cinematicPlayerPos);
    }

    sceneManager.render();
    return;
  }

  if (controls_enabled && playerManager && inputManager && vegetationManager) {
    playerManager.update(delta, inputManager, vegetationManager);
  }

  // update camera (looking at world center)
  const playerPosition = playerManager ? playerManager.get_position() : null;
  const playerRotation = playerManager ? playerManager.get_rotation_y() : 0;
  const target = playerPosition || new THREE.Vector3(0, 0, 0);

  if (playerPosition) {
    if (lightingManager) lightingManager.updatePlayerLight(playerPosition);
    if (sky_manager) sky_manager.update(playerPosition);
  }

  if (hudManager && playerPosition) {
    const treeMarkers = vegetationManager ? vegetationManager.get_tree_minimap_markers() : null;
    hudManager.update(playerPosition, treeMarkers);
  }
  if (cameraController && inputManager && terrainManager) {
    cameraController.update(target, playerRotation, inputManager, terrainManager);
  }

  // render
  sceneManager.render();
}

animate();
console.log('Game started successfully');