export class MainMenu {
  constructor() {
    this.menuContainer = null;
    this.videoElement = null;
    this.audioElement = null;
    this.onNewGame = null;
    this.onLoadGame = null;
    this.onQuit = null;
  }

  // called from main.js after PLAY: builds the full Vivarium-Vite style menu
  init() {
    this.createMenuUI();
    // music is handled by AudioManager in this project,
    // so we don't call setupAudio() here to avoid double audio.
  }

  createMenuUI() {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    this.menuContainer = document.createElement('div');
    this.menuContainer.id = 'main-menu';
    this.menuContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      overflow: hidden;
      opacity: 0;
      background-color: #000000;
    `;

    this.videoElement = document.createElement('video');
    this.videoElement.src = './resources/start/menu/background-video.mp4';
    this.videoElement.autoplay = true;
    this.videoElement.loop = true;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;
    this.videoElement.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      min-width: 100%;
      min-height: 100%;
      width: auto;
      height: auto;
      transform: translate(-50%, -50%);
      z-index: -1;
      object-fit: cover;
    `;
    this.menuContainer.appendChild(this.videoElement);

    this.videoElement.play().catch((err) => {
      console.warn('Menu video autoplay failed:', err);
    });

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 0;
    `;
    this.menuContainer.appendChild(overlay);

    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 1;
      gap: 30px;
    `;

    const logo = document.createElement('img');
    logo.src = './resources/ui/vivarium logo.png';
    logo.style.cssText = `
      width: 50%;
      max-width: 90vw;
      height: auto;
      margin-bottom: 40px;
      margin-left: 45px;
      filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.5));
    `;
    contentWrapper.appendChild(logo);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    `;

    const buttons = [
      { text: 'New Game', action: () => this.handleNewGame() },
      { text: 'Load Game', action: () => this.handleLoadGame() },
      { text: 'Quit', action: () => this.handleQuit() },
    ];

    buttons.forEach((btn) => {
      const button = this.createMenuButton(btn.text, btn.action);
      buttonsContainer.appendChild(button);
    });

    contentWrapper.appendChild(buttonsContainer);
    this.menuContainer.appendChild(contentWrapper);

    const footer = document.createElement('div');
    footer.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      padding: 0 30px;
      z-index: 1;
    `;

    const creditsText = document.createElement('span');
    creditsText.textContent = 'Credits';
    creditsText.style.cssText = `
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      color: white;
      text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.5);
      cursor: pointer;
      transition: color 0.2s ease;
    `;
    creditsText.addEventListener('mouseenter', () => {
      creditsText.style.color = '#aaffaa';
    });
    creditsText.addEventListener('mouseleave', () => {
      creditsText.style.color = 'white';
    });
    creditsText.addEventListener('click', () => {
      this.showCredits();
    });

    const versionText = document.createElement('span');
    versionText.textContent = 'Viv.BETA 1.0 2026';
    versionText.style.cssText = `
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      color: white;
      text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.5);
    `;

    footer.appendChild(creditsText);
    footer.appendChild(versionText);
    this.menuContainer.appendChild(footer);

    document.body.appendChild(this.menuContainer);

    setTimeout(() => {
      this.menuContainer.style.transition = 'opacity 1.2s ease-in';
      this.menuContainer.style.opacity = '1';
    }, 50);
  }

  showCredits() {
    alert('Vivarium - A Fox Adventure\n\nDeveloped by Rita\n\n© 2026');
  }

  createMenuButton(text, onClick) {
    const buttonWrapper = document.createElement('div');
    buttonWrapper.style.cssText = `
      position: relative;
      cursor: pointer;
      transition: transform 0.2s ease;
      display: flex;
      justify-content: center;
      align-items: center;
      top: -30%;
      left: -5%;
    `;

    const buttonBg = document.createElement('img');
    buttonBg.src = './resources/ui/menu_button_left.png';
    buttonBg.style.cssText = `
      width: 300px;
      height: auto;
      display: block;
    `;

    const buttonText = document.createElement('span');
    buttonText.textContent = text;
    buttonText.style.cssText = `
      position: absolute;
      top: 55%;
      left: 59%;
      transform: translate(-50%, -50%);
      font-family: 'Press Start 2P', monospace;
      font-size: 100%;
      color: #4a3728;
      text-shadow: 1px 1px 0px rgba(255, 255, 255, 0.3);
      white-space: nowrap;
      pointer-events: none;
      padding-top: 5%;
    `;

    buttonWrapper.appendChild(buttonBg);
    buttonWrapper.appendChild(buttonText);

    buttonWrapper.addEventListener('mouseenter', () => {
      buttonWrapper.style.transform = 'scale(1.05)';
      buttonBg.style.filter = 'brightness(1.1)';
    });

    buttonWrapper.addEventListener('mouseleave', () => {
      buttonWrapper.style.transform = 'scale(1)';
      buttonBg.style.filter = 'brightness(1)';
    });

    buttonWrapper.addEventListener('click', onClick);

    return buttonWrapper;
  }

  handleNewGame() {
    this.hide(() => {
      if (this.onNewGame) {
        this.onNewGame();
      }
    });
  }

  handleLoadGame() {
    alert('Load Game - Coming soon!');
  }

  handleQuit() {
    if (confirm('Are you sure you want to quit?')) {
      window.close();
      document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;color:#fff;font-family:sans-serif;font-size:24px;">Thanks for playing Vivarium!</div>';
    }
  }

  hide(callback) {
    if (!this.menuContainer) return;

    this.menuContainer.style.transition = 'opacity 0.5s ease-out';
    this.menuContainer.style.opacity = '0';

    setTimeout(() => {
      if (this.videoElement) {
        this.videoElement.pause();
        this.videoElement.src = '';
      }

      this.menuContainer.remove();

      if (callback) callback();
    }, 500);
  }
}

