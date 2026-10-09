import React from 'react';
import { CAMPAIGN_LEVELS } from '../game/levels';
import { PlayerStats } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { X, Star, Lock, Clock, EyeOff, Skull, ShieldAlert } from 'lucide-react';

interface LevelSelectModalProps {
  stats: PlayerStats;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  stats,
  onSelectLevel,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="w-full max-w-4xl bg-slate-950 border border-cyan-500/40 rounded-3xl p-5 sm:p-8 shadow-2xl relative text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 tracking-tight">
              MISSION PROTOCOLS
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-0.5">
              Select an infiltration sector. Achieve Speedrun and Ghost objectives for maximum rewards.
            </p>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 overflow-y-auto pr-1">
          {CAMPAIGN_LEVELS.map((level, idx) => {
            const isUnlocked = idx === 0 || stats.levelsCompleted.includes(level.id - 1);
            const isCompleted = stats.levelsCompleted.includes(level.id);
            const starsEarned = stats.levelStars[level.id] || 0;
            const hasSpeedrun = stats.speedrunCompleted[level.id] || false;
            const hasGhost = stats.ghostCompleted[level.id] || false;

            return (
              <div
                key={level.id}
                className={`relative rounded-2xl border p-4 sm:p-5 transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? isCompleted
                      ? 'bg-slate-900/90 border-cyan-500/40 hover:border-cyan-400 shadow-lg shadow-cyan-950/20'
                      : 'bg-slate-900/70 border-slate-700 hover:border-cyan-500/60'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div>
                  {/* Top row: Name & Stars */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                          SECTOR 0{level.id}
                        </span>
                        {level.guards.some((g) => g.type === 'boss') && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold uppercase font-mono">
                            BOSS
                          </span>
                        )}
                        {level.lasers.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase font-mono flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> LASERS
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        {level.name}
                      </h3>
                    </div>

                    {/* Stars */}
                    {isUnlocked && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((starNum) => (
                          <Star
                            key={starNum}
                            className={`w-4 h-4 ${
                              starsEarned >= starNum
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {level.subtitle}
                  </p>

                  {/* Challenge Goals breakdown */}
                  <div className="flex items-center gap-3 mt-3 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Skull className="w-3.5 h-3.5 text-rose-400" />
                      {level.targetCount} Targets
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        hasSpeedrun ? 'text-emerald-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Par: {level.parTime}s
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        hasGhost ? 'text-cyan-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      Ghost Mode
                    </span>
                  </div>
                </div>

                {/* Bottom Launch Button */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onSelectLevel(level.id);
                      }}
                      className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition font-mono flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isCompleted ? 'REPLAY SECTOR' : 'INFILTRATE'}
                    </button>
                  ) : (
                    <div className="w-full py-2.5 rounded-xl bg-slate-900 text-slate-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 font-mono">
                      <Lock className="w-3.5 h-3.5" />
                      SECTOR LOCKED (CLEAR PREVIOUS)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
