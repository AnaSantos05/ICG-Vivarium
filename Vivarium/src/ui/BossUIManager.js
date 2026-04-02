export class BossUIManager {
  constructor() {
    this.container = null;
    this.healthBar = null;
    this.healthFillClip = null;
    this.healthFillMaxWidth = 0;
    this.nameText = null;
    this.isVisible = false;
    this.init();
  }

  init() {
    this.createUI();
  }

  createUI() {
    // main container
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.top = '20px';
    this.container.style.left = '50%';
    this.container.style.transform = 'translateX(-50%)';
    this.container.style.display = 'none';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.zIndex = '1000';
    this.container.style.transition = 'opacity 0.3s ease';
    this.container.style.opacity = '0';

    // boss name (skull before the name)
    const name_container = document.createElement('div');
    name_container.style.position = 'relative';
    name_container.style.display = 'flex';
    name_container.style.alignItems = 'center';
    name_container.style.justifyContent = 'center';
    name_container.style.gap = '10px';
    name_container.style.marginBottom = '8px';

    const skull_img = document.createElement('img');
    skull_img.src = './resources/ui/skull-red-icon.png';
    skull_img.alt = 'boss skull';
    skull_img.style.width = '30px';
    skull_img.style.height = '30px';
    skull_img.style.opacity = '0.95';
    skull_img.style.filter = 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.35))';
    skull_img.style.pointerEvents = 'none';
    name_container.appendChild(skull_img);

    this.nameText = document.createElement('div');
    this.nameText.textContent = 'DRAJAK';
    this.nameText.style.position = 'relative';
    this.nameText.style.color = '#FF4444';
    this.nameText.style.fontFamily = '"Times New Roman", serif';
    this.nameText.style.fontSize = '28px';
    this.nameText.style.fontWeight = 'bold';
    this.nameText.style.textShadow = '2px 2px 4px #000, 0 0 10px #FF0000';
    this.nameText.style.letterSpacing = '4px';
    name_container.appendChild(this.nameText);

    this.container.appendChild(name_container);

    // health bar container
    const healthBarContainer = document.createElement('div');
    const bar_width = 420;
    const bar_height = 18;

    healthBarContainer.style.width = `${bar_width}px`;
    healthBarContainer.style.height = `${bar_height}px`;
    healthBarContainer.style.position = 'relative';
    healthBarContainer.style.overflow = 'hidden';
    healthBarContainer.style.borderRadius = '999px';
    healthBarContainer.style.boxShadow = '0 6px 14px rgba(0,0,0,0.45)';
    healthBarContainer.style.border = '2px solid rgba(0,0,0,0.55)';
    healthBarContainer.style.background = 'rgba(0,0,0,0.35)';

    // html health bar (no svg)
    // note: comments are intentionally lowercase
    const inner_pad = 3;
    const inner_y = 3;
    const inner_h = bar_height - inner_y * 2;
    const inner_w = bar_width - inner_pad * 2;
    this.healthFillMaxWidth = inner_w;

    const base = document.createElement('div');
    base.style.position = 'absolute';
    base.style.left = `${inner_pad}px`;
    base.style.top = `${inner_y}px`;
    base.style.width = `${inner_w}px`;
    base.style.height = `${inner_h}px`;
    base.style.background = 'rgba(0,0,0,0.55)';
    base.style.borderRadius = '999px';

    this.healthFillClip = document.createElement('div');
    this.healthFillClip.style.position = 'absolute';
    this.healthFillClip.style.left = `${inner_pad}px`;
    this.healthFillClip.style.top = `${inner_y}px`;
    this.healthFillClip.style.width = `${inner_w}px`;
    this.healthFillClip.style.height = `${inner_h}px`;
    this.healthFillClip.style.background = 'linear-gradient(90deg, #d12b2b, #8b1a1a)';
    this.healthFillClip.style.borderRadius = '999px';
    this.healthFillClip.style.transition = 'width 0.1s linear';

    this.healthBar = base;
    healthBarContainer.appendChild(base);
    healthBarContainer.appendChild(this.healthFillClip);
    this.container.appendChild(healthBarContainer);

    document.body.appendChild(this.container);
  }

  show() {
    if (this.isVisible) return;

    this.isVisible = true;
    this.container.style.display = 'flex';

    // force reflow so the opacity transition kicks in
    this.container.offsetHeight;
    this.container.style.opacity = '1';
  }

  hide() {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.container.style.opacity = '0';

    setTimeout(() => {
      if (!this.isVisible) {
        this.container.style.display = 'none';
      }
    }, 300);
  }

  update(isNearBoss) {
    if (isNearBoss) this.show();
    else this.hide();
  }

  // left here for later: clip the bar to match a health percentage
  setHealth(currentHealth, maxHealth) {
    if (!this.healthFillClip) return;
    const safeMax = Math.max(1, maxHealth || 1);
    const healthPercent = Math.max(0, Math.min(1, (currentHealth || 0) / safeMax));
    const w = Math.round(this.healthFillMaxWidth * healthPercent);
    this.healthFillClip.style.width = `${w}px`;
  }
}
