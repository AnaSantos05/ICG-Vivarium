export class CreditsRollScreen {
  constructor(options = {}) {
    this.options = {
      creditsUrl: './resources/credits/credits.txt',
      title: 'Credits',
      speed: 42,
      autoClose: false,
      ...options
    };
    this.root = null;
    this.scrollWrapper = null;
    this.content = null;
    this.skipHint = null;
    this.onComplete = null;
    this.isVisible = false;
    this.startTime = 0;
    this.durationMs = 0;
    this.rafId = null;
    this.keyHandler = this.handleKeyDown.bind(this);
  }

  async show({ onComplete, title, autoClose } = {}) {
    this.onComplete = typeof onComplete === 'function' ? onComplete : null;
    if (typeof title === 'string' && title.trim().length > 0) {
      this.options.title = title.trim();
    }
    if (typeof autoClose === 'boolean') {
      this.options.autoClose = autoClose;
    }

    if (!this.root) {
      this.createUI();
    }

    await this.loadCredits();
    this.root.style.display = 'flex';
    this.isVisible = true;
    this.startScrolling();
    window.addEventListener('keydown', this.keyHandler);
  }

  hide() {
    if (!this.root) return;
    this.isVisible = false;
    this.root.style.display = 'none';
    window.removeEventListener('keydown', this.keyHandler);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  handleKeyDown(event) {
    if (!this.isVisible) return;
    const key = (event && event.key ? event.key : '').toLowerCase();
    if (key !== 's') return;
    event.preventDefault();
    this.finish(true);
  }

  createUI() {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    const root = document.createElement('div');
    root.id = 'credits-roll-screen';
    root.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 14000;
      display: none;
      flex-direction: column;
      background: #1a0f2e;
      color: #ffffff;
      font-family: 'Press Start 2P', monospace;
      overflow: hidden;
    `;

    const fadeTop = document.createElement('div');
    fadeTop.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 18vh;
      background: linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0));
      pointer-events: none;
      z-index: 2;
    `;

    const fadeBottom = document.createElement('div');
    fadeBottom.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 22vh;
      background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0));
      pointer-events: none;
      z-index: 2;
    `;

    const scrollWrapper = document.createElement('div');
    scrollWrapper.style.cssText = `
      position: relative;
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      overflow: hidden;
      padding: 10vh 8vw 12vh;
      z-index: 1;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
      transform: translateY(100%);
      will-change: transform;
    `;

    const skipHint = document.createElement('div');
    skipHint.textContent = 'Press S to skip';
    skipHint.style.cssText = `
      position: absolute;
      bottom: 22px;
      right: 28px;
      font-size: 12px;
      color: #ffd36b;
      text-shadow: 2px 2px 0 rgba(0,0,0,0.8);
      letter-spacing: 0.5px;
      z-index: 3;
    `;

    scrollWrapper.appendChild(content);
    root.appendChild(scrollWrapper);
    root.appendChild(fadeTop);
    root.appendChild(fadeBottom);
    root.appendChild(skipHint);
    document.body.appendChild(root);

    this.root = root;
    this.scrollWrapper = scrollWrapper;
    this.content = content;
    this.skipHint = skipHint;
  }

  async loadCredits() {
    if (!this.content) return;
    this.content.innerHTML = '';

    let rawText = '';
    try {
      const response = await fetch(this.options.creditsUrl, { cache: 'no-store' });
      if (response.ok) rawText = await response.text();
    } catch (error) {
      console.warn('Credits file not found, using fallback content.', error);
    }

    if (!rawText) {
      rawText = `# Vivarium\n## Game Design & Programming\nAna Santos — 120039\nRita — Implementation & UI\n\n## Art & 3D Assets\n- Characters, bosses, and environment models\n- UI frames, icons, and textures\n\n## Audio\n- Ambience, combat, and UI sounds\n\n## Tools\n- Blender, Photoshop, and Three.js\n\n## Special Thanks\n- ICG course staff\n- Playtesters and friends\n\n# Thank you for playing!`;
    }

    const title = document.createElement('div');
    title.textContent = this.options.title;
    title.style.cssText = `
      font-size: clamp(20px, 3.5vw, 36px);
      color: #ffe7a3;
      text-shadow: 3px 3px 0 rgba(0,0,0,0.8);
      margin-bottom: 12px;
    `;
    this.content.appendChild(title);

    const lines = rawText.split(/\r?\n/);
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        const spacer = document.createElement('div');
        spacer.style.height = '18px';
        this.content.appendChild(spacer);
        return;
      }

      const isHeader = trimmed.startsWith('# ');
      const isSubHeader = trimmed.startsWith('## ');
      const isBullet = trimmed.startsWith('- ');

      const text = trimmed
        .replace(/^##\s+/, '')
        .replace(/^#\s+/, '')
        .replace(/^-\s+/, '');

      const lineEl = document.createElement('div');
      lineEl.textContent = text;

      if (isHeader) {
        lineEl.style.cssText = `
          font-size: clamp(18px, 3vw, 30px);
          color: #ffd36b;
          text-shadow: 3px 3px 0 rgba(0,0,0,0.85);
          margin-top: 8px;
        `;
      } else if (isSubHeader) {
        lineEl.style.cssText = `
          font-size: clamp(14px, 2.2vw, 20px);
          color: #a6e3ff;
          text-shadow: 2px 2px 0 rgba(0,0,0,0.8);
          margin-top: 8px;
        `;
      } else if (isBullet) {
        lineEl.style.cssText = `
          font-size: clamp(12px, 1.8vw, 16px);
          color: #ffffff;
          text-shadow: 2px 2px 0 rgba(0,0,0,0.75);
          opacity: 0.95;
        `;
      } else {
        lineEl.style.cssText = `
          font-size: clamp(12px, 1.9vw, 18px);
          color: #ffffff;
          text-shadow: 2px 2px 0 rgba(0,0,0,0.75);
        `;
      }

      this.content.appendChild(lineEl);
    });
  }

  startScrolling() {
    if (!this.content || !this.scrollWrapper) return;
    const viewportHeight = this.scrollWrapper.clientHeight;
    const contentHeight = this.content.offsetHeight;
    const startY = viewportHeight + 40;
    const endY = -contentHeight - 80;
    const distance = startY - endY;
    const speed = Math.max(20, Number(this.options.speed || 42));
    this.durationMs = (distance / speed) * 1000;
    this.startTime = 0;

    const animate = (timestamp) => {
      if (!this.isVisible) return;
      if (!this.startTime) this.startTime = timestamp;
      const elapsed = timestamp - this.startTime;
      const progress = Math.min(1, elapsed / this.durationMs);
      const y = startY - distance * progress;
      this.content.style.transform = `translateY(${y}px)`;

      if (progress >= 1) {
        this.finish(false);
        return;
      }

      this.rafId = requestAnimationFrame(animate);
    };

    this.rafId = requestAnimationFrame(animate);
  }

  finish(skipped) {
    if (!this.isVisible) return;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;

    if (this.options.autoClose || skipped) {
      this.hide();
      if (this.onComplete) this.onComplete();
      return;
    }

    if (this.onComplete) this.onComplete();
  }
}
