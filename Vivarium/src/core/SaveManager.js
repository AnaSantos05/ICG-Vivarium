const SAVE_STORAGE_KEY = 'vivarium_save_latest';
const SAVE_ENCRYPTION_KEY = 'vivarium_save_key_v1';
const SAVE_ENCRYPTION_ALGO = 'xor-base64-v1';

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
    const normalizedQuestState = this.normalizeQuestState(questState);

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
      quest: normalizedQuestState,
      settings: settings && typeof settings === 'object' ? { ...settings } : {},
      lastMapPoint: lastMapPoint && typeof lastMapPoint === 'object' ? { ...lastMapPoint } : null
    };
  }

  saveSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return null;

    const jsonText = this.buildEncryptedSnapshotText(snapshot);
    const fileName = `vivarium-save-${this.getTimestampFileSuffix()}.json`;

    this.downloadJson(jsonText, fileName);
    this.persistInLocalStorage(jsonText);

    return {
      fileName,
      snapshot
    };
  }

  importSnapshotFromJsonText(jsonText) {
    // accepts raw json text (plain or encrypted) and stores it in localstorage
    if (typeof jsonText !== 'string' || jsonText.trim().length === 0) return null;

    const snapshot = this.parseSnapshotFromJsonText(jsonText);
    if (!snapshot) return null;

    const encryptedText = this.buildEncryptedSnapshotText(snapshot);
    this.persistInLocalStorage(encryptedText);

    return snapshot;
  }

  getLatestLocalSave() {
    try {
      const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return null;

      return this.parseSnapshotFromJsonText(raw);
    } catch {
      return null;
    }
  }

  parseSnapshotFromJsonText(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== 'object') return null;

      if (parsed.meta && parsed.progress) {
        return this.normalizeParsedSnapshot(parsed);
      }

      const payload = typeof parsed.payload === 'string' ? parsed.payload : null;
      if (!payload) return null;

      const decrypted = this.decryptText(payload);
      if (!decrypted) return null;

      const snapshot = JSON.parse(decrypted);
      if (!snapshot || typeof snapshot !== 'object') return null;
      if (!snapshot.meta || !snapshot.progress) return null;

      return this.normalizeParsedSnapshot(snapshot);
    } catch {
      return null;
    }
  }

  normalizeParsedSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return null;

    const normalized = { ...snapshot };
    const questCandidate = normalized.quest || normalized.quests || normalized.questState || null;
    normalized.quest = this.normalizeQuestState(questCandidate);

    return normalized;
  }

  normalizeQuestState(questState) {
    if (!questState || typeof questState !== 'object') return null;

    const clampCounter = (value) => {
      if (!Number.isFinite(value)) return 0;
      return Math.max(0, Math.min(3, Math.floor(value)));
    };
    const toBool = (value) => value === true;
    const lilithDefeats = Number.isFinite(questState.lilithDefeats)
      ? questState.lilithDefeats
      : questState.bunnyDefeats;

    return {
      // Keep the legacy alias so older builds can still read imports from this build.
      bunnyDefeats: clampCounter(lilithDefeats),
      lilithDefeats: clampCounter(lilithDefeats),
      orbDefeats: clampCounter(questState.orbDefeats),
      keyGranted: toBool(questState.keyGranted),
      talkedToFrog: toBool(questState.talkedToFrog),
      slimeTurnedIn: toBool(questState.slimeTurnedIn),
      talkedToDuck: toBool(questState.talkedToDuck),
      talkedToDuckForKey: toBool(questState.talkedToDuckForKey)
    };
  }

  buildEncryptedSnapshotText(snapshot) {
    const jsonText = JSON.stringify(snapshot, null, 2);
    const encrypted = this.encryptText(jsonText);
    const wrapper = {
      meta: {
        version: 1,
        encrypted: true,
        algorithm: SAVE_ENCRYPTION_ALGO,
        savedAt: new Date().toISOString()
      },
      payload: encrypted
    };

    return JSON.stringify(wrapper, null, 2);
  }

  encryptText(text) {
    // lightweight obfuscation to discourage manual edits
    if (typeof text !== 'string') return '';
    const bytes = this.xorBytes(new TextEncoder().encode(text), SAVE_ENCRYPTION_KEY);
    return this.bytesToBase64(bytes);
  }

  decryptText(encoded) {
    // expects the payload created by encryptText
    if (typeof encoded !== 'string') return '';
    const bytes = this.base64ToBytes(encoded);
    if (!bytes) return '';
    const decoded = this.xorBytes(bytes, SAVE_ENCRYPTION_KEY);
    return new TextDecoder().decode(decoded);
  }

  xorBytes(bytes, key) {
    const keyBytes = new TextEncoder().encode(String(key));
    if (!keyBytes.length) return bytes;

    const output = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) {
      output[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return output;
  }

  bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
  }

  base64ToBytes(base64) {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
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
