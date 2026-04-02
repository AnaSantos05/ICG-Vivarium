import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

export class ArenaManager {
  constructor(scene) {
    this.scene = scene;
    this.arena = null;
    this.arenaStructure = null;
    this.bushes = [];

    this.config = {
      RADIUS: 35,
      POSITION: { x: 0, y: 0, z: 0 },
      TEXTURE_PATH: './resources/ground/arena_ground_texture.jpg',
      STRUCTURE_PATH: './resources/bosses/arena/doric_arena.glb',
      SEGMENTS: 64,
      STRUCTURE_SCALE: 3.3,

      // bushes around the arena to hide the terrain edge
      BUSH_PATH: './resources/ground/trees/stylized-bush/source/stylized bush/',
      BUSH_MODEL: 'stylized bush.fbx',
      BUSH_TEXTURE: './resources/ground/trees/stylized-bush/source/stylized bush/9.png',
      BUSH_COUNT: 40,
      BUSH_SCALE: 0.05,
      BUSH_RING_RADIUS: 40,
      BUSH_RING_RADIUS_OUTER: 50
    };
  }

  init(centerX, centerZ, terrainHeight) {
    this.config.POSITION.x = centerX;
    this.config.POSITION.z = centerZ;
    this.config.POSITION.y = terrainHeight;

    this.createArena();
    this.loadArenaStructure();
    this.createSurroundingBushes();
  }

  createArena() {
    // a simple circle mesh that sits slightly above the flat zone
    const geometry = new THREE.CircleGeometry(this.config.RADIUS, this.config.SEGMENTS);

    const textureLoader = new THREE.TextureLoader();
    const arenaTexture = textureLoader.load(this.config.TEXTURE_PATH);
    arenaTexture.wrapS = THREE.RepeatWrapping;
    arenaTexture.wrapT = THREE.RepeatWrapping;
    arenaTexture.repeat.set(4, 4);

    const material = new THREE.MeshStandardMaterial({
      map: arenaTexture,
      roughness: 0.9,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    this.arena = new THREE.Mesh(geometry, material);

    const flatY = 0.15;
    this.arena.position.set(this.config.POSITION.x, flatY, this.config.POSITION.z);
    this.arena.rotation.x = -Math.PI / 2;
    this.arena.receiveShadow = true;

    this.scene.add(this.arena);
    console.log('arena floor created');
  }

  loadArenaStructure() {
    const loader = new GLTFLoader();

    loader.load(
      this.config.STRUCTURE_PATH,
      (gltf) => {
        this.arenaStructure = gltf.scene;
        this.arenaStructure.scale.setScalar(this.config.STRUCTURE_SCALE);

        // note: the vite version offsets x by -95 to line up with the model
        this.arenaStructure.position.set(this.config.POSITION.x - 95, 0, this.config.POSITION.z);

        this.arenaStructure.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.scene.add(this.arenaStructure);
        console.log('arena structure loaded');
      },
      undefined,
      (error) => {
        console.error('error loading arena structure:', error);
      }
    );
  }

  createSurroundingBushes() {
    const bushLoader = new FBXLoader();
    bushLoader.setPath(this.config.BUSH_PATH);

    const textureLoader = new THREE.TextureLoader();
    const bushTexture = textureLoader.load(this.config.BUSH_TEXTURE);
    bushTexture.encoding = THREE.sRGBEncoding;

    const centerX = this.config.POSITION.x;
    const centerZ = this.config.POSITION.z;

    // inner ring
    for (let i = 0; i < this.config.BUSH_COUNT; i++) {
      bushLoader.load(this.config.BUSH_MODEL, (bushFbx) => {
        const scale = this.config.BUSH_SCALE * (0.8 + Math.random() * 0.4);
        bushFbx.scale.setScalar(scale);

        const angle = (i / this.config.BUSH_COUNT) * Math.PI * 2;
        const radius = this.config.BUSH_RING_RADIUS;

        const x = centerX + Math.cos(angle) * radius;
        const z = centerZ + Math.sin(angle) * radius;

        bushFbx.position.set(x, 0, z);
        bushFbx.rotation.y = Math.random() * Math.PI * 2;

        bushFbx.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              map: bushTexture,
              roughness: 0.8,
              metalness: 0.0
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.bushes.push(bushFbx);
        this.scene.add(bushFbx);
      });
    }

    // outer ring (slight angle offset to fill the gaps)
    for (let i = 0; i < this.config.BUSH_COUNT; i++) {
      bushLoader.load(this.config.BUSH_MODEL, (bushFbx) => {
        const scale = this.config.BUSH_SCALE * (0.9 + Math.random() * 0.3);
        bushFbx.scale.setScalar(scale);

        const angleOffset = (0.5 / this.config.BUSH_COUNT) * Math.PI * 2;
        const angle = (i / this.config.BUSH_COUNT) * Math.PI * 2 + angleOffset;
        const radius = this.config.BUSH_RING_RADIUS_OUTER;

        const x = centerX + Math.cos(angle) * radius - 5;
        const z = centerZ + Math.sin(angle) * radius - 5;

        bushFbx.position.set(x, -1, z);
        bushFbx.rotation.y = Math.random() * Math.PI * 2;

        bushFbx.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              map: bushTexture,
              roughness: 0.8,
              metalness: 0.0
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.bushes.push(bushFbx);
        this.scene.add(bushFbx);
      });
    }

    console.log('✅ arena surrounding bushes created');
  }

  getCenter() {
    return {
      x: this.config.POSITION.x,
      y: this.config.POSITION.y,
      z: this.config.POSITION.z
    };
  }

  getRadius() {
    return this.config.RADIUS;
  }
}
