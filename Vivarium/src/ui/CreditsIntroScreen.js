export class CreditsIntroScreen {
  constructor() {
    this.introContainer = null;
    this.onComplete = null;
  }

  show(onComplete) {
    this.onComplete = onComplete;
    this.createIntroUI();
  }

  createIntroUI() {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    this.introContainer = document.createElement('div');
    this.introContainer.id = 'credits-intro-screen';
    this.introContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #000000;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 12000;
      opacity: 1;
    `;

    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 30px;
      opacity: 0;
    `;

    const imageWrapper = document.createElement('div');
    imageWrapper.style.cssText = `
      width: 200px;
      height: 200px;
      border-radius: 50%;
      overflow: hidden;
      border: 4px solid #ffffff;
      box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
    `;

    const creatorImage = document.createElement('img');
    creatorImage.src = './resources/start/menu/creator.png';
    creatorImage.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
    imageWrapper.appendChild(creatorImage);

    const text = document.createElement('div');
    text.textContent = 'Game by Ana Santos - 120039';
    text.style.cssText = `
      font-family: 'Press Start 2P', monospace;
      font-size: 16px;
      color: #ffffff;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      text-align: center;
      line-height: 1.6;
    `;

    contentWrapper.appendChild(imageWrapper);
    contentWrapper.appendChild(text);
    this.introContainer.appendChild(contentWrapper);
    document.body.appendChild(this.introContainer);

    this.animateIntro(contentWrapper);
  }

  animateIntro(contentWrapper) {
    setTimeout(() => {
      contentWrapper.style.transition = 'opacity 1s ease-in';
      contentWrapper.style.opacity = '1';
    }, 300);

    setTimeout(() => {
      contentWrapper.style.transition = 'opacity 1s ease-out';
      contentWrapper.style.opacity = '0';
    }, 3300);

    setTimeout(() => {
      if (this.onComplete) {
        this.onComplete();
      }
    }, 3800);

    setTimeout(() => {
      this.introContainer.style.transition = 'opacity 0.8s ease-out';
      this.introContainer.style.opacity = '0';
    }, 4600);

    setTimeout(() => {
      this.introContainer.remove();
    }, 5500);
  }
}
