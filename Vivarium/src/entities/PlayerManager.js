import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { PLAYER_CONFIG } from '../config/gameConfig.js';

export class PlayerManager {
  constructor(scene, terrain_manager) {
    this.scene = scene;
    this.terrain_manager = terrain_manager;
    this.fox = null;
    this.mixer = null;
    this.animations = {};
    this.current_action = null;
    this.on_load_callback = null;
    this.model_loaded = false;
    this.animations_expected = 0;
    this.animations_loaded = 0;
    this.assets_ready_notified = false;
  }

  init(on_load_callback) {
    this.on_load_callback = on_load_callback || null;
    this.load_fox();
  }

  load_fox() {
    const loader = new FBXLoader();
    loader.setPath(PLAYER_CONFIG.MODEL_PATH);

    loader.load(PLAYER_CONFIG.MODEL_FILE, (fbx) => {
      this.fox = fbx;
      this.fox.scale.setScalar(PLAYER_CONFIG.SCALE);
      this.fox.position.set(0, 0, 0);
      this.fox.rotation.y = 0;

      this.apply_textures();
      this.setup_mixer();
      this.load_animations();

      this.scene.add(this.fox);
      console.log('fox loaded');
      this.model_loaded = true;
      this.maybe_notify_ready();
    });
  }

  apply_textures() {
    const texture_loader = new THREE.TextureLoader();

    const base_color_texture = texture_loader.load(
      `${PLAYER_CONFIG.MODEL_PATH}textures/T_Fox_BC.png`
    );
    base_color_texture.encoding = THREE.sRGBEncoding;

    const normal_texture = texture_loader.load(
      `${PLAYER_CONFIG.MODEL_PATH}textures/T_Fox_Normal.png`
    );

    this.fox.traverse((child) => {
      if (child.isMesh) {
        child.material.map = base_color_texture;
        child.material.normalMap = normal_texture;
        child.material.needsUpdate = true;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  setup_mixer() {
    this.mixer = new THREE.AnimationMixer(this.fox);
  }

  load_animations() {
    const anim_loader = new FBXLoader();
    anim_loader.setPath(`${PLAYER_CONFIG.MODEL_PATH}animations/`);

    const animations_to_load = [
      { name: 'idle', file: 'Fox_Idle.fbx', loop: true },
      { name: 'run', file: 'Fox_Run_InPlace.fbx', loop: true },
      { name: 'back', file: 'Fox_Walk_Back_InPlace.fbx', loop: true },
      { name: 'walk_left', file: 'Fox_Walk_Left_InPlace.fbx', loop: true },
      { name: 'walk_right', file: 'Fox_Walk_Right_InPlace.fbx', loop: true }
    ];

    this.animations_expected = animations_to_load.length;
    this.animations_loaded = 0;

    animations_to_load.forEach(({ name, file, loop }) => {
      anim_loader.load(file, (anim) => {
        const action = this.mixer.clipAction(anim.animations[0]);
        if (!loop) {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        }
        this.animations[name] = action;

         this.animations_loaded++;
         this.maybe_notify_ready();
      });
    });
  }

  maybe_notify_ready() {
    if (!this.on_load_callback || this.assets_ready_notified) {
      return;
    }

    if (this.model_loaded && this.animations_loaded === this.animations_expected) {
      this.assets_ready_notified = true;
      this.on_load_callback();
      this.on_load_callback = null;
    }
  }

  fade_to_action(name, duration) {
    const next_action = this.animations[name];
    if (!next_action) return;

    if (this.current_action === next_action) return;

    next_action.reset();
    next_action.play();

    if (this.current_action) {
      this.current_action.crossFadeTo(next_action, duration, false);
    }

    this.current_action = next_action;
  }

  update(delta, input_manager, vegetation_manager) {
    if (!this.fox || !this.mixer) return;

    this.mixer.update(delta);

    const forward = new THREE.Vector3(
      Math.sin(this.fox.rotation.y),
      0,
      Math.cos(this.fox.rotation.y)
    );

    const is_sprinting = input_manager.is_sprinting();
    const speed = is_sprinting ? PLAYER_CONFIG.SPRINT_SPEED : PLAYER_CONFIG.MOVE_SPEED;
    const rotation_speed = PLAYER_CONFIG.ROTATION_SPEED;

    let is_moving = false;
    let is_turning_left = false;
    let is_turning_right = false;
    let is_turning_back = false;

    const old_x = this.fox.position.x;
    const old_z = this.fox.position.z;

    if (input_manager.is_key_pressed('w')) {
      this.fox.position.x += forward.x * speed * delta;
      this.fox.position.z += forward.z * speed * delta;
      is_moving = true;
    }

    if (input_manager.is_key_pressed('s')) {
      const backward_speed = speed * 0.5;
      this.fox.position.x -= forward.x * backward_speed * delta;
      this.fox.position.z -= forward.z * backward_speed * delta;
      is_turning_back = true;
    }

    if (input_manager.is_key_pressed('a')) {
      this.fox.rotation.y += rotation_speed * delta;
      if (!is_moving && !is_turning_back) {
        is_turning_left = true;
      }
    }

    if (input_manager.is_key_pressed('d')) {
      this.fox.rotation.y -= rotation_speed * delta;
      if (!is_moving && !is_turning_back) {
        is_turning_right = true;
      }
    }

    // stop movement if we hit a tree or bush
    if (vegetation_manager && vegetation_manager.check_collision(this.fox.position.x, this.fox.position.z)) {
      this.fox.position.x = old_x;
      this.fox.position.z = old_z;
    }

    if (this.terrain_manager && typeof this.terrain_manager.getTerrainHeight === 'function') {
      this.fox.position.y = this.terrain_manager.getTerrainHeight(
        this.fox.position.x,
        this.fox.position.z
      );
    } else {
      this.fox.position.y = 0;
    }

    if (is_moving) {
      const is_sprinting_now = is_sprinting;
      const run_action = this.animations.run;
      if (run_action) {
        // speed up animation when sprinting
        run_action.setEffectiveTimeScale(is_sprinting_now ? 1.8 : 1.0);
      }
      this.fade_to_action('run', 0.05);
    } else if (is_turning_left) {
      this.fade_to_action('walk_left', 0.1);
    } else if (is_turning_right) {
      this.fade_to_action('walk_right', 0.1);
    } else if (is_turning_back) {
      this.fade_to_action('back', 0.1);
    } else {
      this.fade_to_action('idle', 0.2);
    }
  }

  get_position() {
    if (!this.fox) return null;
    return this.fox.position.clone();
  }

  get_fox() {
    return this.fox;
  }

  get_rotation_y() {
    if (!this.fox) return 0;
    return this.fox.rotation.y;
  }
}
