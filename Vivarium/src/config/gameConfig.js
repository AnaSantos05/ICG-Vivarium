export const CAMERA_CONFIG = {
  FOV: 60,
  NEAR: 1,
  FAR: 1000,
  INITIAL_POSITION: { x: 0, y: 5, z: 10 }
};

export const SCENE_CONFIG = {
  // sky color used for the clear background
  BACKGROUND_COLOR: 0x87ceeb
};

export const TERRAIN_CONFIG = {
  // base size and resolution of the ground
  size: 200,
  segments: 100,
  // how many times the grass texture repeats across the plane
  texture_repeat: 50,
  // path to the main grass texture
  texture_path: './resources/ground/texture.jpg'
};

export const CAMERA_CONTROL_CONFIG = {
  INITIAL_DISTANCE: 15,
  INITIAL_HEIGHT: 5,
  MIN_DISTANCE: 5,
  MAX_DISTANCE: 50,
  MIN_VERTICAL_ANGLE: -Math.PI / 3,
  MAX_VERTICAL_ANGLE: Math.PI / 3,
  MOUSE_SENSITIVITY: 0.005,
  ZOOM_SPEED: 2
};

export const PLAYER_CONFIG = {
  SCALE: 0.15,
  MOVE_SPEED: 12,
  SPRINT_SPEED: 36,
  ROTATION_SPEED: 3,
  MODEL_PATH: './resources/fox/',
  MODEL_FILE: 'Fox.fbx'
};

export const LIGHT_CONFIG = {
  // main sun light
  directional: {
    color: 0xff8da1,
    intensity: 3,
    position: { x: 50, y: 50, z: 50 },
    shadow_map_size: 2048,
    shadow_camera_size: 100
  },
  // soft fill light for the whole scene
  ambient: {
    color: 0xff8da1,
    intensity: 3
  },
  // point light that follows the player (mostly noticeable at night)
  player: {
    color: 0xffffff,
    intensity: 1.2,
    distance: 20
  }
};

export const TREE2_CONFIG = {
  count: 50,
  scale: 20,
  path: './resources/ground/trees/fantasy-x-tree-02/',
  model: 'source/Copilot3D-1dbad8d3-e8ba-405f-b341-6fdbe9aa879f.glb',
  collision_radius: 2,
  spawn_area: 180,
  color_multiplier: 1.25
};

export const TREE_CONFIG = {
  count: 50,
  scale: 1,
  path: './resources/ground/trees/Rita/',
  model: 'Tree_final.glb',
  collision_radius: 1.2,
  spawn_area: 180,
  position: { y: 0 },
  color_multiplier: 0.65
};

export const BUSH_CONFIG = {
  count: 30,
  min_scale: 0.02,
  max_scale: 0.03,
  path: './resources/ground/trees/stylized-bush/source/stylized bush/',
  model: 'stylized bush.fbx',
  texture: './resources/ground/trees/stylized-bush/source/stylized bush/9.png',
  spawn_area: 180
};

export const ARENA_CONFIG = {
  center: { x: -60, z: -60 },
  radius: 35,
  wake_radius: 40,
  // used by `TerrainManager` to keep the arena zone flat
  flat_zone_radius: 35,
  // used by `VegetationManager` to keep the area clear
  vegetation_clearance: 10
};

export const COMBAT_CONFIG = {
  q_cooldown: 1.2,
  r_cooldown: 1.0,
  // r locks to the boss only if the boss is close enough
  r_lock_radius: 40,
  // projectile
  r_projectile_speed: 45,
  r_projectile_lifetime: 1.25,
  // vfx
  shockwave_lifetime: 0.55,
  claw_arc_lifetime: 0.35
};