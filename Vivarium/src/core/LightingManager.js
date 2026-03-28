import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { LIGHT_CONFIG } from '../config/gameConfig.js';

export class LightingManager {
  constructor(scene) {
    this.scene = scene;
    this.directionalLight = null;
    this.ambientLight = null;
    this.playerLight = null;

    // cache day values so we can lerp to night
    this.daySettings = null;

    // night defaults (kept here to avoid forcing config changes)
    this.nightSettings = {
      directionalIntensity: 0.3,
      directionalColor: new THREE.Color(0x4466aa),
      ambientIntensity: 0.2,
      ambientColor: new THREE.Color(0x223355),
      playerLightIntensity: 2.0,
    };
  }

  init() {
    // create a sun like light
    const dir = LIGHT_CONFIG.directional;
    this.directionalLight = new THREE.DirectionalLight(
      dir.color,
      dir.intensity
    );
    this.directionalLight.position.set(
      dir.position.x,
      dir.position.y,
      dir.position.z
    );
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = dir.shadow_map_size;
    this.directionalLight.shadow.mapSize.height = dir.shadow_map_size;
    this.directionalLight.shadow.camera.left = -dir.shadow_camera_size;
    this.directionalLight.shadow.camera.right = dir.shadow_camera_size;
    this.directionalLight.shadow.camera.top = dir.shadow_camera_size;
    this.directionalLight.shadow.camera.bottom = -dir.shadow_camera_size;
    this.scene.add(this.directionalLight);

    // soft light that fills dark areas
    const amb = LIGHT_CONFIG.ambient;
    this.ambientLight = new THREE.AmbientLight(
      amb.color,
      amb.intensity
    );
    this.scene.add(this.ambientLight);

    // player point light (helps visibility at night)
    const playerCfg = LIGHT_CONFIG.player || { color: 0xffffff, intensity: 1.2, distance: 20 };
    this.playerLight = new THREE.PointLight(
      playerCfg.color,
      playerCfg.intensity,
      playerCfg.distance
    );
    this.playerLight.position.set(0, 10, 0);
    this.playerLight.name = 'playerLight';
    this.scene.add(this.playerLight);

    this.daySettings = {
      directionalIntensity: dir.intensity,
      directionalColor: new THREE.Color(dir.color),
      ambientIntensity: amb.intensity,
      ambientColor: new THREE.Color(amb.color),
      playerLightIntensity: playerCfg.intensity,
      playerLightDistance: playerCfg.distance,
      playerLightColor: new THREE.Color(playerCfg.color),
    };
  }

  // helper: lerp two colors into a target color
  lerpColor(target, a, b, t) {
    target.r = a.r + (b.r - a.r) * t;
    target.g = a.g + (b.g - a.g) * t;
    target.b = a.b + (b.b - a.b) * t;
  }

  // helper: lerp two values
  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // update lighting based on time of day (0 = day, 1 = full night)
  updateDayNightCycle(nightAmount) {
    if (!this.daySettings || !this.directionalLight || !this.ambientLight || !this.playerLight) return;

    const t = Math.max(0, Math.min(1, nightAmount));

    this.directionalLight.intensity = this.lerp(
      this.daySettings.directionalIntensity,
      this.nightSettings.directionalIntensity,
      t
    );

    this.lerpColor(
      this.directionalLight.color,
      this.daySettings.directionalColor,
      this.nightSettings.directionalColor,
      t
    );

    this.ambientLight.intensity = this.lerp(
      this.daySettings.ambientIntensity,
      this.nightSettings.ambientIntensity,
      t
    );

    this.lerpColor(
      this.ambientLight.color,
      this.daySettings.ambientColor,
      this.nightSettings.ambientColor,
      t
    );

    // player light is stronger at night
    this.playerLight.intensity = this.lerp(
      this.daySettings.playerLightIntensity,
      this.nightSettings.playerLightIntensity,
      t
    );

    // make the player light warmer at night
    if (t > 0.5) {
      this.playerLight.color.setHex(0xffaa55);
      this.playerLight.distance = Math.max(this.daySettings.playerLightDistance, 30);
    } else {
      this.playerLight.color.copy(this.daySettings.playerLightColor);
      this.playerLight.distance = this.daySettings.playerLightDistance;
    }
  }

  updatePlayerLight(position) {
    if (!this.playerLight || !position) return;
    this.playerLight.position.copy(position);
    this.playerLight.position.y += 3;
  }

  getDirectionalLight() {
    return this.directionalLight;
  }

  getAmbientLight() {
    return this.ambientLight;
  }

  getPlayerLight() {
    return this.playerLight;
  }
}