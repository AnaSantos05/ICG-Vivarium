import { ITEMS_CONFIG } from '../config/gameConfig.js';

export class QuestManager {
  constructor(inventoryManager) {
    this.inventoryManager = inventoryManager;

    this.state = {
      lilithDefeats: 0,
      orbDefeats: 0,
      keyGranted: false,
      talkedToFrog: false,
      slimeTurnedIn: false,
      talkedToDuck: false,
      talkedToDuckForKey: false
    };

    this._cachedTrackerLines = [];
  }

  getState() {
    return {
      // keep legacy key for older saves/imports
      bunnyDefeats: this.state.lilithDefeats,
      lilithDefeats: this.state.lilithDefeats,
      orbDefeats: this.state.orbDefeats,
      keyGranted: this.state.keyGranted,
      talkedToFrog: this.state.talkedToFrog,
      slimeTurnedIn: this.state.slimeTurnedIn,
      talkedToDuck: this.state.talkedToDuck,
      talkedToDuckForKey: this.state.talkedToDuckForKey
    };
  }

  applyState(state) {
    if (!state || typeof state !== 'object') return;
    const rawLilithDefeats = Number.isFinite(state.lilithDefeats)
      ? state.lilithDefeats
      : state.bunnyDefeats;
    const lilithDefeats = Number.isFinite(rawLilithDefeats) ? Math.max(0, Math.min(3, rawLilithDefeats)) : 0;
    const orbDefeats = Number.isFinite(state.orbDefeats) ? Math.max(0, Math.min(3, state.orbDefeats)) : 0;
    const rawTalkedToFrog = state.talkedToFrog === true;
    const rawSlimeTurnedIn = state.slimeTurnedIn === true;
    const rawTalkedToDuck = state.talkedToDuck === true;
    const rawTalkedToDuckForKey = state.talkedToDuckForKey === true;
    const rawKeyGranted = state.keyGranted === true;

    // reconcile older or inconsistent saves:
    // progress counters are authoritative, flags must not jump ahead.
    const talkedToFrog = rawTalkedToFrog || lilithDefeats > 0 || rawSlimeTurnedIn || rawTalkedToDuck || orbDefeats > 0 || rawTalkedToDuckForKey || rawKeyGranted;
    const slimeTurnedIn = (rawSlimeTurnedIn || rawTalkedToDuck || orbDefeats > 0 || rawTalkedToDuckForKey || rawKeyGranted)
      && lilithDefeats >= 3
      && talkedToFrog;
    const talkedToDuck = rawTalkedToDuck || orbDefeats > 0 || rawTalkedToDuckForKey || rawKeyGranted;
    const talkedToDuckForKey = (rawTalkedToDuckForKey || rawKeyGranted)
      && orbDefeats >= 3
      && talkedToDuck;
    const hasKeyItem = this.inventoryManager && typeof this.inventoryManager.hasItem === 'function'
      ? this.inventoryManager.hasItem('end_key')
      : false;
    const keyGranted = (rawKeyGranted || hasKeyItem)
      && orbDefeats >= 3
      && talkedToDuckForKey;

    this.state.lilithDefeats = lilithDefeats;
    this.state.orbDefeats = orbDefeats;
    this.state.keyGranted = keyGranted;
    this.state.talkedToFrog = talkedToFrog;
    this.state.slimeTurnedIn = slimeTurnedIn;
    this.state.talkedToDuck = talkedToDuck;
    this.state.talkedToDuckForKey = talkedToDuckForKey;
  }

  markNpcTalked(npcKey) {
    if (npcKey === 'frog') {
      this.state.talkedToFrog = true;
      if (this.isFrogQuestComplete()) {
        this.state.slimeTurnedIn = true;
      }
      return;
    }

    if (npcKey === 'duck') {
      this.state.talkedToDuck = true;
      if (this.isDuckQuestComplete()) {
        this.state.talkedToDuckForKey = true;
      }
    }
  }

  isFrogQuestComplete() {
    return this.state.lilithDefeats >= 3;
  }

  isDuckQuestComplete() {
    return this.state.orbDefeats >= 3;
  }

  shouldSpawnDoor() {
    return this.state.keyGranted === true;
  }

  getBossEncounterProfile() {
    const talkedToFrog = this.state.talkedToFrog === true;
    const frogQuestDone = this.isFrogQuestComplete();
    const slimeTurnedIn = this.state.slimeTurnedIn === true;
    const talkedToDuck = this.state.talkedToDuck === true;
    const duckQuestDone = this.isDuckQuestComplete();

    // first phase: slime (only after frog gives the quest)
    if (!talkedToFrog) {
      return {
        enabled: false,
        bossId: 'boss_slime',
        bossName: 'slime',
        phase: 'locked_before_frog'
      };
    }

    if (!frogQuestDone) {
      return {
        enabled: true,
        bossId: 'boss_slime',
        bossName: 'slime',
        phase: 'slime_quest'
      };
    }

    if (!slimeTurnedIn) {
      return {
        enabled: false,
        bossId: 'boss_slime',
        bossName: 'slime',
        phase: 'return_to_frog'
      };
    }

    // second phase: lilith (only after duck gives the quest)
    if (!talkedToDuck) {
      return {
        enabled: false,
        bossId: 'boss_orb',
        bossName: 'lilith',
        phase: 'locked_before_duck'
      };
    }

    if (!duckQuestDone) {
      return {
        enabled: true,
        bossId: 'boss_orb',
        bossName: 'lilith',
        phase: 'lilith_quest'
      };
    }

    return {
      enabled: false,
      bossId: 'boss_orb',
      bossName: 'lilith',
      phase: 'done'
    };
  }

  registerBossDefeat(bossId) {
    if (bossId === 'boss_lilith' || bossId === 'boss_bunny' || bossId === 'boss_slime') {
      if (this.state.lilithDefeats >= 3) return;
      this.state.lilithDefeats += 1;
      this.grantSlimeReward(this.state.lilithDefeats);
      this.grantHealthPotion();
      return;
    }

    if (bossId === 'boss_orb') {
      if (this.state.orbDefeats >= 3) return;
      this.state.orbDefeats += 1;
      this.grantOrbReward(this.state.orbDefeats);
      this.grantHealthPotion();
    }
  }

  grantHealthPotion() {
    const potion = ITEMS_CONFIG.health_potion;
    if (!potion) return;
    if (!this.inventoryManager) return;

    this.inventoryManager.addItem({
      ...potion,
      quantity: 1
    });
  }

  grantSlimeReward(step) {
    if (!this.inventoryManager) return;

    const rewardCandidates = step === 1
      ? [ITEMS_CONFIG.bunny_orb, ITEMS_CONFIG.slime_orb, ITEMS_CONFIG.lilith_orb]
      : step === 2
        ? [ITEMS_CONFIG.bunny_blood, ITEMS_CONFIG.slime_blood, ITEMS_CONFIG.lilith_blood]
        : [ITEMS_CONFIG.bunny_tear, ITEMS_CONFIG.slime_tear, ITEMS_CONFIG.lilith_tear];

    const hasAnyEquivalentReward = rewardCandidates.some((candidate) => (
      candidate && candidate.id && this.inventoryManager.hasItem(candidate.id)
    ));
    if (hasAnyEquivalentReward) return;

    const reward = rewardCandidates.find((candidate) => candidate && candidate.id);

    if (!reward) return;

    this.inventoryManager.addItem({
      ...reward,
      quantity: 1
    });
  }

  grantOrbReward(step) {
    if (!this.inventoryManager) return;

    const reward = step === 1
      ? ITEMS_CONFIG.orb_blood
      : step === 2
        ? ITEMS_CONFIG.orb_fang
        : ITEMS_CONFIG.orb_tear;

    if (!reward) return;
    if (this.inventoryManager.hasItem(reward.id)) return;

    this.inventoryManager.addItem({
      ...reward,
      quantity: 1
    });
  }

  grantKeyIfNeeded() {
    if (this.state.keyGranted) return false;
    if (!this.isDuckQuestComplete()) return false;
    if (!this.inventoryManager) return false;

    const keyItem = ITEMS_CONFIG.end_key;
    if (!keyItem) return false;

    this.inventoryManager.addItem({
      ...keyItem,
      quantity: 1
    });

    this.state.keyGranted = true;
    return true;
  }

  getNpcDialogue(npcKey, defaultLines = []) {
    const baseLines = Array.isArray(defaultLines) ? defaultLines : [];

    if (npcKey === 'frog') {
      return baseLines.concat(this.getFrogQuestLines());
    }

    if (npcKey === 'duck') {
      const shouldSkipIntro = this.state.talkedToDuck === true;
      const introSkipCount = shouldSkipIntro ? 2 : 0;
      let prunedBaseLines = introSkipCount > 0 ? baseLines.slice(introSkipCount) : baseLines;
      if (this.isDuckQuestComplete()) {
        prunedBaseLines = prunedBaseLines.filter((line) => !String(line?.text || '').toLowerCase().includes('lilith'));
      }
      const questLines = this.getDuckQuestLines();
      return prunedBaseLines.concat(questLines);
    }

    return baseLines;
  }

  getFrogQuestLines() {
    if (this.state.lilithDefeats <= 0) {
      return [
        { text: 'the slime is lilith\'s pet. fox, you must defeat it before reaching her.' },
        { text: 'defeat the slime and bring me the slime orb.' },
        { text: 'you must defeat the slime three times and return with each item.' }
      ];
    }

    if (this.state.lilithDefeats === 1) {
      return [
        { text: 'nice work. now defeat the slime again and bring me the slime blood.' }
      ];
    }

    if (this.state.lilithDefeats === 2) {
      return [
        { text: 'almost there. defeat the slime one last time and bring me the slime tear.' }
      ];
    }
    if (!this.state.slimeTurnedIn) {
      return [
        { text: 'you did it! now return to me with the slime items.' }
      ];
    }

    return [
      { text: 'thank you! now go find the duck, he has missions for you too.' }
    ];
  }

  getDuckQuestLines() {
    if (!this.isFrogQuestComplete() || !this.state.slimeTurnedIn) {
      return [
        { text: 'talk to lenny first. he will explain what you need to do.' }
      ];
    }

    if (this.state.orbDefeats <= 0) {
      return [
        { text: 'you already defeated the slime. now face lilith.' },
        { text: 'defeat lilith and bring me the orb blood.' },
        { text: 'you must defeat her three times\nand return with each item.' }
      ];
    }

    if (this.state.orbDefeats === 1) {
      return [
        { text: 'good job. defeat lilith again and bring me the orb fang.' }
      ];
    }

    if (this.state.orbDefeats === 2) {
      return [
        { text: 'one more time. defeat lilith again and bring me the orb tear.' }
      ];
    }

    const keyGrantedNow = this.grantKeyIfNeeded();
    if (keyGrantedNow) {
      return [
        { text: 'well, it was a nice journey, thank you for your service. now, find the door.' }
      ];
    }

    return [
      { text: 'well, it was a nice journey, thank you for your service. now, find the door.' }
    ];
  }

  getTrackerLines() {
    return this.getTrackerEntries().map((entry) => entry.text);
  }

  normalizeTrackerText(text) {
    const raw = String(text || '');
    return raw.replace(/defeat\s+lilith's\s+pet/gi, 'defeat the slime');
  }

  getTrackerEntries() {
    const entries = [];

    const keepNextIncomplete = (steps) => {
      const completed = steps.filter((step) => step.completed);
      const next = steps.find((step) => !step.completed);
      return next ? completed.concat(next) : completed;
    };

    const lilithProgress = Math.min(this.state.lilithDefeats, 3);
    const orbProgress = Math.min(this.state.orbDefeats, 3);
    const frogDone = this.isFrogQuestComplete();
    const duckDone = this.isDuckQuestComplete();
    const slimeTurnedIn = this.state.slimeTurnedIn === true;

    if (!frogDone) {
      const steps = [
        {
          id: 'frog_talk',
          text: 'talk to lenny near the forest clearing.',
          completed: this.state.talkedToFrog
        },
        {
          id: 'frog_boss',
          text: this.normalizeTrackerText(`defeat the slime ${lilithProgress}/3`),
          completed: lilithProgress >= 3
        },
        {
          id: 'frog_return',
          text: 'return to lenny with the slime items.',
          completed: lilithProgress >= 3
        }
      ];
      return keepNextIncomplete(steps);
    }

    entries.push({
      id: 'frog_talk',
      text: 'talk to lenny near the forest clearing.',
      completed: this.state.talkedToFrog
    });
    entries.push({
      id: 'frog_boss',
      text: this.normalizeTrackerText('defeat the slime 3/3'),
      completed: true
    });
    entries.push({
      id: 'frog_return',
      text: 'return to lenny with the slime items.',
      completed: slimeTurnedIn
    });

    if (!slimeTurnedIn) {
      return entries;
    }

    if (!duckDone) {
      const steps = [
        {
          id: 'duck_talk',
          text: 'talk to the duck by the lakeside.',
          completed: this.state.talkedToDuck
        },
        {
          id: 'duck_boss',
          text: this.normalizeTrackerText(`defeat lilith ${orbProgress}/3`),
          completed: orbProgress >= 3
        },
        {
          id: 'duck_return',
          text: 'return to the duck with the orb items.',
          completed: orbProgress >= 3
        }
      ];
      return entries.concat(keepNextIncomplete(steps));
    }

    entries.push({
      id: 'duck_talk',
      text: 'talk to the duck by the lakeside.',
      completed: this.state.talkedToDuck
    });
    entries.push({
      id: 'duck_boss',
      text: this.normalizeTrackerText('defeat lilith 3/3'),
      completed: true
    });
    entries.push({
      id: 'duck_return',
      text: 'return to the duck with the orb items.',
      completed: true
    });

    const finalSteps = [];
    if (!this.state.keyGranted) {
      finalSteps.push({
        id: 'duck_key',
        text: 'talk to the duck for the key.',
        completed: this.state.talkedToDuckForKey
      });
      return entries.concat(keepNextIncomplete(finalSteps));
    }

    finalSteps.push({
      id: 'duck_key',
      text: 'talk to the duck for the key.',
      completed: this.state.talkedToDuckForKey
    });
    finalSteps.push({
      id: 'end_door',
      text: 'find the door and unlock it.',
      completed: false
    });

    return entries.concat(keepNextIncomplete(finalSteps));
  }

  debugAdvance() {
    if (this.state.lilithDefeats < 3) {
      this.registerBossDefeat('boss_lilith');
      return 'boss_lilith';
    }

    if (this.state.orbDefeats < 3) {
      this.registerBossDefeat('boss_orb');
      return 'boss_orb';
    }

    return null;
  }
}
