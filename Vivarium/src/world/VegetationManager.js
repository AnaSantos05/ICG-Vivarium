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
    this.on_load_callback = null;
    this.trees_loaded = 0;
    this.bushes_loaded = 0;
  }

  init(on_load_callback) {
    // spawn trees and bushes around the world
    this.on_load_callback = on_load_callback || null;
    this.trees_loaded = 0;
    this.bushes_loaded = 0;
    this.load_trees();
    this.load_bushes();
  }

  check_all_loaded() {
    // consider vegetation loaded after at least one tree and one bush
    if (this.trees_loaded >= 1 && this.bushes_loaded >= 1 && this.on_load_callback) {
      this.on_load_callback();
      this.on_load_callback = null;
    }
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

        this.trees_loaded++;
        this.check_all_loaded();
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

        this.bushes_loaded++;
        this.check_all_loaded();
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

  // returns the minimum distance from a point to any collider
  get_min_distance_to_colliders(x, z) {
    if (this.colliders.length === 0) return Infinity;

    let min = Infinity;
    for (const col of this.colliders) {
      const dx = x - col.x;
      const dz = z - col.z;
      const dist = Math.sqrt(dx * dx + dz * dz) - col.radius;
      if (dist < min) {
        min = dist;
      }
    }
    return min;
  }

  // tries to find a position around origin that is at least
  // min_clear_distance away from trees and bushes
  find_safe_position_around(origin_x, origin_z, min_clear_distance = 15, max_attempts = 40) {
    for (let i = 0; i < max_attempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = min_clear_distance + Math.random() * 10;
      const x = origin_x + Math.sin(angle) * radius;
      const z = origin_z + Math.cos(angle) * radius;

      const min_dist = this.get_min_distance_to_colliders(x, z);
      if (min_dist >= min_clear_distance * 0.8) {
        return { x, z };
      }
    }

    return { x: origin_x, z: origin_z };
  }
}
