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
  }
  
  update(target_position, target_rotation, input_manager) {
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
    this.camera.lookAt(target_position.x, target_position.y, target_position.z);
  }
}