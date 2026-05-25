import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { TREE_CONFIG, TREE2_CONFIG, BUSH_CONFIG } from '../config/gameConfig.js';

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

    // exclusion zones (arena + player spawn)
    this.arena_zone = null;
    this.spawn_zone = { x: 0, z: 0, radius: 25 };
  }

  setArenaZone(x, z, radius) {
    this.arena_zone = { x, z, radius };
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
    const load_tree_asset = (cfg, on_loaded, on_error, override_model = null) => {
      const selected_model = override_model || cfg.model;
      const model = String(selected_model || '').toLowerCase();
      const is_fbx = model.endsWith('.fbx');

      if (is_fbx) {
        const loader = new FBXLoader();
        loader.setPath(cfg.path);
        loader.load(
          selected_model,
          (fbx) => on_loaded(fbx),
          undefined,
          (err) => on_error(err)
        );
        return;
      }

      const loader = new GLTFLoader();
      loader.setPath(cfg.path);
      loader.load(
        selected_model,
        (gltf) => on_loaded(gltf.scene),
        undefined,
        (err) => on_error(err)
      );
    };

    const applyMaterialTweaks = (material, cfg) => {
      const mult = typeof cfg.color_multiplier === 'number' ? cfg.color_multiplier : 1;
      if (material && material.color && mult !== 1) {
        material.color.multiplyScalar(mult);
        material.needsUpdate = true;
      }
    };

    const setupBase = (base, cfg) => {
      base.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;

        if (Array.isArray(child.material)) {
          for (const mat of child.material) applyMaterialTweaks(mat, cfg);
        } else {
          applyMaterialTweaks(child.material, cfg);
        }
      });
    };

    const applyScaleFromConfig = (obj, cfg) => {
      const baseScale = Number.isFinite(cfg && cfg.scale) ? cfg.scale : 1;
      obj.scale.setScalar(baseScale);

      const desiredHeight = Number.isFinite(cfg && cfg.desired_height) ? cfg.desired_height : null;
      if (!desiredHeight || desiredHeight <= 0) return;

      obj.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      box.getSize(size);

      if (!Number.isFinite(size.y) || size.y <= 0.0001) return;
      const factor = desiredHeight / size.y;
      obj.scale.multiplyScalar(factor);
    };

    const isTooClose = (x, z, radius) => {
      for (const col of this.colliders) {
        const dx = x - col.x;
        const dz = z - col.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < (col.radius + radius)) return true;
      }
      return false;
    };

    const pickPosition = (spawnArea, radius, maxAttempts = 80) => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const x = (Math.random() - 0.5) * spawnArea;
        const z = (Math.random() - 0.5) * spawnArea;

        // keep arena clear
        if (this.arena_zone) {
          const dx = x - this.arena_zone.x;
          const dz = z - this.arena_zone.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist <= this.arena_zone.radius + 10) continue;
        }

        // keep spawn area clear
        if (this.spawn_zone) {
          const dx = x - this.spawn_zone.x;
          const dz = z - this.spawn_zone.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist <= this.spawn_zone.radius) continue;
        }

        if (!isTooClose(x, z, radius)) return { x, z };
      }
      return { x: (Math.random() - 0.5) * spawnArea, z: (Math.random() - 0.5) * spawnArea };
    };

    const placeOnTerrain = (obj, x, z, yOffset) => {
      const terrainY = this.terrain_manager.getTerrainHeight(x, z);
      obj.position.set(x, 0, z);
      obj.updateMatrixWorld(true);
      const bbox = new THREE.Box3().setFromObject(obj);
      const bottomY = bbox.min.y;
      const desiredBottomY = terrainY + yOffset;
      obj.position.y += desiredBottomY - bottomY;
    };

    const buildTreeCollider = (tree, cfg, variant, fallbackX, fallbackZ) => {
      tree.updateMatrixWorld(true);
      const bbox = new THREE.Box3().setFromObject(tree);
      const center = new THREE.Vector3(fallbackX, 0, fallbackZ);

      if (!bbox.isEmpty()) {
        bbox.getCenter(center);
      }

      return {
        x: center.x,
        z: center.z,
        radius: cfg.collision_radius,
        kind: 'tree',
        variant
      };
    };

    load_tree_asset(
      TREE_CONFIG,
      (baseA) => {
        setupBase(baseA, TREE_CONFIG);

        const afterLoadB = (baseB) => {
          const countA = Math.max(0, TREE_CONFIG.count | 0);
          const countB = baseB ? Math.max(0, TREE2_CONFIG.count | 0) : 0;
          let remainingA = countA;
          let remainingB = countB;
          const total = remainingA + remainingB;

          for (let i = 0; i < total; i++) {
            const pickB = baseB && remainingB > 0 && (remainingA === 0 || Math.random() < remainingB / (remainingA + remainingB));
            const cfg = pickB ? TREE2_CONFIG : TREE_CONFIG;
            const base = pickB ? baseB : baseA;
            if (pickB) remainingB--; else remainingA--;

            const tree = base.clone(true);
            applyScaleFromConfig(tree, cfg);
            tree.rotation.y = Math.random() * Math.PI * 2;

            const radius = cfg.collision_radius;
            const { x, z } = pickPosition(cfg.spawn_area, radius);
            const yOffset = cfg.position && typeof cfg.position.y === 'number' ? cfg.position.y : 0;
            placeOnTerrain(tree, x, z, yOffset);

            this.scene.add(tree);
            this.trees.push(tree);

            if (this.scene_manager) {
              this.scene_manager.registerCullableObjects([tree]);
            }

            const variant = pickB ? 'tree2' : 'tree1';
            this.colliders.push(buildTreeCollider(tree, cfg, variant, x, z));
            this.trees_loaded++;
          }

          this.check_all_loaded();
        };

        load_tree_asset(
          TREE2_CONFIG,
          (baseB) => {
            setupBase(baseB, TREE2_CONFIG);
            afterLoadB(baseB);
          },
          (err) => {
            const fallbackModel = TREE2_CONFIG && TREE2_CONFIG.fallback_model;
            if (typeof fallbackModel === 'string' && fallbackModel.trim().length > 0) {
              console.warn('TREE2 principal falhou. a tentar fallback:', TREE2_CONFIG.path + fallbackModel, err);
              load_tree_asset(
                TREE2_CONFIG,
                (fallbackBaseB) => {
                  setupBase(fallbackBaseB, TREE2_CONFIG);
                  afterLoadB(fallbackBaseB);
                },
                (fallbackErr) => {
                  console.warn('Fallback TREE2 falhou; usando apenas TREE_CONFIG:', TREE2_CONFIG.path + fallbackModel, fallbackErr);
                  afterLoadB(null);
                },
                fallbackModel
              );
              return;
            }

            console.warn('Failed to load TREE2 model; using only TREE_CONFIG:', TREE2_CONFIG.path + TREE2_CONFIG.model, err);
            afterLoadB(null);
          }
        );
      },
      (err) => {
        console.error('Failed to load tree model:', TREE_CONFIG.path + TREE_CONFIG.model, err);
        // don't block the game if trees fail
        this.trees_loaded = 1;
        this.check_all_loaded();
      }
    );
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

        let x = 0;
        let z = 0;
        for (let attempt = 0; attempt < 60; attempt++) {
          x = (Math.random() - 0.5) * BUSH_CONFIG.spawn_area;
          z = (Math.random() - 0.5) * BUSH_CONFIG.spawn_area;

          if (this.arena_zone) {
            const dx = x - this.arena_zone.x;
            const dz = z - this.arena_zone.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist <= this.arena_zone.radius + 10) continue;
          }

          if (this.spawn_zone) {
            const dx = x - this.spawn_zone.x;
            const dz = z - this.spawn_zone.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist <= this.spawn_zone.radius) continue;
          }

          break;
        }
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
        this.colliders.push({ x, z, radius, kind: 'bush' });

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

  // markers for hud minimap
  get_tree_minimap_markers() {
    return this.colliders
      .filter((c) => c.kind === 'tree')
      .map((c) => ({ x: c.x, z: c.z, variant: c.variant || 'tree1' }));
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
