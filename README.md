# Vivarium

![vivarium logo](./Vivarium/public/resources/ui/vivarium%20logo.png)

I present Vivarium, a cozy RPG featuring a cute fox as the main character. I love foxes and I think they would be great
for RPGs! Also, I’m very inspired by Spirit of The North game which I’ve played before. Where a fox discovers beautiful
scenery and has to solve puzzles.​ Vivarium is inspired by it, but different; The fox character has the ability to fight and defeat monsters. Like the most common RPGs, there is a quest system, from the characters the Fox finds along his journey. Those quests involve having to fight some sort of bosses and creatures.

- 3D game prototype for ICG course, built with three.js and vite.

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
vivarium/
├─ public/
│  └─ resources/
│     ├─ fox/
│     ├─ ground/
│     ├─ bosses/
│     ├─ quest_givers/
│     └─ sounds/
│
├─ src/
   ├─ main.js                  # entry point, creates scene, lighting, terrain, player and loop
   │
   ├─ config/
   │  └─ gameConfig.js         # camera, scene, terrain, light and player config
   │
   ├─ core/
   │  ├─ SceneManager.js       # creates three.js scene, camera and renderer
   │  └─ LightingManager.js    # directional and ambient lights
   │
   ├─ world/
   │  └─ TerrainManager.js     # flat ground plane with grass texture
   │
   ├─ camera/
   │  └─ CameraController.js   # third person camera around the player
   │
   ├─ entities/
   │  └─ PlayerManager.js      # fox player model, animations and movement logic
   │
   ├─ input/
   │  └─ InputManager.js       # keyboard input (wasd, arrows, shift)
   │
   └─ style.css                # simple styles so canvas fills the window
```

---

# How to run

```bash
# install dependencies
npm install

# start dev server
npm run dev
```
then, open the url shown in the terminal (usually http://localhost:5173).

---

# Gameplay

## Current controls

- movement
  - `w` / `s` move the fox forward and backward
  - `a` / `d` rotate the fox left and right
  - `shift` holds sprint

- camera
  - arrow keys rotate and tilt the camera around the fox
  - when the fox rotates with `a` / `d` the camera follows his rotation

---

# Development log

## Implementation

all dates are in yyyy‑mm‑dd format.

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

<video width="800" height="450" controls>
  <source src="./Vivarium/docs/20-03-2026.webm" type="video/webm">
  <source src="./Vivarium/docs/20-03-2026.mp4" type="video/mp4">
  your browser does not support the video tag.
</video>


---


