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
    intensity: 1
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
  // used by `terrainmanager` to keep the arena zone flat
  flat_zone_radius: 35,
  // used by `vegetationmanager` to keep the area clear
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

export const FROG_CONFIG = {
  // model
  path: './resources/quest_givers/cartoon-frog/',
  model: 'source/test03.fbx',
  texture: './resources/quest_givers/cartoon-frog/textures/all_texture02.png',
  ao_texture: './resources/quest_givers/cartoon-frog/textures/ao02.png',
  // if `desired_height` is set, we auto-scale the model to that height
  // `scale` then works as a small multiplier
  desired_height: 1.1,
  scale: 1.0,

  // placement
  position: { x: 30, z: 30 },
  height_offset: 0,
  rotation_y: Math.PI,
  safe_clear_distance: 10,

  // detection + interaction
  detection_distance: 18,
  interaction_distance: 5,

  // behavior
  look_at_player: true,
  look_turn_speed: 6.5,
  // some models have a different forward axis
  facing_yaw_offset: Math.PI,

  // quest marker
  quest_marker: {
    gltf: './resources/quest_givers/quest_marker/scene.gltf',
    scale: 0.2,
    height_offset: 0.25
  },

  // ui
  ui: {
    frame_default: './resources/ui/Text_Frog.png',
    frog_portrait: './resources/ui/Sapo.png'
  },

  // dialogue
  typewriter_ms: 22,
  dialogue_lines: [
    { text: 'hey there!', bg: './resources/ui/Text_Frog.png' },
    { text: "uh... i don't think i've ever seen a creature like you before.", bg: './resources/ui/Text_Frog.png' },
    { text: "either way... i'm lenny! lenny the frog ^^", bg: './resources/ui/Lenny.png' },
    { text: 'nice to meet you stranger-', bg: './resources/ui/Lenny.png' }
  ],

  // sfx
  sfx: {
    detect: './resources/sounds/gameplay/sfx/everything-else/NPCDetectsYou.mp3',
    detect_volume: 0.7,
    speak: './resources/sounds/gameplay/sfx/everything-else/frog-speak.mp3',
    speak_volume: 1.0
  }
};