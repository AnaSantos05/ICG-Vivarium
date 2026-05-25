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
import { TutorialOverlay } from './ui/TutorialOverlay.js';
import { CinematicManager } from './core/CinematicManager.js';
import { IntroScreen } from './ui/IntroScreen.js';
import { CreditsIntroScreen } from './ui/CreditsIntroScreen.js';
import { PlayScreen } from './ui/PlayScreen.js';
import { MainMenu } from './ui/MainMenu.js';
import { GameOverScreen } from './ui/GameOverScreen.js';
import { AudioManager } from './audio/AudioManager.js';
import { HUDManager } from './ui/HUDManager.js';
import { BossUIManager } from './ui/BossUIManager.js';
import { LoreVideoPlayer } from './ui/LoreVideoPlayer.js';
import { ARENA_CONFIG, SLIME_ARENA_CONFIG, TERRAIN_CONFIG } from './config/gameConfig.js';
import { SaveManager } from './core/SaveManager.js';
import { InventoryManager } from './core/InventoryManager.js';
import { QuestManager } from './core/QuestManager.js';
import { DoorManager } from './world/DoorManager.js';
import { EndScreen } from './ui/EndScreen.js';
import { CreditsRollScreen } from './ui/CreditsRollScreen.js';
import { BossCombatSystem } from './core/BossCombatSystem.js';

// set body background
document.body.style.backgroundColor = '#000000';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

// preload tutorial media early to avoid delays when the overlay opens
const __tutorialGifPreload = new Image();
__tutorialGifPreload.src = './resources/start/tutorial/tudo.GIF';

// ui and audio
const audioManager = new AudioManager();
audioManager.init();
window.audioManager = audioManager;

const creditsIntro = new CreditsIntroScreen();
const playScreen = new PlayScreen();
const mainMenu = new MainMenu();
const gameOverScreen = new GameOverScreen();
const introOverlay = new IntroScreen();
const loreVideoPlayer = new LoreVideoPlayer();
let hudManager = null;
const saveManager = new SaveManager();
const inventoryManager = new InventoryManager(audioManager);
const questManager = new QuestManager(inventoryManager);
let pendingLoadedSnapshot = null;
let hasAppliedLoadedSnapshot = false;
let pendingHudSettings = null;

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
let bossCombatSystem = null;
let doorManager = null;
let endScreen = null;
let creditsRoll = null;

let tutorialOverlay = null;

// shared arena info for ui/music triggers
let arena_zone = null;

let game_started = false;
let controls_enabled = false;
let game_completed = false;

const healthTiers = [0, 5, 15, 25, 50, 75, 100];
const statsState = {
  health: 100,
  stamina: 100,
  staminaCooldown: 0,
  pendingDamage: 0,
  damageTimer: null
};

let dev_skip_flow = false;
let dev_quick_start_triggered = false;

let assets_to_load = 4; // player, vegetation, npc, boss
let assets_loaded = 0;
let post_load_flow_started = false;

const clock = new THREE.Clock();

function wrapWorldPosition(position) {
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.z)) return null;
  if (!TERRAIN_CONFIG || !Number.isFinite(TERRAIN_CONFIG.size)) return null;

  const size = TERRAIN_CONFIG.size;
  const half = size * 0.5;
  let { x, z } = position;

  if (Math.abs(x) <= half && Math.abs(z) <= half) return null;

  const wrappedX = (((x + half) % size) + size) % size - half;
  const wrappedZ = (((z + half) % size) + size) % size - half;

  return { x: wrappedX, z: wrappedZ, y: position.y };
}

function ensureHud() {
  if (!hudManager) {
    hudManager = new HUDManager();
    hudManager.init();
  }

  if (pendingHudSettings) {
    hudManager.applySettingsSnapshot(pendingHudSettings.hud || {});
    pendingHudSettings = null;
  }
}

function getCurrentAreaTag(playerPosition) {
  if (!playerPosition || !arena_zone) return 'mundo';

  const dx = playerPosition.x - arena_zone.x;
  const dz = playerPosition.z - arena_zone.z;
  const insideArena = Math.sqrt(dx * dx + dz * dz) <= arena_zone.radius;
  return insideArena ? 'arena' : 'mundo';
}

function buildSettingsSnapshot() {
  const audioSettings = audioManager && typeof audioManager.getVolumeMix === 'function'
    ? audioManager.getVolumeMix()
    : {
      ambient: 1,
      sfx: 1,
      combat: 1,
      muted: false
    };

  return {
    audio: audioSettings,
    hud: hudManager ? hudManager.getSettingsSnapshot() : { minimapScale: 0.85 },
    controls: {
      enabled: !!controls_enabled
    }
  };
}

function applySettingsSnapshot(settings) {
  if (!settings || typeof settings !== 'object') return;

  const audio = settings.audio || {};
  if (audioManager && typeof audioManager.setVolumeMix === 'function') {
    const hasNewFormat = Number.isFinite(audio.ambient) || Number.isFinite(audio.sfx) || Number.isFinite(audio.combat);
    if (hasNewFormat) {
      audioManager.setVolumeMix(audio);
    } else {
      const ambient = Number.isFinite(audio.forestMusicVolume) ? (audio.forestMusicVolume / 0.18) : 1;
      const combat = Number.isFinite(audio.bossMusicVolume) ? (audio.bossMusicVolume / 0.5) : 1;
      const sfx = Number.isFinite(audio.foxSoundVolume) ? (audio.foxSoundVolume / 0.6) : 1;
      audioManager.setVolumeMix({
        ambient: Math.max(0, Math.min(1, ambient)),
        combat: Math.max(0, Math.min(1, combat)),
        sfx: Math.max(0, Math.min(1, sfx)),
        muted: false
      });
    }
  }

  if (hudManager) {
    hudManager.applySettingsSnapshot(settings.hud || {});
  } else {
    pendingHudSettings = settings;
  }
}

function buildLastMapPoint() {
  if (!playerManager || typeof playerManager.get_position !== 'function') return null;

  const playerPosition = playerManager.get_position();
  if (!playerPosition) return null;

  return {
    x: Number(playerPosition.x.toFixed(3)),
    y: Number(playerPosition.y.toFixed(3)),
    z: Number(playerPosition.z.toFixed(3)),
    rotationY: Number((playerManager.get_rotation_y() || 0).toFixed(4)),
    area: getCurrentAreaTag(playerPosition)
  };
}

function performSave() {
  if (bossManager && typeof bossManager.getDefeatHistory === 'function') {
    const bossHistory = bossManager.getDefeatHistory();
    saveManager.applyBossHistory(bossHistory);
  }

  const snapshot = saveManager.buildSnapshot({
    inventoryItems: inventoryManager.getItems(),
    npcDialogueHistory: npcManager && typeof npcManager.getDialogueHistory === 'function'
      ? npcManager.getDialogueHistory()
      : [],
    questState: questManager.getState(),
    settings: buildSettingsSnapshot(),
    lastMapPoint: buildLastMapPoint()
  });

  return saveManager.saveSnapshot(snapshot);
}

function applyLoadedSnapshotIfNeeded() {
  if (!pendingLoadedSnapshot || hasAppliedLoadedSnapshot) return;
  if (!playerManager || !npcManager || !bossManager) return;

  const snapshot = pendingLoadedSnapshot;

  const elapsed = snapshot?.progress?.gameplayTimeSeconds;
  if (Number.isFinite(elapsed)) {
    saveManager.setElapsedGameplaySeconds(elapsed);
  }

  const loadedInventory = snapshot?.inventory?.items;
  inventoryManager.setItems(Array.isArray(loadedInventory) ? loadedInventory : []);

  const questState = snapshot?.quest;
  if (questState && typeof questState === 'object') {
    questManager.applyState(questState);
  }

  const dialogueHistory = snapshot?.npcDialogueHistory;
  if (typeof npcManager.setDialogueHistory === 'function') {
    npcManager.setDialogueHistory(Array.isArray(dialogueHistory) ? dialogueHistory : []);
  }

  const bossHistory = snapshot?.progress?.bossesDefeated;
  if (Array.isArray(bossHistory)) {
    saveManager.applyBossHistory(bossHistory);
    if (typeof bossManager.applyDefeatHistory === 'function') {
      bossManager.applyDefeatHistory(bossHistory);
    }
  }

  const loadedSettings = snapshot?.settings;
  if (loadedSettings && typeof loadedSettings === 'object') {
    applySettingsSnapshot(loadedSettings);
  }

  const lastPoint = snapshot?.lastMapPoint;
  if (lastPoint && typeof playerManager.set_position === 'function') {
    playerManager.set_position(lastPoint);
  }

  hasAppliedLoadedSnapshot = true;
}

function onAssetLoaded() {
  assets_loaded++;

  if (loadingScreen) {
    const progress = assets_loaded / assets_to_load;
    loadingScreen.updateProgress(progress);
  }

  if (!post_load_flow_started && assets_loaded >= assets_to_load && loadingScreen) {
    applyLoadedSnapshotIfNeeded();
    post_load_flow_started = true;
    setTimeout(() => {
      const startGameplayImmediately = () => {
        game_started = true;
        controls_enabled = false;
        audioManager.startGameplayAmbience();
        console.log('game start (dev quick start)');

        if (cinematic_manager && cinematic_manager.isActive && cinematic_manager.isActive()) {
          cinematic_manager.end();
        }

        ensureHud();

        if (!tutorialOverlay) tutorialOverlay = new TutorialOverlay();
        tutorialOverlay.show(() => {
          controls_enabled = true;
        });
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

          controls_enabled = false;
          if (!tutorialOverlay) tutorialOverlay = new TutorialOverlay();
          tutorialOverlay.show(() => {
            if (cinematic_manager) {
              cinematic_manager.start(() => {
                // only show the hud after the cinematic ends
                ensureHud();

                controls_enabled = true;
                console.log('cinematic finished, controls enabled');
              });
              return;
            }

            ensureHud();
            controls_enabled = true;
          });
        });
      });
    }, 300);
  }
}

// allow reopening the tutorial from the hud (settings)
window.addEventListener('vivarium:open-tutorial', () => {
  if (!tutorialOverlay) tutorialOverlay = new TutorialOverlay();
  const prev = controls_enabled;
  controls_enabled = false;
  tutorialOverlay.show(() => {
    controls_enabled = prev;
  });
});

window.addEventListener('vivarium:save-requested', () => {
  const saveResult = performSave();

  if (saveResult) {
    if (hudManager) {
      hudManager.showSaveFeedback(`save feito: ${saveResult.fileName}`);
    }
    return;
  }

  if (hudManager) {
    hudManager.showSaveFeedback('erro ao fazer save', true);
  }
});

window.addEventListener('vivarium:audio-settings-changed', (event) => {
  const detail = event && event.detail ? event.detail : null;
  if (!detail) return;
  if (audioManager && typeof audioManager.setVolumeMix === 'function') {
    audioManager.setVolumeMix(detail);
  }
});

window.addEventListener('vivarium:npc-talked', (event) => {
  const npcKey = event && event.detail ? event.detail.npcKey : null;
  if (!npcKey || !questManager) return;
  questManager.markNpcTalked(npcKey);
});

function startCoreGame(options = {}) {
  loadingScreen = new LoadingScreen();
  assets_loaded = 0;
  post_load_flow_started = false;
  game_started = false;
  game_completed = false;
  controls_enabled = false;

  pendingLoadedSnapshot = options && options.loadedSnapshot ? options.loadedSnapshot : null;
  hasAppliedLoadedSnapshot = false;
  saveManager.setElapsedGameplaySeconds(0);
  saveManager.applyBossHistory([]);
  inventoryManager.setItems([]);
  questManager.applyState({
    lilithDefeats: 0,
    orbDefeats: 0,
    keyGranted: false,
    talkedToFrog: false,
    talkedToDuck: false,
    talkedToDuckForKey: false
  });
  statsState.health = 100;
  statsState.stamina = 100;
  statsState.staminaCooldown = 0;
  statsState.pendingDamage = 0;
  if (statsState.damageTimer) {
    clearTimeout(statsState.damageTimer);
    statsState.damageTimer = null;
  }

  sceneManager = new SceneManager();
  sceneManager.init();
  window.sceneManager = sceneManager;

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
  const arenaConfig = SLIME_ARENA_CONFIG || ARENA_CONFIG;
  const arenaX = arenaConfig.center.x;
  const arenaZ = arenaConfig.center.z;
  const arenaRadius = arenaConfig.radius;
  const arenaWakeRadius = arenaConfig.wake_radius;

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
  npcManager.setDialogueProvider((npcKey, defaultLines) => questManager.getNpcDialogue(npcKey, defaultLines));

  inputManager = new InputManager();
  playerManager = new PlayerManager(scene, terrainManager);
  playerManager.init(onAssetLoaded);
  playerManager.attach_audio_manager(audioManager);

  bossManager = new BossManager(scene, terrainManager, vegetationManager);
  bossManager.setArenaCenter(arenaX, arenaZ, arenaWakeRadius);
  bossManager.setOnBossSpawned(() => {
    if (audioManager) {
      audioManager.play('bossGrowl');
    }
  });
  bossManager.setOnBossDefeated((defeatEntry) => {
    saveManager.recordBossDefeat({
      ...defeatEntry,
      gameTimeSeconds: Number(saveManager.elapsedGameplaySeconds.toFixed(2))
    });
    questManager.registerBossDefeat(defeatEntry.id);
  });
  bossManager.init(onAssetLoaded);

  bossUIManager = new BossUIManager();
  bossCombatSystem = new BossCombatSystem({
    scene,
    boss_manager: bossManager,
    player_manager: playerManager,
    boss_ui_manager: bossUIManager
  });

  doorManager = new DoorManager(scene, terrainManager);
  endScreen = new EndScreen();
  creditsRoll = new CreditsRollScreen({
    creditsUrl: './resources/credits/credits.txt',
    title: 'Vivarium Credits',
    autoClose: true,
    speed: 40
  });
  doorManager.setOnUnlocked(async () => {
    game_completed = true;
    controls_enabled = false;
    if (audioManager) audioManager.stopGameplayAmbience();
    if (loreVideoPlayer) {
      await loreVideoPlayer.playOutro();
    }
    if (creditsRoll) {
      if (audioManager) audioManager.playMenuMusic();
      creditsRoll.show({
        onComplete: () => {
          mainMenu.init();
          wireMainMenuActions();
          if (audioManager) audioManager.playMenuMusic();
        }
      });
    }
  });

  cameraController = new CameraController(camera);

  cinematic_manager = new CinematicManager(camera, playerManager, vegetationManager, terrainManager);

  // register arena bushes for culling once they have had time to load
  setTimeout(() => {
    if (sceneManager && arenaManager && Array.isArray(arenaManager.bushes)) {
      sceneManager.registerCullableObjects(arenaManager.bushes);
    }
  }, 4000);


  window.debugFoxSound = () => {
    if (audioManager) {
      audioManager.playFoxSound();
    }
  };

  window.debugAddItem = (itemName = 'item de teste') => {
    inventoryManager.addItem({
      id: `item_${Date.now()}`,
      name: itemName
    });
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
      ensureHud();
    });
  }
}

function wireMainMenuActions() {
  mainMenu.onNewGame = () => {
    audioManager.stopMenuMusic();
    if (dev_skip_flow) {
      startCoreGame();
      return;
    }
    loreVideoPlayer.playIntro().then(() => {
      startCoreGame();
    });
  };

  mainMenu.onLoadGame = () => {
    const latestSave = saveManager.getLatestLocalSave();
    if (!latestSave) {
      alert('nao foi encontrado nenhum save local.');
      mainMenu.init();
      wireMainMenuActions();
      return;
    }

    audioManager.stopMenuMusic();
    startCoreGame({ loadedSnapshot: latestSave });
  };
}

window.addEventListener('keydown', (e) => {
  if (e.key === '7' && !e.repeat) {
    const defeated = questManager.debugAdvance();
    if (defeated) {
      console.log(`debug: simulated defeat -> ${defeated}`);
    }
  }
  if ((e.key === '-' || e.key === '_') && !e.repeat) {
    queueDamage(15);
  }
  if ((e.key === '+' || e.key === '=') && !e.repeat) {
    const nextHealth = clampHealthTier(statsState.health + 15);
    statsState.health = nextHealth;
    if (hudManager) hudManager.setHealth(statsState.health / 100);
  }
  if (e.key === '9' && e.ctrlKey) {
    devQuickStart();
  }
});

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key !== 'e' || e.repeat) return;
  if (!game_started) return;
  if (!hudManager) return;
  if (hudManager.isInventoryOpen()) {
    hudManager.toggleInventory(false);
    return;
  }
  if (npcManager && typeof npcManager.shouldBlockInventoryToggle === 'function' && npcManager.shouldBlockInventoryToggle()) {
    return;
  }
  hudManager.toggleInventory(true);
});

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key !== 'm' || e.repeat) return;
  if (!game_started) return;
  if (!hudManager) return;
  hudManager.toggleMapPanel();
});

window.addEventListener('vivarium:inventory-use', (e) => {
  const item = e && e.detail ? e.detail : null;
  if (!item || !item.id) return;
  if (item.id !== 'health_potion') return;
  if (statsState.health >= 100) {
    if (hudManager) hudManager.showInventoryMessage('You already are at max healtth.');
    return;
  }

  statsState.health = 100;
  inventoryManager.removeItem('health_potion', 1);
  if (hudManager) hudManager.setHealth(1);
  if (audioManager) {
    audioManager.play('xpGain');
  }
});

window.addEventListener('vivarium:damage', (e) => {
  const amount = e && typeof e.detail === 'number' ? e.detail : 1;
  queueDamage(amount);
});

function clampHealthTier(value) {
  const clamped = Math.max(0, Math.min(100, value));
  let selected = 0;
  for (let i = 0; i < healthTiers.length; i++) {
    if (clamped >= healthTiers[i]) selected = healthTiers[i];
  }
  return selected;
}

function queueDamage(amount) {
  const dmg = Number.isFinite(amount) ? Math.max(1, amount) : 1;
  statsState.pendingDamage += dmg;
  if (statsState.damageTimer) return;

  if (hudManager) hudManager.flashDamage(1000);
  statsState.damageTimer = setTimeout(() => {
    const nextHealth = clampHealthTier(statsState.health - statsState.pendingDamage);
    statsState.pendingDamage = 0;
    statsState.health = nextHealth;
    if (hudManager) hudManager.setHealth(statsState.health / 100);

    if (statsState.health <= 0) {
      handleGameOver();
    }

    statsState.damageTimer = null;
  }, 1000);
}

function handleGameOver() {
  game_completed = true;
  controls_enabled = false;

  gameOverScreen.show({
    onRetry: () => {
      const latestSave = saveManager.getLatestLocalSave();
      if (!latestSave) {
        alert('nao foi encontrado nenhum save local.');
        return;
      }
      gameOverScreen.hide();
      audioManager.stopMenuMusic();
      startCoreGame({ loadedSnapshot: latestSave });
    },
    onMenu: () => {
      gameOverScreen.hide();
      mainMenu.init();
      wireMainMenuActions();
      audioManager.playMenuMusic();
    }
  });
}

creditsIntro.show(() => {
  if (dev_skip_flow) return;

  // after the name intro, show a simple play screen
  playScreen.show(() => {
    if (dev_skip_flow) return;

    mainMenu.init();
    wireMainMenuActions();
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

  if (game_completed) {
    sceneManager.render();
    return;
  }

  saveManager.updateGameplayTime(delta, true);

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
    playerManager.update(delta, inputManager, vegetationManager, bossManager, doorManager);
  }

  if (inputManager) {
    const isSprinting = inputManager.is_sprinting() && inputManager.is_moving();
    const staminaDrainRate = 40;
    const staminaRegenRate = 30;
    const regenDelay = 1.2;

    if (isSprinting && statsState.stamina > 0) {
      statsState.stamina = Math.max(0, statsState.stamina - staminaDrainRate * delta);
      if (statsState.stamina <= 0.1) {
        statsState.stamina = 0;
        statsState.staminaCooldown = regenDelay;
      }
    } else {
      if (statsState.staminaCooldown > 0) {
        statsState.staminaCooldown = Math.max(0, statsState.staminaCooldown - delta);
      } else {
        statsState.stamina = Math.min(100, statsState.stamina + staminaRegenRate * delta);
      }
    }

    inputManager.setSprintBlocked(statsState.stamina <= 0);
  }

  // update camera (looking at world center)
  let playerPosition = playerManager ? playerManager.get_position() : null;
  const playerRotation = playerManager ? playerManager.get_rotation_y() : 0;
  const target = playerPosition || new THREE.Vector3(0, 0, 0);

  if (playerPosition && playerManager && typeof playerManager.set_position === 'function') {
    const wrapped = wrapWorldPosition(playerPosition);
    if (wrapped) {
      playerManager.set_position(wrapped);
      playerPosition = playerManager.get_position();
    }
  }

  if (playerPosition) {
    if (lightingManager) lightingManager.updatePlayerLight(playerPosition);
    if (sky_manager) sky_manager.update(playerPosition);
    if (npcManager) npcManager.update(playerPosition, inputManager);
  }

  // boss logic (wake/attack) + simple proximity ui
  if (bossManager && playerPosition) {
    if (questManager && typeof questManager.getBossEncounterProfile === 'function') {
      const encounterProfile = questManager.getBossEncounterProfile();
      if (encounterProfile && typeof encounterProfile === 'object') {
        if (typeof bossManager.setBossIdentity === 'function') {
          bossManager.setBossIdentity({
            id: encounterProfile.bossId,
            name: encounterProfile.bossName
          });
        }
        if (typeof bossManager.setEncounterEnabled === 'function') {
          bossManager.setEncounterEnabled(encounterProfile.enabled === true);
        }
        if (bossUIManager && typeof bossUIManager.setBossName === 'function') {
          bossUIManager.setBossName(encounterProfile.bossName || 'boss');
        }
      }
    }

    bossManager.update(delta, playerPosition);
    if (bossCombatSystem) {
      bossCombatSystem.update(delta, playerPosition);
    }

    // player-in-arena check is used for ui + music
    let isInArena = false;
    if (arena_zone) {
      const dx = playerPosition.x - arena_zone.x;
      const dz = playerPosition.z - arena_zone.z;
      isInArena = Math.sqrt(dx * dx + dz * dz) < arena_zone.wake_radius;
    }

    const bossActive = typeof bossManager.isBossActive === 'function'
      ? bossManager.isBossActive()
      : !!bossManager.getBoss();

    // battle music follows being inside the arena ring
    if (audioManager && typeof audioManager.updateBossMusic === 'function') {
      audioManager.updateBossMusic(isInArena && bossActive);
    }

    // show boss name/ui while the fox is inside the arena
    if (bossUIManager) bossUIManager.update(isInArena && bossActive);
  }

  if (hudManager && playerPosition) {
    const treeMarkers = vegetationManager ? vegetationManager.get_tree_minimap_markers() : null;
    const bossPos = bossManager && typeof bossManager.isBossActive === 'function' && bossManager.isBossActive()
      ? bossManager.getPosition()
      : null;
    const npcPos = npcManager && typeof npcManager.getPosition === 'function' ? npcManager.getPosition() : null;
    const npcPositions = npcManager && typeof npcManager.getMinimapNpcPositions === 'function'
      ? npcManager.getMinimapNpcPositions()
      : npcPos;

    // reuse the arena logic: skull in range, dot out of range
    let isInArena = false;
    if (arena_zone) {
      const dx = playerPosition.x - arena_zone.x;
      const dz = playerPosition.z - arena_zone.z;
      isInArena = Math.sqrt(dx * dx + dz * dz) < arena_zone.wake_radius;
    }

    const bossLoaded = bossManager && typeof bossManager.isBossActive === 'function'
      ? bossManager.isBossActive()
      : !!(bossManager && bossManager.getBoss && bossManager.getBoss());
    // update camera first so the minimap can show the right view direction
    if (cameraController && inputManager && terrainManager) {
      cameraController.update(target, playerRotation, inputManager, terrainManager);
    }

    const cameraViewYaw = cameraController && typeof cameraController.get_view_yaw === 'function'
      ? cameraController.get_view_yaw()
      : playerRotation;

    hudManager.update(playerPosition, playerRotation, cameraViewYaw, treeMarkers, bossPos, isInArena && bossLoaded, npcPositions);
    hudManager.updateInventory(inventoryManager.getItems());
    hudManager.updateQuestTracker(questManager.getTrackerEntries());
    hudManager.setHealth(statsState.health / 100);
    hudManager.setStamina(statsState.stamina / 100);
    const cooldown = playerManager && typeof playerManager.get_attack_cooldown_state === 'function'
      ? playerManager.get_attack_cooldown_state()
      : null;
    if (cooldown && typeof cooldown.progress === 'number') {
      hudManager.setAttackCooldown(cooldown.progress, cooldown.active === true);
    } else {
      hudManager.setAttackCooldown(1, false);
    }
  }

  // keep updating the camera even if HUD is disabled
  if (!hudManager && cameraController && inputManager && terrainManager) {
    cameraController.update(target, playerRotation, inputManager, terrainManager);
  }

  // render
  sceneManager.render();

  if (doorManager && playerPosition) {
    if (!doorManager.isSpawned && questManager.shouldSpawnDoor()) {
      doorManager.spawn();
    }

    const hasKey = inventoryManager.hasItem('end_key');
    doorManager.update(playerPosition, inputManager, hasKey);
  }
}

animate();
console.log('Game started successfully');
