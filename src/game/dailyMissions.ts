import { DailyMission, DailyMissionState, MissionObjectiveType, PlayerStats } from '../types/game';

interface MissionTemplate {
  type: MissionObjectiveType;
  title: string;
  description: string;
  target: number;
  reward: number;
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    type: 'kills',
    title: 'Silent Blade',
    description: 'Neutralize 8 hostiles with melee takedowns.',
    target: 8,
    reward: 150,
  },
  {
    type: 'ghost_runs',
    title: 'Ghost Infiltrator',
    description: 'Clear 2 sectors without raising any alarms.',
    target: 2,
    reward: 220,
  },
  {
    type: 'combo',
    title: 'Chain Executioner',
    description: 'Achieve a x3 or higher combo chain streak.',
    target: 1,
    reward: 180,
  },
  {
    type: 'distractions',
    title: 'Acoustic Decoy',
    description: 'Throw 4 distraction lures to manipulate enemy positions.',
    target: 4,
    reward: 160,
  },
  {
    type: 'vents',
    title: 'Duct Rat',
    description: 'Slip through secret vent shortcuts 3 times.',
    target: 3,
    reward: 140,
  },
  {
    type: 'smoke',
    title: 'Smoke Mirage',
    description: 'Deploy 3 tactical smoke bombs to evade detection.',
    target: 3,
    reward: 150,
  },
  {
    type: 'endless_wave',
    title: 'Arena Survivor',
    description: 'Survive to Wave 3 or higher in Endless Mode.',
    target: 3,
    reward: 250,
  },
];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Pseudo-random deterministic or randomized 3 missions per day
export function getOrGenerateDailyMissions(existingState?: DailyMissionState): DailyMissionState {
  const today = getTodayDateString();

  if (existingState && existingState.date === today && existingState.missions.length >= 3) {
    return existingState;
  }

  // Shuffle template pool using date as seed or current time
  const shuffled = [...MISSION_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  const missions: DailyMission[] = selected.map((tpl, idx) => ({
    id: `daily-${today}-${idx}-${tpl.type}`,
    type: tpl.type,
    title: tpl.title,
    description: tpl.description,
    target: tpl.target,
    current: 0,
    reward: tpl.reward,
    claimed: false,
  }));

  return {
    date: today,
    missions,
  };
}

export function updateMissionProgress(
  stats: PlayerStats,
  type: MissionObjectiveType,
  amount: number = 1
): PlayerStats {
  const dailyState = getOrGenerateDailyMissions(stats.dailyMissions);
  let updatedAny = false;

  const updatedMissions = dailyState.missions.map((m) => {
    if (m.type === type && !m.claimed && m.current < m.target) {
      updatedAny = true;
      return {
        ...m,
        current: Math.min(m.target, m.current + amount),
      };
    }
    return m;
  });

  if (!updatedAny) return stats;

  return {
    ...stats,
    dailyMissions: {
      ...dailyState,
      missions: updatedMissions,
    },
  };
}

export function claimMissionReward(stats: PlayerStats, missionId: string): PlayerStats {
  const dailyState = getOrGenerateDailyMissions(stats.dailyMissions);
  let rewardCoins = 0;

  const updatedMissions = dailyState.missions.map((m) => {
    if (m.id === missionId && m.current >= m.target && !m.claimed) {
      rewardCoins = m.reward;
      return {
        ...m,
        claimed: true,
      };
    }
    return m;
  });

  if (rewardCoins === 0) return stats;

  return {
    ...stats,
    coins: stats.coins + rewardCoins,
    dailyMissions: {
      ...dailyState,
      missions: updatedMissions,
    },
  };
}
