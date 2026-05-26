import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { TERRAIN_CONFIG, VOID_COVER_CONFIG } from '../config/gameConfig.js';

export class TerrainManager {
  constructor(scene) {
    this.scene = scene;
    this.terrain = null;
    this.flatZone = null;
    this.terrainTiles = [];
    this.voidCover = null;
  }

  setFlatZone(x, z, radius) {
    this.flatZone = { x, z, radius };
  }

  init() {
    // load grass texture for the ground
    const texture_loader = new THREE.TextureLoader();
    const grass_texture = texture_loader.load(TERRAIN_CONFIG.texture_path);
    grass_texture.wrapS = THREE.RepeatWrapping;
    grass_texture.wrapT = THREE.RepeatWrapping;
    grass_texture.repeat.set(
      TERRAIN_CONFIG.texture_repeat,
      TERRAIN_CONFIG.texture_repeat
    );

    // create a plane to act as the ground
    const geometry = new THREE.PlaneGeometry(
      TERRAIN_CONFIG.size,
      TERRAIN_CONFIG.size,
      TERRAIN_CONFIG.segments,
      TERRAIN_CONFIG.segments
    );

    // displace vertices to create a wavy ground
    const vertices = geometry.vertices;
    const arenaCenter = this.flatZone || { x: 0, z: 0, radius: 0 };
    for (let i = 0; i < vertices.length; i++) {
      const vertex = vertices[i];
      const world_x = vertex.x;
      const world_z = vertex.y;

      const dx = world_x - arenaCenter.x;
      const dz = world_z + arenaCenter.z;
      const distanceToArena = Math.sqrt(dx * dx + dz * dz);

      if (distanceToArena < arenaCenter.radius) {
        // keep the arena area flat
        vertex.z = 1.5;
      } else {
        const height = Math.sin(world_x * 0.1) * Math.cos(world_z * 0.1) * 2 +
          Math.sin(world_x * 0.05) * 1.5 +
          Math.random() * 0.5;
        vertex.z = height;
      }
    }

    geometry.verticesNeedUpdate = true;
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      map: grass_texture,
      color: 0x244a27,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
      // shader patch: discard terrain fragments under the arena mesh
      onBeforeCompile: (shader) => {
        shader.uniforms.arenaCenter = { value: new THREE.Vector2(arenaCenter.x, arenaCenter.z) };
        shader.uniforms.arenaRadius = { value: arenaCenter.radius };

        shader.vertexShader = shader.vertexShader.replace(
          '#include <common>',
          `
          #include <common>
          varying vec3 vWorldPos;
          `
        );

        shader.vertexShader = shader.vertexShader.replace(
          '#include <worldpos_vertex>',
          `
          #include <worldpos_vertex>
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `
          #include <common>
          uniform vec2 arenaCenter;
          uniform float arenaRadius;
          varying vec3 vWorldPos;
          `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `
          #include <dithering_fragment>
          float distToArena = length(vec2(vWorldPos.x, vWorldPos.z) - arenaCenter);
          if (distToArena < arenaRadius - 0.5) {
            discard;
          }
          `
        );
      }
    });

    this.terrain = new THREE.Mesh(geometry, material);
    this.terrain.rotation.x = -Math.PI / 2;
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);

    this.createTerrainTiles();
    this.createVoidCover();
    console.log('terrain created');
  }

  createVoidCover() {
    if (!VOID_COVER_CONFIG || !Number.isFinite(TERRAIN_CONFIG.size)) return;

    const sizeMultiplier = Number.isFinite(VOID_COVER_CONFIG.size_multiplier)
      ? VOID_COVER_CONFIG.size_multiplier
      : 4;
    const coverSize = TERRAIN_CONFIG.size * sizeMultiplier;
    const coverHeight = Number.isFinite(VOID_COVER_CONFIG.height) ? VOID_COVER_CONFIG.height : -6;
    const coverOpacity = Number.isFinite(VOID_COVER_CONFIG.opacity) ? VOID_COVER_CONFIG.opacity : 0.9;
    const coverColor = typeof VOID_COVER_CONFIG.color === 'number' ? VOID_COVER_CONFIG.color : 0x1a1a1a;

    const coverGeometry = new THREE.PlaneGeometry(coverSize, coverSize, 1, 1);
    const coverMaterial = new THREE.MeshBasicMaterial({
      color: coverColor,
      transparent: coverOpacity < 1,
      opacity: coverOpacity,
      depthWrite: false,
      fog: true,
      side: THREE.DoubleSide
    });

    this.voidCover = new THREE.Mesh(coverGeometry, coverMaterial);
    this.voidCover.rotation.x = -Math.PI / 2;
    this.voidCover.position.y = coverHeight;
    this.voidCover.renderOrder = -900;
    this.scene.add(this.voidCover);
  }

  update(playerPosition) {
    if (!this.voidCover || !playerPosition) return;
    this.voidCover.position.x = playerPosition.x;
    this.voidCover.position.z = playerPosition.z;
  }

  createTerrainTiles() {
    this.terrainTiles = [];
    if (!this.terrain) return;

    const size = TERRAIN_CONFIG.size;
    const offsets = [-1, 0, 1];

    for (const ox of offsets) {
      for (const oz of offsets) {
        if (ox === 0 && oz === 0) continue;
        const tile = this.terrain.clone();
        tile.position.x = ox * size;
        tile.position.z = oz * size;
        this.scene.add(tile);
        this.terrainTiles.push(tile);
      }
    }
  }

  getTerrain() {
    return this.terrain;
  }

  getTerrainHeight(x, z) {
    if (this.flatZone) {
      const dx = x - this.flatZone.x;
      const dz = z - this.flatZone.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < this.flatZone.radius) {
        return 0.2;
      }
    }

    // use the same formula as the displaced vertices but without randomness
    const height = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2 +
      Math.sin(x * 0.05) * 1.5;
    return height;
  }
}