import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameEngine } from './game/engine';
import { CAMPAIGN_LEVELS, generateEndlessWave } from './game/levels';
import { loadPlayerStats, savePlayerStats } from './game/storage';
import { updateMissionProgress, claimMissionReward } from './game/dailyMissions';
import { GameMetrics, LevelData, PlayerStats, BossTelemetry } from './types/game';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { LevelSelectModal } from './components/LevelSelectModal';
import { ShopModal } from './components/ShopModal';
import { VictoryModal } from './components/VictoryModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BootLoadingScreen } from './components/BootLoadingScreen';
import { MissionBriefingScreen } from './components/MissionBriefingScreen';

type AppView = 'menu' | 'playing';

export default function App() {
  const [stats, setStats] = useState<PlayerStats>(() => loadPlayerStats());
  const [view, setView] = useState<AppView>('menu');
  const [isBooting, setIsBooting] = useState(true);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showShop, setShowShop] = useState(false);

  // Pending mission briefing state
  const [pendingBriefing, setPendingBriefing] = useState<{
    level: LevelData;
    endless: boolean;
    wave: number;
  } | null>(null);

  // Gameplay state
  const [isEndless, setIsEndless] = useState(false);
  const [endlessWave, setEndlessWave] = useState(1);
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [currentLevelData, setCurrentLevelData] = useState<LevelData>(CAMPAIGN_LEVELS[0]);

  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isDefeat, setIsDefeat] = useState(false);
  const [defeatReason, setDefeatReason] = useState('');
  const [guardsLeft, setGuardsLeft] = useState(0);
  const [totalGuards, setTotalGuards] = useState(0);
  const [bossTelemetry, setBossTelemetry] = useState<BossTelemetry | null>(null);

  const [metrics, setMetrics] = useState<GameMetrics>({
    kills: 0,
    combo: 0,
    maxCombo: 0,
    comboTimer: 0,
    alarmsTriggered: 0,
    timeElapsed: 0,
    coinsEarned: 0,
    distractionsUsed: 0,
    ventsUsed: 0,
    smokeUsed: 0,
  });

  // Track state ref to avoid stale closures in callbacks
  const statsRef = useRef(stats);
  statsRef.current = stats;

  const updateStats = useCallback((newStats: PlayerStats) => {
    setStats(newStats);
    savePlayerStats(newStats);
  }, []);

  const handleClaimDailyMission = useCallback((missionId: string) => {
    const updated = claimMissionReward(statsRef.current, missionId);
    updateStats(updated);
  }, [updateStats]);

  // Launch a level
  const startLevel = useCallback(
    (levelData: LevelData, endlessMode: boolean = false, waveNum: number = 1) => {
      if (engine) {
        engine.stop();
      }

      setCurrentLevelData(levelData);
      setIsEndless(endlessMode);
      setEndlessWave(waveNum);
      setIsPaused(false);
      setIsVictory(false);
      setIsDefeat(false);
      setDefeatReason('');
      setTotalGuards(levelData.guards.length);
      setGuardsLeft(levelData.guards.length);
      setBossTelemetry(null);

      const newEngine = new GameEngine({
        levelData,
        equippedSkinId: statsRef.current.equippedSkin,
        equippedTrailId: statsRef.current.equippedTrail,
        perks: statsRef.current.perks,
        onVictory: (finalMetrics) => {
          setIsVictory(true);

          let currentStats = { ...statsRef.current };
          let bonus = 0;

          if (!endlessMode) {
            const isSpeedrun = finalMetrics.timeElapsed <= levelData.parTime;
            const isGhost = finalMetrics.alarmsTriggered === 0;
            if (isSpeedrun) bonus += 30;
            if (isGhost) bonus += 40;

            let stars = 1;
            if (isSpeedrun) stars++;
            if (isGhost) stars++;

            if (!currentStats.levelsCompleted.includes(levelData.id)) {
              currentStats.levelsCompleted.push(levelData.id);
            }

            const prevStars = currentStats.levelStars[levelData.id] || 0;
            currentStats.levelStars[levelData.id] = Math.max(prevStars, stars);
            if (isSpeedrun) currentStats.speedrunCompleted[levelData.id] = true;
            if (isGhost) currentStats.ghostCompleted[levelData.id] = true;

            if (isGhost) {
              currentStats = updateMissionProgress(currentStats, 'ghost_runs', 1);
            }
          } else {
            currentStats.highestWave = Math.max(currentStats.highestWave, waveNum);
            bonus += waveNum * 20;
            currentStats = updateMissionProgress(currentStats, 'endless_wave', waveNum);
          }

          // Update daily mission progression
          currentStats = updateMissionProgress(currentStats, 'kills', finalMetrics.kills);
          if (finalMetrics.distractionsUsed > 0) {
            currentStats = updateMissionProgress(currentStats, 'distractions', finalMetrics.distractionsUsed);
          }
          if (finalMetrics.ventsUsed > 0) {
            currentStats = updateMissionProgress(currentStats, 'vents', finalMetrics.ventsUsed);
          }
          if (finalMetrics.smokeUsed > 0) {
            currentStats = updateMissionProgress(currentStats, 'smoke', finalMetrics.smokeUsed);
          }
          if (finalMetrics.maxCombo >= 3) {
            currentStats = updateMissionProgress(currentStats, 'combo', 1);
          }

          currentStats.coins += finalMetrics.coinsEarned + bonus;
          currentStats.totalKills += finalMetrics.kills;
          updateStats(currentStats);
        },
        onDefeat: (reason, finalMetrics) => {
          setIsDefeat(true);
          setDefeatReason(reason);

          // Even on defeat, retain collected in-game credits, kills, and mission progression
          let currentStats = { ...statsRef.current };
          currentStats.coins += finalMetrics.coinsEarned;
          currentStats.totalKills += finalMetrics.kills;

          currentStats = updateMissionProgress(currentStats, 'kills', finalMetrics.kills);
          if (finalMetrics.distractionsUsed > 0) {
            currentStats = updateMissionProgress(currentStats, 'distractions', finalMetrics.distractionsUsed);
          }
          if (finalMetrics.ventsUsed > 0) {
            currentStats = updateMissionProgress(currentStats, 'vents', finalMetrics.ventsUsed);
          }
          if (finalMetrics.smokeUsed > 0) {
            currentStats = updateMissionProgress(currentStats, 'smoke', finalMetrics.smokeUsed);
          }
          if (finalMetrics.maxCombo >= 3) {
            currentStats = updateMissionProgress(currentStats, 'combo', 1);
          }

          updateStats(currentStats);
        },
        onStatsUpdate: (m, aliveCount, boss) => {
          setMetrics({ ...m });
          setGuardsLeft(aliveCount);
          setBossTelemetry(boss || null);
        },
      });

      setEngine(newEngine);
      setView('playing');
      setShowLevelSelect(false);
      newEngine.start();
    },
    [engine, updateStats]
  );

  const handleSelectLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    setShowLevelSelect(false);
    const lvl = CAMPAIGN_LEVELS.find((l) => l.id === levelId) || CAMPAIGN_LEVELS[0];
    setPendingBriefing({ level: lvl, endless: false, wave: 1 });
  };

  const handleStartEndless = () => {
    const wave1 = generateEndlessWave(1);
    setPendingBriefing({ level: wave1, endless: true, wave: 1 });
  };

  const handleNextLevel = () => {
    setIsVictory(false);
    if (isEndless) {
      const nextWave = endlessWave + 1;
      const waveData = generateEndlessWave(nextWave);
      setPendingBriefing({ level: waveData, endless: true, wave: nextWave });
    } else {
      const nextId = currentLevelId + 1;
      const nextLvl = CAMPAIGN_LEVELS.find((l) => l.id === nextId);
      if (nextLvl) {
        setCurrentLevelId(nextId);
        setPendingBriefing({ level: nextLvl, endless: false, wave: 1 });
      } else {
        handleGoHome();
      }
    }
  };

  const handleReplay = () => {
    startLevel(currentLevelData, isEndless, endlessWave);
  };

  const handleGoHome = () => {
    if (engine) {
      engine.stop();
      setEngine(null);
    }
    setIsPaused(false);
    setIsVictory(false);
    setIsDefeat(false);
    setView('menu');
  };

  const handlePause = () => {
    if (engine && !isVictory && !isDefeat) {
      engine.pause();
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (engine) {
      engine.resume();
      setIsPaused(false);
    }
  };

  const handleDeploySmoke = () => {
    if (engine) {
      engine.deploySmokeBomb();
    }
  };

  const handleToggleDistraction = () => {
    if (engine) {
      engine.toggleAimDistraction();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070a0f] text-slate-100 flex flex-col">
      {/* Offline PWA Indicator */}
      <OfflineIndicator />

      {/* Boot Loading Screen on Initial Startup */}
      {isBooting && (
        <BootLoadingScreen onComplete={() => setIsBooting(false)} />
      )}

      {/* Mission Tactical Briefing Loading Screen */}
      {pendingBriefing && (
        <MissionBriefingScreen
          level={pendingBriefing.level}
          isEndless={pendingBriefing.endless}
          endlessWave={pendingBriefing.wave}
          onDeploy={() => {
            const target = pendingBriefing;
            setPendingBriefing(null);
            startLevel(target.level, target.endless, target.wave);
          }}
        />
      )}

      {/* Main Menu View */}
      {view === 'menu' && (
        <MainMenu
          stats={stats}
          onStartCampaign={() => setShowLevelSelect(true)}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onStartEndless={handleStartEndless}
          onOpenShop={() => setShowShop(true)}
          onClaimDailyMission={handleClaimDailyMission}
        />
      )}

      {/* Playing View (Canvas & HUD) */}
      {view === 'playing' && (
        <div className="relative w-full h-full flex flex-col overflow-hidden">
          <GameCanvas engine={engine} onPause={handlePause} />

          {engine && (
            <HUD
              levelTitle={isEndless ? `SURVIVAL WAVE ${endlessWave}` : currentLevelData.name}
              guardsLeft={guardsLeft}
              totalGuards={totalGuards}
              metrics={metrics}
              boss={bossTelemetry}
              parTime={!isEndless ? currentLevelData.parTime : undefined}
              smokeBombs={engine.player.smokeBombs}
              maxSmokeBombs={engine.player.maxSmokeBombs}
              distractionCount={engine.player.distractionCount}
              maxDistractions={engine.player.maxDistractions}
              isAimingDistraction={engine.player.isAimingDistraction}
              shieldActive={engine.player.shieldActive}
              hasShield={engine.player.hasShield}
              spawnGraceTimer={engine.spawnGraceTimer}
              isSafeZone={engine.isPlayerInSafeZone()}
              onDeploySmoke={handleDeploySmoke}
              onToggleDistraction={handleToggleDistraction}
              onPause={handlePause}
            />
          )}

          {/* Pause Modal */}
          {isPaused && (
            <PauseModal
              onResume={handleResume}
              onRestart={handleReplay}
              onHome={handleGoHome}
            />
          )}

          {/* Victory Modal */}
          {isVictory && (
            <VictoryModal
              level={currentLevelData}
              metrics={metrics}
              isEndless={isEndless}
              endlessWave={endlessWave}
              hasNextLevel={isEndless || currentLevelId < CAMPAIGN_LEVELS.length}
              onNextLevel={handleNextLevel}
              onReplay={handleReplay}
              onHome={handleGoHome}
            />
          )}

          {/* Defeat Modal */}
          {isDefeat && (
            <GameOverModal
              level={currentLevelData}
              reason={defeatReason}
              metrics={metrics}
              onRetry={handleReplay}
              onOpenShop={() => setShowShop(true)}
              onHome={handleGoHome}
            />
          )}
        </div>
      )}

      {/* Level Select Modal */}
      {showLevelSelect && (
        <LevelSelectModal
          stats={stats}
          onSelectLevel={handleSelectLevel}
          onClose={() => setShowLevelSelect(false)}
        />
      )}

      {/* Shop Modal */}
      {showShop && (
        <ShopModal
          stats={stats}
          onUpdateStats={updateStats}
          onClose={() => setShowShop(false)}
        />
      )}
    </div>
  );
}
