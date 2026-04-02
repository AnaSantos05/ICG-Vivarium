export class AudioManager {
  constructor() {
    this.sounds = {
      menuMusic: null,
      forestMusic: null,
      forestAmbience: null,
      bossMusic: null,
      foxSound: null
    };

    this.menuMusicReady = false;

    // boss music state + crossfade
    this.isBossActive = false;
    this.fadeInterval = null;
    this.fadeDuration = 2000; // 2 seconds fade
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

    // battle music (same asset as vivarium-vite)
    this.sounds.bossMusic = new Audio('./resources/sounds/bosses/one.mp3');
    this.sounds.bossMusic.loop = true;
    this.sounds.bossMusic.volume = 0.5;

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

    // if boss music was playing (e.g. restart), force back to gameplay
    this.isBossActive = false;
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    if (this.sounds.bossMusic) {
      this.sounds.bossMusic.pause();
      this.sounds.bossMusic.currentTime = 0;
    }

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
    if (this.sounds.bossMusic) {
      this.sounds.bossMusic.pause();
    }
  }

  // keeps boss music in sync with the boss state
  updateBossMusic(isBossActive) {
    if (!this.sounds.bossMusic || !this.sounds.forestMusic || !this.sounds.forestAmbience) return;

    if (isBossActive && !this.isBossActive) {
      this.isBossActive = true;
      this.transitionToBossMusic();
    } else if (!isBossActive && this.isBossActive) {
      this.isBossActive = false;
      this.transitionToGameplayMusic();
    }
  }

  transitionToBossMusic() {
    // clear any existing fade
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    // start boss music at 0 volume
    this.sounds.bossMusic.volume = 0;
    this.sounds.bossMusic.currentTime = 0;
    this.sounds.bossMusic.play().catch((e) => console.log('boss music autoplay blocked', e));

    // fade out gameplay sounds and fade in boss music
    this.crossFade([
      this.sounds.forestMusic,
      this.sounds.forestAmbience
    ], this.sounds.bossMusic, this.fadeDuration);
  }

  transitionToGameplayMusic() {
    // clear any existing fade
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    // start gameplay sounds at 0 volume
    this.sounds.forestMusic.volume = 0;
    this.sounds.forestAmbience.volume = 0;
    this.sounds.forestMusic.play().catch((e) => console.log('music autoplay blocked', e));
    this.sounds.forestAmbience.play().catch((e) => console.log('ambience autoplay blocked', e));

    // fade out boss music and fade in gameplay sounds
    this.crossFade(this.sounds.bossMusic, [
      this.sounds.forestMusic,
      this.sounds.forestAmbience
    ], this.fadeDuration);
  }

  crossFade(fadeOutSounds, fadeInSounds, duration) {
    const steps = 50;
    const stepDuration = duration / steps;
    let currentStep = 0;

    // target volumes tuned to match existing mix
    const targetVolumes = {
      forestMusic: 0.18,
      forestAmbience: 0.22,
      bossMusic: 0.5
    };

    const fadeOutArray = Array.isArray(fadeOutSounds) ? fadeOutSounds : [fadeOutSounds];
    const fadeInArray = Array.isArray(fadeInSounds) ? fadeInSounds : [fadeInSounds];

    const fadeOutInitialVolumes = fadeOutArray.map((s) => s.volume);

    this.fadeInterval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      // fade out
      fadeOutArray.forEach((sound, index) => {
        sound.volume = fadeOutInitialVolumes[index] * (1 - progress);
      });

      // fade in
      fadeInArray.forEach((sound) => {
        let targetVol = 0.5;
        if (sound === this.sounds.forestMusic) targetVol = targetVolumes.forestMusic;
        if (sound === this.sounds.forestAmbience) targetVol = targetVolumes.forestAmbience;
        if (sound === this.sounds.bossMusic) targetVol = targetVolumes.bossMusic;
        sound.volume = targetVol * progress;
      });

      // finish
      if (currentStep >= steps) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;

        fadeOutArray.forEach((sound) => sound.pause());

        fadeInArray.forEach((sound) => {
          if (sound === this.sounds.forestMusic) sound.volume = targetVolumes.forestMusic;
          if (sound === this.sounds.forestAmbience) sound.volume = targetVolumes.forestAmbience;
          if (sound === this.sounds.bossMusic) sound.volume = targetVolumes.bossMusic;
        });
      }
    }, stepDuration);
  }

  playFoxSound() {
    if (!this.sounds.foxSound) return;
    console.log('playing fox sound');
    this.sounds.foxSound.currentTime = 0;
    this.sounds.foxSound.play().catch((e) => console.log('fox sound blocked', e));
  }
}
