export type GuardType = 'standard' | 'shielded' | 'armored' | 'sniper' | 'boss';

export type GuardState = 'patrol' | 'suspicious' | 'alert' | 'attacking' | 'dead';

export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LaserTrap {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
  cycleTime: number; // in seconds
  activeDuration: number;
  timer: number;
  warningDuration?: number; // Pre-activation warning phase (e.g. 0.8s)
  isWarning?: boolean;
}

export interface Vent {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  connectedVentId?: string;
}

export interface SmokeCloud {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  lifetime: number; // in seconds
  duration: number;
}

export interface DistractionLure {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  progress: number; // 0 to 1
  duration: number;
  landed: boolean;
  soundRadius: number;
  soundWaveLife: number; // 0 to 1 for expanding ripple animation
  maxSoundWaveLife: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'square' | 'line';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  angle: number; // in radians
  targetPos: Point | null;
  inVent: boolean;
  ventId: string | null;
  smokeBombs: number;
  maxSmokeBombs: number;
  distractionCount: number;
  maxDistractions: number;
  isAimingDistraction: boolean;
  hasShield: boolean; // cyber deflector shield
  shieldActive: boolean;
  strikeRange: number;
  skinId: string;
  trailId: string;
  isAttacking: boolean;
  attackCooldown: number;
  attackAnimTimer: number;
}

export interface BossTelemetry {
  id: string;
  name: string;
  subtitle: string;
  phase: number;
  maxPhases: number;
  hp: number;
  maxHp: number;
  attackState?: string;
  shieldActive: boolean;
}

export interface Guard {
  id: string;
  type: GuardType;
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number; // in radians
  fov: number; // field of view in radians (e.g. 70 deg)
  visionRange: number;
  state: GuardState;
  patrolPoints: Point[];
  currentPatrolIdx: number;
  patrolForward: boolean; // For reversible or cyclic routes
  waitTimer: number;
  alertTimer: number; // time spent in alert
  hp: number;
  maxHp: number;
  lastKnownPlayerPos: Point | null;
  investigatePos: Point | null;
  investigateTimer: number;
  shootCooldown: number;
  sweepAngleSpeed: number; // for rotating sweeps
  bossSpecialTimer?: number;
  // Multi-Phase Boss Encounter Mechanics
  bossPhase?: number;
  maxBossPhases?: number;
  bossPhaseHp?: number;
  maxBossPhaseHp?: number;
  bossShieldActive?: boolean;
  bossTitle?: string;
  bossSubtitle?: string;
  bossAttackState?: 'idle' | 'charging' | 'slam' | 'laser_sweep' | 'summon_minions' | 'overdrive' | 'orbital_strike';
  bossAttackProgress?: number;
  laserSweepAngle?: number;
  targetedStrikePos?: Point | null;
  targetedStrikeTimer?: number;
}

export interface LevelData {
  id: number;
  chapter?: number; // 1, 2, or 3
  chapterName?: string;
  isBossEncounter?: boolean;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  playerStart: Point;
  targetCount: number;
  parTime: number; // Target seconds for speedrun badge
  walls: Wall[];
  lasers: LaserTrap[];
  vents: Vent[];
  safeZone?: { x1: number; y1: number; x2: number; y2: number }; // Infiltration staging safe room where player cannot be spotted
  guards: Omit<Guard, 'state' | 'alertTimer' | 'waitTimer' | 'lastKnownPlayerPos' | 'investigatePos' | 'investigateTimer' | 'patrolForward' | 'shootCooldown'>[];
}

export interface SkinItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unlocked: boolean;
  color: string;
  glowColor: string;
  visorColor: string;
}

export interface TrailItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unlocked: boolean;
  color: string;
}

export interface PerkLevels {
  speed: number;       // +10% move speed per level (max 4)
  strikeRange: number; // +15% kill radius per level (max 4)
  smokeCapacity: number; // +1 smoke bomb per level (max 3)
  cyberShield: number; // deflect 1 fatal attack (0 or 1)
}

export type MissionObjectiveType =
  | 'kills'
  | 'ghost_runs'
  | 'combo'
  | 'distractions'
  | 'vents'
  | 'smoke'
  | 'endless_wave';

export interface DailyMission {
  id: string;
  type: MissionObjectiveType;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  claimed: boolean;
}

export interface DailyMissionState {
  date: string; // YYYY-MM-DD
  missions: DailyMission[];
}

export interface PlayerStats {
  coins: number;
  highestWave: number;
  totalKills: number;
  levelsCompleted: number[];
  levelStars: Record<number, number>; // levelId -> stars (1-3)
  speedrunCompleted: Record<number, boolean>;
  ghostCompleted: Record<number, boolean>;
  equippedSkin: string;
  equippedTrail: string;
  unlockedSkins: string[];
  unlockedTrails: string[];
  perks: PerkLevels;
  dailyMissions?: DailyMissionState;
}

export interface GameMetrics {
  kills: number;
  combo: number;
  maxCombo: number;
  comboTimer: number;
  alarmsTriggered: number;
  timeElapsed: number;
  coinsEarned: number;
  distractionsUsed: number;
  ventsUsed: number;
  smokeUsed: number;
}
