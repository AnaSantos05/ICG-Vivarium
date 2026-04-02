import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { ARENA_CONFIG } from '../config/gameConfig.js';

export class BossManager {
  constructor(scene, terrainManager, vegetationManager) {
    this.scene = scene;
    this.terrainManager = terrainManager;
    this.vegetationManager = vegetationManager;

    this.boss = null;
    this.mixer = null;
    this.animations = {};
    this.arenaCenter = null;

    this.state = {
      isAwakened: false,
      isAwakening: false,
      isSleeping: false,
      lastPlayerSeenTime: 0,
      nextAttackTime: 0,
      currentAnimation: null
    };

    this.config = {
      SCALE: 0.8,
      PATH: './resources/bosses/two/',
      MODEL: 'source/tàthần.fbx',
      IDLE_ANIM: 'source/tàthần.fbx',
      TEXTURE: './resources/bosses/two/textures/Mst_902_AwakenedCaesar_D_512.png',
      HEIGHT_OFFSET: 3,
      COLLISION_RADIUS: 3,
      PLAYER_TIMEOUT: 30,
      ATTACK_COOLDOWN_MIN: 2,
      ATTACK_COOLDOWN_MAX: 5,
      ARENA_WAKE_RADIUS: ARENA_CONFIG.wake_radius
    };

    // boss sounds live here (same approach as vite)
    this.bossAwakeSound = new Audio('./resources/sounds/gameplay/sfx/everything-else/boss-awake.mp3');
    this.bossAwakeSound.volume = 0.6;

    this.bossRoarSound = new Audio('./resources/sounds/gameplay/sfx/everything-else/boss-roar.mp3');
    this.bossRoarSound.volume = 0.5;

    this.lastRoarTime = 0;
    this.nextRoarCooldown = 15 + Math.random() * 20;

    this.onLoadCallback = null;
  }

  // returns true when the boss encounter is currently active
  isBossActive() {
    return !!(
      this.boss &&
      this.boss.visible &&
      (this.state.isAwakened || this.state.isAwakening)
    );
  }

  setArenaCenter(x, z) {
    this.arenaCenter = { x, z };
  }

  init(onLoadCallback) {
    this.onLoadCallback = onLoadCallback || null;
    // small delay keeps the load order stable during startup
    setTimeout(() => this.loadBoss(), 500);
  }

  loadBoss() {
    const bossLoader = new FBXLoader();
    bossLoader.setPath(this.config.PATH);

    const textureLoader = new THREE.TextureLoader();
    const bossTexture = textureLoader.load(this.config.TEXTURE);
    bossTexture.encoding = THREE.sRGBEncoding;

    bossLoader.load(this.config.MODEL, (bossFbx) => {
      this.boss = bossFbx;
      this.boss.scale.setScalar(this.config.SCALE);

      let bossX = -20;
      let bossZ = -20;

      // in the arena version we always prefer the arena center
      if (this.arenaCenter) {
        bossX = this.arenaCenter.x;
        bossZ = this.arenaCenter.z;
      }

      const bossY = this.arenaCenter
        ? 0.15 + this.config.HEIGHT_OFFSET
        : (this.terrainManager ? this.terrainManager.getTerrainHeight(bossX, bossZ) : 0) + this.config.HEIGHT_OFFSET;

      this.boss.position.set(bossX, bossY, bossZ);
      this.boss.rotation.y = 0;

      this.boss.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: bossTexture,
            roughness: 0.8,
            metalness: 0.1,
            skinning: true
          });
          child.material.needsUpdate = true;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.setupMixer();
      this.loadAnimations();

      // boss should not disappear due to frustum culling
      this.boss.frustumCulled = false;
      this.boss.traverse((child) => {
        child.frustumCulled = false;
      });

      this.scene.add(this.boss);
      console.log('boss loaded');

      if (this.onLoadCallback) {
        this.onLoadCallback();
        this.onLoadCallback = null;
      }
    });
  }

  setupMixer() {
    this.mixer = new THREE.AnimationMixer(this.boss);
    this.mixer.addEventListener('finished', (e) => this.onAnimationFinished(e));
  }

  loadAnimations() {
    const animLoader = new FBXLoader();
    animLoader.setPath(this.config.PATH);

    animLoader.load(this.config.IDLE_ANIM, (animFbx) => {
      if (!animFbx.animations || animFbx.animations.length === 0) return;

      animFbx.animations.forEach((clip, index) => {
        console.log(`animation ${index}: "${clip.name}" (${clip.duration.toFixed(2)}s)`);

        const action = this.mixer.clipAction(clip);
        const name = (clip.name || '').toLowerCase();

        if (name.includes('idle') && !this.animations.idle) {
          this.animations.idle = action;
          action.setLoop(THREE.LoopRepeat);
          console.log('found idle animation:', clip.name);
        } else if (name.includes('born2') && !this.animations.born) {
          this.animations.born = action;
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
          console.log('found born animation:', clip.name);
        } else if (name.includes('dead') && !this.animations.dead) {
          this.animations.dead = action;
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
          console.log('found dead animation:', clip.name);
        } else if (name.includes('spell') || name.includes('atk')) {
          if (!this.animations.spells) this.animations.spells = [];
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
          this.animations.spells.push({ name: clip.name, action });
        }
      });

      // start sleeping and invisible until the player enters the arena
      this.boss.visible = false;
      this.state.isSleeping = true;

      console.log('boss animations loaded');
      console.log('spells/attacks available:', this.animations.spells?.length || 0);
    });
  }

  onAnimationFinished(event) {
    const action = event.action;

    if (action === this.animations.born) {
      // born finished -> idle
      this.state.isAwakening = false;
      this.state.isAwakened = true;
      this.playAnimation('idle');
      return;
    }

    if (this.animations.spells?.some((s) => s.action === action)) {
      this.playAnimation('idle');
      return;
    }

    if (action === this.animations.dead) {
      // dead finished -> hide and mark as sleeping
      this.state.isSleeping = true;
      this.state.isAwakened = false;
      this.state.isAwakening = false;
      if (this.boss) this.boss.visible = false;
    }
  }

  playAnimation(animName) {
    // stop current base animation
    if (this.state.currentAnimation && this.animations[this.state.currentAnimation]) {
      const currentAction = this.animations[this.state.currentAnimation];
      currentAction.fadeOut(0.3);
      currentAction.stop();
      currentAction.reset();
    }

    // also stop spells cleanly
    if (this.animations.spells) {
      for (const spell of this.animations.spells) {
        if (spell.action.isRunning()) {
          spell.action.stop();
          spell.action.reset();
        }
      }
    }

    let targetAction = null;

    if (animName === 'idle' && this.animations.idle) {
      targetAction = this.animations.idle;
      targetAction.reset();
    } else if ((animName === 'born2' || animName === 'born') && this.animations.born) {
      targetAction = this.animations.born;
      targetAction.reset();
      targetAction.timeScale = 1;
    } else if (animName === 'dead' && this.animations.dead) {
      targetAction = this.animations.dead;
      targetAction.reset();
    } else if (animName === 'spell' && this.animations.spells && this.animations.spells.length > 0) {
      const randomSpell = this.animations.spells[Math.floor(Math.random() * this.animations.spells.length)];
      targetAction = randomSpell.action;
      targetAction.reset();
      console.log('casting:', randomSpell.name);
    }

    if (targetAction) {
      targetAction.fadeIn(0.3);
      targetAction.play();
      this.state.currentAnimation = animName;
    }
  }

  update(delta, playerPosition) {
    if (this.mixer) this.mixer.update(delta);
    if (!this.boss || !playerPosition) return;

    const currentTime = Date.now() / 1000;

    // arena ring check: if we have a center, distance to it wins
    let isInArenaRing = false;
    if (this.arenaCenter) {
      const dx = playerPosition.x - this.arenaCenter.x;
      const dz = playerPosition.z - this.arenaCenter.z;
      const distanceToCenter = Math.sqrt(dx * dx + dz * dz);
      isInArenaRing = distanceToCenter < this.config.ARENA_WAKE_RADIUS;
    }

    if (isInArenaRing) {
      this.state.lastPlayerSeenTime = currentTime;

      if (this.state.isSleeping) {
        console.log('boss awakening');
        this.state.isSleeping = false;
        this.state.isAwakening = true;

        this.bossAwakeSound.currentTime = 0;
        this.bossAwakeSound.play().catch((err) => console.warn('boss awake sound failed:', err));

        this.boss.visible = true;
        this.playAnimation('born2');
      }

      if (this.state.isAwakened && !this.state.isAwakening) {
        // random roar
        if (currentTime - this.lastRoarTime > this.nextRoarCooldown) {
          this.bossRoarSound.currentTime = 0;
          this.bossRoarSound.play().catch((err) => console.warn('boss roar sound failed:', err));
          this.lastRoarTime = currentTime;
          this.nextRoarCooldown = 15 + Math.random() * 20;
        }

        if (currentTime >= this.state.nextAttackTime) {
          this.playAnimation('spell');

          const cooldown = this.config.ATTACK_COOLDOWN_MIN +
            Math.random() * (this.config.ATTACK_COOLDOWN_MAX - this.config.ATTACK_COOLDOWN_MIN);
          this.state.nextAttackTime = currentTime + cooldown;
        }

        // face the player
        const dx = playerPosition.x - this.boss.position.x;
        const dz = playerPosition.z - this.boss.position.z;
        const angle = Math.atan2(dx, dz);
        this.boss.rotation.y = angle;
      }

      return;
    }

    // player is outside the ring
    if (this.state.isAwakened || this.state.isAwakening) {
      const timeSinceLastSeen = currentTime - this.state.lastPlayerSeenTime;

      if (timeSinceLastSeen >= this.config.PLAYER_TIMEOUT) {
        console.log('boss going back to sleep');
        this.state.isAwakened = false;
        this.state.isAwakening = false;
        this.state.isSleeping = true;

        // keep it simple: play dead (sleep) then hide on finish
        this.playAnimation('dead');
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
}
