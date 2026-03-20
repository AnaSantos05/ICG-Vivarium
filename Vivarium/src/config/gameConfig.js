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
  MOVE_SPEED: 20,
  SPRINT_SPEED: 40,
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
  }
};