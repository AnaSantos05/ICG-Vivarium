import './style.css';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { SceneManager } from './core/SceneManager.js';
import { LightingManager } from './core/LightingManager.js';
import { GameClock } from './core/GameClock.js';
import { TerrainManager } from './world/TerrainManager.js';
import { VegetationManager } from './world/VegetationManager.js';
import { SkyManager } from './world/SkyManager.js';
import { ArenaManager } from './world/ArenaManager.js';
import { CameraController } from './camera/CameraController.js';
import { PlayerManager } from './entities/PlayerManager.js';
import { BossManager } from './entities/BossManager.js';
import { NPCManager } from './entities/NPCManager.js';
import { InputManager } from './input/InputManager.js';
import { LoadingScreen } from './ui/LoadingScreen.js';
import { CinematicManager } from './core/CinematicManager.js';
import { IntroScreen } from './ui/IntroScreen.js';
import { CreditsIntroScreen } from './ui/CreditsIntroScreen.js';
import { PlayScreen } from './ui/PlayScreen.js';
import { MainMenu } from './ui/MainMenu.js';
import { AudioManager } from './audio/AudioManager.js';
import { HUDManager } from './ui/HUDManager.js';
import { BossUIManager } from './ui/BossUIManager.js';
import { ARENA_CONFIG } from './config/gameConfig.js';

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
let arenaManager = null;
let inputManager = null;
let playerManager = null;
let npcManager = null;
let bossManager = null;
let cameraController = null;
let cinematic_manager = null;
let bossUIManager = null;

// shared arena info for ui/music triggers
let arena_zone = null;

let game_started = false;
let controls_enabled = false;

let dev_skip_flow = false;
let dev_quick_start_triggered = false;

let assets_to_load = 4; // player, vegetation, npc, boss
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
      const startGameplayImmediately = () => {
        game_started = true;
        controls_enabled = true;
        audioManager.startGameplayAmbience();
        console.log('game start (dev quick start)');

        if (cinematic_manager && cinematic_manager.isActive && cinematic_manager.isActive()) {
          cinematic_manager.end();
        }

        if (!hudManager) {
          hudManager = new HUDManager();
          hudManager.init();
        }
      };

      if (dev_skip_flow && typeof loadingScreen.hideImmediately === 'function') {
        loadingScreen.hideImmediately(startGameplayImmediately);
        return;
      }

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
  // arena configuration
  const arenaX = ARENA_CONFIG.center.x;
  const arenaZ = ARENA_CONFIG.center.z;
  const arenaRadius = ARENA_CONFIG.radius;
  const arenaWakeRadius = ARENA_CONFIG.wake_radius;

  arena_zone = {
    x: arenaX,
    z: arenaZ,
    radius: arenaRadius,
    wake_radius: arenaWakeRadius
  };

  terrainManager.setFlatZone(arenaX, arenaZ, arenaRadius);
  terrainManager.init();

  arenaManager = new ArenaManager(scene);
  arenaManager.init(arenaX, arenaZ, 0);

  vegetationManager = new VegetationManager(scene, terrainManager, sceneManager);
  vegetationManager.setArenaZone(arenaX, arenaZ, arenaRadius);
  vegetationManager.init(onAssetLoaded);

  npcManager = new NPCManager(scene, terrainManager, vegetationManager);
  npcManager.init(onAssetLoaded);

  inputManager = new InputManager();
  playerManager = new PlayerManager(scene, terrainManager);
  playerManager.init(onAssetLoaded);
  playerManager.attach_audio_manager(audioManager);

  bossManager = new BossManager(scene, terrainManager, vegetationManager);
  bossManager.setArenaCenter(arenaX, arenaZ);
  bossManager.init(onAssetLoaded);

  bossUIManager = new BossUIManager();

  cameraController = new CameraController(camera);

  cinematic_manager = new CinematicManager(camera, playerManager, vegetationManager, terrainManager);

  // register arena bushes for culling once they have had time to load
  setTimeout(() => {
    if (sceneManager && arenaManager && Array.isArray(arenaManager.bushes)) {
      sceneManager.registerCullableObjects(arenaManager.bushes);
    }
  }, 4000);


  // small debug helper: allow testing fox sound from console
  window.debugFoxSound = () => {
    if (audioManager) {
      audioManager.playFoxSound();
    }
  };
}

// intro (name) -> play screen -> main menu -> loading/black intro -> animation
audioManager.playMenuMusic();

function devQuickStart() {
  if (dev_quick_start_triggered) return;
  dev_quick_start_triggered = true;
  dev_skip_flow = true;

  // stop any menu path callbacks from firing later
  creditsIntro.onComplete = null;
  playScreen.onPlayClick = null;
  mainMenu.onNewGame = null;

  // hide/remove any visible menu overlays
  const idsToRemove = ['credits-intro-screen', 'play-screen', 'main-menu', 'intro-screen'];
  idsToRemove.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  if (audioManager && typeof audioManager.stopMenuMusic === 'function') {
    audioManager.stopMenuMusic();
  }

  // start the core game if it isn't already loading/initialized
  if (!sceneManager) {
    startCoreGame();
  }

  // if assets are already loaded and we're still waiting at the loading gate,
  // force-start immediately
  if (!game_started && loadingScreen && assets_loaded >= assets_to_load && typeof loadingScreen.hideImmediately === 'function') {
    loadingScreen.hideImmediately(() => {
      game_started = true;
      controls_enabled = true;
      audioManager.startGameplayAmbience();
      if (!hudManager) {
        hudManager = new HUDManager();
        hudManager.init();
      }
    });
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === '9') {
    devQuickStart();
  }
});

creditsIntro.show(() => {
  if (dev_skip_flow) return;

  // after the name intro, show a simple play screen
  playScreen.show(() => {
    if (dev_skip_flow) return;

    // when play is pressed, show the main menu
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
    playerManager.update(delta, inputManager, vegetationManager, bossManager);
  }

  // update camera (looking at world center)
  const playerPosition = playerManager ? playerManager.get_position() : null;
  const playerRotation = playerManager ? playerManager.get_rotation_y() : 0;
  const target = playerPosition || new THREE.Vector3(0, 0, 0);

  if (playerPosition) {
    if (lightingManager) lightingManager.updatePlayerLight(playerPosition);
    if (sky_manager) sky_manager.update(playerPosition);
    if (npcManager) npcManager.update(playerPosition, inputManager);
  }

  // boss logic (wake/attack) + simple proximity ui
  if (bossManager && playerPosition) {
    bossManager.update(delta, playerPosition);

    // player-in-arena check is used for ui + music
    let isInArena = false;
    if (arena_zone) {
      const dx = playerPosition.x - arena_zone.x;
      const dz = playerPosition.z - arena_zone.z;
      isInArena = Math.sqrt(dx * dx + dz * dz) < arena_zone.wake_radius;
    }

    const bossLoaded = !!bossManager.getBoss();

    // battle music follows being inside the arena ring
    if (audioManager && typeof audioManager.updateBossMusic === 'function') {
      audioManager.updateBossMusic(isInArena && bossLoaded);
    }

    // show boss name/ui while the fox is inside the arena
    if (bossUIManager) bossUIManager.update(isInArena && bossLoaded);
  }

  if (hudManager && playerPosition) {
    const treeMarkers = vegetationManager ? vegetationManager.get_tree_minimap_markers() : null;
    const bossPos = bossManager ? bossManager.getPosition() : null;
    const npcPos = npcManager && typeof npcManager.getPosition === 'function' ? npcManager.getPosition() : null;

    // reuse the arena logic: skull in range, dot out of range
    let isInArena = false;
    if (arena_zone) {
      const dx = playerPosition.x - arena_zone.x;
      const dz = playerPosition.z - arena_zone.z;
      isInArena = Math.sqrt(dx * dx + dz * dz) < arena_zone.wake_radius;
    }

    const bossLoaded = bossManager ? !!bossManager.getBoss() : false;
    // update camera first so the minimap can show the correct view direction
    if (cameraController && inputManager && terrainManager) {
      cameraController.update(target, playerRotation, inputManager, terrainManager);
    }

    const cameraViewYaw = cameraController && typeof cameraController.get_view_yaw === 'function'
      ? cameraController.get_view_yaw()
      : playerRotation;

    hudManager.update(playerPosition, playerRotation, cameraViewYaw, treeMarkers, bossPos, isInArena && bossLoaded, npcPos);
  }

  // keep updating the camera even if HUD is disabled
  if (!hudManager && cameraController && inputManager && terrainManager) {
    cameraController.update(target, playerRotation, inputManager, terrainManager);
  }

  // render
  sceneManager.render();
}

animate();
console.log('Game started successfully');