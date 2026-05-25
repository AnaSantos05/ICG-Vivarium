import { ITEMS_CONFIG } from '../config/gameConfig.js';

const ITEM_NAME_TO_ID = Object.values(ITEMS_CONFIG).reduce((acc, item) => {
  if (item && typeof item.name === 'string') {
    acc[item.name.trim().toLowerCase()] = item.id;
  }
  return acc;
}, {});

const LEGACY_SLIME_ITEM_IDS = new Set([
  'slime_orb',
  'slime_blood',
  'slime_tear',
  'lilith_orb',
  'lilith_blood',
  'lilith_tear',
  'bunny_orb',
  'bunny_blood',
  'bunny_tear'
]);

const resolveItemDefaults = (item) => {
  if (!item || typeof item !== 'object') return null;

  const rawId = typeof item.id === 'string' ? item.id.trim() : '';
  const rawName = typeof item.name === 'string' ? item.name.trim() : '';
  const idFromName = rawName ? ITEM_NAME_TO_ID[rawName.toLowerCase()] : null;
  const configId = rawId || idFromName || null;
  const configItem = configId ? ITEMS_CONFIG[configId] : null;

  if (!configItem) return { ...item };

  const shouldForceConfigLabel = LEGACY_SLIME_ITEM_IDS.has(configItem.id);

  return {
    ...configItem,
    ...item,
    id: configItem.id,
    name: shouldForceConfigLabel ? configItem.name : (item.name || configItem.name),
    icon: shouldForceConfigLabel ? configItem.icon : (item.icon || configItem.icon),
    lore: shouldForceConfigLabel ? configItem.lore : (item.lore || configItem.lore),
    stackable: typeof item.stackable === 'boolean' ? item.stackable : configItem.stackable
  };
};

export class InventoryManager {
  constructor(audioManager) {
    this.items = [];
    this.audioManager = audioManager; // Use shared AudioManager instance
  }

  getItems() {
    return this.items.map((item) => ({ ...item }));
  }

  getItemById(id) {
    if (typeof id !== 'string') return null;
    return this.items.find((item) => item && item.id === id) || null;
  }

  hasItem(id) {
    return !!this.getItemById(id);
  }

  setItems(items) {
    if (!Array.isArray(items)) {
      this.items = [];
      return;
    }

    this.items = items
      .filter((item) => item && typeof item === 'object')
      .map((item) => resolveItemDefaults(item))
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({ ...item }));
  }

  addItem(item) {
    if (!item || typeof item !== 'object') return;

    const normalized = resolveItemDefaults(item) || item;

    const itemId = typeof normalized.id === 'string' && normalized.id.trim().length > 0
      ? normalized.id
      : `item_${this.items.length + 1}`;

    const itemName = typeof normalized.name === 'string' && normalized.name.trim().length > 0
      ? normalized.name
      : 'item sem nome';

    const icon = typeof normalized.icon === 'string' ? normalized.icon : null;
    const lore = typeof normalized.lore === 'string' ? normalized.lore : null;
    const stackable = normalized.stackable === true;
    const quantity = Number.isFinite(normalized.quantity) ? Math.max(1, Math.floor(normalized.quantity)) : 1;

    const existing = this.items.find((entry) => entry && entry.id === itemId);
    if (existing) {
      if (existing.stackable || stackable) {
        existing.quantity = Math.max(1, Math.floor((existing.quantity || 1) + quantity));
        return;
      }

      return;
    }

    this.items.push({
      id: itemId,
      name: itemName,
      quantity,
      icon,
      lore,
      stackable,
      collectedAt: typeof item.collectedAt === 'string' ? item.collectedAt : new Date().toISOString()
    });
  }

  removeItem(id, quantity = 1) {
    if (typeof id !== 'string') return false;
    const index = this.items.findIndex((item) => item && item.id === id);
    if (index === -1) return false;

    const item = this.items[index];
    const qty = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

    if (item.stackable && Number.isFinite(item.quantity)) {
      item.quantity = Math.max(0, item.quantity - qty);
      if (item.quantity <= 0) {
        this.items.splice(index, 1);
      }
      return true;
    }

    this.items.splice(index, 1);
    return true;
  }

  useItem(itemId) {
    const item = this.getItemById(itemId);
    if (!item) return;

    if (item.type === 'potion') {
      if (this.audioManager) {
        this.audioManager.play('levelUp');
      }

      // Logic for using the potion
      console.log(`Potion ${item.name} used!`);
      this.removeItem(itemId);
    }
  }
}
