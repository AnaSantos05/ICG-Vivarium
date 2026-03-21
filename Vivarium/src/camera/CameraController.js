import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { CAMERA_CONTROL_CONFIG } from '../config/gameConfig.js';

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.distance = CAMERA_CONTROL_CONFIG.INITIAL_DISTANCE;
    this.height = CAMERA_CONTROL_CONFIG.INITIAL_HEIGHT;
    // extra angle so the player can rotate and the camera can still be moved
    this.angle_offset = 0;
    this.verticalAngle = 0;

    this.is_dragging = false;
    this.last_x = 0;
    this.last_y = 0;

    this.setup_mouse_controls();
  }
  
  setup_mouse_controls() {
    // right mouse button drag rotates the camera
    window.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        this.is_dragging = true;
        this.last_x = e.clientX;
        this.last_y = e.clientY;
        e.preventDefault();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.is_dragging = false;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.is_dragging) return;

      const dx = e.clientX - this.last_x;
      const dy = e.clientY - this.last_y;

      this.last_x = e.clientX;
      this.last_y = e.clientY;

      this.angle_offset += dx * CAMERA_CONTROL_CONFIG.MOUSE_SENSITIVITY;
      this.verticalAngle -= dy * CAMERA_CONTROL_CONFIG.MOUSE_SENSITIVITY;
    });
  }

  update(target_position, target_rotation, input_manager, terrain_manager) {
    // arrow keys move the camera around the player
    if (input_manager) {
      const { delta_x, delta_y } = input_manager.get_arrow_rotation_delta();
      this.angle_offset += delta_x;
      this.verticalAngle += delta_y;
    }

    this.verticalAngle = Math.max(
      CAMERA_CONTROL_CONFIG.MIN_VERTICAL_ANGLE,
      Math.min(CAMERA_CONTROL_CONFIG.MAX_VERTICAL_ANGLE, this.verticalAngle)
    );

    const base_angle = typeof target_rotation === 'number' ? target_rotation : 0;
    const final_angle = base_angle + this.angle_offset;

    const x = Math.sin(final_angle) * Math.cos(this.verticalAngle) * this.distance;
    const y = Math.sin(this.verticalAngle) * this.distance + this.height;
    const z = Math.cos(final_angle) * Math.cos(this.verticalAngle) * this.distance;

    this.camera.position.set(
      target_position.x + x,
      target_position.y + y,
      target_position.z + z
    );

    // keep camera from going under the player or the terrain
    const min_height_above_player = 1.5;
    let min_y = target_position.y + min_height_above_player;

    if (terrain_manager && typeof terrain_manager.getTerrainHeight === 'function') {
      const terrain_height = terrain_manager.getTerrainHeight(
        this.camera.position.x,
        this.camera.position.z
      );
      const min_height_above_terrain = 1.0;
      const terrain_min_y = terrain_height + min_height_above_terrain;
      if (terrain_min_y > min_y) {
        min_y = terrain_min_y;
      }
    }

    if (this.camera.position.y < min_y) {
      this.camera.position.y = min_y;
    }
    this.camera.lookAt(target_position.x, target_position.y, target_position.z);
  }
}