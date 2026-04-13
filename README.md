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
- The main character - a fox. A few NPCs as quest givers (min 1). And a minimum of 2 bosses. (F)
- Quest giving/accepting/completion system. (F)
- Fight system and animations. (F)
- Inventory system. (F)
- The game has to be optimized to be able to run on a different variety of computers. (NF)
- A functional tutorial at the beginning of the game. (F)
- Day and night system. (F)
- Ambient music, combat music and SFX. (NF)
- Mini animated story to give context of the game, in the beginning of it. (NF)


F - Functional Requirements, NF - Non-Functional Requirements

# Project structure

```text
Vivarium/
├─ index.html
├─ package.json
├─ public/
│  └─ resources/
│     ├─ fox/                    # fox model, animations and VFX
│     ├─ ground/                 # terrain textures
│     │  ├─ sky/                 # day/night sky textures
│     │  └─ trees/               # vegetation models (glb/fbx + textures)
│     │     ├─ Rita/             # custom trees made by me (Tree_final.glb)
│     │     ├─ fantasy-x-tree-02/# tree set used as tree variant
│     │     └─ stylized-bush/    # bush fbx + textures
│     ├─ bosses/                 # (future) bosses and enemies (1 boss so far)
│     ├─ quest_givers/           # NPC models
│     ├─ ui/                     # ui sprites (hud icons, minimap frame, favicon, etc.)
│     └─ sounds/
│        ├─ intro/               # menu / intro music
│        ├─ gameplay/            # exploration music
│        └─ gameplay/sfx/        # ambience, fox sound, footsteps, etc.
│
└─ src/
   ├─ main.js                    # entry point and main loop; wires all managers and UI flow
   ├─ style.css                  # base styles so canvas and overlays fill the window
   │
   ├─ config/
   │  └─ gameConfig.js           # camera, scene, terrain, light and player config
   │
   ├─ core/
   │  ├─ GameClock.js            # timekeeping used by the day/night cycle
   │  ├─ SceneManager.js         # creates three.js scene, camera and renderer
   │  ├─ LightingManager.js      # directional and ambient lights
   │  └─ CinematicManager.js     # intro camera/fox cinematic before gameplay
   │
   ├─ world/
   │  ├─ SkyManager.js           # sky dome + day/night sky swapping
   │  ├─ TerrainManager.js       # wavy terrain with grass texture and height queries
   │  └─ VegetationManager.js    # trees, bushes, colliders and frustum‑culling registration
   │
   ├─ camera/
   │  └─ CameraController.js     # third‑person camera orbiting around the fox
   │
   ├─ entities/
   │  └─ PlayerManager.js        # fox model, animations, movement, collisions and fox sounds
   │
   ├─ input/
   │  └─ InputManager.js         # keyboard input (WASD, arrows, Shift)
   │
   ├─ audio/
   │  └─ AudioManager.js         # menu music, gameplay music and forest ambience
   │
   └─ ui/
      ├─ CreditsIntroScreen.js   # lil intro
      ├─ HUDManager.js           # in-game hud (minimap, backpack, bars, settings)
      ├─ PlayScreen.js           # full‑screen PLAY button before heavy loading
      ├─ MainMenu.js             # Vivarium main menu (New / Load / Quit + credits)
      ├─ LoadingScreen.js        # 3D fox loading screen with progress
      └─ IntroScreen.js          # black overlay used as transition into the cinematic
```

---

# How to run

Github pages:

https://anasantos05.github.io/ICG-Vivarium/

Or, clone repo and:

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
Image from the very beginning of the game:

<img width="1920" height="1080" alt="Screenshot from 2026-03-20 20-52-28" src="https://github.com/user-attachments/assets/3efacfa0-c8f6-4f52-87bf-533d4a400e71" />

---
Short video of the state of the game:

https://github.com/user-attachments/assets/7fd9c0f2-5bc0-4a00-8c90-22840a783dbb

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

https://github.com/user-attachments/assets/0603efb1-4f04-4ca9-89c2-b2958c2db43e

---

Short video of the state of the game:
- I made it so that the unloading radius was bigger so that the unloading for optimization wasn't so noticable

https://github.com/user-attachments/assets/9aee8ee3-68d3-4460-b26f-8b510c325b0a

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

https://github.com/user-attachments/assets/0cd6c628-737b-4b81-8e1d-0b7f1dedc1a8

---

### 2026‑03‑28

- added the in-game hud (minimap frame + minimap canvas, backpack button, health/stamina bars, settings icon)
- updated the minimap so the player stays centered and the world scrolls around them
- replaced the minimap player dot with the fox icon (`public/resources/ui/fox_icon.svg`)
- hide the hud during the intro cinematic and only show it after the cinematic ends
- added my custom tree model `public/resources/ground/trees/Rita/Tree_final.glb` and wired it as `TREE_CONFIG`
- fixed a crash caused by loading the same tree model many times by loading once and cloning for instances
- spawn two tree variants (`TREE_CONFIG` + `TREE2_CONFIG`) with spacing, and drive minimap tree markers from real colliders

- added a day/night cycle system:
  - created `src/core/GameClock.js` (10 min full cycle) with smooth `getNightAmount()` blending
  - created `src/world/SkyManager.js` sky dome that swaps day/night textures and follows the player
  - updated `src/core/LightingManager.js` to lerp sun/ambient/player lights into moonlight at night
  - wired the update in `src/main.js` so the cycle runs during menus, cinematic, and gameplay

### Commits

4713552 - added day and night feature

74ed02a - removed old stuff

48b5702 - map in ui

551791a - I modeled a tree in blended, put it there in the game


---

Me creating the tree model (low poly) in Blender:

<img width="1920" height="1080" alt="Screenshot from 2026-03-27 14-47-55" src="https://github.com/user-attachments/assets/b3c9d396-31c8-4028-ba15-9a819966201a" />
<img width="1920" height="1080" alt="Screenshot from 2026-03-27 14-50-41" src="https://github.com/user-attachments/assets/3da0c462-724b-4394-8762-80083537865a" />

---

Short video of the state of the game:

https://github.com/user-attachments/assets/e6faa199-a633-4ade-b479-858c7490a725

---

Day/Night feature:

<img width="1920" height="1080" alt="Screenshot from 2026-03-28 18-20-55" src="https://github.com/user-attachments/assets/ebdeaf5a-8066-4b13-ac9b-2948e07b52e6" />
<img width="1920" height="1080" alt="Screenshot from 2026-03-28 18-34-13" src="https://github.com/user-attachments/assets/03da57eb-0b3a-49e3-96aa-6e20685ade08" />

### 2026‑04‑2

- added a Boss (placeholder, I will change it later with a model that I create)
- added an arena
- made the boss be activated whenever the player entered the ring (combat music activates as well), made it despawn whenever the main character leaved the arena (combat music fades)
- put the ui of the healthbar of the boss there (still static)
- played arround with the combat animations that the boss had in the model

### Commits

de88e49 - added boss, arena, boss on minimap and combat animation

### 2026‑04‑4

- added an NPC - a frog. It will be one of the quest givers.
- I put the dialogue working (static for now until quests are available) with a character sprite.
- Also, made it appear on the minimap
- sound queues and dialogue sounds
- quest mark above it
- made it turn to the player if the player is near and then, when the player is not in that radius, it will look to a default point, so it's not that creepy :P

### Commits

dde300a - npc frog added, quick dialogue, plus it appearing on the minimap

### 2026‑04‑7

- I made the tutorial key design on Figma and animated it using kdenlive
- put it at the beginning of the game -> it can be visited in the settings later
- I modeled a new NPC - a duck - using blender.

### Commits

8de62e5 - Tutorial added
83ceb2f - New NPC added- a duckie, extra stuff

---

Me creating the model of the duck NPC (in Blender):

<img width="1920" height="1080" alt="Screenshot from 2026-04-07 14-13-18" src="https://github.com/user-attachments/assets/83e96970-7a7c-4776-ab04-fbaa4943396f" />

<img width="1920" height="1080" alt="Screenshot from 2026-04-07 14-18-37" src="https://github.com/user-attachments/assets/f277f351-4f82-4752-acff-3e0303be9740" />

<img width="1920" height="1080" alt="Screenshot from 2026-04-07 18-29-42" src="https://github.com/user-attachments/assets/e07cb2e3-8374-4b23-8e78-d80d8a4db428" />

<img width="1920" height="1080" alt="Screenshot from 2026-04-07 18-59-23" src="https://github.com/user-attachments/assets/f750c7c0-ae4f-421f-9de8-bf20eca3eb89" />

<img width="1920" height="1080" alt="Screenshot from 2026-04-07 19-04-18" src="https://github.com/user-attachments/assets/aa29d9d9-055e-41c2-84d6-fa7d6a571e6d" />

<img width="723" height="422" alt="Screenshot from 2026-04-07 20-06-21" src="https://github.com/user-attachments/assets/8bb7bc5a-53ba-4994-bf20-33521cc4efe2" />

---

### 2026-04-12

- I drew the character sprites for the new NPC, the duck

### Commits

1f8d0a1 - fixed dialogue

---

Short video of the state of the game:

https://github.com/user-attachments/assets/4f35019a-4ef1-4f60-a3bc-000bf61b36ec

---
