import React, { useState } from 'react';
import { CAMPAIGN_LEVELS } from '../game/levels';
import { PlayerStats } from '../types/game';
import { soundManager } from '../audio/soundManager';
import {
  X,
  Star,
  Lock,
  Clock,
  EyeOff,
  Skull,
  ShieldAlert,
  Layers,
  Zap,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface LevelSelectModalProps {
  stats: PlayerStats;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

const CHAPTERS = [
  { id: 0, title: 'ALL SECTORS', subtitle: 'Complete Campaign Overview' },
  {
    id: 1,
    title: 'CH 1: THE OUTSKIRTS',
    subtitle: 'Industrial slums, riot depots, security laser tripwires & cryo maze.',
    sectorRange: 'Sectors 01 - 04',
  },
  {
    id: 2,
    title: 'CH 2: MEGACORP CITADEL',
    subtitle: 'Corporate high-security data vault & Sector 07 Apex Inquisitor Boss.',
    sectorRange: 'Sectors 05 - 07',
  },
  {
    id: 3,
    title: 'CH 3: ORBITAL SPIRE',
    subtitle: 'Plasma skybridges, nanite labs & Sector 10 Lord Vanguard Climax Boss.',
    sectorRange: 'Sectors 08 - 10',
  },
];

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  stats,
  onSelectLevel,
  onClose,
}) => {
  const [activeChapter, setActiveChapter] = useState<number>(0);

  // Filter levels based on selected chapter
  const filteredLevels =
    activeChapter === 0
      ? CAMPAIGN_LEVELS
      : CAMPAIGN_LEVELS.filter((lvl) => lvl.chapter === activeChapter);

  // Calculate chapter stats
  const totalStarsInChapter = (chapId: number) => {
    const levelsInChap =
      chapId === 0
        ? CAMPAIGN_LEVELS
        : CAMPAIGN_LEVELS.filter((l) => l.chapter === chapId);
    let earned = 0;
    for (const lvl of levelsInChap) {
      earned += stats.levelStars[lvl.id] || 0;
    }
    return { earned, total: levelsInChap.length * 3 };
  };

  const selectedChapStats = totalStarsInChapter(activeChapter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="w-full max-w-5xl bg-slate-950 border border-cyan-500/40 rounded-3xl p-4 sm:p-7 shadow-2xl relative text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 tracking-tight">
                CAMPAIGN CHAPTERS
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
              Select an infiltration sector. Master Speedrun and Ghost objectives to unlock elite stealth ratings.
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

        {/* Chapter Selection Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 pb-2">
          {CHAPTERS.map((chap) => {
            const isSelected = activeChapter === chap.id;
            const chapProgress = totalStarsInChapter(chap.id);

            return (
              <button
                key={chap.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveChapter(chap.id);
                }}
                className={`flex flex-col text-left p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900 border-cyan-400 text-white shadow-lg shadow-cyan-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] sm:text-xs font-black tracking-wide truncate">
                    {chap.title}
                  </span>
                  {chap.id !== 0 && (
                    <span className="text-[10px] font-mono text-cyan-400 font-bold ml-1">
                      {chapProgress.earned}/{chapProgress.total} ⭐
                    </span>
                  )}
                </div>
                {chap.sectorRange && (
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {chap.sectorRange}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Chapter Lore Banner */}
        {activeChapter !== 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 my-2 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-slate-400">{CHAPTERS[activeChapter].subtitle}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {selectedChapStats.earned} / {selectedChapStats.total} STARS
              </span>
            </div>
          </div>
        )}

        {/* Level Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 overflow-y-auto pr-1">
          {filteredLevels.map((level) => {
            const isUnlocked = level.id === 1 || stats.levelsCompleted.includes(level.id - 1);
            const isCompleted = stats.levelsCompleted.includes(level.id);
            const starsEarned = stats.levelStars[level.id] || 0;
            const hasSpeedrun = stats.speedrunCompleted[level.id] || false;
            const hasGhost = stats.ghostCompleted[level.id] || false;
            const isBossLevel = !!level.isBossEncounter || level.guards.some((g) => g.type === 'boss');

            return (
              <div
                key={level.id}
                className={`relative rounded-2xl border p-4 sm:p-5 transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? isBossLevel
                      ? isCompleted
                        ? 'bg-gradient-to-b from-rose-950/40 via-slate-900/90 to-slate-950 border-rose-500/60 hover:border-rose-400 shadow-xl shadow-rose-950/30'
                        : 'bg-gradient-to-b from-rose-950/30 to-slate-900/80 border-rose-500/50 hover:border-rose-400 shadow-lg shadow-rose-950/20'
                      : isCompleted
                      ? 'bg-slate-900/90 border-cyan-500/40 hover:border-cyan-400 shadow-lg shadow-cyan-950/20'
                      : 'bg-slate-900/70 border-slate-700 hover:border-cyan-500/60'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div>
                  {/* Top row: Name & Stars */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                          SECTOR {level.id < 10 ? `0${level.id}` : level.id}
                        </span>

                        {level.chapter && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold font-mono">
                            CH {level.chapter}
                          </span>
                        )}

                        {isBossLevel && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/60 text-[10px] font-black uppercase font-mono flex items-center gap-1 animate-pulse">
                            <Skull className="w-3 h-3 text-rose-400" /> MULTI-PHASE BOSS
                          </span>
                        )}

                        {level.lasers.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase font-mono flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> {level.lasers.length} LASERS
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white mt-1">
                        {level.name}
                      </h3>
                    </div>

                    {/* Stars */}
                    {isUnlocked && (
                      <div className="flex items-center gap-1 shrink-0">
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
                  <div className="flex items-center gap-3 mt-3 text-[11px] font-mono text-slate-400 flex-wrap">
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
                      className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition font-mono flex items-center justify-center gap-2 cursor-pointer ${
                        isBossLevel
                          ? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 shadow-md shadow-rose-950/40'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> REPLAY SECTOR
                        </>
                      ) : (
                        <>
                          INFILTRATE <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
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
