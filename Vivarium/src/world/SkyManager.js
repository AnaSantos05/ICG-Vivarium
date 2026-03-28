import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

export class SkyManager {
  constructor(scene) {
    this.scene = scene;
    this.skyDome = null;
    this.isLoaded = false;

    // sky textures
    this.dayTexture = null;
    this.nightTexture = null;
    this.currentNightAmount = 0;

    // paths
    this.DAY_TEXTURE_PATH = './resources/ground/sky/daytime/textures/sky_water_landscape.jpg';
    this.NIGHT_TEXTURE_PATH = './resources/ground/sky/night/textures/background.jpg';
  }

  init() {
    this.loadTextures();
  }

  loadTextures() {
    const textureLoader = new THREE.TextureLoader();
    let loadedCount = 0;

    // load day texture
    this.dayTexture = textureLoader.load(
      this.DAY_TEXTURE_PATH,
      () => {
        loadedCount++;
        if (loadedCount === 2) this.createSkyDome();
      },
      undefined,
      (error) => {
        console.error('error loading day sky texture:', error);
      }
    );
    this.dayTexture.encoding = THREE.sRGBEncoding;

    // load night texture
    this.nightTexture = textureLoader.load(
      this.NIGHT_TEXTURE_PATH,
      () => {
        loadedCount++;
        if (loadedCount === 2) this.createSkyDome();
      },
      undefined,
      (error) => {
        console.error('error loading night sky texture:', error);
      }
    );
    this.nightTexture.encoding = THREE.sRGBEncoding;

    // create a dome immediately (will update when both load)
    this.createSkyDome();
  }

  createSkyDome() {
    // remove existing dome
    if (this.skyDome) {
      this.scene.remove(this.skyDome);
    }

    // create a sphere smaller than the camera far plane (1000)
    const skyGeometry = new THREE.SphereGeometry(900, 32, 32);

    // start with day texture
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: this.dayTexture,
      side: THREE.BackSide,
      fog: false,
    });

    this.skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    this.skyDome.renderOrder = -1000;
    this.skyDome.frustumCulled = false;

    this.scene.add(this.skyDome);
    this.isLoaded = true;
  }

  // update sky based on time of day
  updateDayNightCycle(nightAmount) {
    if (!this.skyDome || !this.dayTexture || !this.nightTexture) return;

    this.currentNightAmount = nightAmount;

    // switch texture based on a threshold
    this.skyDome.material.map = nightAmount > 0.5 ? this.nightTexture : this.dayTexture;

    // adjust brightness during night
    const brightness = 1 - (nightAmount * 0.3);
    this.skyDome.material.color.setRGB(brightness, brightness, brightness);
    this.skyDome.material.needsUpdate = true;
  }

  update(playerPosition) {
    if (!this.skyDome || !this.isLoaded || !playerPosition) return;

    // keep the sky centered on the player
    this.skyDome.position.x = playerPosition.x;
    this.skyDome.position.y = playerPosition.y;
    this.skyDome.position.z = playerPosition.z;
  }

  getSkyDome() {
    return this.skyDome;
  }
}
