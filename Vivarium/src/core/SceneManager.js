import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { SCENE_CONFIG, CAMERA_CONFIG } from '../config/gameConfig.js';

export class SceneManager {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.frustum = new THREE.Frustum();
    this.cameraViewProjectionMatrix = new THREE.Matrix4();
    this.cullableObjects = [];
  }

  init() {
    // create scene
    this.scene = new THREE.Scene();
    // no scene background so the sky dome can be visible
    this.scene.background = null;
    console.log('scene created');

    // create camera
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.FOV,
      window.innerWidth / window.innerHeight,
      CAMERA_CONFIG.NEAR,
      CAMERA_CONFIG.FAR
    );
    this.camera.position.set(
      CAMERA_CONFIG.INITIAL_POSITION.x,
      CAMERA_CONFIG.INITIAL_POSITION.y,
      CAMERA_CONFIG.INITIAL_POSITION.z
    );
    this.camera.lookAt(0, 0, 0);
    console.log('camera positioned');

    // create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // transparent clear so body background stays behind
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // attach renderer to the main app container
    const container = document.getElementById('app') || document.body;
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);
    console.log('renderer created');

    // handle window resize
    this.setupResizeHandler();
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // register objects for frustum culling
  registerCullableObjects(objects) {
    this.cullableObjects = this.cullableObjects.concat(objects);
  }

  // update frustum and cull objects
  updateFrustumCulling() {
    // update camera matrices
    this.camera.updateMatrixWorld();
    this.cameraViewProjectionMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraViewProjectionMatrix);

    // check each cullable object
    for (const obj of this.cullableObjects) {
      if (!obj || !obj.position) continue;

      // simple bounding sphere culling around the object position
      // larger radius so objects only disappear when very far
      const boundingSphere = new THREE.Sphere(obj.position, 60);
      const isVisible = this.frustum.intersectsSphere(boundingSphere);
      obj.visible = isVisible;
    }
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }

  render() {
    this.updateFrustumCulling();
    this.renderer.render(this.scene, this.camera);
  }
}