import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { CAMERA_CONTROL_CONFIG } from '../config/gameConfig.js';

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.distance = CAMERA_CONTROL_CONFIG.INITIAL_DISTANCE;
    this.height = CAMERA_CONTROL_CONFIG.INITIAL_HEIGHT;
    this.horizontalAngle = 0;
    this.verticalAngle = 0;
    
    this.setupMouseListeners();
  }

  setupMouseListeners() {
    document.addEventListener('mousemove', (e) => {
      const deltaX = e.movementX * CAMERA_CONTROL_CONFIG.MOUSE_SENSITIVITY;
      const deltaY = e.movementY * CAMERA_CONTROL_CONFIG.MOUSE_SENSITIVITY;

      this.horizontalAngle -= deltaX;
      this.verticalAngle -= deltaY;

      // clamp vertical angle
      this.verticalAngle = Math.max(
        CAMERA_CONTROL_CONFIG.MIN_VERTICAL_ANGLE,
        Math.min(CAMERA_CONTROL_CONFIG.MAX_VERTICAL_ANGLE, this.verticalAngle)
      );
    });

    document.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.distance += (e.deltaY > 0 ? 1 : -1) * CAMERA_CONTROL_CONFIG.ZOOM_SPEED;
      this.distance = Math.max(
        CAMERA_CONTROL_CONFIG.MIN_DISTANCE,
        Math.min(CAMERA_CONTROL_CONFIG.MAX_DISTANCE, this.distance)
      );
    });
  }

  update(targetPosition) {
    // calculate camera position around target
    const x = Math.sin(this.horizontalAngle) * Math.cos(this.verticalAngle) * this.distance;
    const y = Math.sin(this.verticalAngle) * this.distance + this.height;
    const z = Math.cos(this.horizontalAngle) * Math.cos(this.verticalAngle) * this.distance;

    this.camera.position.set(
      targetPosition.x + x,
      targetPosition.y + y,
      targetPosition.z + z
    );
    this.camera.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
  }
}