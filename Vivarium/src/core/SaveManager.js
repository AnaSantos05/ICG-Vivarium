const SAVE_STORAGE_KEY = 'vivarium_save_latest';

export class SaveManager {
  constructor() {
    this.elapsedGameplaySeconds = 0;
    this.bossDefeatHistory = [];
    this.currentSaveSlot = 'slot_principal';
  }

  updateGameplayTime(delta, isGameplayActive = true) {
    if (!isGameplayActive) return;
    if (!Number.isFinite(delta) || delta <= 0) return;

    this.elapsedGameplaySeconds += delta;
  }

  setElapsedGameplaySeconds(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return;
    this.elapsedGameplaySeconds = seconds;
  }

  recordBossDefeat(payload) {
    if (!payload || typeof payload !== 'object') return;

    const bossId = typeof payload.id === 'string' ? payload.id : 'boss_sem_id';

    const defeatedAt = typeof payload.defeatedAt === 'string'
      ? payload.defeatedAt
      : new Date().toISOString();

    this.bossDefeatHistory.push({
      id: bossId,
      name: typeof payload.name === 'string' ? payload.name : bossId,
      defeatedAt,
      gameTimeSeconds: Number.isFinite(payload.gameTimeSeconds)
        ? payload.gameTimeSeconds
        : Number(this.elapsedGameplaySeconds.toFixed(2))
    });
  }

  applyBossHistory(history) {
    if (!Array.isArray(history)) return;

    this.bossDefeatHistory = history
      .filter((entry) => entry && typeof entry === 'object' && typeof entry.id === 'string')
      .map((entry) => ({
        id: entry.id,
        name: typeof entry.name === 'string' ? entry.name : entry.id,
        defeatedAt: typeof entry.defeatedAt === 'string' ? entry.defeatedAt : new Date().toISOString(),
        gameTimeSeconds: Number.isFinite(entry.gameTimeSeconds) ? entry.gameTimeSeconds : 0
      }));
  }

  getBossHistory() {
    return this.bossDefeatHistory.map((entry) => ({ ...entry }));
  }

  buildSnapshot({ inventoryItems = [], npcDialogueHistory = [], settings = {}, lastMapPoint = null, questState = null } = {}) {
    return {
      meta: {
        version: 1,
        slot: this.currentSaveSlot,
        savedAt: new Date().toISOString()
      },
      progress: {
        gameplayTimeSeconds: Number(this.elapsedGameplaySeconds.toFixed(2)),
        bossesDefeatedCount: this.bossDefeatHistory.length,
        bossesDefeated: this.getBossHistory()
      },
      inventory: {
        itemCount: Array.isArray(inventoryItems) ? inventoryItems.length : 0,
        items: Array.isArray(inventoryItems)
          ? inventoryItems.map((item) => ({ ...item }))
          : []
      },
      npcDialogueHistory: Array.isArray(npcDialogueHistory)
        ? npcDialogueHistory.map((entry) => ({ ...entry }))
        : [],
      quest: questState && typeof questState === 'object' ? { ...questState } : null,
      settings: settings && typeof settings === 'object' ? { ...settings } : {},
      lastMapPoint: lastMapPoint && typeof lastMapPoint === 'object' ? { ...lastMapPoint } : null
    };
  }

  saveSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return null;

    const jsonText = JSON.stringify(snapshot, null, 2);
    const fileName = `vivarium-save-${this.getTimestampFileSuffix()}.json`;

    this.downloadJson(jsonText, fileName);
    this.persistInLocalStorage(jsonText);

    return {
      fileName,
      snapshot
    };
  }

  getLatestLocalSave() {
    try {
      const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  persistInLocalStorage(jsonText) {
    try {
      window.localStorage.setItem(SAVE_STORAGE_KEY, jsonText);
    } catch (error) {
      console.warn('nao foi possivel guardar o save no localstorage', error);
    }
  }

  downloadJson(jsonText, fileName) {
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  getTimestampFileSuffix() {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
  }
}
