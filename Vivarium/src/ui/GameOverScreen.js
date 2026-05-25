export class GameOverScreen {
  constructor() {
    this.root = null;
    this.background = null;
    this.motivational = null;
    this.onRetry = null;
    this.onMenu = null;

    this.backgrounds = [1, 2, 3, 4, 5, 6].map((index) => `./resources/game_over/${index}.png`);
    this.motivationalLines = [
      "don't give up, fox. you can do it!",
      'every fall makes you stronger.',
      'the forest still believes in you.',
      'breathe, reset, and try again.',
      'your next run will shine brighter.'
    ];
  }

  show({ onRetry, onMenu } = {}) {
    this.onRetry = typeof onRetry === 'function' ? onRetry : null;
    this.onMenu = typeof onMenu === 'function' ? onMenu : null;

    if (!this.root) {
      this.create();
    }

    this.applyRandomBackground();
    this.applyRandomMotivation();
    this.root.style.display = 'flex';

    // Pause music and play game-over sound effect
    if (window.audioManager) {
      window.audioManager.stopGameplayAmbience();
      window.audioManager.stopMenuMusic?.();
    }
    const gameOverSfx = new Audio('./resources/sounds/gameplay/sfx/everything-else/game-over.mp3');
    gameOverSfx.play().catch(() => {});
  }

  hide() {
    if (!this.root) return;
    this.root.style.display = 'none';
  }

  applyRandomBackground() {
    if (!this.background) return;
    const index = Math.floor(Math.random() * this.backgrounds.length);
    this.background.style.backgroundImage = `url('${this.backgrounds[index]}')`;
  }

  applyRandomMotivation() {
    if (!this.motivational) return;
    const index = Math.floor(Math.random() * this.motivationalLines.length);
    this.motivational.textContent = this.motivationalLines[index];
  }

  create() {
    const root = document.createElement('div');
    root.id = 'game-over-screen';
    root.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 13000;
      display: none;
      align-items: center;
      justify-content: center;
      font-family: 'Press Start 2P', system-ui, sans-serif;
      color: #fff4d6;
      text-align: center;
    `;

    const background = document.createElement('div');
    background.style.cssText = `
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      filter: saturate(1.05);
    `;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(6, 8, 14, 0.7), rgba(6, 8, 14, 0.85));
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 30px 40px;
      min-width: min(680px, 90vw);
      transform: translateY(-110px);
    `;

    const logo = document.createElement('img');
    logo.src = './resources/ui/vivarium logo.png';
    logo.alt = 'Vivarium logo';
    logo.style.cssText = `
      width: min(900px, 90vw);
      height: auto;
      margin-bottom: 0;
      filter: drop-shadow(0 0 22px rgba(0, 255, 255, 0.55));
    `;

    const title = document.createElement('div');
    title.textContent = 'game over';
    title.style.cssText = `
      font-size: clamp(40px, 6.5vw, 70px);
      color: #ffd166;
      text-shadow: 6px 6px 0 rgba(0, 0, 0, 0.85);
      letter-spacing: 3px;
      margin-top: -14px;
    `;

    const subtitle = document.createElement('div');
    subtitle.textContent = 'try again?';
    subtitle.style.cssText = `
      font-size: clamp(16px, 3vw, 24px);
      color: #fff4d6;
      text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
      margin-top: 10px;
    `;

    const choices = document.createElement('div');
    choices.style.cssText = `
      display: flex;
      gap: 22px;
      align-items: center;
      justify-content: center;
      margin-top: 10px;
    `;

    const buildButton = (label, onClick) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.style.cssText = `
        padding: 12px 20px;
        border-radius: 14px;
        border: 4px solid #ffd166;
        background: rgba(20, 16, 10, 0.9);
        color: #fff4d6;
        font-family: 'Press Start 2P', system-ui, sans-serif;
        font-size: 14px;
        cursor: pointer;
        text-transform: lowercase;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
      `;
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(75, 44, 21, 0.95)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(20, 16, 10, 0.9)';
      });
      btn.addEventListener('click', onClick);
      return btn;
    };

    const yesButton = buildButton('yes', () => {
      if (this.onRetry) this.onRetry();
    });

    const noButton = buildButton('no', () => {
      if (this.onMenu) this.onMenu();
    });

    choices.appendChild(yesButton);
    choices.appendChild(noButton);

    const motivational = document.createElement('div');
    motivational.style.cssText = `
      margin-top: 20px;
      font-size: clamp(12px, 2.5vw, 16px);
      color: #dfffe2;
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.75);
      max-width: 520px;
      line-height: 1.8;
    `;

    this.motivational = motivational;
    this.background = background;

    content.appendChild(logo);
    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(choices);
    content.appendChild(motivational);

    root.appendChild(background);
    root.appendChild(overlay);
    root.appendChild(content);

    document.body.appendChild(root);
    this.root = root;
  }
}
