export class GameClock {
  constructor() {
    this.ticks = 0;
    this.dayLength = 600; // 600 seconds for a full day cycle
    this.timeOfDay = 0; // 0..1 (0 = dawn, 0.25 = noon, 0.5 = dusk, 0.75 = midnight)
    this.isNight = false;
    this.listeners = [];

    // time thresholds
    this.DAWN_START = 0.0;
    this.DAY_START = 0.1;
    this.DUSK_START = 0.4;
    this.NIGHT_START = 0.5;
    this.NIGHT_END = 0.9;
  }

  // subscribe to day/night changes
  onDayNightChange(callback) {
    this.listeners.push(callback);
  }

  // notify all listeners
  notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.isNight, this.timeOfDay);
    }
  }

  update(delta) {
    this.ticks += delta;

    // calculate time of day (0..1)
    this.timeOfDay = (this.ticks % this.dayLength) / this.dayLength;

    // determine if it's night
    const wasNight = this.isNight;
    this.isNight = this.timeOfDay >= this.NIGHT_START && this.timeOfDay < this.NIGHT_END;

    // notify listeners if day/night changed
    if (wasNight !== this.isNight) {
      this.notifyListeners();
    }
  }

  // returns 0 during day, 1 during night, and 0..1 during transitions
  getNightAmount() {
    const t = this.timeOfDay;

    // full day
    if (t >= this.DAY_START && t < this.DUSK_START) return 0;

    // transition to night (dusk)
    if (t >= this.DUSK_START && t < this.NIGHT_START) {
      return (t - this.DUSK_START) / (this.NIGHT_START - this.DUSK_START);
    }

    // full night
    if (t >= this.NIGHT_START && t < this.NIGHT_END) return 1;

    // transition to day (dawn)
    if (t >= this.NIGHT_END || t < this.DAY_START) {
      const span = 1 - this.NIGHT_END + this.DAY_START;
      if (t >= this.NIGHT_END) {
        return 1 - (t - this.NIGHT_END) / span;
      }
      return 1 - (t + (1 - this.NIGHT_END)) / span;
    }

    return 0;
  }

  getTimeString() {
    const hours = Math.floor(this.timeOfDay * 24);
    const minutes = Math.floor((this.timeOfDay * 24 - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  getTicks() {
    return this.ticks;
  }

  getTimeOfDay() {
    return this.timeOfDay;
  }

  getIsNight() {
    return this.isNight;
  }

  // for testing - skip to a specific time
  setTimeOfDay(time) {
    this.ticks = time * this.dayLength;
    this.timeOfDay = time;

    const wasNight = this.isNight;
    this.isNight = this.timeOfDay >= this.NIGHT_START && this.timeOfDay < this.NIGHT_END;

    if (wasNight !== this.isNight) {
      this.notifyListeners();
    }
  }
}
