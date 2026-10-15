import React from 'react';
import { GameMetrics, LevelData } from '../types/game';
import { soundManager } from '../audio/soundManager';
import {
  Star,
  Clock,
  Skull,
  EyeOff,
  Flame,
  Zap,
  ArrowRight,
  RotateCcw,
  Home,
} from 'lucide-react';

interface VictoryModalProps {
  level: LevelData;
  metrics: GameMetrics;
  isEndless?: boolean;
  endlessWave?: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  metrics,
  isEndless,
  endlessWave,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onHome,
}) => {
  const isSpeedrunPassed = !isEndless && metrics.timeElapsed <= level.parTime;
  const isGhostPassed = !isEndless && metrics.alarmsTriggered === 0;

  // Star calculation
  let stars = 1;
  if (isSpeedrunPassed) stars++;
  if (isGhostPassed) stars++;

  const bonusCoins = (isSpeedrunPassed ? 30 : 0) + (isGhostPassed ? 40 : 0);
  const totalEarned = metrics.coinsEarned + bonusCoins;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-md bg-slate-950 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100 flex flex-col items-center text-center">
        {/* Glow halo */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/30">
          <Star className="w-10 h-10 fill-emerald-400 text-emerald-400" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
          {isEndless ? `WAVE ${endlessWave} CLEARED` : 'SECTOR LIBERATED'}
        </h2>
        <p className="text-xs font-mono text-emerald-400 mt-1 uppercase tracking-widest font-bold">
          {level.name}
        </p>

        {level.isBossEncounter && (
          <div className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-900 border border-rose-500/50 mt-3 mb-1 flex items-center justify-center gap-2 text-rose-300 font-bold text-xs font-mono uppercase tracking-widest animate-pulse">
            <Skull className="w-4 h-4 text-rose-400" />
            <span>CHAPTER CLIMAX BOSS OVERTHROWN!</span>
          </div>
        )}

        {/* Stars */}
        {!isEndless && (
          <div className="flex items-center gap-2 my-4">
            {[1, 2, 3].map((starIdx) => (
              <Star
                key={starIdx}
                className={`w-8 h-8 transition-all ${
                  stars >= starIdx
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                    : 'text-slate-800'
                }`}
              />
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 my-4 space-y-2.5 font-mono text-xs sm:text-sm">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" /> Time Elapsed:
            </span>
            <span className="font-bold text-white">
              {formatTime(metrics.timeElapsed)} {!isEndless && `(Par: ${level.parTime}s)`}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Skull className="w-4 h-4 text-rose-400" /> Hostiles Neutralized:
            </span>
            <span className="font-bold text-white">{metrics.kills}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> Max Combo:
            </span>
            <span className="font-bold text-amber-300">x{metrics.maxCombo || 1}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-purple-400" /> Alarms Raised:
            </span>
            <span className={`font-bold ${metrics.alarmsTriggered === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.alarmsTriggered === 0 ? '0 (GHOST MASTER)' : metrics.alarmsTriggered}
            </span>
          </div>

          {/* Credits summary */}
          <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-slate-200">
            <span className="flex items-center gap-2 font-bold text-amber-400">
              <Zap className="w-4 h-4 fill-amber-400" /> CREDITS SECURED:
            </span>
            <span className="font-black text-amber-300 text-base">
              +{totalEarned} C
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 mt-2">
          {hasNextLevel ? (
            <button
              onClick={() => {
                soundManager.playClick();
                onNextLevel();
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer font-mono"
            >
              <span>{isEndless ? 'NEXT SURVIVAL WAVE' : 'NEXT SECTOR'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                soundManager.playClick();
                onHome();
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer font-mono"
            >
              <span>CAMPAIGN COMPLETE! RETURN HOME</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                onReplay();
              }}
              className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" /> REPLAY
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                onHome();
              }}
              className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer font-mono"
            >
              <Home className="w-3.5 h-3.5" /> MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
