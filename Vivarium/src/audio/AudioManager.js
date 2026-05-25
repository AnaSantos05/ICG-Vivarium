export class AudioManager {
  constructor() {
    this.sounds = {
      menuMusic: null,
      forestMusic: null,
      forestAmbience: null,
      bossMusic: null,
      foxSound: null,
      bossGrowl: null,
      levelUp: null,
      xpGain: null
    };

    this.menuMusicReady = false;

    // boss music state + crossfade
    this.isBossActive = false;
    this.fadeInterval = null;
    this.fadeDuration = 2000; // 2 seconds fade

    this.baseVolumes = {
      menuMusic: 0.5,
      forestMusic: 0.18,
      forestAmbience: 0.22,
      bossMusic: 0.5,
      foxSound: 0.6,
      bossGrowl: 0.75,
      levelUp: 0.7,
      xpGain: 0.7
    };
    this.volumeMix = {
      ambient: 1,
      sfx: 1,
      combat: 1,
      muted: false
    };
  }

  init() {
    this.sounds.menuMusic = new Audio('./resources/sounds/intro/forest-lullaby-vivarium.mp3');
    this.sounds.menuMusic.loop = true;
    this.sounds.menuMusic.volume = this.getTargetVolume('menuMusic');

    this.sounds.forestMusic = new Audio('./resources/sounds/gameplay/moonlit-forest.mp3');
    this.sounds.forestMusic.loop = true;
    this.sounds.forestMusic.volume = this.getTargetVolume('forestMusic');

    this.sounds.forestAmbience = new Audio('./resources/sounds/gameplay/sfx/forest-ambience.mp3');
    this.sounds.forestAmbience.loop = true;
    this.sounds.forestAmbience.volume = this.getTargetVolume('forestAmbience');

    // battle music (yep, the dramatic one)
    this.sounds.bossMusic = new Audio('./resources/sounds/bosses/one.mp3');
    this.sounds.bossMusic.loop = true;
    this.sounds.bossMusic.volume = this.getTargetVolume('bossMusic');

    this.sounds.foxSound = new Audio('./resources/sounds/gameplay/sfx/fox-sound.mp3');
    this.sounds.foxSound.loop = false;
    this.sounds.foxSound.volume = this.getTargetVolume('foxSound');

    this.sounds.bossGrowl = new Audio('./resources/sounds/gameplay/sfx/everything-else/boss-roar.mp3');
    this.sounds.bossGrowl.loop = false;
    this.sounds.bossGrowl.volume = this.getTargetVolume('bossGrowl');

    this.sounds.levelUp = new Audio('./resources/sounds/gameplay/sfx/everything-else/level-up.mp3');
    this.sounds.levelUp.loop = false;
    this.sounds.levelUp.volume = this.getTargetVolume('levelUp');

    this.sounds.xpGain = new Audio('./resources/sounds/gameplay/sfx/everything-else/xp-gain.mp3');
    this.sounds.xpGain.loop = false;
    this.sounds.xpGain.volume = this.getTargetVolume('xpGain');

    console.log('audio manager ready');
  }

  getTargetVolume(soundName) {
    const base = Number(this.baseVolumes[soundName] || 0);
    if (this.volumeMix.muted) return 0;

    if (soundName === 'bossMusic') return base * this.volumeMix.combat;
    if (soundName === 'forestMusic' || soundName === 'forestAmbience' || soundName === 'menuMusic') {
      return base * this.volumeMix.ambient;
    }
    return base * this.volumeMix.sfx;
  }

  setVolumeMix(next = {}) {
    if (Number.isFinite(next.ambient)) this.volumeMix.ambient = Math.max(0, Math.min(1, next.ambient));
    if (Number.isFinite(next.sfx)) this.volumeMix.sfx = Math.max(0, Math.min(1, next.sfx));
    if (Number.isFinite(next.combat)) this.volumeMix.combat = Math.max(0, Math.min(1, next.combat));
    if (typeof next.muted === 'boolean') this.volumeMix.muted = next.muted;
    this.refreshMixVolumes();
  }

  getVolumeMix() {
    return { ...this.volumeMix };
  }

  refreshMixVolumes() {
    if (this.sounds.menuMusic) this.sounds.menuMusic.volume = this.getTargetVolume('menuMusic');
    if (this.sounds.foxSound) this.sounds.foxSound.volume = this.getTargetVolume('foxSound');
    if (this.sounds.bossGrowl) this.sounds.bossGrowl.volume = this.getTargetVolume('bossGrowl');
    if (this.sounds.levelUp) this.sounds.levelUp.volume = this.getTargetVolume('levelUp');
    if (this.sounds.xpGain) this.sounds.xpGain.volume = this.getTargetVolume('xpGain');

    if (this.isBossActive) {
      if (this.sounds.bossMusic) this.sounds.bossMusic.volume = this.getTargetVolume('bossMusic');
    } else {
      if (this.sounds.forestMusic) this.sounds.forestMusic.volume = this.getTargetVolume('forestMusic');
      if (this.sounds.forestAmbience) this.sounds.forestAmbience.volume = this.getTargetVolume('forestAmbience');
    }
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
        let targetVol = this.getTargetVolume('bossMusic');
        if (sound === this.sounds.forestMusic) targetVol = this.getTargetVolume('forestMusic');
        if (sound === this.sounds.forestAmbience) targetVol = this.getTargetVolume('forestAmbience');
        if (sound === this.sounds.bossMusic) targetVol = this.getTargetVolume('bossMusic');
        sound.volume = targetVol * progress;
      });

      // finish
      if (currentStep >= steps) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;

        fadeOutArray.forEach((sound) => sound.pause());

        fadeInArray.forEach((sound) => {
          if (sound === this.sounds.forestMusic) sound.volume = this.getTargetVolume('forestMusic');
          if (sound === this.sounds.forestAmbience) sound.volume = this.getTargetVolume('forestAmbience');
          if (sound === this.sounds.bossMusic) sound.volume = this.getTargetVolume('bossMusic');
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

  play(soundName) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch((e) => console.log(`Sound ${soundName} playback blocked`, e));
    } else {
      console.warn(`Sound ${soundName} not found in AudioManager.`);
    }
  }
}
