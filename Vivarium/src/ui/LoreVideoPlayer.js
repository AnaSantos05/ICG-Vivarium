export class LoreVideoPlayer {
  constructor() {
    this.activeOverlay = null;
    this.activeVideo = null;
    this.isPlaying = false;
  }

  play({ src, attemptFullscreen = false, allowSkip = false } = {}) {
    if (!src || this.isPlaying) {
      return Promise.resolve(false);
    }

    this.isPlaying = true;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9800;
      pointer-events: auto;
      cursor: none;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .lore-video::-webkit-media-controls {
        display: none !important;
      }
      .lore-video::-webkit-media-controls-enclosure {
        display: none !important;
      }
      .lore-video::-webkit-media-controls-panel {
        display: none !important;
      }
      .lore-video::-webkit-media-controls-start-playback-button {
        display: none !important;
      }
    `;

    const video = document.createElement('video');
    video.className = 'lore-video';
    video.src = src;
    video.preload = 'auto';
    video.playsInline = true;
    video.controls = false;
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.controlsList = 'nodownload noplaybackrate noremoteplayback';
    video.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: #000;
    `;

    overlay.appendChild(style);
    overlay.appendChild(video);
    document.body.appendChild(overlay);

    this.activeOverlay = overlay;
    this.activeVideo = video;

    const finish = () => {
      if (!this.isPlaying) return;
      this.isPlaying = false;
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      if (this.activeOverlay) {
        this.activeOverlay.remove();
      }
      this.activeOverlay = null;
      this.activeVideo = null;
    };

    const onEnded = () => {
      finish();
      resolvePromise(true);
    };

    const onError = () => {
      finish();
      resolvePromise(false);
    };

    const onClick = () => {
      if (video.paused) {
        video.play().catch(() => {});
        return;
      }
      if (!allowSkip) return;
      finish();
      resolvePromise(true);
    };

    let resolvePromise = () => {};
    const playbackPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    video.addEventListener('ended', onEnded, { once: true });
    video.addEventListener('error', onError, { once: true });
    overlay.addEventListener('click', onClick);

    const startPlayback = () => {
      video.play().catch(() => {
        // autoplay may be blocked; wait for a user click
      });
    };

    startPlayback();

    return playbackPromise;
  }

  playIntro() {
    return this.play({ src: './resources/lore/intro.mp4', attemptFullscreen: false, allowSkip: false });
  }

  playOutro() {
    return this.play({ src: './resources/lore/outro.mp4', attemptFullscreen: false, allowSkip: false });
  }
}
