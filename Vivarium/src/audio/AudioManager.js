export class AudioManager {
  constructor() {
    this.sounds = {
      menuMusic: null,
      forestMusic: null,
      forestAmbience: null,
      foxSound: null
    };

    this.menuMusicReady = false;
  }

  init() {
    this.sounds.menuMusic = new Audio('./resources/sounds/intro/forest-lullaby-vivarium.mp3');
    this.sounds.menuMusic.loop = true;
    this.sounds.menuMusic.volume = 0.5;

    this.sounds.forestMusic = new Audio('./resources/sounds/gameplay/moonlit-forest.mp3');
    this.sounds.forestMusic.loop = true;
    this.sounds.forestMusic.volume = 0.18;

    this.sounds.forestAmbience = new Audio('./resources/sounds/gameplay/sfx/forest-ambience.mp3');
    this.sounds.forestAmbience.loop = true;
    this.sounds.forestAmbience.volume = 0.22;

    this.sounds.foxSound = new Audio('./resources/sounds/gameplay/sfx/fox-sound.mp3');
    this.sounds.foxSound.loop = false;
    this.sounds.foxSound.volume = 0.6;

    console.log('audio manager ready');
  }

  playMenuMusic() {
    if (!this.sounds.menuMusic) return;
    this.stopGameplayAmbience();

    const tryPlay = () => {
      this.sounds.menuMusic
        .play()
        .then(() => {
          this.menuMusicReady = true;
        })
        .catch((e) => {
          console.log('menu music blocked, waiting for interaction', e);
        });
    };

    // try immediately
    tryPlay();

    // also ensure it starts on first user interaction if blocked
    if (!this.menuMusicReady) {
      const onFirstInteraction = () => {
        tryPlay();
        document.removeEventListener('click', onFirstInteraction);
        document.removeEventListener('keydown', onFirstInteraction);
      };

      document.addEventListener('click', onFirstInteraction);
      document.addEventListener('keydown', onFirstInteraction);
    }
  }

  stopMenuMusic() {
    if (this.sounds.menuMusic) {
      this.sounds.menuMusic.pause();
      this.sounds.menuMusic.currentTime = 0;
    }
  }

  startGameplayAmbience() {
    this.stopMenuMusic();

    if (this.sounds.forestMusic) {
      this.sounds.forestMusic.play().catch((e) => console.log('music autoplay blocked', e));
    }

    if (this.sounds.forestAmbience) {
      this.sounds.forestAmbience.play().catch((e) => console.log('ambience autoplay blocked', e));
    }
  }

  stopGameplayAmbience() {
    if (this.sounds.forestMusic) {
      this.sounds.forestMusic.pause();
    }
    if (this.sounds.forestAmbience) {
      this.sounds.forestAmbience.pause();
    }
  }

  playFoxSound() {
    if (!this.sounds.foxSound) return;
    console.log('playing fox sound');
    this.sounds.foxSound.currentTime = 0;
    this.sounds.foxSound.play().catch((e) => console.log('fox sound blocked', e));
  }
}
