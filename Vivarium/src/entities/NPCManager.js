import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import { FROG_CONFIG, DUCK_CONFIG } from '../config/gameConfig.js';

export class NPCManager {
  constructor(scene, terrainManager, vegetationManager) {
    this.scene = scene;
    this.terrainManager = terrainManager;
    this.vegetationManager = vegetationManager;

    this.frog = null;
    this.duck = null;

    this.exclamationMark = null;
    this.duckExclamationMark = null;

    this.frogBaseYaw = 0;
    this.duckBaseYaw = 0;

    this.frog_height = 1;
    this.duck_height = 1;

    this.wasPlayerDetected = false;
    this.wasDuckPlayerDetected = false;
    this.isPlayerInInteractionRange = false;
    this.isDialogueOpen = false;

    this.activeNpcKey = 'frog';

    this.interactionPrompt = null;
    this.dialogueContainer = null;
    this.frogImage = null;
    this.dialogueText = null;
    this.continuePrompt = null;

    this.isTyping = false;
    this.typewriterTimer = null;

    this.detectionSound = new Audio(FROG_CONFIG.sfx.detect);
    this.detectionSound.volume = FROG_CONFIG.sfx.detect_volume;

    this.frogSpeakSound = new Audio(FROG_CONFIG.sfx.speak);
    this.frogSpeakSound.volume = FROG_CONFIG.sfx.speak_volume;

    this.dialogueData = Array.isArray(FROG_CONFIG.dialogue_lines) ? FROG_CONFIG.dialogue_lines : [];
    this.currentDialogueLine = 0;

    // when true, `line.bg` is respected; when false we force the npc default frame
    // (useful when we fall back to another npc's dialogue lines)
    this._useLineBackgrounds = true;

    this.onLoadCallback = null;

    this.createInteractionPrompt();
    this.createDialogueUI();
    this.loadExclamationMark();
  }

  getActiveNpcConfig() {
    return this.activeNpcKey === 'duck' ? DUCK_CONFIG : FROG_CONFIG;
  }

  getNpcFrameDefault(cfg) {
    return (cfg && cfg.ui && cfg.ui.frame_default) || (FROG_CONFIG && FROG_CONFIG.ui && FROG_CONFIG.ui.frame_default);
  }

  getNpcPortraitSrc(cfg) {
    const ui = (cfg && cfg.ui) || {};
    // historical naming: both configs use `frog_portrait` as the portrait key
    return ui.frog_portrait || ui.duck_portrait || ui.portrait || (FROG_CONFIG && FROG_CONFIG.ui && FROG_CONFIG.ui.frog_portrait);
  }

  getPosition() {
    return this.frog ? this.frog.position : null;
  }

  getMinimapNpcPositions() {
    // minimap only needs x/z, so just return the positions we have
    const positions = [];
    if (this.frog && this.frog.position) positions.push(this.frog.position);
    if (this.duck && this.duck.position) positions.push(this.duck.position);
    return positions;
  }

  init(onLoadCallback) {
    this.onLoadCallback = typeof onLoadCallback === 'function' ? onLoadCallback : null;
    this.loadFrog();
    this.loadDuck();
  }

  createInteractionPrompt() {
    this.interactionPrompt = document.createElement('div');
    this.interactionPrompt.style.position = 'fixed';
    this.interactionPrompt.style.left = '50%';
    this.interactionPrompt.style.top = '50%';
    this.interactionPrompt.style.transform = 'translate(-50%, 110px)';
    this.interactionPrompt.style.padding = '12px 18px';
    this.interactionPrompt.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.interactionPrompt.style.color = 'white';
    this.interactionPrompt.style.fontFamily = 'Arial, sans-serif';
    this.interactionPrompt.style.fontSize = '18px';
    this.interactionPrompt.style.fontWeight = 'bold';
    this.interactionPrompt.style.borderRadius = '10px';
    this.interactionPrompt.style.border = '2px solid #ffd700';
    this.interactionPrompt.style.zIndex = '2000';
    this.interactionPrompt.style.display = 'none';
    this.interactionPrompt.innerHTML = 'press <span style="color: #ffd700;">[e]</span> to interact';
    document.body.appendChild(this.interactionPrompt);
  }

  createDialogueUI() {
    const portraitBottomOffset = 'clamp(-50px, -3vh, -10px)';
    const dialogueBottomOffset = 'clamp(-420px, -26vh, -170px)';
    const portraitRightInset = 'clamp(10px, 1.5vw, 32px)';

    // pixel font
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // frog portrait behind the dialogue box
    this.frogImage = document.createElement('img');
    this.frogImage.src = FROG_CONFIG.ui.frog_portrait;
    this.frogImage.style.position = 'fixed';
    // keep it behind the frame and hugged to the right edge of the textbox
    // (the frame spans almost the full width of the viewport)
    this.frogImage.style.right = portraitRightInset;
    this.frogImage.style.bottom = portraitBottomOffset;
    // nudge left a bit and up so it peeks from behind the frame
    this.frogImage.style.transform = 'translate(-180px, -320px)';
    this.frogImage.style.width = '700px';
    this.frogImage.style.height = 'auto';
    this.frogImage.style.imageRendering = 'pixelated';
    this.frogImage.style.zIndex = '2000';
    this.frogImage.style.display = 'none';
    document.body.appendChild(this.frogImage);

    // main container using the dialogue frame image
    this.dialogueContainer = document.createElement('div');
    this.dialogueContainer.style.position = 'fixed';
    this.dialogueContainer.style.left = '50%';
    this.dialogueContainer.style.bottom = dialogueBottomOffset;
    this.dialogueContainer.style.transform = 'translateX(-50%)';
    this.dialogueContainer.style.width = '4900px';
    this.dialogueContainer.style.height = '1260px';
    this.dialogueContainer.style.backgroundImage = `url(${FROG_CONFIG.ui.frame_default})`;
    this.dialogueContainer.style.backgroundSize = 'contain';
    this.dialogueContainer.style.backgroundRepeat = 'no-repeat';
    this.dialogueContainer.style.backgroundPosition = 'center';
    this.dialogueContainer.style.imageRendering = 'pixelated';
    this.dialogueContainer.style.display = 'none';
    this.dialogueContainer.style.zIndex = '2001';
    this.dialogueContainer.style.fontFamily = '"Press Start 2P", monospace';
    this.dialogueContainer.style.pointerEvents = 'none';

    const textWrapper = document.createElement('div');
    textWrapper.style.position = 'absolute';
    // keep dialogue text centered and away from the frame edges
    // (also stays above the hp/stamina hud bars)
    textWrapper.style.left = '50%';
    // place text higher inside the frame
    textWrapper.style.bottom = 'clamp(320px, 18vh, 440px)';
    textWrapper.style.transform = 'translateX(-50%)';
    textWrapper.style.width = 'clamp(620px, 58vw, 1100px)';
    textWrapper.style.boxSizing = 'border-box';
    textWrapper.style.padding = '0 64px';
    textWrapper.style.display = 'flex';
    textWrapper.style.flexDirection = 'column';
    textWrapper.style.justifyContent = 'flex-start';
    textWrapper.style.alignItems = 'center';

    this.dialogueText = document.createElement('div');
    this.dialogueText.style.color = 'white';
    this.dialogueText.style.fontSize = '26px';
    this.dialogueText.style.lineHeight = '2.2';
    this.dialogueText.style.textShadow = '3px 3px 0px #000';
    this.dialogueText.style.textAlign = 'center';
    this.dialogueText.style.maxWidth = '100%';
    this.dialogueText.style.whiteSpace = 'normal';
    this.dialogueText.style.wordWrap = 'break-word';
    this.dialogueText.style.overflowWrap = 'break-word';

    this.continuePrompt = document.createElement('div');
    this.continuePrompt.style.color = '#ffd700';
    this.continuePrompt.style.fontSize = '18px';
    this.continuePrompt.style.textAlign = 'center';
    this.continuePrompt.style.marginTop = '80px';
    this.continuePrompt.style.textShadow = '2px 2px 0px #000';
    this.continuePrompt.style.visibility = 'hidden';
    this.continuePrompt.textContent = 'press [e] to continue...';

    textWrapper.appendChild(this.dialogueText);
    textWrapper.appendChild(this.continuePrompt);
    this.dialogueContainer.appendChild(textWrapper);
    document.body.appendChild(this.dialogueContainer);
  }

  loadExclamationMark() {
    const loader = new GLTFLoader();
    loader.load(FROG_CONFIG.quest_marker.gltf, (gltf) => {
      const template = gltf.scene;

      // make the marker face the camera correctly (asset comes flipped)
      template.rotation.y += Math.PI;

      // remove the question mark meshes, keep only exclamation
      const toRemove = [];
      template.traverse((child) => {
        if (child && child.isMesh && child.position && child.position.x < 0) {
          toRemove.push(child);
        }
      });
      for (const mesh of toRemove) {
        if (mesh.parent) mesh.parent.remove(mesh);
      }

      // clone a marker per npc
      this.exclamationMark = template.clone(true);
      this.exclamationMark.scale.setScalar(FROG_CONFIG.quest_marker.scale);
      this.exclamationMark.visible = false;

      this.duckExclamationMark = template.clone(true);
      this.duckExclamationMark.scale.setScalar((DUCK_CONFIG && DUCK_CONFIG.quest_marker && DUCK_CONFIG.quest_marker.scale) || FROG_CONFIG.quest_marker.scale);
      this.duckExclamationMark.visible = false;

      if (this.scene) {
        this.scene.add(this.exclamationMark);
        this.scene.add(this.duckExclamationMark);
      }
    });
  }

  loadFrog() {
    const frogLoader = new FBXLoader();
    frogLoader.setPath(FROG_CONFIG.path);

    const textureLoader = new THREE.TextureLoader();
    const frogTexture = textureLoader.load(FROG_CONFIG.texture);
    frogTexture.encoding = THREE.sRGBEncoding;

    const frogAO = textureLoader.load(FROG_CONFIG.ao_texture);

    frogLoader.load(FROG_CONFIG.model, (frogFbx) => {
      this.frog = frogFbx;

      // scale can vary wildly between fbx exports, so prefer auto-scaling by height
      this.applyFrogScale();

      // pick a safe spot near the configured position
      let px = FROG_CONFIG.position.x;
      let pz = FROG_CONFIG.position.z;
      if (this.vegetationManager && typeof this.vegetationManager.find_safe_position_around === 'function') {
        const safe = this.vegetationManager.find_safe_position_around(px, pz, FROG_CONFIG.safe_clear_distance, 50);
        px = safe.x;
        pz = safe.z;
      }

      const y = this.terrainManager.getTerrainHeight(px, pz) + FROG_CONFIG.height_offset;
      this.frog.position.set(px, y, pz);
      this.frog.rotation.y = FROG_CONFIG.rotation_y;
      this.frog.rotation.order = 'YXZ';
      this.frogBaseYaw = this.frog.rotation.y;

      this.frog.traverse((child) => {
        if (!child.isMesh) return;
        child.material = new THREE.MeshStandardMaterial({
          map: frogTexture,
          aoMap: frogAO,
          roughness: 1.0,
          metalness: 0.0,
          aoMapIntensity: 1.0
        });
        child.material.needsUpdate = true;
        child.castShadow = true;
        child.receiveShadow = true;
      });

      if (this.scene) this.scene.add(this.frog);

      if (this.onLoadCallback) {
        const cb = this.onLoadCallback;
        this.onLoadCallback = null;
        cb();
      }
    });
  }

  loadDuck() {
    const loader = new GLTFLoader();
    loader.load(`${DUCK_CONFIG.path}${DUCK_CONFIG.model}`, (gltf) => {
      // some glb files have the origin in weird places (thanks, exporter).
      // so we ground-align it using the bbox, then move/rotate a root group.
      const duckModel = gltf.scene;
      this.duck = duckModel;
      this.applyDuckScale();

      duckModel.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(duckModel);
      const minY = box.min.y;
      if (Number.isFinite(minY) && minY < 0) {
        duckModel.position.y += -minY;
        duckModel.updateMatrixWorld(true);
      }

      const duckRoot = new THREE.Group();
      duckRoot.add(duckModel);
      this.duck = duckRoot;

      let px = DUCK_CONFIG.position.x;
      let pz = DUCK_CONFIG.position.z;
      if (this.vegetationManager && typeof this.vegetationManager.find_safe_position_around === 'function') {
        const safe = this.vegetationManager.find_safe_position_around(px, pz, DUCK_CONFIG.safe_clear_distance, 50);
        px = safe.x;
        pz = safe.z;
      }

      const y = this.terrainManager.getTerrainHeight(px, pz) + (DUCK_CONFIG.height_offset || 0);
      duckRoot.position.set(px, y, pz);
      duckRoot.rotation.y = DUCK_CONFIG.rotation_y;
      duckRoot.rotation.order = 'YXZ';
      this.duckBaseYaw = duckRoot.rotation.y;

      duckModel.traverse((child) => {
        if (!child || !child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.needsUpdate = true;
        }
      });

      if (this.scene) this.scene.add(duckRoot);
    });
  }

  applyFrogScale() {
    if (!this.frog) return;

    const desired = typeof FROG_CONFIG.desired_height === 'number' ? FROG_CONFIG.desired_height : null;
    const mult = typeof FROG_CONFIG.scale === 'number' ? FROG_CONFIG.scale : 1;

    if (!desired || desired <= 0) {
      // legacy: scale is treated as the final scalar
      this.frog.scale.setScalar(mult);
      this.frog.updateMatrixWorld(true);
      this.frog_height = this.measureObjectHeight(this.frog) || 1;
      return;
    }

    // reset scale so the bbox is measured in model units
    this.frog.scale.setScalar(1);
    this.frog.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(this.frog);
    const size = new THREE.Vector3();
    box.getSize(size);

    const h = size.y;
    if (!Number.isFinite(h) || h <= 0.0001) {
      this.frog.scale.setScalar(mult);
      this.frog.updateMatrixWorld(true);
      this.frog_height = this.measureObjectHeight(this.frog) || 1;
      return;
    }

    const s = (desired / h) * mult;
    this.frog.scale.setScalar(s);
    this.frog.updateMatrixWorld(true);
    this.frog_height = this.measureObjectHeight(this.frog) || desired;
  }

  applyDuckScale() {
    if (!this.duck) return;

    const desired = typeof DUCK_CONFIG.desired_height === 'number' ? DUCK_CONFIG.desired_height : null;
    const mult = typeof DUCK_CONFIG.scale === 'number' ? DUCK_CONFIG.scale : 1;

    if (!desired || desired <= 0) {
      this.duck.scale.setScalar(mult);
      this.duck.updateMatrixWorld(true);
      this.duck_height = this.measureObjectHeight(this.duck) || 1;
      return;
    }

    this.duck.scale.setScalar(1);
    this.duck.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(this.duck);
    const size = new THREE.Vector3();
    box.getSize(size);
    const h = size.y;
    if (!Number.isFinite(h) || h <= 0.0001) {
      this.duck.scale.setScalar(mult);
      this.duck.updateMatrixWorld(true);
      this.duck_height = this.measureObjectHeight(this.duck) || 1;
      return;
    }

    const s = (desired / h) * mult;
    this.duck.scale.setScalar(s);
    this.duck.updateMatrixWorld(true);
    this.duck_height = this.measureObjectHeight(this.duck) || desired;
  }

  measureObjectHeight(obj) {
    if (!obj) return 0;
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);
    const h = size.y;
    return Number.isFinite(h) ? h : 0;
  }

  getQuestMarkerY() {
    // keep the marker close to the head regardless of model units
    const base = this.frog ? this.frog.position.y : 0;
    const h = Number.isFinite(this.frog_height) && this.frog_height > 0 ? this.frog_height : 1;

    const cfg = FROG_CONFIG && FROG_CONFIG.quest_marker ? FROG_CONFIG.quest_marker : {};
    const raw_extra = typeof cfg.height_offset === 'number' ? cfg.height_offset : 0;
    // clamp config offset so it doesn't shoot into the sky
    const extra = Math.max(0, Math.min(raw_extra, h * 0.35));

    return base + h * 0.75 + extra;
  }

  getDuckQuestMarkerY() {
    const base = this.duck ? this.duck.position.y : 0;
    const h = Number.isFinite(this.duck_height) && this.duck_height > 0 ? this.duck_height : 1;

    const cfg = DUCK_CONFIG && DUCK_CONFIG.quest_marker ? DUCK_CONFIG.quest_marker : {};
    const raw_extra = typeof cfg.height_offset === 'number' ? cfg.height_offset : 0;
    const extra = Math.max(0, Math.min(raw_extra, h * 0.35));

    // push it a tiny bit higher than the frog so it doesn't hug the head
    return base + h * 0.85 + extra;
  }

  update(playerPosition, inputManager = null) {
    if (!playerPosition) return;

    // keep quest markers above npcs
    if (this.frog && this.exclamationMark) {
      this.exclamationMark.position.set(this.frog.position.x, this.getQuestMarkerY(), this.frog.position.z);
    }
    if (this.duck && this.duckExclamationMark) {
      this.duckExclamationMark.position.set(this.duck.position.x, this.getDuckQuestMarkerY(), this.duck.position.z);
    }

    // give the marker a simple spin so it feels more alive
    if (this.exclamationMark) this.exclamationMark.rotation.y += 0.03;
    if (this.duckExclamationMark) this.duckExclamationMark.rotation.y += 0.03;

    // choose which npc is currently the interaction target (nearest)
    const candidates = [];
    if (this.frog) {
      const dx = playerPosition.x - this.frog.position.x;
      const dz = playerPosition.z - this.frog.position.z;
      candidates.push({ key: 'frog', obj: this.frog, dx, dz, dist: Math.sqrt(dx * dx + dz * dz), cfg: FROG_CONFIG });
    }
    if (this.duck) {
      const dx = playerPosition.x - this.duck.position.x;
      const dz = playerPosition.z - this.duck.position.z;
      candidates.push({ key: 'duck', obj: this.duck, dx, dz, dist: Math.sqrt(dx * dx + dz * dz), cfg: DUCK_CONFIG });
    }

    if (candidates.length === 0) return;
    candidates.sort((a, b) => a.dist - b.dist);

    // lock target during dialogue
    let active = candidates[0];
    if (this.isDialogueOpen) {
      const locked = candidates.find((c) => c.key === this.activeNpcKey);
      if (locked) active = locked;
    } else {
      this.activeNpcKey = active.key;
    }

    // per-npc detection/marker visibility + facing
    for (const c of candidates) {
      const isDetected = c.dist < c.cfg.detection_distance;
      const isInteractable = c.dist < c.cfg.interaction_distance;

      const look_at_player = c.cfg.look_at_player !== false;
      const shouldLook = (this.isDialogueOpen && c.key === this.activeNpcKey) || isInteractable || (isDetected && look_at_player);
      if (shouldLook) {
        const yaw_offset = typeof c.cfg.facing_yaw_offset === 'number' ? c.cfg.facing_yaw_offset : Math.PI;
        const targetYaw = Math.atan2(c.dx, c.dz) + yaw_offset;
        if ((this.isDialogueOpen && c.key === this.activeNpcKey) || isInteractable) {
          c.obj.rotation.y = targetYaw;
        } else {
          const turnSpeed = typeof c.cfg.look_turn_speed === 'number' ? c.cfg.look_turn_speed : 10;
          const dt = 1 / 60;
          const t = Math.max(0, Math.min(1, turnSpeed * dt));
          c.obj.rotation.y = this.lerpAngle(c.obj.rotation.y, targetYaw, t);
        }
      } else if (!this.isDialogueOpen) {
        const turnSpeed = 6;
        const dt = 1 / 60;
        const t = Math.max(0, Math.min(1, turnSpeed * dt));
        if (c.key === 'frog' && typeof this.frogBaseYaw === 'number') {
          c.obj.rotation.y = this.lerpAngle(c.obj.rotation.y, this.frogBaseYaw, t);
        }
        if (c.key === 'duck' && typeof this.duckBaseYaw === 'number') {
          c.obj.rotation.y = this.lerpAngle(c.obj.rotation.y, this.duckBaseYaw, t);
        }
      }

      if (c.key === 'frog') {
        if (isDetected && !this.wasPlayerDetected) {
          this.wasPlayerDetected = true;
          this.safePlay(this.detectionSound);
          if (this.exclamationMark) this.exclamationMark.visible = true;
        }
        if (!isDetected) {
          this.wasPlayerDetected = false;
          if (this.exclamationMark) this.exclamationMark.visible = false;
        }
      }

      if (c.key === 'duck') {
        if (isDetected && !this.wasDuckPlayerDetected) {
          this.wasDuckPlayerDetected = true;
          this.safePlay(this.detectionSound);
          if (this.duckExclamationMark) this.duckExclamationMark.visible = true;
        }
        if (!isDetected) {
          this.wasDuckPlayerDetected = false;
          if (this.duckExclamationMark) this.duckExclamationMark.visible = false;
        }
      }
    }

    const isActiveInteractable = active.dist < active.cfg.interaction_distance;

    // prompt only when close to active npc and not in dialogue
    if (isActiveInteractable && !this.isDialogueOpen) {
      if (!this.isPlayerInInteractionRange) {
        this.isPlayerInInteractionRange = true;
        if (this.interactionPrompt) this.interactionPrompt.style.display = 'block';
      }
    } else {
      if (this.isPlayerInInteractionRange) {
        this.isPlayerInInteractionRange = false;
        if (this.interactionPrompt) this.interactionPrompt.style.display = 'none';
      }
    }

    const pressedInteract = inputManager && typeof inputManager.was_key_just_pressed === 'function'
      ? inputManager.was_key_just_pressed('e')
      : false;

    if (pressedInteract) {
      if (!this.isDialogueOpen && isActiveInteractable) {
        this.openDialogue();
      } else if (this.isDialogueOpen) {
        this.advanceDialogue();
      }
    }
  }

  openDialogue() {
    this.isDialogueOpen = true;
    this.currentDialogueLine = 0;

    // pick dialogue + UI assets based on the active npc
    const cfg = this.getActiveNpcConfig();
    const cfgDialogue = Array.isArray(cfg && cfg.dialogue_lines) ? cfg.dialogue_lines : [];
    const fallbackDialogue = Array.isArray(FROG_CONFIG && FROG_CONFIG.dialogue_lines) ? FROG_CONFIG.dialogue_lines : [];
    this.dialogueData = cfgDialogue.length > 0 ? cfgDialogue : fallbackDialogue;
    this._useLineBackgrounds = cfgDialogue.length > 0;

    if (this.frogImage) {
      this.frogImage.src = this.getNpcPortraitSrc(cfg);
    }
    if (this.dialogueContainer) {
      const bg = this.getNpcFrameDefault(cfg);
      if (bg) this.dialogueContainer.style.backgroundImage = `url(${bg})`;
    }

    const hudBars = document.getElementById('hud-bars');
    if (hudBars) {
      // preserve original display so we can restore it correctly (flex)
      if (this._hudBarsPrevDisplay == null) {
        this._hudBarsPrevDisplay = hudBars.style.display || 'flex';
      }
      hudBars.style.display = 'none';
    }

    const portraitBottomOffset = 'clamp(-50px, -3vh, -10px)';
    const dialogueBottomOffset = 'clamp(-420px, -26vh, -170px)';

    if (this.interactionPrompt) this.interactionPrompt.style.display = 'none';
    if (this.frogImage) this.frogImage.style.display = 'block';
    if (this.dialogueContainer) {
      this.dialogueContainer.style.display = 'block';
      this.dialogueContainer.style.bottom = dialogueBottomOffset;
    }

    if (this.frogImage) {
      this.frogImage.style.bottom = portraitBottomOffset;
      this.frogImage.style.transform = 'translate(-180px, -220px)';
    }

    this.showDialogueLine(0);
  }

  closeDialogue() {
    this.isDialogueOpen = false;
    this.isTyping = false;

    this.stopAudio(this.frogSpeakSound);

    const hudBars = document.getElementById('hud-bars');
    if (hudBars) {
      hudBars.style.display = this._hudBarsPrevDisplay || 'flex';
    }
    this._hudBarsPrevDisplay = null;

    if (this.typewriterTimer) {
      clearTimeout(this.typewriterTimer);
      this.typewriterTimer = null;
    }

    if (this.dialogueContainer) this.dialogueContainer.style.display = 'none';
    if (this.frogImage) this.frogImage.style.display = 'none';
    if (this.continuePrompt) this.continuePrompt.style.visibility = 'hidden';
    if (this.dialogueText) this.dialogueText.textContent = '';
  }

  advanceDialogue() {
    if (!this.isDialogueOpen) return;

    if (this.isTyping) {
      // finish current line instantly
      this.isTyping = false;
      if (this.typewriterTimer) {
        clearTimeout(this.typewriterTimer);
        this.typewriterTimer = null;
      }

      this.stopAudio(this.frogSpeakSound);

      const line = this.dialogueData[this.currentDialogueLine];
      if (line && this.dialogueText) {
        this.dialogueText.textContent = String(line.text || '');
      }
      if (this.continuePrompt) this.continuePrompt.style.visibility = 'visible';
      return;
    }

    this.currentDialogueLine++;
    if (this.currentDialogueLine >= this.dialogueData.length) {
      this.closeDialogue();
      return;
    }

    this.showDialogueLine(this.currentDialogueLine);
  }

  showDialogueLine(index) {
    const line = this.dialogueData[index];
    if (!line) {
      this.closeDialogue();
      return;
    }

    // update frame background per line
    if (this.dialogueContainer) {
      const cfg = this.getActiveNpcConfig();
      const fallbackBg = this.getNpcFrameDefault(cfg);
      const bg = (this._useLineBackgrounds && line.bg) ? line.bg : fallbackBg;
      this.dialogueContainer.style.backgroundImage = `url(${bg})`;
    }

    if (this.dialogueText) this.dialogueText.textContent = '';
    if (this.continuePrompt) this.continuePrompt.style.visibility = 'hidden';

    this.safePlay(this.frogSpeakSound);

    const text = String(line.text || '');
    this.isTyping = true;

    const cfg = this.getActiveNpcConfig();
    const typewriterMs = typeof (cfg && cfg.typewriter_ms) === 'number' ? cfg.typewriter_ms : FROG_CONFIG.typewriter_ms;

    const typeNext = (i) => {
      if (!this.isTyping) return;
      if (!this.dialogueText) return;

      this.dialogueText.textContent = text.slice(0, i);

      if (i >= text.length) {
        this.isTyping = false;
        if (this.continuePrompt) this.continuePrompt.style.visibility = 'visible';

        // stop the talk sound when the message is fully displayed
        this.stopAudio(this.frogSpeakSound);
        return;
      }

      this.typewriterTimer = setTimeout(() => typeNext(i + 1), typewriterMs);
    };

    typeNext(1);
  }

  safePlay(audio) {
    if (!audio) return;
    try {
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {
      // ignore autoplay restrictions
    }
  }

  stopAudio(audio) {
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // ignore
    }
  }

  lerpAngle(a, b, t) {
    const twoPi = Math.PI * 2;
    let d = (b - a) % twoPi;
    if (d > Math.PI) d -= twoPi;
    if (d < -Math.PI) d += twoPi;
    return a + d * t;
  }
}
