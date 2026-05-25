export const CAMERA_CONFIG = {
  FOV: 60,
  NEAR: 1,
  FAR: 2000,
  INITIAL_POSITION: { x: 0, y: 5, z: 10 }
};

export const SCENE_CONFIG = {
  // sky color used for the clear background
  BACKGROUND_COLOR: 0x87ceeb,
  FOG_COLOR: 0x3b2a57,
  FOG_DENSITY: 0.008,
  FOG_NEAR: 30,
  FOG_FAR: 160
};

export const TERRAIN_CONFIG = {
  // base size and resolution of the ground
  size: 400,
  segments: 200,
  // how many times the grass texture repeats across the plane
  texture_repeat: 100,
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

export const COLLISION_CONFIG = {
  // shrink the fox box so it doesn't collide with thin air
  player_box_shrink: 0.35,
  // shrink tree/bush boxes so only the trunk-ish area blocks
  collider_box_shrink: 0.6,
  // extra padding for the broad-phase distance check
  broadphase_pad: 1
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
  count: 55,
  scale: 1,
  path: './resources/ground/trees/Rita/',
  model: 'TreeGhibliComplete.glb',
  fallback_model: 'Tree3.glb',
  collision_radius: 1.4,
  spawn_area: 360,
  color_multiplier: 1.1,
  desired_height: 14
};

export const TREE_CONFIG = {
  count: 30,
  scale: 1,
  path: './resources/ground/trees/Rita/',
  model: 'Tree_final.glb',
  collision_radius: 1.0,
  spawn_area: 360,
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
  spawn_area: 360
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

export const SLIME_ARENA_CONFIG = {
  center: { ...ARENA_CONFIG.center },
  radius: ARENA_CONFIG.radius,
  wake_radius: ARENA_CONFIG.wake_radius,
  flat_zone_radius: ARENA_CONFIG.flat_zone_radius,
  vegetation_clearance: ARENA_CONFIG.vegetation_clearance
};

export const COMBAT_CONFIG = {
  q_cooldown: 2.8,
  r_cooldown: 1.0,
  // r locks to the boss only if the boss is close enough
  r_lock_radius: 40,
  // player -> boss damage rules
  player_tail_damage: 42,
  player_paws_damage: 30,
  player_tail_range: 8.5,
  player_paws_range: 38,
  player_attack_arc_dot: 0.18,
  player_projectile_dot: -0.2,
  // boss combat tuning
  boss_max_health: 320,
  boss_activation_radius: 40,
  boss_aggro_range: 30,
  boss_attack_cooldown: 3.2,
  boss_attack_windup_ratio: 0.55,
  boss_attack_anim_speed: 0.92,
  boss_max_defeats: 3,
  boss_respawn_delay: 3.8,
  boss_injured_idle_ratio: 0.35,
  boss_slash_damage: 12,
  boss_slash_range: 7.8,
  boss_front_arc_dot: 0.16,
  boss_spell_damage: 15,
  boss_spell_range: 20,
  boss_warning_flash_speed: 12,
  boss_warning_height_offset: 0.9,
  boss_area_damage: 18,
  boss_area_range: 9.5,
  boss_spell_vfx_speed: 20,
  player_damage_invuln: 1.15,
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
    { text: 'careful, fox. the slime is lilith\'s pet - defeat it before you reach her.', bg: './resources/ui/Lenny.png' }
  ],

  // sfx
  sfx: {
    detect: './resources/sounds/gameplay/sfx/everything-else/NPCDetectsYou.mp3',
    detect_volume: 0.7,
    speak: './resources/sounds/gameplay/sfx/everything-else/frog-speak.mp3',
    speak_volume: 1.0
  }
};

export const DUCK_CONFIG = {
  // model
  path: './resources/quest_givers/duck/',
  model: 'chick2.glb',
  // if `desired_height` is set, we auto-scale the model to that height
  // `scale` then works as a small multiplier
  desired_height: 1.1,
  scale: 2.0,

  // ui
  ui: {
    frame_default: './resources/ui/Peep.png',
    frog_portrait: './resources/ui/Chick.png'
  },

  // dialogue
  dialogue_lines: [
    { text: 'Peep!' },
    { text: "Hi fox! I'm Peep! If you're ready, we can plan how to face Lilith." }
  ],

  // placement
  position: { x: -20, z: 70 },
  height_offset: 0,
  rotation_y: 0,
  safe_clear_distance: 8,

  // detection + interaction
  detection_distance: 18,
  interaction_distance: 5,

  // behavior
  look_at_player: true,
  look_turn_speed: 6.5,
  // chick2.glb forward axis needs a yaw correction to face the player
  facing_yaw_offset: -Math.PI / 2,

  // quest marker (reuse the same asset)
  quest_marker: {
    gltf: './resources/quest_givers/quest_marker/scene.gltf',
    scale: 0.2,
    height_offset: 0.25
  }
};

export const ITEMS_CONFIG = {
  health_potion: {
    id: 'health_potion',
    name: 'health potion',
    icon: './resources/inventory/both/health.png',
    stackable: true,
    lore: 'a warm brew that seals wounds and calms the heart.'
  },
  slime_orb: {
    id: 'slime_orb',
    name: 'slime orb',
    icon: './resources/inventory/orb_boss/orb_blood.png',
    stackable: false,
    lore: 'a sticky orb pulsing with the slime guard essence.'
  },
  slime_blood: {
    id: 'slime_blood',
    name: 'slime blood',
    icon: './resources/inventory/orb_boss/orb_fang.png',
    stackable: false,
    lore: 'a viscous drop that keeps wobbling inside the vial.'
  },
  slime_tear: {
    id: 'slime_tear',
    name: 'slime tear',
    icon: './resources/inventory/orb_boss/orb_tear.png',
    stackable: false,
    lore: 'a gelatinous tear that reflects the moonlight.'
  },
  // legacy aliases for backward-compatible saves
  lilith_orb: {
    id: 'lilith_orb',
    name: 'slime orb',
    icon: './resources/inventory/orb_boss/orb_blood.png',
    stackable: false,
    lore: 'a sticky orb pulsing with the slime guard essence.'
  },
  lilith_blood: {
    id: 'lilith_blood',
    name: 'slime blood',
    icon: './resources/inventory/orb_boss/orb_fang.png',
    stackable: false,
    lore: 'a viscous drop that keeps wobbling inside the vial.'
  },
  lilith_tear: {
    id: 'lilith_tear',
    name: 'slime tear',
    icon: './resources/inventory/orb_boss/orb_tear.png',
    stackable: false,
    lore: 'a gelatinous tear that reflects the moonlight.'
  },
  bunny_orb: {
    id: 'bunny_orb',
    name: 'slime orb',
    icon: './resources/inventory/orb_boss/orb_blood.png',
    stackable: false,
    lore: 'a sticky orb pulsing with the slime guard essence.'
  },
  bunny_blood: {
    id: 'bunny_blood',
    name: 'slime blood',
    icon: './resources/inventory/orb_boss/orb_fang.png',
    stackable: false,
    lore: 'a viscous drop that keeps wobbling inside the vial.'
  },
  bunny_tear: {
    id: 'bunny_tear',
    name: 'slime tear',
    icon: './resources/inventory/orb_boss/orb_tear.png',
    stackable: false,
    lore: 'a gelatinous tear that reflects the moonlight.'
  },
  orb_blood: {
    id: 'orb_blood',
    name: 'orb blood',
    icon: './resources/inventory/orb_boss/orb_blood.png',
    stackable: false,
    lore: 'liquid light trapped in a fragile shell.'
  },
  orb_fang: {
    id: 'orb_fang',
    name: 'orb fang',
    icon: './resources/inventory/orb_boss/orb_fang.png',
    stackable: false,
    lore: 'a cold fang that still echoes the orb roar.'
  },
  orb_tear: {
    id: 'orb_tear',
    name: 'orb tear',
    icon: './resources/inventory/orb_boss/orb_tear.png',
    stackable: false,
    lore: 'a shimmering tear that never evaporates.'
  },
  end_key: {
    id: 'end_key',
    name: 'wooden key',
    icon: './resources/inventory/end_of_game/key.png',
    stackable: false,
    lore: 'a weathered key carved with forest runes.'
  }
};

export const DOOR_CONFIG = {
  model: './resources/end/wooden_door.glb',
  scale: 2.4,
  position: { x: 80, z: -50 },
  rotation_y: Math.PI * 0.5,
  interaction_distance: 5,
  collision_radius: 3.5
};
