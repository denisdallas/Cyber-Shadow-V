import React from 'react';
import { GameMetrics, BossTelemetry } from '../types/game';
import { soundManager } from '../audio/soundManager';
import {
  Pause,
  Volume2,
  VolumeX,
  Music,
  Wind,
  Shield,
  Clock,
  Coins,
  Crosshair,
  Flame,
  Radio,
  Zap,
  Skull,
} from 'lucide-react';

interface HUDProps {
  levelTitle: string;
  guardsLeft: number;
  totalGuards: number;
  metrics: GameMetrics;
  boss?: BossTelemetry | null;
  parTime?: number;
  smokeBombs: number;
  maxSmokeBombs: number;
  distractionCount: number;
  maxDistractions: number;
  isAimingDistraction: boolean;
  shieldActive: boolean;
  hasShield: boolean;
  spawnGraceTimer?: number;
  isSafeZone?: boolean;
  onDeploySmoke: () => void;
  onToggleDistraction: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  levelTitle,
  guardsLeft,
  totalGuards,
  metrics,
  boss,
  parTime,
  smokeBombs,
  maxSmokeBombs,
  distractionCount,
  maxDistractions,
  isAimingDistraction,
  shieldActive,
  hasShield,
  spawnGraceTimer = 0,
  isSafeZone = false,
  onDeploySmoke,
  onToggleDistraction,
  onPause,
}) => {
  const [mutedStates, setMutedStates] = React.useState(soundManager.getMutedState());

  const toggleSfx = () => {
    soundManager.toggleMute();
    setMutedStates(soundManager.getMutedState());
  };

  const toggleMusic = () => {
    soundManager.toggleMusic();
    setMutedStates(soundManager.getMutedState());
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none font-mono">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Level & Targets Left */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl px-3 sm:px-4 py-2 backdrop-blur-md shadow-lg shadow-cyan-950/40">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              {levelTitle}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Crosshair className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                {guardsLeft} / {totalGuards} HOSTILES
              </span>
            </div>
          </div>

          {/* Time & Speedrun Par */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2 backdrop-blur-md">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-slate-200">
              {formatTime(metrics.timeElapsed)}
            </span>
            {parTime && (
              <span className={`text-xs ml-1 ${metrics.timeElapsed <= parTime ? 'text-emerald-400' : 'text-rose-400'}`}>
                (PAR: {parTime}s)
              </span>
            )}
          </div>
        </div>

        {/* Right: Credits Earned & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Credits in run */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/40 rounded-xl px-3 py-2 backdrop-blur-md shadow-lg shadow-amber-950/30">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-300">
              +{metrics.coinsEarned}
            </span>
          </div>

          {/* Audio Toggles */}
          <button
            onClick={toggleSfx}
            title="Toggle SFX"
            className="w-9 h-9 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
          >
            {mutedStates.sfxMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
          <button
            onClick={toggleMusic}
            title="Toggle Music"
            className="w-9 h-9 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Music className={`w-4 h-4 ${mutedStates.musicMuted ? 'text-slate-500' : 'text-purple-400'}`} />
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            title="Pause Game"
            className="w-9 h-9 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Boss Health & Phase Status Banner */}
      {boss && (
        <div className="w-full max-w-xl mx-auto bg-slate-950/95 border border-rose-500/60 rounded-2xl p-2.5 sm:p-3.5 backdrop-blur-md shadow-2xl shadow-rose-950/50 flex flex-col gap-1.5 my-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skull className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-black text-white tracking-wider uppercase">
                {boss.name}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold font-mono">
                PHASE {boss.phase} / {boss.maxPhases}
              </span>
              {boss.shieldActive && (
                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/50 text-[9px] font-bold flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" /> KINETIC SHIELD
                </span>
              )}
            </div>
            <div className="text-xs font-bold font-mono text-rose-400">
              {boss.hp} / {boss.maxHp} HP
            </div>
          </div>

          {/* Segmented HP Gauge */}
          <div className="w-full h-3 bg-slate-900 rounded-lg p-0.5 border border-slate-700/80 flex gap-1">
            {Array.from({ length: boss.maxHp }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-full rounded-sm transition-all duration-300 ${
                  idx < boss.hp
                    ? boss.phase === 3
                      ? 'bg-gradient-to-r from-fuchsia-500 to-rose-500 shadow-sm shadow-fuchsia-500/50'
                      : boss.phase === 2
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500 shadow-sm shadow-rose-500/50'
                      : 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-sm shadow-cyan-400/50'
                    : 'bg-slate-800/60'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="text-slate-400 truncate">{boss.subtitle}</span>
            {boss.attackState && boss.attackState !== 'idle' && (
              <span className="text-rose-400 font-bold uppercase animate-pulse flex items-center gap-1">
                <Zap className="w-3 h-3" /> {boss.attackState.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Middle Alerts / Combo Chain Meter / Infiltration Cloak Status */}
      <div className="flex flex-col items-center justify-center gap-2">
        {/* Spawn Infiltration Cloak Banner */}
        {spawnGraceTimer > 0 && (
          <div className="bg-slate-950/90 border border-cyan-400 rounded-full px-4 py-1.5 backdrop-blur-md shadow-lg shadow-cyan-500/25 flex items-center gap-2 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs sm:text-sm font-extrabold text-cyan-300 tracking-wider">
              CLOAKED: INFILTRATION PROTOCOL ({spawnGraceTimer.toFixed(1)}s)
            </span>
          </div>
        )}

        {/* Staging Safe Zone Banner */}
        {isSafeZone && spawnGraceTimer <= 0 && (
          <div className="bg-slate-950/85 border border-emerald-400/70 rounded-full px-4 py-1 backdrop-blur-md shadow-md shadow-emerald-500/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-300 tracking-wider uppercase">
              SECURITY AIRLOCK [SAFE ZONE]
            </span>
          </div>
        )}

        {metrics.combo > 1 && (
          <div className="bg-black/80 border border-amber-500/70 rounded-2xl px-5 py-2 backdrop-blur-md shadow-xl shadow-amber-500/20 animate-bounce flex flex-col items-center">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-base sm:text-lg tracking-wider">
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
              <span>COMBO x{metrics.combo}</span>
            </div>
            {/* Combo Timer Bar */}
            <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-75"
                style={{ width: `${Math.max(0, (metrics.comboTimer / 5.0) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Gadgets & Status */}
      <div className="flex items-end justify-between gap-3 w-full">
        {/* Shield Status Badge */}
        <div className="flex items-center gap-2">
          {hasShield && (
            <div
              className={`flex items-center gap-2 rounded-xl px-3 py-2 border backdrop-blur-md text-xs font-bold transition-all ${
                shieldActive
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                  : 'bg-slate-900/60 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <Shield className={`w-4 h-4 ${shieldActive ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span>{shieldActive ? 'DEFLECTOR ACTIVE' : 'SHIELD DEPLETED'}</span>
            </div>
          )}
        </div>

        {/* Tactical Gadget Buttons */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          {/* Distraction Lure Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleDistraction();
            }}
            disabled={distractionCount <= 0}
            className={`group relative flex items-center gap-2.5 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold uppercase tracking-wider text-xs sm:text-sm shadow-xl transition-all active:scale-95 cursor-pointer ${
              isAimingDistraction
                ? 'bg-amber-400 text-slate-950 border border-amber-200 shadow-amber-400/40 animate-pulse'
                : distractionCount > 0
                ? 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-blue-500/25 border border-sky-400/40'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Radio className={`w-4 h-4 sm:w-5 sm:h-5 ${distractionCount > 0 ? 'text-sky-200 animate-pulse' : 'text-slate-500'}`} />
            <div className="text-left">
              <div className="font-extrabold flex items-center gap-1.5">
                <span>{isAimingDistraction ? 'AIMING...' : 'DECOY'}</span>
                <span className="text-[10px] opacity-75 font-mono hidden sm:inline">[Q]</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold opacity-90">
                {distractionCount} / {maxDistractions}
              </div>
            </div>
          </button>

          {/* Smoke Bomb Gadget Trigger Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onDeploySmoke();
            }}
            disabled={smokeBombs <= 0}
            className={`group relative flex items-center gap-2.5 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold uppercase tracking-wider text-xs sm:text-sm shadow-xl transition-all active:scale-95 cursor-pointer ${
              smokeBombs > 0
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-cyan-500/25 border border-cyan-300/40'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Wind className={`w-4 h-4 sm:w-5 sm:h-5 ${smokeBombs > 0 ? 'text-slate-950 animate-pulse' : 'text-slate-500'}`} />
            <div className="text-left">
              <div className="font-extrabold flex items-center gap-1.5">
                <span>SMOKE</span>
                <span className="text-[10px] opacity-75 font-mono hidden sm:inline">[E]</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold opacity-90">
                {smokeBombs} / {maxSmokeBombs}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

