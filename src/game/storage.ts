import { PlayerStats } from '../types/game';
import { getOrGenerateDailyMissions } from './dailyMissions';

const STORAGE_KEY = 'cyber_hunter_save_v1';

const DEFAULT_STATS: PlayerStats = {
  coins: 50, // Starting bonus
  highestWave: 0,
  totalKills: 0,
  levelsCompleted: [],
  levelStars: {},
  speedrunCompleted: {},
  ghostCompleted: {},
  equippedSkin: 'default',
  equippedTrail: 'cyan_edge',
  unlockedSkins: ['default'],
  unlockedTrails: ['cyan_edge'],
  perks: {
    speed: 0,
    strikeRange: 0,
    smokeCapacity: 0,
    cyberShield: 0,
  },
};

export function loadPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const loaded: PlayerStats = {
      ...DEFAULT_STATS,
      ...parsed,
      perks: {
        ...DEFAULT_STATS.perks,
        ...(parsed.perks || {}),
      },
      levelStars: parsed.levelStars || {},
      speedrunCompleted: parsed.speedrunCompleted || {},
      ghostCompleted: parsed.ghostCompleted || {},
      unlockedSkins: parsed.unlockedSkins || ['default'],
      unlockedTrails: parsed.unlockedTrails || ['cyan_edge'],
    };

    // Ensure daily missions are initialized for today's date
    loaded.dailyMissions = getOrGenerateDailyMissions(loaded.dailyMissions);
    return loaded;
  } catch {
    const fallback = { ...DEFAULT_STATS };
    fallback.dailyMissions = getOrGenerateDailyMissions();
    return fallback;
  }
}

export function savePlayerStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save player stats:', err);
  }
}
