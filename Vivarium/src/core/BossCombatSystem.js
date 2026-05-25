import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { COMBAT_CONFIG } from '../config/gameConfig.js';

export class BossCombatSystem {
  constructor({ scene, boss_manager, player_manager, boss_ui_manager }) {
    this.scene = scene;
    this.boss_manager = boss_manager;
    this.player_manager = player_manager;
    this.boss_ui_manager = boss_ui_manager;

    this.pending_boss_attack = null;
    this.next_boss_attack_time = 0;
    this.next_player_damage_time = 0;

    this.active_vfx = [];
    this.attack_warning = null;
    this.attack_warning_elapsed = 0;
  }

  update(delta, player_position) {
    this.update_vfx(delta);

    const boss = this.boss_manager;
    const player = this.player_manager;
    if (!boss || !player || !player_position) return;

    const health = typeof boss.getHealthState === 'function' ? boss.getHealthState() : null;
    if (health && this.boss_ui_manager && typeof this.boss_ui_manager.setHealth === 'function') {
      this.boss_ui_manager.setHealth(health.current, health.max);
    }

    if (typeof boss.isBossActive === 'function' && !boss.isBossActive()) {
      if (this.player_manager && typeof this.player_manager.consume_combat_attack_events === 'function') {
        this.player_manager.consume_combat_attack_events();
      }
      this.pending_boss_attack = null;
      this.hide_attack_warning();
      return;
    }

    this.process_player_attacks();
    this.update_boss_attack_loop(delta, player_position);
    this.update_attack_warning(delta);
  }

  process_player_attacks() {
    if (!this.player_manager || typeof this.player_manager.consume_combat_attack_events !== 'function') return;

    const attack_events = this.player_manager.consume_combat_attack_events();
    if (!Array.isArray(attack_events) || attack_events.length === 0) return;

    const boss_pos = this.boss_manager && typeof this.boss_manager.getPosition === 'function'
      ? this.boss_manager.getPosition()
      : null;
    const player_pos = this.player_manager && typeof this.player_manager.get_position === 'function'
      ? this.player_manager.get_position()
      : null;

    if (!boss_pos || !player_pos) return;

    for (const event of attack_events) {
      this.try_apply_player_attack(event, player_pos, boss_pos);
    }
  }

  try_apply_player_attack(event, player_pos, boss_pos) {
    if (!event || !event.attack) return;
    if (this.boss_manager && typeof this.boss_manager.isSpawning === 'function' && this.boss_manager.isSpawning()) return;

    const to_boss = new THREE.Vector3(
      boss_pos.x - player_pos.x,
      0,
      boss_pos.z - player_pos.z
    );

    const distance = to_boss.length();
    if (distance <= 0.0001) return;

    const forward = event.forward instanceof THREE.Vector3
      ? event.forward.clone().normalize()
      : new THREE.Vector3(Math.sin(event.rotationY || 0), 0, Math.cos(event.rotationY || 0));

    const aim = to_boss.clone().normalize();
    const facingDot = forward.dot(aim);

    let hit = false;
    let damage = 0;

    if (event.attack === 'attack_tail') {
      const range = COMBAT_CONFIG.player_tail_range || 8.5;
      const minDot = COMBAT_CONFIG.player_attack_arc_dot || 0.18;
      hit = distance <= range && facingDot >= minDot;
      damage = COMBAT_CONFIG.player_tail_damage || 22;
    } else if (event.attack === 'attack_paws') {
      const range = COMBAT_CONFIG.player_paws_range || 38;
      const minDot = COMBAT_CONFIG.player_projectile_dot || -0.2;
      hit = distance <= range && facingDot >= minDot;
      damage = COMBAT_CONFIG.player_paws_damage || 30;
    }

    if (!hit) return;

    const damage_result = this.boss_manager.receiveDamage(damage, { source: 'player' });
    if (!damage_result || !damage_result.wasApplied) return;

    this.spawn_boss_hit_vfx(boss_pos.x, boss_pos.z, damage_result.wasKilled);
  }

  update_boss_attack_loop(delta, player_position) {
    const now = performance.now() * 0.001;

    if (this.pending_boss_attack) {
      this.pending_boss_attack.elapsed += delta;
      this.try_trigger_boss_attack_impact(player_position);

      const attack_done = this.pending_boss_attack.elapsed >= this.pending_boss_attack.duration + 0.08;
      const boss_stopped = this.boss_manager && typeof this.boss_manager.isAttacking === 'function'
        ? !this.boss_manager.isAttacking()
        : false;

      if (attack_done || boss_stopped) {
        this.pending_boss_attack = null;
        this.hide_attack_warning();
      }
      return;
    }

    if (now < this.next_boss_attack_time) return;

    const boss_pos = this.boss_manager && typeof this.boss_manager.getPosition === 'function'
      ? this.boss_manager.getPosition()
      : null;
    if (!boss_pos) return;

    const dx = player_position.x - boss_pos.x;
    const dz = player_position.z - boss_pos.z;
    const distance = Math.sqrt((dx * dx) + (dz * dz));

    if (distance > (COMBAT_CONFIG.boss_aggro_range || 30)) return;

    const attack_data = this.boss_manager.startNextAttack();
    if (!attack_data) return;

    const duration = Math.max(0.45, Number(attack_data.duration || 1.25));
    const windup_ratio = COMBAT_CONFIG.boss_attack_windup_ratio || 0.42;

    this.pending_boss_attack = {
      key: attack_data.key,
      profile: attack_data.profile || {},
      duration,
      elapsed: 0,
      impact_time: Math.max(0.12, duration * windup_ratio),
      impact_done: false
    };

    if ((this.pending_boss_attack.profile.type || '') === 'spell_cast') {
      this.show_attack_warning();
    } else {
      this.hide_attack_warning();
    }

    this.next_boss_attack_time = now + Math.max(COMBAT_CONFIG.boss_attack_cooldown || 2.1, duration * 0.55);
  }

  try_trigger_boss_attack_impact(player_position) {
    const current_attack = this.pending_boss_attack;
    if (!current_attack || current_attack.impact_done) return;
    if (current_attack.elapsed < current_attack.impact_time) return;

    const boss_pos = this.boss_manager && typeof this.boss_manager.getPosition === 'function'
      ? this.boss_manager.getPosition()
      : null;
    if (!boss_pos) return;

    current_attack.impact_done = true;
    this.hide_attack_warning();

    const profile = current_attack.profile || {};
    const attack_type = profile.type || 'magic_slash';

    this.spawn_boss_attack_vfx(attack_type, boss_pos, player_position);

    if (this.does_attack_hit_player(attack_type, profile, boss_pos, player_position)) {
      this.dispatch_player_damage(profile.damage || (COMBAT_CONFIG.boss_slash_damage || 12));
    }
  }

  does_attack_hit_player(attack_type, profile, boss_pos, player_pos) {
    const dx = player_pos.x - boss_pos.x;
    const dz = player_pos.z - boss_pos.z;
    const distance = Math.sqrt((dx * dx) + (dz * dz));

    if (attack_type === 'area_blast') {
      return distance <= (profile.range || COMBAT_CONFIG.boss_area_range || 10.5);
    }

    if (attack_type === 'spell_cast') {
      return distance <= (profile.range || COMBAT_CONFIG.boss_spell_range || 24);
    }

    const slash_range = profile.range || COMBAT_CONFIG.boss_slash_range || 8;
    if (distance > slash_range) return false;

    const bossObject = this.boss_manager && typeof this.boss_manager.getBoss === 'function'
      ? this.boss_manager.getBoss()
      : null;
    if (!bossObject) return true;

    const boss_dir = new THREE.Vector3(
      Math.sin(bossObject.rotation.y - Math.PI),
      0,
      Math.cos(bossObject.rotation.y - Math.PI)
    ).normalize();

    const to_player = new THREE.Vector3(dx, 0, dz).normalize();
    const dot = boss_dir.dot(to_player);
    return dot >= (COMBAT_CONFIG.boss_front_arc_dot || 0.06);
  }

  dispatch_player_damage(amount) {
    const now = performance.now() * 0.001;
    if (now < this.next_player_damage_time) return;

    this.next_player_damage_time = now + (COMBAT_CONFIG.player_damage_invuln || 0.85);

    const safe_damage = Number.isFinite(amount) ? Math.max(1, Math.round(amount)) : 1;
    window.dispatchEvent(new CustomEvent('vivarium:damage', { detail: safe_damage }));
  }

  spawn_boss_attack_vfx(type, boss_pos, player_pos) {
    if (!this.scene) return;

    if (type === 'area_blast') {
      const geometry = new THREE.RingGeometry(0.7, 1.1, 48);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff2f6b,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const ring = new THREE.Mesh(geometry, material);
      ring.position.set(boss_pos.x, 0.15, boss_pos.z);
      ring.rotation.x = -Math.PI / 2;
      this.scene.add(ring);

      this.active_vfx.push({
        mesh: ring,
        kind: 'boss_area_ring',
        age: 0,
        lifetime: 0.65
      });
      return;
    }

    if (type === 'spell_cast') {
      const orbGeometry = new THREE.SphereGeometry(0.33, 16, 12);
      const orbMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8d2f,
        transparent: true,
        opacity: 0.92,
        depthWrite: false
      });

      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      orb.position.set(boss_pos.x, 1.8, boss_pos.z);

      const dir = new THREE.Vector3(
        player_pos.x - boss_pos.x,
        0,
        player_pos.z - boss_pos.z
      );

      if (dir.lengthSq() <= 0.0001) {
        dir.set(0, 0, 1);
      } else {
        dir.normalize();
      }

      this.scene.add(orb);
      this.active_vfx.push({
        mesh: orb,
        kind: 'boss_spell_orb',
        age: 0,
        lifetime: 0.5,
        forward: dir,
        speed: COMBAT_CONFIG.boss_spell_vfx_speed || 20
      });
      return;
    }

    const slashGeometry = new THREE.PlaneGeometry(3.5, 1.35);
    const slashMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const slash = new THREE.Mesh(slashGeometry, slashMaterial);
    const bossObject = this.boss_manager && typeof this.boss_manager.getBoss === 'function'
      ? this.boss_manager.getBoss()
      : null;
    const bossRotation = bossObject ? bossObject.rotation.y : 0;
    const forward = new THREE.Vector3(Math.sin(bossRotation - Math.PI), 0, Math.cos(bossRotation - Math.PI));

    slash.position.set(
      boss_pos.x + forward.x * 2.1,
      1.4,
      boss_pos.z + forward.z * 2.1
    );
    slash.rotation.y = bossRotation;

    this.scene.add(slash);
    this.active_vfx.push({
      mesh: slash,
      kind: 'boss_slash',
      age: 0,
      lifetime: 0.26
    });
  }

  spawn_boss_hit_vfx(x, z, is_kill) {
    if (!this.scene) return;

    const geometry = new THREE.SphereGeometry(is_kill ? 0.52 : 0.35, 12, 10);
    const material = new THREE.MeshBasicMaterial({
      color: is_kill ? 0xffe066 : 0xffffff,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });

    const spark = new THREE.Mesh(geometry, material);
    spark.position.set(x, 1.8, z);
    this.scene.add(spark);

    this.active_vfx.push({
      mesh: spark,
      kind: 'boss_hit',
      age: 0,
      lifetime: is_kill ? 0.5 : 0.28
    });
  }

  show_attack_warning() {
    if (!this.scene) return;
    this.attack_warning_elapsed = 0;

    if (this.attack_warning) {
      this.attack_warning.visible = true;
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 210px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 20;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeText('!', canvas.width / 2, canvas.height / 2 + 8);
    ctx.fillStyle = '#ffd84a';
    ctx.fillText('!', canvas.width / 2, canvas.height / 2 + 8);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });

    this.attack_warning = new THREE.Sprite(material);
    this.attack_warning.scale.set(1.85, 1.85, 1);
    this.attack_warning.visible = true;
    this.scene.add(this.attack_warning);
  }

  hide_attack_warning() {
    if (this.attack_warning) {
      this.attack_warning.visible = false;
    }
  }

  update_attack_warning(delta) {
    if (!this.attack_warning) return;
    if (!this.attack_warning.visible) return;

    const anchor = this.boss_manager && typeof this.boss_manager.getWarningAnchorPosition === 'function'
      ? this.boss_manager.getWarningAnchorPosition()
      : null;

    if (!anchor) {
      this.hide_attack_warning();
      return;
    }

    this.attack_warning_elapsed += delta;
    const flashSpeed = COMBAT_CONFIG.boss_warning_flash_speed || 12;
    const pulse = 0.35 + (0.65 * (0.5 + (0.5 * Math.sin(this.attack_warning_elapsed * flashSpeed))));
    const baseY = anchor.y + (COMBAT_CONFIG.boss_warning_height_offset || 0.9);

    this.attack_warning.position.set(anchor.x, baseY, anchor.z);
    this.attack_warning.material.opacity = pulse;
    this.attack_warning.scale.set(1.6 + (0.3 * pulse), 1.6 + (0.3 * pulse), 1);
  }

  update_vfx(delta) {
    if (!Array.isArray(this.active_vfx) || this.active_vfx.length === 0) return;

    for (let i = this.active_vfx.length - 1; i >= 0; i -= 1) {
      const fx = this.active_vfx[i];
      fx.age += delta;

      const t = Math.max(0, Math.min(1, fx.age / Math.max(0.001, fx.lifetime)));

      if (fx.kind === 'boss_area_ring') {
        const s = 1 + (t * 7.5);
        fx.mesh.scale.setScalar(s);
        fx.mesh.material.opacity = 0.6 * (1 - t);
      } else if (fx.kind === 'boss_spell_orb') {
        const step = (fx.speed || 20) * delta;
        fx.mesh.position.x += fx.forward.x * step;
        fx.mesh.position.z += fx.forward.z * step;
        fx.mesh.material.opacity = 0.92 * (1 - t);
      } else if (fx.kind === 'boss_slash') {
        fx.mesh.rotation.z += delta * 5.4;
        fx.mesh.scale.set(1 + t * 0.4, 1 + t * 0.2, 1);
        fx.mesh.material.opacity = 0.72 * (1 - t);
      } else if (fx.kind === 'boss_hit') {
        const s = 1 + (t * 1.9);
        fx.mesh.scale.setScalar(s);
        fx.mesh.material.opacity = 0.85 * (1 - t);
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
