import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';

// simple loading screen with a floating fox
export class LoadingScreen {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.fox = null;
    this.mixer = null;
    this.is_loading = true;
    this.can_interact = false;
    this.loading_container = null;
    this.waiting_for_input = false;
    this.dot_interval = null;

    this.init();
  }

  init() {
    this.create_loading_ui();
    this.create_scene();
    this.load_fox();
    this.animate();
  }

  create_loading_ui() {
    const font_link = document.createElement('link');
    font_link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    font_link.rel = 'stylesheet';
    document.head.appendChild(font_link);

    this.loading_container = document.createElement('div');
    this.loading_container.id = 'loading-screen';
    this.loading_container.style.position = 'fixed';
    this.loading_container.style.top = '0';
    this.loading_container.style.left = '0';
    this.loading_container.style.width = '100%';
    this.loading_container.style.height = '100%';
    this.loading_container.style.backgroundColor = '#4a3f6b';
    this.loading_container.style.display = 'flex';
    this.loading_container.style.flexDirection = 'column';
    this.loading_container.style.justifyContent = 'center';
    this.loading_container.style.alignItems = 'center';
    this.loading_container.style.zIndex = '9999';

    this.canvas_container = document.createElement('div');
    this.canvas_container.style.width = '800px';
    this.canvas_container.style.height = '500px';
    this.canvas_container.style.position = 'relative';

    this.loading_text = document.createElement('div');
    this.loading_text.style.fontFamily = '"Press Start 2P", monospace';
    this.loading_text.style.fontSize = '24px';
    this.loading_text.style.color = 'white';
    this.loading_text.style.marginTop = '30px';
    this.loading_text.style.textShadow = '3px 3px 0px #000';
    this.loading_text.textContent = 'loading...';

    this.dot_count = 0;
    this.dot_interval = setInterval(() => {
      if (!this.waiting_for_input) {
        this.dot_count = (this.dot_count + 1) % 4;
        this.loading_text.textContent = 'loading' + '.'.repeat(this.dot_count);
      }
    }, 500);

    this.loading_container.appendChild(this.canvas_container);
    this.loading_container.appendChild(this.loading_text);
    document.body.appendChild(this.loading_container);
  }

  create_scene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x4a3f6b);

    this.camera = new THREE.PerspectiveCamera(45, 800 / 500, 0.1, 1000);
    this.camera.position.set(0, 2, 18);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(800, 500);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setClearColor(0x4a3f6b, 1);
    this.canvas_container.appendChild(this.renderer.domElement);

    const ambient_light = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient_light);

    const directional_light = new THREE.DirectionalLight(0xffffff, 1);
    directional_light.position.set(5, 10, 7);
    this.scene.add(directional_light);

    const purple_light = new THREE.PointLight(0x9966ff, 0.5, 20);
    purple_light.position.set(-3, 2, 3);
    this.scene.add(purple_light);
  }

  load_fox() {
    const loader = new GLTFLoader();

    loader.load('./resources/start/loading/floating_fox/scene.gltf', (gltf) => {
      this.fox = gltf.scene;
      this.fox.scale.setScalar(1.2);
      this.fox.position.set(0, 0, 0);
      this.fox.rotation.y = 0;

      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.fox);
        const action = this.mixer.clipAction(gltf.animations[0]);
        action.play();
      }

      this.scene.add(this.fox);
      console.log('loading fox model ready');
    },
    undefined,
    (error) => {
      console.error('error loading loading fox', error);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.mixer) {
      this.mixer.update(0.016);
    }

    if (this.fox) {
      this.fox.position.y = Math.sin(Date.now() * 0.002) * 0.2;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  updateProgress(progress) {
    if (!this.waiting_for_input) {
      const percent = Math.round(progress * 100);
      this.loading_text.textContent = `loading... ${percent}%`;
    }
  }

  hide(callback) {
    const start_game = () => {
      if (this.can_interact) {
        this.can_interact = false;
        window.removeEventListener('keydown', start_game);
        window.removeEventListener('click', start_game);

        // start the next screen (intro / game) immediately,
        // while this loading UI fades out behind a black overlay
        if (callback) callback();

        this.loading_container.style.transition = 'opacity 0.5s ease-out';
        this.loading_container.style.opacity = '0';

        setTimeout(() => {
          this.loading_container.remove();

          if (this.renderer) {
            this.renderer.dispose();
          }
        }, 500);
      }
    };

    window.addEventListener('keydown', start_game);
    window.addEventListener('click', start_game);
  }

  onGameReady(callback) {
    this.is_loading = false;
    this.can_interact = true;
    this.waiting_for_input = true;

    if (this.dot_interval) {
      clearInterval(this.dot_interval);
    }

    this.loading_text.textContent = 'press any key to start';

    this.hide(callback);
  }
}
