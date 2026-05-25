export class EndScreen {
  constructor() {
    this.root = null;
  }

  show(message = 'the end') {
    if (!this.root) {
      const root = document.createElement('div');
      root.id = 'end-screen';
      root.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 12000;
        background: rgba(0, 0, 0, 0.92);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Press Start 2P', system-ui, sans-serif;
        color: #ffffff;
        text-align: center;
      `;

      const text = document.createElement('div');
      text.style.cssText = `
        font-size: clamp(20px, 4vw, 48px);
        line-height: 1.4;
        text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
        padding: 24px;
      `;
      text.textContent = message;

      root.appendChild(text);
      document.body.appendChild(root);
      this.root = root;
      return;
    }

    this.root.style.display = 'flex';
  }
}
