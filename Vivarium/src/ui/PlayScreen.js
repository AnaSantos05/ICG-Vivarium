export class PlayScreen {
  constructor() {
    this.playContainer = null;
    this.videoElement = null;
    this.onPlayClick = null;
  }

  show(onPlayClick) {
    this.onPlayClick = onPlayClick;
    this.createPlayUI();
  }

  createPlayUI() {
    this.playContainer = document.createElement('div');
    this.playContainer.id = 'play-screen';
    this.playContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 11000;
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
    this.playContainer.appendChild(this.videoElement);

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
    this.playContainer.appendChild(overlay);

    const playButton = document.createElement('img');
    playButton.src = './resources/ui/PLAY.png';
    playButton.style.cssText = `
      width: 400px;
      height: auto;
      cursor: pointer;
      transition: transform 0.2s ease, filter 0.2s ease;
      filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
      z-index: 1;
    `;

    const buttonWrapper = document.createElement('div');
    buttonWrapper.style.cssText = `
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1;
    `;
    buttonWrapper.appendChild(playButton);

    playButton.addEventListener('mouseenter', () => {
      playButton.style.transform = 'scale(1.1)';
      playButton.style.filter = 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.5)) brightness(1.1)';
    });

    playButton.addEventListener('mouseleave', () => {
      playButton.style.transform = 'scale(1)';
      playButton.style.filter = 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))';
    });

    playButton.addEventListener('click', () => {
      this.hide();
    });

    this.playContainer.appendChild(buttonWrapper);
    document.body.appendChild(this.playContainer);

    this.videoElement.play().catch((err) => {
      console.warn('play video autoplay failed', err);
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.playContainer.style.transition = 'opacity 0.8s ease-in';
        this.playContainer.style.opacity = '1';
      });
    });
  }

  hide() {
    this.playContainer.style.transition = 'opacity 0.5s ease-out';
    this.playContainer.style.opacity = '0';

    setTimeout(() => {
      if (this.videoElement) {
        this.videoElement.pause();
        this.videoElement.src = '';
      }

      this.playContainer.remove();

      if (this.onPlayClick) {
        this.onPlayClick();
      }
    }, 500);
  }
}
