import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { COMBAT_CONFIG } from '../config/gameConfig.js';

export class BossManager {
  constructor(scene, terrainManager, vegetationManager) {
    this.scene = scene;
    this.terrainManager = terrainManager;
    this.vegetationManager = vegetationManager;

    this.boss = null;
    this.mixer = null;
    this.animations = {};
    this.currentBaseAction = null;
    this.activeActionKey = null;
    this.bossFillLight = null;

    this.arenaCenter = null;
    this.onLoadCallback = null;
    this.onBossDefeated = null;
    this.onBossSpawned = null;

    this.fixedBossPosition = new THREE.Vector3();
    this.fixedScale = 1;

    this.attackAnimationKeys = [];
    this.attackCursor = 0;

    this.bossDefeatHistory = [];
    this.bossMeta = {
      id: 'boss_slime',
      name: 'slime'
    };
    this.legacyBossIds = ['boss_bunny', 'boss_lilith'];
    this.bossTexture = null;
    this.embeddedIdleClip = null;

    this.healthState = {
      max: Math.max(1, COMBAT_CONFIG.boss_max_health || 320),
      current: Math.max(1, COMBAT_CONFIG.boss_max_health || 320)
    };

    this.state = {
      isDead: false,
      isSpawning: false,
      isAttacking: false,
      isInPain: false,
      hasActivated: false
    };
    this.pendingRespawnAt = 0;
    this.encounterEnabled = false;
    this.lastHitReactAt = -Infinity;

    this.config = {
      MODEL_PROFILES: {
        slime: {
          candidates: [
            './resources/bosses/Slime/slime-monster-stylized-low-poly-creature/source/SLI%25ME%20MONSTER%20LOW%20.fbx'
          ],
          texture: './resources/bosses/Slime/slime-monster-stylized-low-poly-creature/textures/texture_20250901.png',
          desiredHeight: 7,
          preferEmbeddedIdle: true
        },
        lilith: {
          candidates: [
            './resources/bosses/Lilith/Standing_Idle.fbx',
            './resources/bosses/Lilith/standing idle.fbx',
            './resources/bosses/Lilith/Bunny3.fbx',
            './resources/bosses/Lilith/Bunny 3.fbx',
            './resources/bosses/Lilith/Getting_Up.fbx'
          ],
          texture: null,
          desiredHeight: 7,
          preferEmbeddedIdle: false,
          animationFiles: {
            idle: [
              './resources/bosses/Lilith/Standing_Idle.fbx',
              './resources/bosses/Lilith/Standing Idle.fbx',
              './resources/bosses/Lilith/standing idle.fbx'
            ],
            injured_idle: [
              './resources/bosses/Lilith/Injured_Idle.fbx',
              './resources/bosses/Lilith/Injured Idle.fbx'
            ],
            spawn: [
              './resources/bosses/Lilith/Getting_Up.fbx',
              './resources/bosses/Lilith/Getting Up.fbx'
            ],
            hit_react: [
              './resources/bosses/Lilith/Standing_React_Large_From_Right.fbx',
              './resources/bosses/Lilith/Standing React Large From Right.fbx'
            ],
            death: [
              './resources/bosses/Lilith/Standing_Death_Right.fbx',
              './resources/bosses/Lilith/Standing Death Right.fbx'
            ],
            attacks: [
              {
                key: 'attack_2h_magic_cast',
                files: [
                  './resources/bosses/Lilith/Standing_2H_Magic_Attack.fbx',
                  './resources/bosses/Lilith/Standing 2H Magic Attack.fbx',
                  './resources/bosses/Lilith/Standing 2H Magic Attack 01.fbx'
                ]
              },
              {
                key: 'attack_2h_magic_02',
                files: [
                  './resources/bosses/Lilith/Standing 2H Magic Attack 02.fbx',
                  './resources/bosses/Lilith/Standing_2H_Magic_Attack_02.fbx',
                  './resources/bosses/Lilith/Standing _2H_Magic_Attack_02.fbx'
                ]
              },
              {
                key: 'attack_2h_magic_03',
                files: [
                  './resources/bosses/Lilith/Standing 2H Magic Attack 03.fbx'
                ]
              },
              {
                key: 'attack_2h_magic_04',
                files: [
                  './resources/bosses/Lilith/Standing 2H Magic Attack 04.fbx'
                ]
              },
              {
                key: 'attack_2h_magic_05',
                files: [
                  './resources/bosses/Lilith/Standing 2H Magic Attack 05.fbx'
                ]
              },
              {
                key: 'attack_area_01',
                files: [
                  './resources/bosses/Lilith/Standing 2H Magic Area Attack 01.fbx'
                ]
              },
              {
                key: 'attack_area_02',
                files: [
                  './resources/bosses/Lilith/Standing 2H Magic Area Attack 02.fbx'
                ]
              }
            ]
          }
        }
      },
      MODEL_CANDIDATES: [],
      MODEL_TEXTURE: null,
      ENABLE_ANIMATIONS: true,
      ANIMATION_FILES: {
        idle: [
          './resources/bosses/Lilith/Standing_Idle.fbx',
          './resources/bosses/Lilith/Standing Idle.fbx'
        ],
        injured_idle: [
          './resources/bosses/Lilith/Injured_Idle.fbx',
          './resources/bosses/Lilith/Injured Idle.fbx'
        ],
        spawn: [
          './resources/bosses/Lilith/Getting_Up.fbx',
          './resources/bosses/Lilith/Getting Up.fbx'
        ],
        hit_react: [
          './resources/bosses/Lilith/Standing_React_Large_From_Right.fbx',
          './resources/bosses/Lilith/Standing React Large From Right.fbx'
        ],
        death: [
          './resources/bosses/Lilith/Standing_Death_Right.fbx',
          './resources/bosses/Lilith/Standing Death Right.fbx'
        ],
        attacks: [
          {
            key: 'attack_2h_magic_cast',
            files: [
              './resources/bosses/Lilith/Standing_2H_Magic_Attack.fbx',
              './resources/bosses/Lilith/Standing 2H Magic Attack.fbx'
            ]
          },
          {
            key: 'attack_2h_magic_02',
            files: [
              './resources/bosses/Lilith/Standing 2H Magic Attack 02.fbx',
              './resources/bosses/Lilith/Standing_2H_Magic_Attack_02.fbx',
              './resources/bosses/Lilith/Standing _2H_Magic_Attack_02.fbx'
            ]
          },
          {
            key: 'attack_2h_magic_03',
            files: [
              './resources/bosses/Lilith/Standing 2H Magic Attack 03.fbx'
            ]
          },
          {
            key: 'attack_2h_magic_04',
            files: [
              './resources/bosses/Lilith/Standing 2H Magic Attack 04.fbx'
            ]
          },
          {
            key: 'attack_2h_magic_05',
            files: [
              './resources/bosses/Lilith/Standing 2H Magic Attack 05.fbx'
            ]
          },
          {
            key: 'attack_area_01',
            files: [
              './resources/bosses/Lilith/Standing 2H Magic Area Attack 01.fbx'
            ]
          },
          {
            key: 'attack_area_02',
            files: [
              './resources/bosses/Lilith/Standing 2H Magic Area Attack 02.fbx'
            ]
          }
        ]
      },
      PREFER_EMBEDDED_IDLE: true,
      IDLE_STATIC_POSE: false,
      LOW_HEALTH_INJURED_RATIO: COMBAT_CONFIG.boss_injured_idle_ratio || 0.35,
      ATTACK_ANIMATION_SPEED: COMBAT_CONFIG.boss_attack_anim_speed || 0.78,
      HIT_REACT_COOLDOWN_SECONDS: Math.max(0, Number(COMBAT_CONFIG.boss_hit_react_cooldown || 0.9)),
      ACTIVATION_RADIUS: COMBAT_CONFIG.boss_activation_radius || 40,
      FACING_YAW_OFFSET: THREE.Math.degToRad(5),
      DESIRED_HEIGHT: 7,
      HEIGHT_OFFSET: 0,
      COLLISION_RADIUS: 3.5,
      BOSS_FILL_LIGHT: {
        color: 0xffe5d2,
        intensity: 0.85,
        distance: 16,
        height: 2.8,
        frontOffset: 1.5
      },
      MAX_DEFEATS_BEFORE_DISABLE: Math.max(1, Number(COMBAT_CONFIG.boss_max_defeats || 3)),
      RESPAWN_DELAY_SECONDS: Math.max(0.5, Number(COMBAT_CONFIG.boss_respawn_delay || 4.5))
    };
    this.applyBossModelProfile();
  }

  cloneAnimationFiles(files) {
    if (!files || typeof files !== 'object') return null;
    return {
      idle: Array.isArray(files.idle) ? [...files.idle] : [],
      injured_idle: Array.isArray(files.injured_idle) ? [...files.injured_idle] : [],
      spawn: Array.isArray(files.spawn) ? [...files.spawn] : [],
      hit_react: Array.isArray(files.hit_react) ? [...files.hit_react] : [],
      death: Array.isArray(files.death) ? [...files.death] : [],
      attacks: Array.isArray(files.attacks)
        ? files.attacks.map((entry) => ({
          key: entry && entry.key ? entry.key : 'attack',
          files: Array.isArray(entry && entry.files) ? [...entry.files] : []
        }))
        : []
    };
  }

  isBossActive() {
    return !!(this.boss && this.boss.visible && this.state.hasActivated && !this.state.isDead);
  }

  isAttacking() {
    return !!this.state.isAttacking;
  }

  isSpawning() {
    return !!this.state.isSpawning;
  }

  setArenaCenter(x, z, wakeRadius) {
    this.arenaCenter = {
      x,
      z,
      wakeRadius: Number.isFinite(wakeRadius) ? Math.max(1, wakeRadius) : null
    };
  }

  setOnBossDefeated(callback) {
    this.onBossDefeated = typeof callback === 'function' ? callback : null;
  }

  setOnBossSpawned(callback) {
    this.onBossSpawned = typeof callback === 'function' ? callback : null;
  }

  setEncounterEnabled(enabled) {
    const next = enabled === true;
    if (this.encounterEnabled === next) return;
    this.encounterEnabled = next;
    if (!next) this.resetEncounterState();
  }

  setBossIdentity(meta = {}) {
    const previousId = this.bossMeta.id;
    const nextId = typeof meta.id === 'string' && meta.id.trim().length > 0
      ? meta.id.trim()
      : this.bossMeta.id;
    const nextName = typeof meta.name === 'string' && meta.name.trim().length > 0
      ? meta.name.trim()
      : this.bossMeta.name;

    const changed = nextId !== this.bossMeta.id;
    const modelChanged = this.getBossModelKey(previousId) !== this.getBossModelKey(nextId);
    this.bossMeta.id = nextId;
    this.bossMeta.name = nextName;

    if (changed) {
      this.resetEncounterState();
      if (modelChanged) {
        this.applyBossModelProfile();
        this.reloadBossModel();
      }
    }
  }

  getBossModelKey(bossId) {
    return bossId === 'boss_orb' ? 'lilith' : 'slime';
  }

  applyBossModelProfile() {
    const key = this.getBossModelKey(this.bossMeta.id);
    const profile = (this.config.MODEL_PROFILES && this.config.MODEL_PROFILES[key]) || null;
    if (!profile) return;

    this.config.MODEL_CANDIDATES = Array.isArray(profile.candidates) ? [...profile.candidates] : [];
    this.config.MODEL_TEXTURE = typeof profile.texture === 'string' && profile.texture.trim().length > 0
      ? profile.texture
      : null;
    if (Number.isFinite(profile.desiredHeight) && profile.desiredHeight > 0) {
      this.config.DESIRED_HEIGHT = profile.desiredHeight;
    }
    if (typeof profile.preferEmbeddedIdle === 'boolean') {
      this.config.PREFER_EMBEDDED_IDLE = profile.preferEmbeddedIdle;
    }
    if (profile.animationFiles && typeof profile.animationFiles === 'object') {
      const cloned = this.cloneAnimationFiles(profile.animationFiles);
      if (cloned) this.config.ANIMATION_FILES = cloned;
    }
    this.bossTexture = null;
  }

  reloadBossModel() {
    if (this.mixer && typeof this.mixer.stopAllAction === 'function') {
      this.mixer.stopAllAction();
    }
    if (this.scene && this.boss) {
      this.scene.remove(this.boss);
    }
    if (this.scene && this.bossFillLight) {
      this.scene.remove(this.bossFillLight);
    }

    this.boss = null;
    this.mixer = null;
    this.animations = {};
    this.currentBaseAction = null;
    this.activeActionKey = null;
    this.attackAnimationKeys = [];
    this.embeddedIdleClip = null;
    this.bossFillLight = null;

    this.loadBoss();
  }

  resetEncounterState() {
    this.state.isDead = false;
    this.state.isSpawning = false;
    this.state.isAttacking = false;
    this.state.isInPain = false;
    this.state.hasActivated = false;
    this.pendingRespawnAt = 0;
    this.healthState.current = this.healthState.max;
    this.attackCursor = 0;

    if (this.currentBaseAction && typeof this.currentBaseAction.stop === 'function') {
      this.currentBaseAction.stop();
    }
    this.currentBaseAction = null;
    this.activeActionKey = null;

    if (this.boss) this.boss.visible = false;
    if (this.bossFillLight) this.bossFillLight.visible = false;
  }

  getValidBossIds() {
    if (this.bossMeta.id === 'boss_slime') {
      return [this.bossMeta.id, ...(Array.isArray(this.legacyBossIds) ? this.legacyBossIds : [])];
    }
    return [this.bossMeta.id];
  }

  getDefeatCount() {
    const validBossIds = this.getValidBossIds();
    return this.bossDefeatHistory.filter((entry) => validBossIds.includes(entry.id)).length;
  }

  hasReachedDefeatLimit() {
    return this.getDefeatCount() >= this.config.MAX_DEFEATS_BEFORE_DISABLE;
  }

  canRespawn() {
    return this.getDefeatCount() < this.config.MAX_DEFEATS_BEFORE_DISABLE;
  }

  notifyBossSpawned(spawnReason = 'spawn') {
    if (!this.onBossSpawned) return;
    this.onBossSpawned({
      id: this.bossMeta.id,
      name: this.bossMeta.name,
      spawnReason,
      spawnAt: new Date().toISOString(),
      defeatsSoFar: this.getDefeatCount()
    });
  }

  init(onLoadCallback) {
    this.onLoadCallback = onLoadCallback || null;
    setTimeout(() => this.loadBoss(), 250);
  }

  loadFbxWithFallback(loader, candidates, onLoad, onAllFailed, validate) {
    const queue = Array.isArray(candidates) ? [...candidates] : [candidates];

    const tryNext = () => {
      const current = queue.shift();
      if (!current) {
        if (typeof onAllFailed === 'function') onAllFailed();
        return;
      }

      loader.load(
        current,
        (fbx) => {
          if (typeof validate === 'function' && !validate(fbx, current)) {
            console.warn(`fbx validation failed: ${current}`);
            tryNext();
            return;
          }
          onLoad(fbx, current);
        },
        undefined,
        (err) => {
          console.warn(`fbx load failed: ${current}`, err);
          tryNext();
        }
      );
    };

    tryNext();
  }

  loadBoss() {
    const loader = new FBXLoader();
    const hasRenderableMesh = (object3d) => {
      let found = false;
      if (!object3d || typeof object3d.traverse !== 'function') return false;
      object3d.traverse((child) => {
        if (child && (child.isSkinnedMesh || child.isMesh)) found = true;
      });
      return found;
    };

    this.loadFbxWithFallback(
      loader,
      this.config.MODEL_CANDIDATES,
      (fbx, loadedFrom) => {
        this.boss = fbx;
        const bestEmbeddedClip = this.pickBestClip(
          Array.isArray(fbx.animations) ? fbx.animations : [],
          { preferredKeywords: ['idle', 'breathe', 'breath', 'rest', 'sleep'] }
        );
        this.embeddedIdleClip = bestEmbeddedClip ? this.sanitizeClip(bestEmbeddedClip, { preservePosition: false }) : null;

        this.prepareModel();
        this.autoScaleToHeight(this.config.DESIRED_HEIGHT);
        this.placeAtArenaCenter();
        this.fixedBossPosition.copy(this.boss.position);
        this.setupBossFillLight();

        if (this.config.ENABLE_ANIMATIONS) {
          this.setupMixer();
          this.loadAnimations();
        } else {
          this.finishLoadCallback();
        }

        this.boss.visible = false;
        if (this.bossFillLight) this.bossFillLight.visible = false;
        this.boss.frustumCulled = false;
        this.boss.traverse((child) => {
          child.frustumCulled = false;
        });

        this.scene.add(this.boss);
        console.log('boss loaded from:', loadedFrom);
      },
      () => {
        console.error('failed to load boss model from all known paths');
        this.finishLoadCallback();
      },
      (fbx) => hasRenderableMesh(fbx)
    );
  }

  prepareModel() {
    if (!this.boss) return;
    if (!this.bossTexture && this.config.MODEL_TEXTURE) {
      this.bossTexture = new THREE.TextureLoader().load(this.config.MODEL_TEXTURE);
      this.bossTexture.encoding = THREE.sRGBEncoding;
    }

    this.boss.traverse((child) => {
      if (!child || !child.isMesh) return;

      const sourceMaterial = child.material;
      const sourceMap = sourceMaterial && sourceMaterial.map ? sourceMaterial.map : this.bossTexture;
      const sourceColor = sourceMaterial && sourceMaterial.color
        ? sourceMaterial.color.clone()
        : new THREE.Color(0x9a9a9a);
      const boostedColor = sourceColor.clone();
      if (!sourceMap && (boostedColor.r + boostedColor.g + boostedColor.b) < 0.15) {
        boostedColor.setRGB(0.32, 0.30, 0.36);
      }
      const isSkinned = !!child.isSkinnedMesh;

      // use a soft lit material so the boss is visible without blowing out
      child.material = new THREE.MeshStandardMaterial({
        map: sourceMap,
        color: boostedColor,
        side: THREE.DoubleSide,
        transparent: !!(sourceMaterial && sourceMaterial.transparent),
        opacity: sourceMaterial && Number.isFinite(sourceMaterial.opacity) ? sourceMaterial.opacity : 1,
        alphaTest: sourceMaterial && Number.isFinite(sourceMaterial.alphaTest) ? sourceMaterial.alphaTest : 0,
        roughness: 0.88,
        metalness: 0.02,
        skinning: isSkinned
      });
      child.material.needsUpdate = true;

      child.castShadow = false;
      child.receiveShadow = true;
    });
  }

  setupBossFillLight() {
    if (!this.scene || !this.boss) return;

    if (this.bossFillLight) {
      this.scene.remove(this.bossFillLight);
    }

    const cfg = this.config.BOSS_FILL_LIGHT || {};
    this.bossFillLight = new THREE.PointLight(
      cfg.color || 0xffe5d2,
      Number.isFinite(cfg.intensity) ? cfg.intensity : 0.85,
      Number.isFinite(cfg.distance) ? cfg.distance : 16,
      2
    );
    this.bossFillLight.castShadow = false;
    this.scene.add(this.bossFillLight);
    this.updateBossFillLight();
  }

  updateBossFillLight() {
    if (!this.boss || !this.bossFillLight) return;

    const cfg = this.config.BOSS_FILL_LIGHT || {};
    const height = Number.isFinite(cfg.height) ? cfg.height : 2.8;
    const frontOffset = Number.isFinite(cfg.frontOffset) ? cfg.frontOffset : 1.5;

    const forward = new THREE.Vector3(
      Math.sin(this.boss.rotation.y - Math.PI),
      0,
      Math.cos(this.boss.rotation.y - Math.PI)
    );

    this.bossFillLight.position.set(
      this.boss.position.x + (forward.x * frontOffset),
      this.boss.position.y + height,
      this.boss.position.z + (forward.z * frontOffset)
    );
  }

  autoScaleToHeight(desiredHeight) {
    if (!this.boss || !desiredHeight) return;

    const box = new THREE.Box3().setFromObject(this.boss);
    const size = new THREE.Vector3();
    box.getSize(size);

    if (size.y <= 0.0001) {
      console.warn('boss invalid height, keeping default scale');
      return;
    }

    const scalar = desiredHeight / size.y;
    this.fixedScale = scalar;
    this.boss.scale.setScalar(scalar);
  }

  placeAtArenaCenter() {
    if (!this.boss) return;

    let bossX = -20;
    let bossZ = -20;

    if (this.arenaCenter) {
      bossX = this.arenaCenter.x;
      bossZ = this.arenaCenter.z;
    }

    let groundY = 0;
    if (this.arenaCenter) {
      groundY = 0.15;
    } else if (this.terrainManager && typeof this.terrainManager.getTerrainHeight === 'function') {
      groundY = this.terrainManager.getTerrainHeight(bossX, bossZ);
    }

    this.boss.position.set(bossX, groundY + this.config.HEIGHT_OFFSET, bossZ);

    const box = new THREE.Box3().setFromObject(this.boss);
    const lift = (groundY + this.config.HEIGHT_OFFSET) - box.min.y;
    this.boss.position.y += lift;
  }

  setupMixer() {
    this.mixer = new THREE.AnimationMixer(this.boss);
    this.mixer.addEventListener('finished', (event) => this.onAnimationFinished(event));
  }

  sanitizeClip(clip, options = {}) {
    if (!clip) return clip;
    const cloned = clip.clone();
    const preservePosition = options.preservePosition === true;

    cloned.tracks = cloned.tracks.filter((track) => {
      const name = (track.name || '').toLowerCase();
      if (!preservePosition && name.includes('.position')) return false;
      if (name.includes('.scale')) return false;
      return true;
    });

    cloned.resetDuration();
    return cloned;
  }

  pickBestClip(animations = [], options = {}) {
    if (!Array.isArray(animations) || animations.length === 0) return null;
    const preferred = Array.isArray(options.preferredKeywords)
      ? options.preferredKeywords
        .map((keyword) => String(keyword || '').toLowerCase())
        .filter(Boolean)
      : [];

    let best = animations[0];
    let bestScore = -Infinity;

    animations.forEach((clip) => {
      if (!clip) return;
      const duration = Number(clip.duration || 0);
      const tracks = Array.isArray(clip.tracks) ? clip.tracks.length : 0;
      const clipName = String(clip.name || '').toLowerCase();
      const preferredScore = preferred.some((keyword) => clipName.includes(keyword)) ? 2500 : 0;
      const score = preferredScore + (duration > 0.12 ? 1000 : 0) + (duration * 10) + tracks;
      if (score > bestScore) {
        best = clip;
        bestScore = score;
      }
    });

    return best;
  }

  loadAnimations() {
    const animLoader = new FBXLoader();
    const files = this.config.ANIMATION_FILES;

    if (this.embeddedIdleClip && this.mixer && !this.animations.idle) {
      const embeddedIdleAction = this.mixer.clipAction(this.embeddedIdleClip);
      embeddedIdleAction.setLoop(THREE.LoopRepeat);
      this.animations.idle = embeddedIdleAction;
      console.log('boss animation mapped: idle <- embedded model clip');
    }

    const allowExternalIdle = !this.config.PREFER_EMBEDDED_IDLE || !this.animations.idle;
    const entries = [
      ...(allowExternalIdle ? [{ key: 'idle', files: files.idle, loop: true, isAttack: false, preservePosition: false }] : []),
      { key: 'injured_idle', files: files.injured_idle, loop: true, isAttack: false, preservePosition: false },
      { key: 'spawn', files: files.spawn, loop: false, isAttack: false, preservePosition: true },
      { key: 'hit_react', files: files.hit_react, loop: false, isAttack: false, preservePosition: false },
      { key: 'death', files: files.death, loop: false, isAttack: false, preservePosition: true },
      ...files.attacks.map((entry) => ({
        key: entry.key,
        files: entry.files,
        loop: false,
        isAttack: true,
        preservePosition: false
      }))
    ];

    const loadedAttackKeys = [];
    let remaining = entries.length;

    if (remaining === 0) {
      this.attackAnimationKeys = files.attacks.map((entry) => entry.key).filter((key) => this.animations[key]);
      this.onAnimationsReady();
      return;
    }

    const doneOne = () => {
      remaining -= 1;
      if (remaining <= 0) {
        this.attackAnimationKeys = files.attacks
          .map((entry) => entry.key)
          .filter((key) => loadedAttackKeys.includes(key));
        this.onAnimationsReady();
      }
    };

    entries.forEach(({ key, files: fileCandidates, loop, isAttack, preservePosition }) => {
      this.loadFbxWithFallback(
        animLoader,
        fileCandidates,
        (animFbx, loadedFrom) => {
          const bestRawClip = this.pickBestClip(animFbx.animations || []);
          if (bestRawClip) {
            const clip = this.sanitizeClip(bestRawClip, { preservePosition });
            const action = this.mixer.clipAction(clip);

            if (loop) {
              action.setLoop(THREE.LoopRepeat);
            } else {
              action.setLoop(THREE.LoopOnce, 1);
              action.clampWhenFinished = true;
            }

            this.animations[key] = action;
            if (isAttack) loadedAttackKeys.push(key);
            console.log(`boss animation mapped: ${key} <- ${loadedFrom}`);
          } else {
            console.warn(`animation file has no clips: ${loadedFrom}`);
          }
          doneOne();
        },
        () => {
          console.warn(`failed to load boss animation (${key}) from all known paths`);
          doneOne();
        }
      );
    });
  }

  onAnimationsReady() {
    // stay dormant until player reaches activation area
    if (this.boss) this.boss.visible = false;
    if (this.bossFillLight) this.bossFillLight.visible = false;

    window.debugBossIdle = () => this.playIdle();
    window.debugBossDead = () => this.playDead();

    this.finishLoadCallback();
  }

  finishLoadCallback() {
    if (this.onLoadCallback) {
      this.onLoadCallback();
      this.onLoadCallback = null;
    }
  }

  getActivationRadius() {
    if (this.arenaCenter && Number.isFinite(this.arenaCenter.wakeRadius) && this.arenaCenter.wakeRadius > 0) {
      return this.arenaCenter.wakeRadius;
    }
    return Number.isFinite(this.config.ACTIVATION_RADIUS) ? this.config.ACTIVATION_RADIUS : 40;
  }

  tryActivateEncounter(playerPosition) {
    if (!playerPosition || !this.boss || this.state.hasActivated || this.state.isDead) return false;
    if (!this.encounterEnabled) return false;
    if (this.hasReachedDefeatLimit()) return false;
    if (!this.arenaCenter) return false;

    const dx = playerPosition.x - this.arenaCenter.x;
    const dz = playerPosition.z - this.arenaCenter.z;
    const dist = Math.sqrt((dx * dx) + (dz * dz));

    if (dist > this.getActivationRadius()) return false;

    this.state.hasActivated = true;
    this.boss.visible = true;
    if (this.bossFillLight) this.bossFillLight.visible = true;

    if (this.animations.spawn) {
      this.playSpawn('activation');
    } else {
      this.playIdle();
      this.notifyBossSpawned('activation');
    }
    return true;
  }

  playAction(name, options = {}) {
    const next = this.animations[name];
    if (!next) return false;

    const fade = Number.isFinite(options.fade) ? options.fade : 0.12;
    const force = options.force === true;

    if (!force && this.currentBaseAction === next) return true;

    next.reset();
    next.enabled = true;
    next.paused = false;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(1);
    next.play();

    if (this.currentBaseAction && this.currentBaseAction !== next) {
      this.currentBaseAction.crossFadeTo(next, fade, false);
    }

    this.currentBaseAction = next;
    this.activeActionKey = name;
    return true;
  }

  isLowHealth() {
    const maxHp = Math.max(1, Number(this.healthState.max || 1));
    const ratio = this.healthState.current / maxHp;
    return ratio <= Math.max(0.05, Math.min(0.95, this.config.LOW_HEALTH_INJURED_RATIO || 0.35));
  }

  getIdleActionKey() {
    if (this.isLowHealth() && this.animations.injured_idle) return 'injured_idle';
    return this.animations.idle ? 'idle' : (this.animations.injured_idle ? 'injured_idle' : null);
  }

  playIdle() {
    if (this.state.isDead) return;

    this.state.isInPain = false;
    this.state.isSpawning = false;
    this.state.isAttacking = false;

    const idleKey = this.getIdleActionKey();
    if (!idleKey) return;

    const didPlay = this.playAction(idleKey, { fade: 0.12 });
    if (!didPlay) return;

    if (this.config.IDLE_STATIC_POSE && this.animations[idleKey]) {
      this.animations[idleKey].time = 0;
      this.animations[idleKey].paused = true;
    }
  }

  playSpawn(spawnReason = 'spawn') {
    if (this.state.isDead) return false;
    const didPlay = this.playAction('spawn', { fade: 0.1, force: true });
    if (!didPlay) return false;

    this.state.isSpawning = true;
    this.state.isInPain = false;
    this.state.isAttacking = false;
    this.notifyBossSpawned(spawnReason);

    const spawnClip = this.animations.spawn && this.animations.spawn.getClip
      ? this.animations.spawn.getClip()
      : null;
    const spawnDuration = Number(spawnClip && spawnClip.duration ? spawnClip.duration : 0);
    const spawnTracks = Array.isArray(spawnClip && spawnClip.tracks) ? spawnClip.tracks.length : 0;

    // some FBX files may load with a bind-pose clip; avoid getting stuck in spawn.
    if (spawnDuration <= 0.08 || spawnTracks <= 1) {
      this.state.isSpawning = false;
      this.playIdle();
    }

    return true;
  }

  playHitReaction() {
    if (this.state.isDead || this.state.isSpawning) return false;
    if (this.state.isAttacking) return false;
    if (!this.animations.hit_react) return false;
    const now = performance.now() * 0.001;
    const hitReactCooldown = Math.max(0, Number(this.config.HIT_REACT_COOLDOWN_SECONDS || 0));
    if (now < (this.lastHitReactAt + hitReactCooldown)) return false;
    const didPlay = this.playAction('hit_react', { fade: 0.06, force: true });
    if (!didPlay) return false;

    this.lastHitReactAt = now;
    this.state.isInPain = true;
    this.state.isAttacking = false;
    return true;
  }

  startNextAttack() {
    if (this.state.isDead || this.state.isSpawning || this.state.isAttacking || this.state.isInPain) return null;
    if (!Array.isArray(this.attackAnimationKeys) || this.attackAnimationKeys.length === 0) return null;

    const attackKey = this.attackAnimationKeys[this.attackCursor % this.attackAnimationKeys.length];
    this.attackCursor += 1;

    const didPlay = this.playAction(attackKey, { fade: 0.08, force: true });
    if (!didPlay) return null;

    this.state.isAttacking = true;
    this.state.isInPain = false;

    const clip = this.animations[attackKey] && this.animations[attackKey].getClip
      ? this.animations[attackKey].getClip()
      : null;
    const attackSpeed = Math.max(0.35, Number(this.config.ATTACK_ANIMATION_SPEED || 0.78));
    if (this.animations[attackKey]) {
      this.animations[attackKey].setEffectiveTimeScale(attackSpeed);
    }

    return {
      key: attackKey,
      duration: Math.max(0.35, Number(clip && clip.duration ? clip.duration : 1.2) / attackSpeed),
      profile: this.getAttackProfile(attackKey)
    };
  }

  getAttackProfile(attackKey) {
    const lowerKey = (attackKey || '').toLowerCase();

    if (lowerKey.includes('area')) {
      return {
        type: 'area_blast',
        damage: COMBAT_CONFIG.boss_area_damage || 20,
        range: COMBAT_CONFIG.boss_area_range || 10.5
      };
    }

    if (lowerKey.includes('cast')) {
      return {
        type: 'spell_cast',
        damage: COMBAT_CONFIG.boss_spell_damage || 16,
        range: COMBAT_CONFIG.boss_spell_range || 24
      };
    }

    return {
      type: 'magic_slash',
      damage: COMBAT_CONFIG.boss_slash_damage || 12,
      range: COMBAT_CONFIG.boss_slash_range || 8
    };
  }

  receiveDamage(amount, options = {}) {
    if (this.state.isDead || this.state.isSpawning) {
      return {
        wasApplied: false,
        wasKilled: false,
        currentHealth: this.healthState.current,
        maxHealth: this.healthState.max
      };
    }

    const safeAmount = Number.isFinite(amount) ? Math.max(1, amount) : 1;
    this.healthState.current = Math.max(0, this.healthState.current - safeAmount);

    if (this.healthState.current <= 0) {
      this.playDead(options);
      return {
        wasApplied: true,
        wasKilled: true,
        currentHealth: 0,
        maxHealth: this.healthState.max
      };
    }

    this.playHitReaction();

    return {
      wasApplied: true,
      wasKilled: false,
      currentHealth: this.healthState.current,
      maxHealth: this.healthState.max
    };
  }

  playDead(options = {}) {
    if (this.state.isDead) return;

    const silent = !!options.silent;
    const skipHistory = !!options.skipHistory;

    this.state.isDead = true;
    this.state.isAttacking = false;
    this.state.isInPain = false;
    this.state.isSpawning = false;
    this.healthState.current = 0;

    if (this.state.hasActivated) {
      if (this.boss) this.boss.visible = true;
      if (this.bossFillLight) this.bossFillLight.visible = true;
    }

    if (this.animations.death) {
      this.playAction('death', { fade: 0.1, force: true });
    } else if (this.animations.idle || this.animations.injured_idle) {
      const fallbackIdle = this.getIdleActionKey();
      if (fallbackIdle) {
        this.playAction(fallbackIdle, { fade: 0.1, force: true });
        this.animations[fallbackIdle].time = 0;
        this.animations[fallbackIdle].paused = true;
      }
    }

    let defeatEntry = null;
    if (!skipHistory) {
      defeatEntry = {
        id: this.bossMeta.id,
        name: this.bossMeta.name,
        defeatedAt: new Date().toISOString()
      };
      this.bossDefeatHistory.push(defeatEntry);
    }

    this.pendingRespawnAt = this.canRespawn()
      ? (performance.now() * 0.001) + this.config.RESPAWN_DELAY_SECONDS
      : 0;

    if (!silent && defeatEntry && this.onBossDefeated) {
      this.onBossDefeated(defeatEntry);
    }
  }

  tryRespawn() {
    if (!this.encounterEnabled) return false;
    if (!this.state.isDead || !this.boss || !this.canRespawn()) return false;

    this.state.isDead = false;
    this.state.isAttacking = false;
    this.state.isInPain = false;
    this.state.isSpawning = false;
    this.state.hasActivated = true;
    this.healthState.current = this.healthState.max;

    this.boss.visible = true;
    if (this.bossFillLight) this.bossFillLight.visible = true;

    this.pendingRespawnAt = 0;

    if (this.animations.spawn) {
      this.playSpawn('respawn');
    } else {
      this.playIdle();
      this.notifyBossSpawned('respawn');
    }

    return true;
  }

  onAnimationFinished(event) {
    const action = event && event.action;
    if (!action) return;

    const activeAction = this.activeActionKey ? this.animations[this.activeActionKey] : null;
    if (!activeAction || action !== activeAction) return;

    const isAttack = this.attackAnimationKeys.includes(this.activeActionKey);
    if (isAttack && !this.state.isDead) {
      this.state.isAttacking = false;
      this.playIdle();
      return;
    }

    if (this.activeActionKey === 'spawn' && !this.state.isDead) {
      this.state.isSpawning = false;
      this.playIdle();
      return;
    }

    if (this.activeActionKey === 'hit_react' && !this.state.isDead) {
      this.state.isInPain = false;
      this.playIdle();
    }
  }

  lockTransform() {
    if (!this.boss) return;
    this.boss.position.copy(this.fixedBossPosition);
    this.boss.scale.setScalar(this.fixedScale || 1);
  }

  update(delta, playerPosition) {
    if (this.mixer) this.mixer.update(delta);
    this.lockTransform();

    if (!this.boss) return;
    if (!this.encounterEnabled) {
      if (this.boss.visible || this.state.hasActivated || this.state.isDead || this.pendingRespawnAt > 0) {
        this.resetEncounterState();
      }
      return;
    }

    this.tryActivateEncounter(playerPosition);
    if (this.state.isDead && this.pendingRespawnAt > 0) {
      const now = performance.now() * 0.001;
      if (now >= this.pendingRespawnAt) {
        this.tryRespawn();
      }
    }
    if (!this.state.hasActivated || this.state.isDead) return;

    this.boss.rotation.x = 0;
    this.boss.rotation.z = 0;

    if (playerPosition) {
      const dx = playerPosition.x - this.boss.position.x;
      const dz = playerPosition.z - this.boss.position.z;
      this.boss.rotation.y = Math.atan2(dx, dz) + (this.config.FACING_YAW_OFFSET || 0);
    }

    this.updateBossFillLight();

    if (this.state.isSpawning) {
      const spawnAction = this.animations.spawn;
      const stuckOnSpawn = !spawnAction || !spawnAction.isRunning();
      if (stuckOnSpawn) {
        this.state.isSpawning = false;
        this.playIdle();
      }
    }

    if (!this.state.isSpawning && !this.state.isAttacking && !this.state.isInPain) {
      const expectedIdle = this.getIdleActionKey();
      if (expectedIdle && this.activeActionKey !== expectedIdle) {
        this.playIdle();
      }
    }
  }

  getBoss() {
    return this.boss;
  }

  getBossPosition() {
    if (!this.boss) return null;
    return {
      x: this.boss.position.x,
      z: this.boss.position.z,
      radius: this.config.COLLISION_RADIUS
    };
  }

  getPosition() {
    return this.boss ? this.boss.position : null;
  }

  getWarningAnchorPosition() {
    if (!this.boss) return null;
    return {
      x: this.boss.position.x,
      y: this.boss.position.y + (this.config.DESIRED_HEIGHT * 0.95),
      z: this.boss.position.z
    };
  }

  getHealthState() {
    return {
      current: this.healthState.current,
      max: this.healthState.max
    };
  }

  getDefeatHistory() {
    return this.bossDefeatHistory.map((entry) => ({ ...entry }));
  }

  applyDefeatHistory(history) {
    if (!Array.isArray(history)) return;

    this.bossDefeatHistory = history
      .filter((entry) => entry && typeof entry === 'object' && typeof entry.id === 'string')
      .map((entry) => ({
        id: entry.id,
        name: typeof entry.name === 'string' ? entry.name : entry.id,
        defeatedAt: typeof entry.defeatedAt === 'string' ? entry.defeatedAt : new Date().toISOString()
      }));

    if (this.hasReachedDefeatLimit()) {
      this.playDead({ silent: true, skipHistory: true });
      this.pendingRespawnAt = 0;
    }
  }
}
