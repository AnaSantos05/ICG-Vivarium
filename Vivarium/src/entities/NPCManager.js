import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import { FROG_CONFIG } from '../config/gameConfig.js';

export class NPCManager {
  constructor(scene, terrainManager, vegetationManager) {
    this.scene = scene;
    this.terrainManager = terrainManager;
    this.vegetationManager = vegetationManager;

    this.frog = null;
    this.exclamationMark = null;

    this.frogBaseYaw = 0;

    this.frog_height = 1;

    this.wasPlayerDetected = false;
    this.isPlayerInInteractionRange = false;
    this.isDialogueOpen = false;

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

    this.onLoadCallback = null;

    this.createInteractionPrompt();
    this.createDialogueUI();
    this.loadExclamationMark();
  }

  getPosition() {
    return this.frog ? this.frog.position : null;
  }

  init(onLoadCallback) {
    this.onLoadCallback = typeof onLoadCallback === 'function' ? onLoadCallback : null;
    this.loadFrog();
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
    // place text lower inside the frame
    textWrapper.style.bottom = 'clamp(220px, 14vh, 320px)';
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
      this.exclamationMark = gltf.scene;

      // make the marker face the camera correctly (asset comes flipped)
      this.exclamationMark.rotation.y += Math.PI;

      // remove the question mark meshes, keep only exclamation
      const toRemove = [];
      this.exclamationMark.traverse((child) => {
        if (child && child.isMesh && child.position && child.position.x < 0) {
          toRemove.push(child);
        }
      });
      for (const mesh of toRemove) {
        if (mesh.parent) mesh.parent.remove(mesh);
      }

      this.exclamationMark.scale.setScalar(FROG_CONFIG.quest_marker.scale);
      this.exclamationMark.visible = false;

      if (this.scene) this.scene.add(this.exclamationMark);
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

  update(playerPosition, inputManager = null) {
    if (!this.frog || !playerPosition) return;

    // keep quest marker above npc
    if (this.exclamationMark) {
      this.exclamationMark.position.set(
        this.frog.position.x,
        this.getQuestMarkerY(),
        this.frog.position.z
      );
    }

    const dx = playerPosition.x - this.frog.position.x;
    const dz = playerPosition.z - this.frog.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    const isDetected = distance < FROG_CONFIG.detection_distance;
    const isInteractable = distance < FROG_CONFIG.interaction_distance;

    // look at the player when nearby / interacting
    const look_at_player = FROG_CONFIG.look_at_player !== false;
    // always face the player while interacting / in dialogue.
    // when just detected, respect the config toggle.
    const shouldLook = this.isDialogueOpen || isInteractable || (isDetected && look_at_player);
    if (shouldLook) {
      // most imported rigs face the opposite direction, so default to pi.
      // allow per-asset override via config.
      const yaw_offset = typeof FROG_CONFIG.facing_yaw_offset === 'number' ? FROG_CONFIG.facing_yaw_offset : Math.PI;
      const targetYaw = Math.atan2(dx, dz) + yaw_offset;

      // snap while in dialogue so it's obvious and consistent
      if (this.isDialogueOpen || isInteractable) {
        this.frog.rotation.y = targetYaw;
      } else {
        const turnSpeed = typeof FROG_CONFIG.look_turn_speed === 'number' ? FROG_CONFIG.look_turn_speed : 10;
        // approximate delta-time without threading dt through the entire game
        const dt = 1 / 60;
        const t = Math.max(0, Math.min(1, turnSpeed * dt));
        this.frog.rotation.y = this.lerpAngle(this.frog.rotation.y, targetYaw, t);
      }
    } else if (!this.isDialogueOpen && typeof this.frogBaseYaw === 'number') {
      // softly return to base orientation when the player is far
      const turnSpeed = 6;
      const dt = 1 / 60;
      const t = Math.max(0, Math.min(1, turnSpeed * dt));
      this.frog.rotation.y = this.lerpAngle(this.frog.rotation.y, this.frogBaseYaw, t);
    }

    if (isDetected && !this.wasPlayerDetected) {
      this.wasPlayerDetected = true;
      this.safePlay(this.detectionSound);
      if (this.exclamationMark) this.exclamationMark.visible = true;
    }

    if (!isDetected) {
      this.wasPlayerDetected = false;
      if (this.exclamationMark) this.exclamationMark.visible = false;
    }

    // prompt only when close and not in dialogue
    if (isInteractable && !this.isDialogueOpen) {
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
      if (!this.isDialogueOpen && isInteractable) {
        this.openDialogue();
      } else if (this.isDialogueOpen) {
        this.advanceDialogue();
      }
    }
  }

  openDialogue() {
    this.isDialogueOpen = true;
    this.currentDialogueLine = 0;

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
      const bg = line.bg || FROG_CONFIG.ui.frame_default;
      this.dialogueContainer.style.backgroundImage = `url(${bg})`;
    }

    if (this.dialogueText) this.dialogueText.textContent = '';
    if (this.continuePrompt) this.continuePrompt.style.visibility = 'hidden';

    this.safePlay(this.frogSpeakSound);

    const text = String(line.text || '');
    this.isTyping = true;

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

      this.typewriterTimer = setTimeout(() => typeNext(i + 1), FROG_CONFIG.typewriter_ms);
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
