export class HUDManager {
  constructor() {
    this.root = null;
    this.minimapCanvas = null;
    this.minimapContext = null;

    this.treeMarkers = [];

    this.healthFill = null;
    this.staminaFill = null;

    this.minimapScale = 0.85; // world units -> minimap pixels (higher = more zoom)

    // fox icon for the minimap
    this.foxIcon = new Image();
    this.foxIconLoaded = false;
    this.foxIcon.src = './resources/ui/fox_icon.svg';
    this.foxIcon.onload = () => {
      this.foxIconLoaded = true;
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
      z-index: 5000;
      font-family: 'Press Start 2P', system-ui, sans-serif;
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
      alert('Inventory / backpack - em breve.');
    });
    backpackGroup.appendChild(backpackBtn);

    root.appendChild(backpackGroup);

    // health & stamina bars (bottom-center)
    const barsGroup = document.createElement('div');
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

    root.appendChild(barsGroup);

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
      alert('Settings - em breve.');
    });
    root.appendChild(settingsBtn);

    document.body.appendChild(root);
    this.root = root;
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

    container.appendChild(barOuter);

    return { container, fill: barInner };
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

  // updates the minimap: tree markers + player icon.
  update(playerPosition, treeMarkers) {
    if (!this.minimapCanvas || !this.minimapContext || !playerPosition) return;

    if (Array.isArray(treeMarkers)) {
      this.treeMarkers = treeMarkers;
    }

    const ctx = this.minimapContext;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // grass-like background
    ctx.fillStyle = '#296b2c';
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;

    // draw real trees around the player
    for (const marker of this.treeMarkers) {
      const sx = centerX + (marker.x - playerPosition.x) * this.minimapScale;
      const sz = centerY + (marker.z - playerPosition.z) * this.minimapScale;

      if (sx < -8 || sx > w + 8 || sz < -8 || sz > h + 8) continue;

      ctx.fillStyle = marker.variant === 'tree2' ? '#2b5c2f' : '#18411b';
      ctx.beginPath();
      ctx.arc(sx, sz, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // soft border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // player icon (fox) fixed at the center
    const iconSize = 22;
    const px = centerX - iconSize / 2;
    const pz = centerY - iconSize / 2;

    if (this.foxIconLoaded) {
      ctx.drawImage(this.foxIcon, px, pz, iconSize, iconSize);
    } else {
      // fallback: red dot
      ctx.fillStyle = '#ff5522';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
