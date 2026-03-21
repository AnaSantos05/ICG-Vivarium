import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { TREE_CONFIG, BUSH_CONFIG } from '../config/gameConfig.js';

export class VegetationManager {
  constructor(scene, terrain_manager, scene_manager) {
    this.scene = scene;
    this.terrain_manager = terrain_manager;
    this.scene_manager = scene_manager;
    this.trees = [];
    this.bushes = [];
    this.colliders = [];
  }

  init() {
    // spawn trees and bushes around the world
    this.load_trees();
    this.load_bushes();
  }

  load_trees() {
    const loader = new GLTFLoader();
    loader.setPath(TREE_CONFIG.path);

    for (let i = 0; i < TREE_CONFIG.count; i++) {
      loader.load(TREE_CONFIG.model, (gltf) => {
        const tree = gltf.scene;
        tree.scale.setScalar(TREE_CONFIG.scale);

        const x = (Math.random() - 0.5) * TREE_CONFIG.spawn_area;
        const z = (Math.random() - 0.5) * TREE_CONFIG.spawn_area;
        const y = this.terrain_manager.getTerrainHeight(x, z) + 7;

        tree.position.set(x, y, z);
        tree.rotation.y = Math.random() * Math.PI * 2;

        tree.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.scene.add(tree);
        this.trees.push(tree);

        if (this.scene_manager) {
          this.scene_manager.registerCullableObjects([tree]);
        }

        // simple sphere collider around the tree trunk
        this.colliders.push({ x, z, radius: TREE_CONFIG.collision_radius });
      });
    }
  }

  load_bushes() {
    const loader = new FBXLoader();
    loader.setPath(BUSH_CONFIG.path);

    const texture_loader = new THREE.TextureLoader();
    const bush_texture = texture_loader.load(BUSH_CONFIG.texture);
    bush_texture.encoding = THREE.sRGBEncoding;

    for (let i = 0; i < BUSH_CONFIG.count; i++) {
      loader.load(BUSH_CONFIG.model, (fbx) => {
        const scale = BUSH_CONFIG.min_scale + Math.random() * (BUSH_CONFIG.max_scale - BUSH_CONFIG.min_scale);
        fbx.scale.setScalar(scale);

        const x = (Math.random() - 0.5) * BUSH_CONFIG.spawn_area;
        const z = (Math.random() - 0.5) * BUSH_CONFIG.spawn_area;
        const y = this.terrain_manager.getTerrainHeight(x, z);

        fbx.position.set(x, y, z);
        fbx.rotation.y = Math.random() * Math.PI * 2;

        fbx.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              map: bush_texture,
              roughness: 0.8,
              metalness: 0.0
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.scene.add(fbx);
        this.bushes.push(fbx);

        if (this.scene_manager) {
          this.scene_manager.registerCullableObjects([fbx]);
        }

        // use bush size as collision radius
        const radius = scale * 30;
        this.colliders.push({ x, z, radius });
      });
    }
  }

  check_collision(x, z) {
    for (const col of this.colliders) {
      const dx = x - col.x;
      const dz = z - col.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < col.radius) {
        return true;
      }
    }
    return false;
  }
}
