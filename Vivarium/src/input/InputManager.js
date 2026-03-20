export class InputManager {
  constructor() {
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      shift: false,
      arrowup: false,
      arrowdown: false,
      arrowleft: false,
      arrowright: false
    };

    this.keyJustPressed = {};

    this.arrow_key_speed = 0.04;

    this.setup_event_listeners();
  }

  setup_event_listeners() {
    window.addEventListener('keydown', (e) => this.handle_key_down(e));
    window.addEventListener('keyup', (e) => this.handle_key_up(e));
  }

  handle_key_down(e) {
    const key = e.key.toLowerCase();
    if (key in this.keys) {
      this.keys[key] = true;
    }
    if (key === 'shift') {
      this.keys.shift = true;
    }
  }

  handle_key_up(e) {
    const key = e.key.toLowerCase();
    if (key in this.keys) {
      this.keys[key] = false;
    }
    if (key === 'shift') {
      this.keys.shift = false;
    }
  }

  is_key_pressed(key) {
    return this.keys[key] || false;
  }

  is_moving() {
    return this.keys.w || this.keys.a || this.keys.s || this.keys.d;
  }

  is_sprinting() {
    return this.keys.shift;
  }

  get_arrow_rotation_delta() {
    let delta_x = 0;
    let delta_y = 0;

    if (this.keys.arrowleft) {
      delta_x = -this.arrow_key_speed;
    }
    if (this.keys.arrowright) {
      delta_x = this.arrow_key_speed;
    }
    if (this.keys.arrowup) {
      delta_y = this.arrow_key_speed;
    }
    if (this.keys.arrowdown) {
      delta_y = -this.arrow_key_speed;
    }

    return { delta_x, delta_y };
  }
}

window.addEventListener('contextmenu', (e) => e.preventDefault());
