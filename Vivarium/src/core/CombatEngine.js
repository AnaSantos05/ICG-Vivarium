import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { COMBAT_CONFIG } from '../config/gameConfig.js';

export class CombatEngine {
  constructor(scene) {
    this.scene = scene;

    // bindings (provided by player manager)
    this.player = null;
    this.animations = null;
    this.get_current_action = null;
    this.set_current_action = null;
    this.fade_to_action = null;

    // combat state
    this.state = {
      is_attacking: false,
      current_attack: null,
      next_q_time: 0,
      next_r_time: 0,
      last_r_target: null
    };

    // simple vfx list (custom meshes)
    this.active_vfx = [];
  }

  bind_player({ player, animations, get_current_action, set_current_action, fade_to_action }) {
    this.player = player;
    this.animations = animations;
    this.get_current_action = get_current_action;
    this.set_current_action = set_current_action;
    this.fade_to_action = fade_to_action;
  }

  is_locked() {
    return !!this.state.is_attacking;
  }

  on_animation_finished(e) {
    if (!e || !e.action || !this.state.is_attacking) return;
    if (!this.animations || typeof this.fade_to_action !== 'function') return;

    const attack_action = this.animations[this.state.current_attack];
    if (attack_action && e.action === attack_action) {
      this.state.is_attacking = false;
      this.state.current_attack = null;
      this.fade_to_action('idle', 0.15);
    }
  }

  update(delta, input_manager, boss_manager) {
    this.update_vfx(delta);
    this.update_combat(delta, input_manager, boss_manager);
  }

  update_combat(delta, input_manager, boss_manager) {
    if (!this.player || !this.animations) return;
    if (!input_manager || typeof input_manager.was_key_just_pressed !== 'function') return;

    const now = Date.now() / 1000;

    // q -> tail attack (shockwave ring)
    if (input_manager.was_key_just_pressed('q') && !this.state.is_attacking && now >= this.state.next_q_time) {
      this.perform_attack('attack_tail');
      this.state.next_q_time = now + COMBAT_CONFIG.q_cooldown;
      return;
    }

    // r -> paws attack (projectile)
    if (input_manager.was_key_just_pressed('r') && !this.state.is_attacking && now >= this.state.next_r_time) {
      this.state.last_r_target = this.get_boss_target_point(boss_manager);
      this.perform_attack('attack_paws');
      this.state.next_r_time = now + COMBAT_CONFIG.r_cooldown;
    }
  }

  get_boss_target_point(boss_manager) {
    if (!this.player || !boss_manager) return null;

    // only lock to the boss if it's active (awake/visible)
    if (typeof boss_manager.isBossActive === 'function' && !boss_manager.isBossActive()) {
      return null;
    }

    const boss_pos = typeof boss_manager.getPosition === 'function' ? boss_manager.getPosition() : null;
    if (!boss_pos) return null;

    const dx = boss_pos.x - this.player.position.x;
    const dz = boss_pos.z - this.player.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > (COMBAT_CONFIG.r_lock_radius || 0)) return null;

    return new THREE.Vector3(boss_pos.x, 0, boss_pos.z);
  }

  perform_attack(anim_name) {
    const action = this.animations ? this.animations[anim_name] : null;
    if (!action || !this.player) return;

    this.state.is_attacking = true;
    this.state.current_attack = anim_name;

    // stop current movement animation quickly
    if (typeof this.get_current_action === 'function') {
      const current = this.get_current_action();
      if (current) current.fadeOut(0.05);
    }

    action.reset();
    action.play();

    if (typeof this.set_current_action === 'function') {
      this.set_current_action(action);
    }

    // spawn vfx slightly after the motion starts
    if (anim_name === 'attack_tail') {
      setTimeout(() => this.spawn_shockwave_vfx(), 180);
    } else if (anim_name === 'attack_paws') {
      setTimeout(() => this.spawn_r_projectile_vfx(), 180);
    }
  }

  spawn_r_projectile_vfx() {
    if (!this.scene || !this.player) return;

    // basic projectile mesh (simple, readable, custom)
    const geometry = new THREE.SphereGeometry(0.25, 14, 10);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    const proj = new THREE.Mesh(geometry, material);
    proj.position.copy(this.player.position);
    proj.position.y += 1.6;
    this.scene.add(proj);

    // decide direction: boss target if available, else forward
    const target = this.state.last_r_target;
    let dir = new THREE.Vector3(Math.sin(this.player.rotation.y), 0, Math.cos(this.player.rotation.y));
    if (target) {
      dir = new THREE.Vector3(target.x - proj.position.x, 0, target.z - proj.position.z);
      if (dir.lengthSq() > 0.0001) dir.normalize();
      else dir.set(Math.sin(this.player.rotation.y), 0, Math.cos(this.player.rotation.y));
    }

    this.active_vfx.push({
      mesh: proj,
      age: 0,
      lifetime: COMBAT_CONFIG.r_projectile_lifetime,
      kind: 'r_projectile',
      forward: dir,
      speed: COMBAT_CONFIG.r_projectile_speed,
      start_opacity: 0.9
    });
  }

  spawn_shockwave_vfx() {
    if (!this.scene || !this.player) return;

    const geometry = new THREE.RingGeometry(0.6, 0.9, 48);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;

    ring.position.copy(this.player.position);
    ring.position.y += 0.12;

    this.scene.add(ring);

    const forward = new THREE.Vector3(Math.sin(this.player.rotation.y), 0, Math.cos(this.player.rotation.y));
    this.active_vfx.push({
      mesh: ring,
      age: 0,
      lifetime: COMBAT_CONFIG.shockwave_lifetime,
      kind: 'shockwave',
      forward
    });
  }

  spawn_claw_arc_vfx() {
    if (!this.scene || !this.player) return;

    const geometry = new THREE.PlaneGeometry(2.6, 1.2);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const arc = new THREE.Mesh(geometry, material);

    const forward = new THREE.Vector3(Math.sin(this.player.rotation.y), 0, Math.cos(this.player.rotation.y));
    arc.position.copy(this.player.position);
    arc.position.add(forward.clone().multiplyScalar(2.2));
    arc.position.y += 1.4;

    arc.rotation.y = this.player.rotation.y;
    arc.rotation.z = 0.35;

    this.scene.add(arc);

    this.active_vfx.push({
      mesh: arc,
      age: 0,
      lifetime: COMBAT_CONFIG.claw_arc_lifetime,
      kind: 'claw_arc',
      forward
    });
  }

  update_vfx(delta) {
    if (!this.active_vfx || this.active_vfx.length === 0) return;

    for (let i = this.active_vfx.length - 1; i >= 0; i--) {
      const fx = this.active_vfx[i];
      fx.age += delta;
      const t = Math.min(fx.age / fx.lifetime, 1);

      if (fx.kind === 'shockwave') {
        const s = 1 + t * 6;
        fx.mesh.scale.setScalar(s);
        fx.mesh.position.add(fx.forward.clone().multiplyScalar(delta * 6));
        fx.mesh.material.opacity = 0.55 * (1 - t);
      } else if (fx.kind === 'claw_arc') {
        fx.mesh.scale.set(1 + t * 0.8, 1 + t * 0.4, 1);
        fx.mesh.rotation.z += delta * 6;
        fx.mesh.material.opacity = 0.65 * (1 - t);
      } else if (fx.kind === 'r_projectile') {
        const step = (fx.speed || 40) * delta;
        fx.mesh.position.x += fx.forward.x * step;
        fx.mesh.position.z += fx.forward.z * step;
        fx.mesh.material.opacity = (fx.start_opacity || 0.9) * (1 - t);
      }

      if (fx.age >= fx.lifetime) {
        if (this.scene) this.scene.remove(fx.mesh);
        if (fx.mesh.geometry) fx.mesh.geometry.dispose();
        if (fx.mesh.material) fx.mesh.material.dispose();
        this.active_vfx.splice(i, 1);
      }
    }
  }
}
