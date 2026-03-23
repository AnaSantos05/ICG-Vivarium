# Vivarium

![vivarium logo](./Vivarium/public/resources/ui/vivarium%20logo.png)

I present Vivarium, a cozy RPG featuring a cute fox as the main character. I love foxes and I think they would be great
for RPGs! Also, I’m very inspired by Spirit of The North game which I’ve played before. Where a fox discovers beautiful
scenery and has to solve puzzles.​ Vivarium is inspired by it, but different; The fox character has the ability to fight and defeat monsters. Like the most common RPGs, there is a quest system, from the characters the Fox finds along his journey. Those quests involve having to fight some sort of bosses and creatures.

- 3D game prototype for the ICG course, built with **three.js** and **Vite**.

---

# Requirements

Requirements, ordered by priority:
- A big world with a Minimap on UI. (F)

- ​ The main character - a fox. A few NPCs as quest givers (min 1). And a minimum of 2 bosses. (F)

- Quest giving/accepting/completion system. (F)

 - Fight system and animations. (F)

- ​ Inventory system. (F)

- ​ Day and night system. (F)

- ​ Ambient music, combat music and SFX. (NF)

- Mini animated story to give context of the game, in the beginning of it. (NF)

F - Functional Requirements, NF - Non-Functional Requirements

# Project structure

```text
Vivarium/
├─ index.html
├─ package.json
├─ public/
│  └─ resources/
│     ├─ fox/                   # fox model, animations and VFX
│     ├─ ground/                # terrain textures
│     ├─ bosses/                # (future) bosses and enemies
│     ├─ quest_givers/          # (future) NPC models
│     └─ sounds/
│        ├─ intro/              # menu / intro music
│        ├─ gameplay/           # exploration music
│        └─ gameplay/sfx/       # ambience, fox sound, footsteps, etc.
│
└─ src/
   ├─ main.js                   # entry point and main loop; wires all managers and UI flow
   ├─ style.css                 # base styles so canvas and overlays fill the window
   │
   ├─ config/
   │  └─ gameConfig.js          # camera, scene, terrain, light and player config
   │
   ├─ core/
   │  ├─ SceneManager.js        # creates three.js scene, camera and renderer
   │  ├─ LightingManager.js     # directional and ambient lights
   │  └─ CinematicManager.js    # intro camera/fox cinematic before gameplay
   │
   ├─ world/
   │  ├─ TerrainManager.js      # wavy terrain with grass texture and height queries
   │  └─ VegetationManager.js   # trees, bushes, colliders and frustum‑culling registration
   │
   ├─ camera/
   │  └─ CameraController.js    # third‑person camera orbiting around the fox
   │
   ├─ entities/
   │  └─ PlayerManager.js       # fox model, animations, movement, collisions and fox sounds
   │
   ├─ input/
   │  └─ InputManager.js        # keyboard input (WASD, arrows, Shift)
   │
   ├─ audio/
   │  └─ AudioManager.js        # menu music, gameplay music and forest ambience
   │
   └─ ui/
      ├─ CreditsIntroScreen.js  # "Game by Ana Santos" intro
      ├─ PlayScreen.js          # full‑screen PLAY button before heavy loading
      ├─ MainMenu.js            # Vivarium main menu (New / Load / Quit + credits)
      ├─ LoadingScreen.js       # 3D fox loading screen with progress
      └─ IntroScreen.js         # black overlay used as transition into the cinematic
```

---

# How to run

```bash
# install dependencies
npm install

# start dev server
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

---

# Gameplay

## Current controls

- **Movement**
  - `W` / `S` – move the fox forward and backward
  - `A` / `D` – rotate the fox left and right
  - `Shift` – sprint

- camera
  - arrow keys rotate and tilt the camera around the fox
  - when the fox rotates with `a` / `d` the camera follows his rotation

## Performance / optimizations

- Trees and bushes are registered in `SceneManager` for frustum culling.
- Objects that are far outside the camera view are hidden and stop casting shadows.
- This keeps the scene lighter while moving around the world.

---

## Development log (summary)

All dates are in `yyyy‑mm‑dd` format.

### 2026‑03‑20

- created a `vivarium` project using vite and three.js
- set up `scenemanager` with perspective camera and blue sky background
- added `lightingmanager` with directional light (sun) and ambient light based on `light_config`
- added `terrainmanager` with flat plane and grass texture from `public/resources/ground`
- added a lot of resources that I had previously researched, such as audios, 3D models and drawings/UI made by me
- imported fox model and textures into `playermanager`
- set up `animationmixer` for idle and movement animations
- implemented `inputmanager` for wasd movement and sprint
- implemented third person `cameracontroller`:
  - camera orbits around the player
  - arrow keys adjust camera angle
  - camera follows fox rotation when using `a` and `d`
- cleaned basic styles so the canvas fills the window

### Commits
4d1fb08 - initial commit

95dde48 - basic illumination, ground and sky, also camera movement by mouse

c9d4d47 - Resources added

56bc061 - better lighting and texture. Main character and character movements

---
Short video of the state of the game:

https://github.com/user-attachments/assets/f60f9c20-d4d4-457f-b5f5-0a7c065cfee9

---

### 2026‑03‑21

- made the ground wavy in `terrainmanager`
- added `vegetationmanager` with trees and bushes scattered on the terrain
- wired trees and bushes into `scenemanager` frustum culling so far away objects are unloaded
- tuned camera height so it never goes under the terrain
- fixed the Shift problem

### Commits

f545930 - added wavy terrain, vegetation and camera tweaks. Optimization and Shift key fix

---
Noticing the optimization - things that the camera cannot see are unloaded:

https://github.com/user-attachments/assets/f4cb82f4-77cb-48ac-ad08-3967c650881b

---

Short video of the state of the game:
- I made it so that the unloading radius was bigger so that the unloading for optimization wasn't so noticable

https://github.com/user-attachments/assets/e4d05c88-d464-456b-b648-c915540ed4ec

---

### 2026‑03‑22

- Implemented the **LoadingScreen** with the 3D fox floating and a loading bar.
- Created the **CinematicManager** for the intro where the camera starts on the side and moves behind the fox while she runs.
- Added the black transition screen (**IntroScreen**) to hide visual pops when the cinematic starts.
- Recreated the full UI flow: **CreditsIntroScreen** (Author, me) -> **PlayScreen** (PLAY button) → **MainMenu** (New Game / Load Game / Quit + Credits).
- Implemented the **AudioManager** with menu music, forest gameplay music and ambient forest SFX.
- Re‑enabled occasional **fox vocalisation sounds** while the fox moves.

### Commits

e8e6af8 - loading screen
ccab796 - I created an intro animation
e26903f - Initial menu + sounds and music

---

Short video of the state of the game:

https://github.com/user-attachments/assets/b90f58b4-3b88-4018-af7f-148ff2bfe6c8
