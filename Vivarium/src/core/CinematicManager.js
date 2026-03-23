import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { PLAYER_CONFIG } from '../config/gameConfig.js';

// simple intro cinematic: fox walks forward while camera
// starts on the side and moves behind the player
export class CinematicManager {
  constructor(camera, player_manager, vegetation_manager, terrain_manager) {
    this.camera = camera;
    this.player_manager = player_manager;
    this.vegetation_manager = vegetation_manager;
    this.terrain_manager = terrain_manager;

    this.is_playing = false;
    this.on_complete = null;

    this.config = {
      total_duration: 5000,
      side_phase_ratio: 0.6,
      fox_move_speed: PLAYER_CONFIG.MOVE_SPEED * 0.4,
      side_offset: 6,
      side_height: 2,
      behind_distance: 10,
      behind_height: 5
    };

    this.start_time = 0;
    this.last_time = 0;
  }

  isActive() {
    return this.is_playing;
  }

  start(on_complete) {
    this.is_playing = true;
    this.on_complete = on_complete || null;
    this.start_time = performance.now();
    this.last_time = this.start_time;

    const fox = this.player_manager.get_fox ? this.player_manager.get_fox() : null;
    if (!fox) {
      console.warn('fox not ready, skipping cinematic');
      this.end();
      return;
    }

    // move fox to a safe start position away from trees and bushes
    let fox_pos = this.player_manager.get_position();

    if (this.vegetation_manager && typeof this.vegetation_manager.find_safe_position_around === 'function') {
      // use a larger clear distance so the cinematic always
      // starts in a very open area with no trees nearby
      const safe = this.vegetation_manager.find_safe_position_around(fox_pos.x, fox_pos.z, 40);
      fox.position.x = safe.x;
      fox.position.z = safe.z;

      if (this.terrain_manager && typeof this.terrain_manager.getTerrainHeight === 'function') {
        fox.position.y = this.terrain_manager.getTerrainHeight(fox.position.x, fox.position.z);
      }

      fox_pos = this.player_manager.get_position();
    }

    // pick a direction that is clear for some distance
    fox.rotation.y = this.find_safe_direction(fox_pos, fox.rotation.y);
    this.update_camera_side_view(fox_pos, fox.rotation.y);

    if (this.player_manager.fade_to_action) {
      // start running immediately, no fade, so fox does not pause
      this.player_manager.fade_to_action('run', 0);
    }

    // run one immediate update so movement and animation
    // start in the same frame the cinematic begins
    this.update(0.016);
  }

  // search around current rotation for a direction with fewer obstacles
  find_safe_direction(fox_pos, current_rotation) {
    if (!this.vegetation_manager || typeof this.vegetation_manager.check_collision !== 'function') {
      return current_rotation;
    }

    const max_distance = 30;
    const step_distance = 3;
    const directions = [
      0,
      Math.PI / 6,
      -Math.PI / 6,
      Math.PI / 3,
      -Math.PI / 3,
      Math.PI / 2,
      -Math.PI / 2,
      Math.PI
    ];

    let best_angle = current_rotation;
    let best_score = -Infinity;

    for (const offset of directions) {
      const angle = current_rotation + offset;
      let score = 0;

      for (let d = step_distance; d <= max_distance; d += step_distance) {
        const x = fox_pos.x + Math.sin(angle) * d;
        const z = fox_pos.z + Math.cos(angle) * d;

        if (this.vegetation_manager.check_collision(x, z)) {
          break;
        }

        score += 1;
      }

      if (score > best_score) {
        best_score = score;
        best_angle = angle;
      }
    }

    return best_angle;
  }

  update(delta) {
    if (!this.is_playing) return;

    const now = performance.now();
      const frame_delta = delta || (now - this.last_time) / 1000;
    this.last_time = now;

    const elapsed = now - this.start_time;
    const progress = Math.min(elapsed / this.config.total_duration, 1);

    const fox = this.player_manager.get_fox ? this.player_manager.get_fox() : null;
    if (!fox) {
      this.end();
      return;
    }

    this.move_fox_forward(frame_delta);

    if (this.player_manager.mixer) {
      this.player_manager.mixer.update(frame_delta);
    }

    const fox_pos = this.player_manager.get_position();

    if (progress < this.config.side_phase_ratio) {
      this.update_camera_side_view(fox_pos, fox.rotation.y);
    } else {
      const t = (progress - this.config.side_phase_ratio) / (1 - this.config.side_phase_ratio);
      const smooth_t = this.ease_in_out_cubic(t);

      const side_pos = this.get_side_camera_position(fox_pos, fox.rotation.y);
      const behind_pos = this.get_behind_camera_position(fox_pos, fox.rotation.y);

      this.camera.position.lerpVectors(side_pos, behind_pos, smooth_t);
      this.camera.lookAt(fox_pos.x, fox_pos.y + 1, fox_pos.z);
    }

    if (progress >= 1) {
      this.end();
    }
  }

  move_fox_forward(delta) {
    const fox = this.player_manager.get_fox ? this.player_manager.get_fox() : null;
    if (!fox) return;

    const move_distance = this.config.fox_move_speed * delta;

    const next_x = fox.position.x + Math.sin(fox.rotation.y) * move_distance;
    const next_z = fox.position.z + Math.cos(fox.rotation.y) * move_distance;

    // during the intro cinematic we ignore vegetation collisions
    // to keep the movement perfectly smooth and avoid bumps
    fox.position.x = next_x;
    fox.position.z = next_z;

    if (this.terrain_manager && typeof this.terrain_manager.getTerrainHeight === 'function') {
      fox.position.y = this.terrain_manager.getTerrainHeight(fox.position.x, fox.position.z);
    }
  }

  get_side_camera_position(fox_pos, fox_rotation) {
    const side_angle = fox_rotation + Math.PI * 0.65;

    const x = fox_pos.x + Math.sin(side_angle) * this.config.side_offset;
    const z = fox_pos.z + Math.cos(side_angle) * this.config.side_offset;
    const y = fox_pos.y + this.config.side_height;

    return new THREE.Vector3(x, y, z);
  }

  update_camera_side_view(fox_pos, fox_rotation) {
    const pos = this.get_side_camera_position(fox_pos, fox_rotation);
    this.camera.position.copy(pos);

    const look_x = fox_pos.x + Math.sin(fox_rotation) * 2;
    const look_z = fox_pos.z + Math.cos(fox_rotation) * 2;
    this.camera.lookAt(look_x, fox_pos.y + 0.5, look_z);
  }

  get_behind_camera_position(fox_pos, fox_rotation) {
    const offset = new THREE.Vector3(0, this.config.behind_height, this.config.behind_distance);

    const rotation_matrix = new THREE.Matrix4();
    rotation_matrix.makeRotationY(fox_rotation);
    offset.applyMatrix4(rotation_matrix);

    return new THREE.Vector3(
      fox_pos.x + offset.x,
      fox_pos.y + offset.y,
      fox_pos.z + offset.z
    );
  }

  ease_in_out_cubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  end() {
    this.is_playing = false;

    if (this.player_manager.fade_to_action) {
      this.player_manager.fade_to_action('idle', 0.3);
    }

    if (this.on_complete) {
      this.on_complete();
      this.on_complete = null;
    }
  }
}
