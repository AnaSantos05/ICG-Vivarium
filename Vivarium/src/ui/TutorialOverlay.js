export class TutorialOverlay {
  constructor() {
    this.root = null;
    this.onClose = null;
  }

  init() {
    if (this.root) return;

    const root = document.createElement('div');
    root.id = 'tutorial-overlay';
    root.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 10050;
      background: #000000;
      display: none;
      pointer-events: auto;
      font-family: 'Press Start 2P', system-ui, sans-serif;
      color: #ffffff;
    `;

    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      justify-items: center;
      align-items: start;
      padding: 36px 24px 44px;
      box-sizing: border-box;
      text-align: center;
    `;

    const title = document.createElement('div');
    title.textContent = 'Tutorial';
    title.style.cssText = `
      font-size: 28px;
      line-height: 1.2;
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
    `;

    const center = document.createElement('div');
    center.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 18px;
      width: 100%;
      min-height: 0;
    `;

    const tutorialGif = document.createElement('img');
    tutorialGif.src = './resources/start/tutorial/tudo.GIF';
    tutorialGif.alt = 'tutorial';
    tutorialGif.loading = 'eager';
    tutorialGif.decoding = 'async';
    tutorialGif.style.cssText = `
      width: min(1180px, 96vw);
      height: auto;
      max-height: 66vh;
      object-fit: contain;
      image-rendering: auto;
      filter: drop-shadow(0 10px 0 rgba(0, 0, 0, 0.7));
    `;

    center.appendChild(tutorialGif);

    const bottom = document.createElement('div');
    bottom.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      width: 100%;
      max-width: 860px;
    `;

    const understoodBtn = document.createElement('button');
    understoodBtn.type = 'button';
    understoodBtn.textContent = 'Understood';
    understoodBtn.style.cssText = `
      pointer-events: auto;
      cursor: pointer;
      border: 2px solid #ffffff;
      background: #ffffff;
      color: #000000;
      padding: 14px 22px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.2;
      text-transform: none;
      min-width: 220px;
    `;

    understoodBtn.addEventListener('click', () => {
      this.hide();
      const cb = this.onClose;
      this.onClose = null;
      if (typeof cb === 'function') cb();
    });

    bottom.appendChild(understoodBtn);

    const disclaimer = document.createElement('div');
    disclaimer.textContent = 'you can always see this tutorial again in the settings.';
    disclaimer.style.cssText = `
      font-size: 12px;
      line-height: 1.6;
      opacity: 0.85;
      max-width: 760px;
    `;
    bottom.appendChild(disclaimer);

    wrap.appendChild(title);
    wrap.appendChild(center);
    wrap.appendChild(bottom);

    root.appendChild(wrap);
    document.body.appendChild(root);

    this.root = root;
  }

  show(onClose = null) {
    this.init();
    this.onClose = typeof onClose === 'function' ? onClose : null;
    this.root.style.display = 'block';
  }

  hide() {
    if (!this.root) return;
    this.root.style.display = 'none';
  }

  isVisible() {
    return !!(this.root && this.root.style.display !== 'none');
  }
}
