export class HUDManager {
  constructor() {
    this.root = null;
    this.minimapCanvas = null;
    this.minimapContext = null;
    this.mapGroup = null;
    this.backpackGroup = null;
    this.barsGroup = null;
    this.settingsButton = null;
    this.saveButton = null;
    this.questTrackerPanel = null;
    this.hudScale = 1;
    this.hudScaleReference = { width: 1366, height: 768 };
    this._hudResizeHandler = null;
    this.expandedMapPanel = null;
    this.expandedMapCanvas = null;
    this.expandedMapContext = null;
    this.mapExpandedOpen = false;
    this.expandedMapMinScale = 0.3;
    this.expandedMapMaxScale = 5.5;
    this.expandedMapZoomStep = 0.2;
    this.expandedMapScale = 1.7;
    this.expandedMapZoomLabel = null;
    this.saveStatusLabel = null;
    this._saveStatusTimer = null;

    this.treeMarkers = [];

    this.healthFill = null;
    this.staminaFill = null;
    this.attackCooldownFill = null;
    this.attackCooldownLabel = null;

    this.damageOverlay = null;

    this.inventoryPanel = null;
    this.inventorySlots = [];
    this.inventoryOpen = false;
    this.inventoryTitle = null;
    this.inventoryCloseBtn = null;
    this.inventoryTooltip = null;
    this.inventoryMessage = null;
    this._inventoryMessageQueue = [];
    this._inventoryMessageActive = false;
    this._inventoryMessageHideTimer = null;
    this._tooltipItemId = null;
    this.questTracker = null;
    this.settingsPanel = null;
    this.settingsOpen = false;
    this.settingsAmbientSlider = null;
    this.settingsSfxSlider = null;
    this.settingsCombatSlider = null;
    this.settingsMuteToggle = null;
    this.settingsInvertCameraToggle = null;
    this.settingsInvertCameraXToggle = null;
    this.cameraInvertY = false;
    this.cameraInvertX = false;
    this._cachedInventorySignature = '';
    this._cachedQuestSignature = '';
    this._completedQuestLines = new Set();
    this._dragState = null;

    this.minimapScale = 1.15; // world units -> minimap pixels (higher = more zoom)
    this.audioSettings = {
      ambient: 1,
      sfx: 1,
      combat: 1,
      muted: false
    };

    // fox icon for the minimap
    this.foxIcon = new Image();
    this.foxIconLoaded = false;
    this.foxIcon.src = './resources/ui/fox_icon.svg';
    this.foxIcon.onload = () => {
      this.foxIconLoaded = true;
    };

    // boss icon for the minimap
    this.bossSkullIcon = new Image();
    this.bossSkullIconLoaded = false;
    this.bossSkullIcon.src = './resources/ui/skull-red-icon.png';
    this.bossSkullIcon.onload = () => {
      this.bossSkullIconLoaded = true;
    };

    // npc icon for the minimap (quest giver = '?')
    this.npcQuestionIcon = new Image();
    this.npcQuestionIconLoaded = false;
    this.npcQuestionIcon.src = './resources/ui/question_mark.svg';
    this.npcQuestionIcon.onload = () => {
      this.npcQuestionIconLoaded = true;
    };
  }

  init() {
    if (this.root) return;
    this.createHUD();
  }

  createHUD() {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    const root = document.createElement('div');
    root.id = 'hud-container';
    root.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9000;
      font-family: 'Press Start 2P', system-ui, sans-serif;
      line-height: 1.35;
      color: #ffffff;
    `;

    // map + minimap (top-left)
    const mapGroup = document.createElement('div');
    mapGroup.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      width: 260px;
      height: 220px;
      pointer-events: none;
    `;

    const mapImg = document.createElement('img');
    mapImg.src = './resources/ui/map.png';
    mapImg.alt = 'Map frame';
    mapImg.style.cssText = `
      width: 100%;
      height: auto;
      display: block;
    `;
    mapGroup.appendChild(mapImg);

    // minimap placed on top of the green area of the map frame
    const minimap = document.createElement('canvas');
    minimap.width = 190;
    minimap.height = 130;
    minimap.style.cssText = `
      position: absolute;
      top: 40px;
      left: 35px;
      width: 190px;
      height: 130px;
      border-radius: 18px;
      background: rgba(0, 0, 0, 0.45);
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.7);
      overflow: hidden;
    `;
    mapGroup.appendChild(minimap);

    this.minimapCanvas = minimap;
    this.minimapContext = minimap.getContext('2d');

    // markers come from the vegetation manager via update(...)

    // m key centered under the map frame
    const mKey = document.createElement('img');
    mKey.src = './resources/ui/m.png';
    mKey.alt = 'Key M';
    mKey.style.cssText = `
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: auto;
    `;
    mapGroup.appendChild(mKey);

    root.appendChild(mapGroup);
    this.mapGroup = mapGroup;

    // backpack + e key (bottom-left)
    const backpackGroup = document.createElement('div');
    backpackGroup.style.cssText = `
      position: absolute;
      left: 36px;
      bottom: 80px;
      pointer-events: none;
      text-align: center;
    `;

    const eKey = document.createElement('img');
    eKey.src = './resources/ui/e.png';
    eKey.alt = 'Key E';
    eKey.style.cssText = `
      display: block;
      margin: 0 auto 8px auto;
      width: 42px;
      height: auto;
    `;
    backpackGroup.appendChild(eKey);

    const backpackBtn = document.createElement('img');
    backpackBtn.src = './resources/ui/backpack.png';
    backpackBtn.alt = 'Backpack';
    backpackBtn.style.cssText = `
      width: 110px;
      height: auto;
      display: block;
      cursor: pointer;
      pointer-events: auto;
    `;
    backpackBtn.addEventListener('click', () => {
      this.toggleInventory();
    });
    backpackGroup.appendChild(backpackBtn);

    root.appendChild(backpackGroup);
    this.backpackGroup = backpackGroup;

    // health & stamina bars (bottom-center)
    const barsGroup = document.createElement('div');
    barsGroup.id = 'hud-bars';
    barsGroup.style.cssText = `
      position: absolute;
      left: 50%;
      bottom: 25px;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 40px;
      pointer-events: none;
    `;

    // colors approximated to the icons (heart / thunder)
    const health = this.createBar('./resources/ui/heart.png', '#4a1410', '#e63946');
    this.healthFill = health.fill;
    barsGroup.appendChild(health.container);

    const stamina = this.createBar('./resources/ui/thunder.png', '#70420f', '#ffd166');
    this.staminaFill = stamina.fill;
    barsGroup.appendChild(stamina.container);

    const attackCd = this.createBar('./resources/ui/recharge.png', '#10254d', '#3a9dff');
    this.attackCooldownFill = attackCd.fill;
    this.attackCooldownLabel = attackCd.label;
    barsGroup.appendChild(attackCd.container);

    root.appendChild(barsGroup);
    this.barsGroup = barsGroup;

    const damageOverlay = document.createElement('div');
    damageOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(200, 20, 20, 0.4);
      opacity: 0;
      transition: opacity 0.12s ease-out;
      pointer-events: none;
      z-index: 9400;
    `;
    document.body.appendChild(damageOverlay);
    this.damageOverlay = damageOverlay;

    // settings (top-right)
    const settingsBtn = document.createElement('img');
    settingsBtn.src = './resources/ui/settings.png';
    settingsBtn.alt = 'Settings';
    settingsBtn.style.cssText = `
      position: absolute;
      top: 18px;
      right: 20px;
      width: 56px;
      height: auto;
      cursor: pointer;
      pointer-events: auto;
    `;
    settingsBtn.addEventListener('click', () => {
      this.toggleSettingsPanel();
    });
    root.appendChild(settingsBtn);
    this.settingsButton = settingsBtn;

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'save';
    saveBtn.style.cssText = `
      position: absolute;
      top: 22px;
      right: 90px;
      min-width: 78px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(255, 255, 255, 0.75);
      border-radius: 10px;
      background: rgba(18, 24, 28, 0.78);
      color: #f8f9fa;
      font-family: 'Press Start 2P', system-ui, sans-serif;
      font-size: 9px;
      letter-spacing: 0.4px;
      cursor: pointer;
      pointer-events: auto;
      text-transform: uppercase;
    `;
    saveBtn.addEventListener('mouseenter', () => {
      saveBtn.style.background = 'rgba(52, 77, 69, 0.9)';
    });
    saveBtn.addEventListener('mouseleave', () => {
      saveBtn.style.background = 'rgba(18, 24, 28, 0.78)';
    });
    saveBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('vivarium:save-requested'));
    });
    root.appendChild(saveBtn);
    this.saveButton = saveBtn;

    const saveStatus = document.createElement('div');
    saveStatus.style.cssText = `
      position: absolute;
      top: 58px;
      right: 22px;
      min-height: 18px;
      max-width: 250px;
      text-align: right;
      color: #d7f5df;
      text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
      font-size: 9px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.18s ease-out;
    `;
    root.appendChild(saveStatus);
    this.saveStatusLabel = saveStatus;

    document.body.appendChild(root);
    this.root = root;

    this.createInventoryPanel();
    this.createExpandedMapPanel();
    this.createQuestTracker();
    this.createSettingsPanel();
    this.setAttackCooldown(1, false);
    this.applyHUDResponsiveScale();

    if (!this._hudResizeHandler) {
      this._hudResizeHandler = () => this.applyHUDResponsiveScale();
      window.addEventListener('resize', this._hudResizeHandler, { passive: true });
    }
  }

  applyHUDResponsiveScale() {
    const refW = Math.max(this.hudScaleReference.width || 0, 1);
    const refH = Math.max(this.hudScaleReference.height || 0, 1);
    const currentW = Math.max(window.innerWidth || 0, 1);
    const currentH = Math.max(window.innerHeight || 0, 1);
    const scale = Math.max(0.42, Math.min(1, Math.min(currentW / refW, currentH / refH)));
    const isSmallScreen = currentW <= 768;
    const isVerySmallScreen = currentW <= 560;
    const mapBoost = isVerySmallScreen ? 2.15 : (isSmallScreen ? 1.75 : 1);
    const questBoost = isVerySmallScreen ? 2.05 : (isSmallScreen ? 1.6 : 1);
    const topRightBoost = isVerySmallScreen ? 1.95 : (isSmallScreen ? 1.55 : 1);
    const mapScale = Math.min(1.08, scale * mapBoost);
    const questScale = Math.min(1.02, scale * questBoost);
    const topRightScale = Math.min(1.08, scale * topRightBoost);
    this.hudScale = scale;

    if (this.mapGroup) {
      this.mapGroup.style.transformOrigin = 'top left';
      this.mapGroup.style.transform = `scale(${mapScale})`;
      this.mapGroup.style.top = `${Math.round(10 * mapScale)}px`;
      this.mapGroup.style.left = `${Math.round(10 * mapScale)}px`;
    }

    if (this.backpackGroup) {
      this.backpackGroup.style.transformOrigin = 'bottom left';
      this.backpackGroup.style.transform = `scale(${scale})`;
      this.backpackGroup.style.left = `${Math.round(36 * scale)}px`;
      this.backpackGroup.style.bottom = `${Math.round(80 * scale)}px`;
    }

    if (this.barsGroup) {
      this.barsGroup.style.transformOrigin = 'bottom center';
      this.barsGroup.style.transform = `translateX(-50%) scale(${scale})`;
      this.barsGroup.style.bottom = `${Math.round(25 * scale)}px`;
    }

    if (this.settingsButton) {
      this.settingsButton.style.transformOrigin = 'top right';
      this.settingsButton.style.transform = `scale(${topRightScale})`;
      this.settingsButton.style.top = `${Math.round(18 * topRightScale)}px`;
      this.settingsButton.style.right = `${Math.round(20 * topRightScale)}px`;
    }

    if (this.saveButton) {
      this.saveButton.style.transformOrigin = 'top right';
      this.saveButton.style.transform = `scale(${topRightScale})`;
      this.saveButton.style.top = `${Math.round(22 * topRightScale)}px`;
      this.saveButton.style.right = `${Math.round(90 * topRightScale)}px`;
    }

    if (this.saveStatusLabel) {
      this.saveStatusLabel.style.transformOrigin = 'top right';
      this.saveStatusLabel.style.transform = `scale(${topRightScale})`;
      this.saveStatusLabel.style.top = `${Math.round(58 * topRightScale)}px`;
      this.saveStatusLabel.style.right = `${Math.round(22 * topRightScale)}px`;
    }

    if (this.questTrackerPanel) {
      this.questTrackerPanel.style.transformOrigin = 'top right';
      this.questTrackerPanel.style.transform = `scale(${questScale})`;
      this.questTrackerPanel.style.top = `${Math.round(170 * questScale)}px`;
      this.questTrackerPanel.style.right = `${Math.round(20 * questScale)}px`;
    }
  }

  createInventoryPanel() {
    const panel = document.createElement('div');
    panel.id = 'inventory-panel';
    panel.style.cssText = `
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 9500;
      display: none;
      pointer-events: auto;
      font-family: 'Press Start 2P', system-ui, sans-serif;
    `;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 10px 16px;
      background: #7d4a2b;
      border: 4px solid #d2a171;
      border-radius: 12px;
      box-shadow: inset 0 0 0 4px #5e341e, 0 10px 20px rgba(0, 0, 0, 0.5);
    `;

    const title = document.createElement('div');
    title.textContent = 'inventory';
    title.style.cssText = `
      font-size: 18px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #fff4d6;
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
    `;
    header.appendChild(title);
    this.inventoryTitle = title;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'x';
    closeBtn.style.cssText = `
      cursor: pointer;
      border: 3px solid #d2a171;
      border-radius: 10px;
      background: #5e341e;
      color: #fff4d6;
      width: 38px;
      height: 32px;
      font-size: 16px;
      line-height: 1.2;
      text-transform: uppercase;
      pointer-events: auto;
    `;
    closeBtn.addEventListener('click', () => this.toggleInventory(false));
    header.appendChild(closeBtn);
    this.inventoryCloseBtn = closeBtn;

    const mainGrid = document.createElement('div');
    mainGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding: 20px;
      background: #7d4a2b;
      border: 4px solid #d2a171;
      border-radius: 12px;
      box-shadow: inset 0 0 0 4px #5e341e, 0 10px 20px rgba(0, 0, 0, 0.5);
    `;

    const buildSlot = () => {
      const slot = document.createElement('div');
      slot.style.cssText = `
        width: 88px;
        height: 88px;
        background: #8a5736;
        border: 3px solid #d2a171;
        border-radius: 8px;
        box-shadow: inset 0 0 0 3px #5e341e;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        image-rendering: pixelated;
        pointer-events: auto;
      `;

      slot.addEventListener('mouseenter', (event) => this.showInventoryTooltip(slot, event));
      slot.addEventListener('mousemove', (event) => this.showInventoryTooltip(slot, event));
      slot.addEventListener('mouseleave', () => this.hideInventoryTooltip());
      slot.addEventListener('click', () => {
        if (!slot._item) return;
        window.dispatchEvent(new CustomEvent('vivarium:inventory-use', { detail: slot._item }));
      });

      const icon = document.createElement('img');
      icon.style.cssText = `
        width: 58px;
        height: 58px;
        object-fit: contain;
        image-rendering: pixelated;
        display: none;
        pointer-events: none;
      `;

      const quantity = document.createElement('div');
      quantity.style.cssText = `
        position: absolute;
        right: 6px;
        bottom: 4px;
        font-size: 10px;
        color: #fff4d6;
        text-shadow: 1px 1px 0 #000;
        display: none;
        pointer-events: none;
      `;

      slot.appendChild(icon);
      slot.appendChild(quantity);

      this.inventorySlots.push({ slot, icon, quantity });
      return slot;
    };

    for (let i = 0; i < 16; i++) {
      mainGrid.appendChild(buildSlot());
    }

    wrapper.appendChild(header);
    wrapper.appendChild(mainGrid);
    panel.appendChild(wrapper);
    document.body.appendChild(panel);

    this.inventoryPanel = panel;

    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: fixed;
      z-index: 9600;
      padding: 10px 12px;
      background: rgba(0, 0, 0, 0.85);
      border: 2px solid #ffd166;
      border-radius: 10px;
      font-size: 10px;
      line-height: 1.5;
      color: #fff4d6;
      max-width: 260px;
      display: none;
      pointer-events: none;
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
    `;
    document.body.appendChild(tooltip);
    this.inventoryTooltip = tooltip;

    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 85px;
      transform: translateX(-50%);
      min-width: 240px;
      padding: 16px 22px;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #ffd166;
      border-radius: 14px;
      font-size: 14px;
      color: #fff4d6;
      text-align: center;
      display: none;
      opacity: 0;
      transition: opacity 0.25s ease, transform 0.25s ease;
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      z-index: 9600;
    `;
    document.body.appendChild(message);
    this.inventoryMessage = message;
  }

  showInventoryTooltip(slot, event) {
    if (!this.inventoryTooltip || !slot || !slot._item) return;
    const item = slot._item;
    const lore = item.lore || 'An item with a story waiting to be told.';
    const canUse = item.id === 'health_potion';

    this.inventoryTooltip.innerHTML = `
      <div style="font-size: 14px; color: #ffd166; margin-bottom: 8px; text-transform: uppercase;">${item.name || 'Item'}</div>
      <div style="font-size: 12px;">${lore}</div>
      ${canUse ? '<div style="font-size: 11px; color: #aaa; margin-top: 10px;">Click to use this item.</div>' : ''}
    `;

    const rect = slot.getBoundingClientRect();
    const pointerX = event && typeof event.clientX === 'number' ? event.clientX : rect.right;
    const pointerY = event && typeof event.clientY === 'number' ? event.clientY : rect.top + rect.height * 0.5;
    const left = pointerX + 16;
    const top = pointerY - 24;
    this.inventoryTooltip.style.left = `${Math.min(left, window.innerWidth - 280)}px`;
    this.inventoryTooltip.style.top = `${Math.max(20, top)}px`;
    this.inventoryTooltip.style.display = 'block';
    this._tooltipItemId = item.id;
  }

  hideInventoryTooltip() {
    if (!this.inventoryTooltip) return;
    this.inventoryTooltip.style.display = 'none';
    this._tooltipItemId = null;
  }

  showInventoryMessage(text, durationMs = 1600) {
    if (!this.inventoryMessage) return;
    this._inventoryMessageQueue.push({ text: String(text || ''), durationMs });
    if (this._inventoryMessageActive) return;
    this._showNextInventoryMessage();
  }

  _showNextInventoryMessage() {
    if (!this.inventoryMessage) return;
    const next = this._inventoryMessageQueue.shift();
    if (!next) {
      this._inventoryMessageActive = false;
      return;
    }

    this._inventoryMessageActive = true;
    this.inventoryMessage.textContent = next.text;
    this.inventoryMessage.style.display = 'block';
    this.inventoryMessage.style.opacity = '0';
    this.inventoryMessage.style.transform = 'translateX(-50%) translateY(10px)';

    requestAnimationFrame(() => {
      if (!this.inventoryMessage) return;
      this.inventoryMessage.style.opacity = '1';
      this.inventoryMessage.style.transform = 'translateX(-50%) translateY(0)';
    });

    clearTimeout(this._inventoryMessageTimer);
    clearTimeout(this._inventoryMessageHideTimer);
    this._inventoryMessageTimer = setTimeout(() => {
      if (!this.inventoryMessage) return;
      this.inventoryMessage.style.opacity = '0';
      this.inventoryMessage.style.transform = 'translateX(-50%) translateY(10px)';
      this._inventoryMessageHideTimer = setTimeout(() => {
        if (this.inventoryMessage) this.inventoryMessage.style.display = 'none';
        this._showNextInventoryMessage();
      }, 260);
    }, next.durationMs || 1600);
  }

  createQuestTracker() {
    const tracker = document.createElement('div');
    tracker.id = 'quest-tracker';
    tracker.style.cssText = `
      position: fixed;
      right: 20px;
      top: 170px;
      max-width: 420px;
      padding: 20px 22px;
      border-radius: 12px;
      border: 2px solid rgba(255, 255, 255, 0.6);
      background: rgba(0, 0, 0, 0.55);
      font-size: 12px;
      line-height: 1.8;
      text-transform: none;
      pointer-events: none;
      color: #ffffff;
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
    `;

    const title = document.createElement('div');
    title.textContent = 'quests';
    title.style.cssText = `
      font-size: 13px;
      margin-bottom: 10px;
      color: #ffd166;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;
    tracker.appendChild(title);

    const list = document.createElement('div');
    list.id = 'quest-tracker-list';
    tracker.appendChild(list);

    document.body.appendChild(tracker);
    this.questTrackerPanel = tracker;
    this.questTracker = list;
  }

  toggleInventory(forceState = null) {
    if (!this.inventoryPanel) return;
    if (typeof forceState === 'boolean') {
      this.inventoryOpen = forceState;
    } else {
      this.inventoryOpen = !this.inventoryOpen;
    }

    this.inventoryPanel.style.display = this.inventoryOpen ? 'block' : 'none';
    if (!this.inventoryOpen) {
      this.hideInventoryTooltip();
    }
  }

  isInventoryOpen() {
    return !!this.inventoryOpen;
  }

  updateInventory(items) {
    if (!Array.isArray(items)) return;
    const signature = JSON.stringify(items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      icon: item.icon
    })));

    if (signature === this._cachedInventorySignature) return;
    this._cachedInventorySignature = signature;

    const slots = this.inventorySlots;
    for (let i = 0; i < slots.length; i++) {
      const slotEntry = slots[i];
      const item = items[i];
      slotEntry.slot._item = item || null;
      if (item && item.icon) {
        slotEntry.icon.src = item.icon;
        slotEntry.icon.style.display = 'block';
        const qty = Number.isFinite(item.quantity) ? item.quantity : 1;
        if (qty > 1) {
          slotEntry.quantity.textContent = String(qty);
          slotEntry.quantity.style.display = 'block';
        } else {
          slotEntry.quantity.textContent = '';
          slotEntry.quantity.style.display = 'none';
        }
      } else {
        slotEntry.icon.src = '';
        slotEntry.icon.style.display = 'none';
        slotEntry.quantity.textContent = '';
        slotEntry.quantity.style.display = 'none';
      }
    }
  }

  updateQuestTracker(entries) {
    if (!this.questTracker) return;
    if (!Array.isArray(entries)) return;

    const normalizeQuestText = (text) => String(text || '')
      .replace(/defeat\s+lilith's\s+pet/gi, 'defeat the slime');

    const normalizedEntries = entries
      .map((entry) => {
        if (typeof entry === 'string') {
          const safeText = normalizeQuestText(entry);
          return { id: safeText, text: safeText, completed: false };
        }

        if (entry && typeof entry === 'object') {
          const safeText = normalizeQuestText(entry.text || '');
          return {
            id: entry.id || entry.text || '',
            text: safeText,
            completed: entry.completed === true
          };
        }

        return null;
      })
      .filter((entry) => entry && entry.text);

    const signature = normalizedEntries
      .map((entry) => `${entry.id}:${entry.text}:${entry.completed ? '1' : '0'}`)
      .join('|');
    if (signature === this._cachedQuestSignature) return;
    this._cachedQuestSignature = signature;

    const completedLines = normalizedEntries.filter((entry) => entry.completed === true);
    if (completedLines.length === 0) {
      this._completedQuestLines.clear();
    }

    this.questTracker.innerHTML = '';
    normalizedEntries.forEach((entry) => {
      const item = document.createElement('div');
      item.textContent = entry.text;
      item.style.marginBottom = '6px';

      if (entry.completed) {
        item.style.color = '#7bff6a';
        item.style.textDecoration = 'line-through';
        item.style.textShadow = '2px 2px 0 rgba(0, 0, 0, 0.85)';

        if (!this._completedQuestLines.has(entry.text)) {
          this._completedQuestLines.add(entry.text);
          window.dispatchEvent(new CustomEvent('vivarium:quest-complete', { detail: { line: entry.text } }));
        }
      }

      this.questTracker.appendChild(item);
    });
  }

  createBar(iconSrc, baseColor, fillColor) {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const icon = document.createElement('img');
    icon.src = iconSrc;
    icon.style.cssText = `
      width: 28px;
      height: auto;
    `;
    container.appendChild(icon);

    const barOuter = document.createElement('div');
    barOuter.style.cssText = `
      position: relative;
      width: 320px;
      height: 26px;
      border-radius: 18px;
      background: ${baseColor};
      box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.6);
      overflow: hidden;
    `;

    const barInner = document.createElement('div');
    barInner.style.cssText = `
      width: 80%;
      height: 100%;
      border-radius: 18px;
      background: linear-gradient(90deg, ${fillColor}, #fffbcc);
      transition: width 0.25s ease-out;
    `;
    barOuter.appendChild(barInner);
    const barLabel = document.createElement('div');
    barLabel.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      letter-spacing: 0.3px;
      color: #e6f4ff;
      text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
      text-transform: uppercase;
      pointer-events: none;
    `;
    barLabel.textContent = '';
    barOuter.appendChild(barLabel);

    container.appendChild(barOuter);

    return { container, fill: barInner, label: barLabel };
  }

  // value: 0..1
  setHealth(value) {
    if (!this.healthFill) return;
    const clamped = Math.max(0, Math.min(1, value));
    this.healthFill.style.width = `${clamped * 100}%`;
  }

  // value: 0..1
  setStamina(value) {
    if (!this.staminaFill) return;
    const clamped = Math.max(0, Math.min(1, value));
    this.staminaFill.style.width = `${clamped * 100}%`;
  }

  // value: 0..1 where 1 = ready
  setAttackCooldown(value, isCoolingDown = true) {
    if (!this.attackCooldownFill) return;
    const clamped = Math.max(0, Math.min(1, value));
    this.attackCooldownFill.style.width = `${clamped * 100}%`;
    if (!this.attackCooldownLabel) return;

    if (!isCoolingDown) {
      this.attackCooldownLabel.textContent = 'ready';
      return;
    }

    const pct = Math.max(0, Math.min(100, Math.round(clamped * 100)));
    this.attackCooldownLabel.textContent = `${pct}%`;
  }

  makePanelDraggable(panel, handle) {
    if (!panel || !handle) return;
    handle.style.cursor = 'grab';

    const onMouseMove = (event) => {
      if (!this._dragState) return;
      const nextX = event.clientX - this._dragState.offsetX;
      const nextY = event.clientY - this._dragState.offsetY;
      panel.style.left = `${nextX}px`;
      panel.style.top = `${nextY}px`;
      panel.style.transform = 'none';
    };

    const onMouseUp = () => {
      if (!this._dragState) return;
      this._dragState = null;
      handle.style.cursor = 'grab';
    };

    handle.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      const rect = panel.getBoundingClientRect();
      this._dragState = {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
      };
      handle.style.cursor = 'grabbing';
      event.preventDefault();
    });

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  createExpandedMapPanel() {
    const panel = document.createElement('div');
    panel.id = 'expanded-map-panel';
    panel.style.cssText = `
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 9510;
      display: none;
      pointer-events: auto;
      font-family: 'Press Start 2P', system-ui, sans-serif;
    `;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: stretch;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 10px 14px;
      background: rgba(8, 13, 17, 0.9);
      border: 2px solid rgba(205, 219, 230, 0.55);
      border-radius: 12px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.55);
      user-select: none;
    `;

    const title = document.createElement('div');
    title.textContent = 'map';
    title.style.cssText = `
      font-size: 16px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #e6f4ff;
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
    `;
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'x';
    closeBtn.style.cssText = `
      cursor: pointer;
      border: 2px solid rgba(205, 219, 230, 0.55);
      border-radius: 10px;
      background: rgba(10, 18, 24, 0.95);
      color: #e6f4ff;
      width: 38px;
      height: 32px;
      font-size: 16px;
      line-height: 1.2;
      text-transform: uppercase;
      pointer-events: auto;
    `;
    closeBtn.addEventListener('click', () => this.toggleMapPanel(false));
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.style.cssText = `
      position: relative;
      width: min(1240px, 96vw);
      height: min(840px, 88vh);
      background: rgba(4, 8, 11, 0.98);
      border: 2px solid rgba(205, 219, 230, 0.52);
      border-radius: 12px;
      box-shadow: 0 12px 26px rgba(0, 0, 0, 0.58);
      overflow: hidden;
    `;

    const minimap = document.createElement('canvas');
    minimap.width = 1400;
    minimap.height = 940;
    minimap.style.cssText = `
      position: absolute;
      inset: 10px;
      width: calc(100% - 20px);
      height: calc(100% - 20px);
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.72);
      box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.08);
      overflow: hidden;
    `;
    minimap.addEventListener('wheel', (event) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      this.adjustMapZoom(direction);
    }, { passive: false });
    body.appendChild(minimap);

    const zoomControls = document.createElement('div');
    zoomControls.style.cssText = `
      position: absolute;
      top: 18px;
      right: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(8, 15, 20, 0.75);
      border: 1px solid rgba(205, 219, 230, 0.45);
      border-radius: 10px;
      padding: 8px;
      z-index: 2;
    `;

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.type = 'button';
    zoomOutBtn.textContent = '-';
    zoomOutBtn.style.cssText = `
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid rgba(205, 219, 230, 0.55);
      background: rgba(8, 15, 20, 0.95);
      color: #e6f4ff;
      font-family: 'Press Start 2P', system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.2;
      cursor: pointer;
      pointer-events: auto;
    `;
    zoomOutBtn.addEventListener('click', () => this.adjustMapZoom(-1));
    zoomControls.appendChild(zoomOutBtn);

    const zoomLabel = document.createElement('div');
    zoomLabel.style.cssText = `
      min-width: 52px;
      text-align: center;
      font-size: 9px;
      color: #d8e8f5;
      letter-spacing: 0.5px;
      text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.85);
    `;
    zoomControls.appendChild(zoomLabel);
    this.expandedMapZoomLabel = zoomLabel;

    const zoomInBtn = document.createElement('button');
    zoomInBtn.type = 'button';
    zoomInBtn.textContent = '+';
    zoomInBtn.style.cssText = `
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid rgba(205, 219, 230, 0.55);
      background: rgba(8, 15, 20, 0.95);
      color: #e6f4ff;
      font-family: 'Press Start 2P', system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.2;
      cursor: pointer;
      pointer-events: auto;
    `;
    zoomInBtn.addEventListener('click', () => this.adjustMapZoom(1));
    zoomControls.appendChild(zoomInBtn);
    body.appendChild(zoomControls);

    const hint = document.createElement('div');
    hint.textContent = 'drag header • scroll zoom • M close';
    hint.style.cssText = `
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 8px;
      color: #d8e8f5;
      text-shadow: 1px 1px 0 rgba(0,0,0,0.8);
      text-transform: uppercase;
      white-space: nowrap;
      max-width: calc(100% - 28px);
      pointer-events: none;
    `;
    body.appendChild(hint);

    wrapper.appendChild(header);
    wrapper.appendChild(body);
    panel.appendChild(wrapper);
    document.body.appendChild(panel);

    this.expandedMapPanel = panel;
    this.expandedMapCanvas = minimap;
    this.expandedMapContext = minimap.getContext('2d');
    this.updateExpandedMapZoomLabel();
    this.makePanelDraggable(panel, header);
  }

  adjustMapZoom(direction) {
    if (!Number.isFinite(direction) || direction === 0) return;
    const delta = direction * this.expandedMapZoomStep;
    this.expandedMapScale = Math.max(
      this.expandedMapMinScale,
      Math.min(this.expandedMapMaxScale, this.expandedMapScale + delta)
    );
    this.updateExpandedMapZoomLabel();
  }

  updateExpandedMapZoomLabel() {
    if (!this.expandedMapZoomLabel) return;
    const zoomRatio = this.minimapScale > 0.0001 ? this.expandedMapScale / this.minimapScale : 1;
    this.expandedMapZoomLabel.textContent = `${Math.round(zoomRatio * 100)}%`;
  }

  toggleMapPanel(forceState = null) {
    if (!this.expandedMapPanel) return;
    if (typeof forceState === 'boolean') {
      this.mapExpandedOpen = forceState;
    } else {
      this.mapExpandedOpen = !this.mapExpandedOpen;
    }
    this.expandedMapPanel.style.display = this.mapExpandedOpen ? 'block' : 'none';
  }

  isMapOpen() {
    return !!this.mapExpandedOpen;
  }

  emitAudioSettingsChanged() {
    window.dispatchEvent(new CustomEvent('vivarium:audio-settings-changed', {
      detail: { ...this.audioSettings }
    }));
  }

  emitCameraSettingsChanged() {
    window.dispatchEvent(new CustomEvent('vivarium:camera-invert-changed', {
      detail: {
        invertY: this.cameraInvertY === true,
        invertX: this.cameraInvertX === true
      }
    }));
  }

  setCameraInvertY(enabled, emitEvent = true) {
    this.cameraInvertY = enabled === true;
    if (this.settingsInvertCameraToggle) {
      this.settingsInvertCameraToggle.textContent = this.cameraInvertY ? 'camera y: inverted' : 'camera y: normal';
    }
    if (emitEvent) {
      this.emitCameraSettingsChanged();
    }
  }

  setCameraInvertX(enabled, emitEvent = true) {
    this.cameraInvertX = enabled === true;
    if (this.settingsInvertCameraXToggle) {
      this.settingsInvertCameraXToggle.textContent = this.cameraInvertX ? 'camera x: inverted' : 'camera x: normal';
    }
    if (emitEvent) {
      this.emitCameraSettingsChanged();
    }
  }

  createSettingsPanel() {
    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.style.cssText = `
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 9520;
      display: none;
      pointer-events: auto;
      font-family: 'Press Start 2P', system-ui, sans-serif;
      width: min(560px, 92vw);
    `;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 10px 16px;
      background: #7d4a2b;
      border: 4px solid #d2a171;
      border-radius: 12px;
      box-shadow: inset 0 0 0 4px #5e341e, 0 10px 20px rgba(0, 0, 0, 0.5);
      user-select: none;
    `;

    const title = document.createElement('div');
    title.textContent = 'settings';
    title.style.cssText = `
      font-size: 16px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #fff4d6;
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
    `;
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'x';
    closeBtn.style.cssText = `
      cursor: pointer;
      border: 3px solid #d2a171;
      border-radius: 10px;
      background: #5e341e;
      color: #fff4d6;
      width: 38px;
      height: 32px;
      font-size: 16px;
      line-height: 1.2;
      text-transform: uppercase;
      pointer-events: auto;
    `;
    closeBtn.addEventListener('click', () => this.toggleSettingsPanel(false));
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.style.cssText = `
      background: #7d4a2b;
      border: 4px solid #d2a171;
      border-radius: 12px;
      box-shadow: inset 0 0 0 4px #5e341e, 0 10px 20px rgba(0, 0, 0, 0.5);
      padding: 18px 16px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    `;

    const makeSliderRow = (labelText, initialValue) => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 150px 48px;
        align-items: center;
        gap: 12px;
      `;

      const label = document.createElement('div');
      label.textContent = labelText;
      label.style.cssText = `
        font-size: 10px;
        color: #fff4d6;
        text-transform: uppercase;
        line-height: 1.4;
      `;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.step = '1';
      slider.value = String(Math.round(initialValue * 100));
      slider.style.cssText = `width: 100%;`;

      const value = document.createElement('div');
      value.textContent = `${slider.value}%`;
      value.style.cssText = `
        font-size: 10px;
        color: #ffe9c7;
        text-align: right;
      `;

      slider.addEventListener('input', () => {
        value.textContent = `${slider.value}%`;
      });

      row.appendChild(label);
      row.appendChild(slider);
      row.appendChild(value);
      body.appendChild(row);
      return slider;
    };

    const ambientSlider = makeSliderRow('ambient music', this.audioSettings.ambient);
    const sfxSlider = makeSliderRow('sfx', this.audioSettings.sfx);
    const combatSlider = makeSliderRow('combat music', this.audioSettings.combat);
    this.settingsAmbientSlider = ambientSlider;
    this.settingsSfxSlider = sfxSlider;
    this.settingsCombatSlider = combatSlider;

    const controlsRow = document.createElement('div');
    controlsRow.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
    `;

    const muteToggle = document.createElement('button');
    muteToggle.type = 'button';
    muteToggle.style.cssText = `
      cursor: pointer;
      border: 3px solid #d2a171;
      border-radius: 10px;
      background: #5e341e;
      color: #fff4d6;
      min-width: 180px;
      height: 36px;
      font-size: 10px;
      text-transform: uppercase;
      pointer-events: auto;
    `;
    const renderMute = () => {
      muteToggle.textContent = this.audioSettings.muted ? 'unmute all' : 'mute all';
    };
    renderMute();
    muteToggle.addEventListener('click', () => {
      this.audioSettings.muted = !this.audioSettings.muted;
      renderMute();
      this.emitAudioSettingsChanged();
    });
    this.settingsMuteToggle = muteToggle;
    controlsRow.appendChild(muteToggle);

    const tutorialBtn = document.createElement('button');
    tutorialBtn.type = 'button';
    tutorialBtn.textContent = 'tutorial';
    tutorialBtn.style.cssText = `
      cursor: pointer;
      border: 3px solid #d2a171;
      border-radius: 10px;
      background: #5e341e;
      color: #fff4d6;
      min-width: 130px;
      height: 36px;
      font-size: 10px;
      text-transform: uppercase;
      pointer-events: auto;
    `;
    tutorialBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('vivarium:open-tutorial'));
    });
    controlsRow.appendChild(tutorialBtn);

    body.appendChild(controlsRow);

    const gameplayRow = document.createElement('div');
    gameplayRow.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    `;

    const invertCameraBtn = document.createElement('button');
    invertCameraBtn.type = 'button';
    invertCameraBtn.style.cssText = `
      cursor: pointer;
      border: 3px solid #d2a171;
      border-radius: 10px;
      background: #5e341e;
      color: #fff4d6;
      min-width: 220px;
      height: 36px;
      font-size: 10px;
      text-transform: uppercase;
      pointer-events: auto;
    `;
    invertCameraBtn.addEventListener('click', () => {
      this.setCameraInvertY(!this.cameraInvertY);
    });
    this.settingsInvertCameraToggle = invertCameraBtn;
    this.setCameraInvertY(this.cameraInvertY, false);
    gameplayRow.appendChild(invertCameraBtn);

    const invertCameraXBtn = document.createElement('button');
    invertCameraXBtn.type = 'button';
    invertCameraXBtn.style.cssText = `
      cursor: pointer;
      border: 3px solid #d2a171;
      border-radius: 10px;
      background: #5e341e;
      color: #fff4d6;
      min-width: 220px;
      height: 36px;
      font-size: 10px;
      text-transform: uppercase;
      pointer-events: auto;
    `;
    invertCameraXBtn.addEventListener('click', () => {
      this.setCameraInvertX(!this.cameraInvertX);
    });
    this.settingsInvertCameraXToggle = invertCameraXBtn;
    this.setCameraInvertX(this.cameraInvertX, false);
    gameplayRow.appendChild(invertCameraXBtn);

    const mainMenuBtn = document.createElement('button');
    mainMenuBtn.type = 'button';
    mainMenuBtn.textContent = 'main menu';
    mainMenuBtn.style.cssText = `
      cursor: pointer;
      border: 3px solid #d2a171;
      border-radius: 10px;
      background: #5e341e;
      color: #fff4d6;
      min-width: 160px;
      height: 36px;
      font-size: 10px;
      text-transform: uppercase;
      pointer-events: auto;
    `;
    mainMenuBtn.addEventListener('click', () => {
      this.toggleSettingsPanel(false);
      window.dispatchEvent(new CustomEvent('vivarium:quit-requested'));
    });
    gameplayRow.appendChild(mainMenuBtn);

    body.appendChild(gameplayRow);

    const onSliderChange = () => {
      this.audioSettings.ambient = Number(ambientSlider.value) / 100;
      this.audioSettings.sfx = Number(sfxSlider.value) / 100;
      this.audioSettings.combat = Number(combatSlider.value) / 100;
      this.emitAudioSettingsChanged();
    };
    ambientSlider.addEventListener('input', onSliderChange);
    sfxSlider.addEventListener('input', onSliderChange);
    combatSlider.addEventListener('input', onSliderChange);

    wrapper.appendChild(header);
    wrapper.appendChild(body);
    panel.appendChild(wrapper);
    document.body.appendChild(panel);

    this.settingsPanel = panel;
    this.makePanelDraggable(panel, header);
  }

  toggleSettingsPanel(forceState = null) {
    if (!this.settingsPanel) return;
    if (typeof forceState === 'boolean') {
      this.settingsOpen = forceState;
    } else {
      this.settingsOpen = !this.settingsOpen;
    }
    this.settingsPanel.style.display = this.settingsOpen ? 'block' : 'none';
  }

  isSettingsOpen() {
    return !!this.settingsOpen;
  }

  flashDamage(durationMs = 1000) {
    if (!this.damageOverlay) return;
    this.damageOverlay.style.opacity = '1';
    clearTimeout(this._damageTimer);
    this._damageTimer = setTimeout(() => {
      if (this.damageOverlay) this.damageOverlay.style.opacity = '0';
    }, durationMs);
  }

  getSettingsSnapshot() {
    return {
      minimapScale: Number(this.minimapScale.toFixed(3)),
      expandedMapScale: Number(this.expandedMapScale.toFixed(3)),
      invertCameraY: this.cameraInvertY === true,
      invertCameraX: this.cameraInvertX === true,
      audio: {
        ambient: Number(this.audioSettings.ambient.toFixed(3)),
        sfx: Number(this.audioSettings.sfx.toFixed(3)),
        combat: Number(this.audioSettings.combat.toFixed(3)),
        muted: this.audioSettings.muted === true
      }
    };
  }

  applySettingsSnapshot(settings) {
    if (!settings || typeof settings !== 'object') return;
    if (Number.isFinite(settings.minimapScale)) {
      this.minimapScale = Math.max(this.expandedMapMinScale, Math.min(this.expandedMapMaxScale, settings.minimapScale));
      this.updateExpandedMapZoomLabel();
    }
    if (Number.isFinite(settings.expandedMapScale)) {
      this.expandedMapScale = Math.max(this.expandedMapMinScale, Math.min(this.expandedMapMaxScale, settings.expandedMapScale));
      this.updateExpandedMapZoomLabel();
    }
    if (typeof settings.invertCameraY === 'boolean') {
      this.setCameraInvertY(settings.invertCameraY, true);
    }
    if (typeof settings.invertCameraX === 'boolean') {
      this.setCameraInvertX(settings.invertCameraX, true);
    }

    const audio = settings.audio;
    if (audio && typeof audio === 'object') {
      if (Number.isFinite(audio.ambient)) this.audioSettings.ambient = Math.max(0, Math.min(1, audio.ambient));
      if (Number.isFinite(audio.sfx)) this.audioSettings.sfx = Math.max(0, Math.min(1, audio.sfx));
      if (Number.isFinite(audio.combat)) this.audioSettings.combat = Math.max(0, Math.min(1, audio.combat));
      this.audioSettings.muted = audio.muted === true;

      if (this.settingsAmbientSlider) this.settingsAmbientSlider.value = String(Math.round(this.audioSettings.ambient * 100));
      if (this.settingsSfxSlider) this.settingsSfxSlider.value = String(Math.round(this.audioSettings.sfx * 100));
      if (this.settingsCombatSlider) this.settingsCombatSlider.value = String(Math.round(this.audioSettings.combat * 100));
      if (this.settingsAmbientSlider) this.settingsAmbientSlider.dispatchEvent(new Event('input'));
      if (this.settingsSfxSlider) this.settingsSfxSlider.dispatchEvent(new Event('input'));
      if (this.settingsCombatSlider) this.settingsCombatSlider.dispatchEvent(new Event('input'));
      if (this.settingsMuteToggle) {
        this.settingsMuteToggle.textContent = this.audioSettings.muted ? 'unmute all' : 'mute all';
      }
      this.emitAudioSettingsChanged();
    }
  }

  showSaveFeedback(text, isError = false) {
    if (!this.saveStatusLabel) return;

    this.saveStatusLabel.textContent = text;
    this.saveStatusLabel.style.color = isError ? '#ffd2d2' : '#d7f5df';
    this.saveStatusLabel.style.opacity = '1';

    if (this._saveStatusTimer) {
      clearTimeout(this._saveStatusTimer);
    }

    this._saveStatusTimer = setTimeout(() => {
      if (this.saveStatusLabel) this.saveStatusLabel.style.opacity = '0';
    }, 2100);
  }

  // updates the minimap: trees + boss + npcs + player icon.
  update(playerPosition, playerRotation, cameraViewYaw, treeMarkers, bossPosition = null, isBossInRange = false, npcPosition = null) {
    if (!this.minimapCanvas || !this.minimapContext || !playerPosition) return;

    if (Array.isArray(treeMarkers)) {
      this.treeMarkers = treeMarkers;
    }

    this.drawMinimapToCanvas(
      this.minimapCanvas,
      this.minimapContext,
      playerPosition,
      playerRotation,
      cameraViewYaw,
      bossPosition,
      npcPosition
    );

    if (this.mapExpandedOpen && this.expandedMapCanvas && this.expandedMapContext) {
      this.drawMinimapToCanvas(
        this.expandedMapCanvas,
        this.expandedMapContext,
        playerPosition,
        playerRotation,
        cameraViewYaw,
        bossPosition,
        npcPosition
      );
    }
  }

  drawMinimapToCanvas(canvas, ctx, playerPosition, playerRotation, cameraViewYaw, bossPosition, npcPosition) {
    if (!canvas || !ctx || !playerPosition) return;

    const w = canvas.width;
    const h = canvas.height;
    const scale = canvas === this.expandedMapCanvas ? this.expandedMapScale : this.minimapScale;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#296b2c';
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;

    for (const marker of this.treeMarkers) {
      const sx = centerX + (marker.x - playerPosition.x) * scale;
      const sz = centerY + (marker.z - playerPosition.z) * scale;
      if (sx < -8 || sx > w + 8 || sz < -8 || sz > h + 8) continue;
      ctx.fillStyle = marker.variant === 'tree2' ? '#2b5c2f' : '#18411b';
      ctx.beginPath();
      ctx.arc(sx, sz, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    if (bossPosition && typeof bossPosition.x === 'number' && typeof bossPosition.z === 'number') {
      const relX = (bossPosition.x - playerPosition.x) * scale;
      const relZ = (bossPosition.z - playerPosition.z) * scale;
      const edge_pad = 12;
      const maxX = w / 2 - edge_pad;
      const maxY = h / 2 - edge_pad;
      let bx = centerX + relX;
      let by = centerY + relZ;
      const absX = Math.abs(relX);
      const absY = Math.abs(relZ);
      const is_offscreen = absX > maxX || absY > maxY;
      if (is_offscreen) {
        const sx = absX > 0.0001 ? maxX / absX : 1;
        const sy = absY > 0.0001 ? maxY / absY : 1;
        const s = Math.min(sx, sy);
        bx = centerX + relX * s;
        by = centerY + relZ * s;
      }
      if (!is_offscreen && this.bossSkullIconLoaded) {
        const size = 18;
        ctx.drawImage(this.bossSkullIcon, bx - size / 2, by - size / 2, size, size);
      } else {
        ctx.fillStyle = '#ff2b2b';
        ctx.beginPath();
        ctx.arc(bx, by, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    const npcPositions = Array.isArray(npcPosition)
      ? npcPosition
      : (npcPosition && typeof npcPosition === 'object' ? [npcPosition] : []);

    for (const pos of npcPositions) {
      if (!pos || typeof pos.x !== 'number' || typeof pos.z !== 'number') continue;
      const relX = (pos.x - playerPosition.x) * scale;
      const relZ = (pos.z - playerPosition.z) * scale;
      const edge_pad = 12;
      const maxX = w / 2 - edge_pad;
      const maxY = h / 2 - edge_pad;
      let nx = centerX + relX;
      let ny = centerY + relZ;
      const absX = Math.abs(relX);
      const absY = Math.abs(relZ);
      const is_offscreen = absX > maxX || absY > maxY;
      if (is_offscreen) {
        const sx = absX > 0.0001 ? maxX / absX : 1;
        const sy = absY > 0.0001 ? maxY / absY : 1;
        const s = Math.min(sx, sy);
        nx = centerX + relX * s;
        ny = centerY + relZ * s;
      }
      if (!is_offscreen && this.npcQuestionIconLoaded) {
        const size = 26;
        ctx.drawImage(this.npcQuestionIcon, nx - size / 2, ny - size / 2, size, size);
      } else {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(nx, ny, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    const iconSize = 22;
    const yaw = typeof cameraViewYaw === 'number'
      ? cameraViewYaw
      : (typeof playerRotation === 'number' ? playerRotation : 0);
    const theta = Math.PI / 2 - yaw;
    const radius = Math.min(w, h) * 0.18;
    const halfAngle = 0.5;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, theta - halfAngle, theta + halfAngle);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(theta) * radius, Math.sin(theta) * radius);
    ctx.stroke();
    ctx.restore();

    if (this.foxIconLoaded) {
      ctx.drawImage(this.foxIcon, centerX - iconSize / 2, centerY - iconSize / 2, iconSize, iconSize);
    } else {
      ctx.fillStyle = '#ff5522';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
