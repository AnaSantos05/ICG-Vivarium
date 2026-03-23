export class IntroScreen {
  constructor() {
    this.introContainer = null;
    this.onComplete = null;
  }

  show(onComplete) {
    this.onComplete = onComplete;
    this.createIntroUI();
  }

  createIntroUI() {
    this.introContainer = document.createElement('div');
    this.introContainer.id = 'intro-screen';
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
    document.body.appendChild(this.introContainer);

    this.animateIntro();
  }

  animateIntro() {
    const holdBeforeCallback = 200; // time fully black before game starts
    const extraHoldBeforeFade = 300; // keep black while cinematic begins
    const fadeDuration = 700; // fade from black to game

    // start the game / cinematic while screen is still fully black
    setTimeout(() => {
      if (this.onComplete) {
        this.onComplete();
      }
    }, holdBeforeCallback);

    // only then start fading the black screen
    setTimeout(() => {
      this.introContainer.style.transition = `opacity ${fadeDuration}ms ease-out`;
      this.introContainer.style.opacity = '0';
    }, holdBeforeCallback + extraHoldBeforeFade);

    // remove container after fade finishes
    setTimeout(() => {
      this.introContainer.remove();
    }, holdBeforeCallback + extraHoldBeforeFade + fadeDuration + 100);
  }
}
