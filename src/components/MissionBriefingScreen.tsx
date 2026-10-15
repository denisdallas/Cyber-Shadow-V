import React, { useState, useEffect } from 'react';
import { LevelData } from '../types/game';
import { soundManager } from '../audio/soundManager';
import {
  Skull,
  Clock,
  ShieldAlert,
  Wind,
  Radio,
  Crosshair,
  ArrowRight,
  Zap,
  Info,
} from 'lucide-react';

interface MissionBriefingScreenProps {
  level: LevelData;
  isEndless?: boolean;
  endlessWave?: number;
  onDeploy: () => void;
}

const TACTICAL_TIPS = [
  'Backstabs ignore guard armor and instantly neutralize unshielded hostiles.',
  'Riot shields completely deflect frontal strikes. Strike from behind or flanks.',
  'Smoke bombs blind all hostiles within the cloud, letting you strike shielded guards from any direction.',
  'Throwing distraction decoys lures suspicious guards away from their patrol corridors.',
  'Vent ducts hide you completely and connect to distant escape shafts across the compound.',
  'Laser tripwires flash amber before activating. Time your dash or slip into a safe staging room.',
  'Bosses enter Overdrive in later phases. Watch for sweeping laser matrices and orbital painters.',
];

export const MissionBriefingScreen: React.FC<MissionBriefingScreenProps> = ({
  level,
  isEndless,
  endlessWave,
  onDeploy,
}) => {
  const [countdown, setCountdown] = useState(2.0);
  const [tip] = useState(() => TACTICAL_TIPS[Math.floor(Math.random() * TACTICAL_TIPS.length)]);
  const isBossLevel = !!level.isBossEncounter || level.guards.some((g) => g.type === 'boss');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0.1) {
          clearInterval(timer);
          onDeploy();
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        soundManager.playClick();
        onDeploy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDeploy]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050914e6] backdrop-blur-md select-none font-mono text-slate-100 overflow-hidden">
      {/* Scanlines and Vignette */}
      <div className="vignette" />
      <div className="scanlines" />

      {/* Tactical Briefing Panel */}
      <div className="relative z-10 w-full max-w-xl bg-gradient-to-b from-[#101c30f5] to-[#080f1df7] border border-[#45f4e8]/60 rounded-2xl p-5 sm:p-7 shadow-[0_0_44px_rgba(17,221,209,0.2)] text-left flex flex-col justify-between">
        {/* Top Banner Accent Line */}
        <div className="absolute top-0 left-0 w-24 h-1 bg-[#45f4e8] shadow-[0_0_12px_#45f4e8] rounded-tl-2xl" />

        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded bg-[#0a1220] border border-[#45f4e8]/50 text-[#45f4e8] text-[11px] font-black uppercase tracking-wider shadow-sm">
              {isEndless ? `SIMULATOR WAVE ${endlessWave}` : `SECTOR 0${level.id}`}
            </span>

            {level.chapter && (
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold">
                CH {level.chapter}
              </span>
            )}

            {isBossLevel && (
              <span className="px-2.5 py-1 rounded bg-[#ff397e]/20 border border-[#ff397e]/60 text-[#ff397e] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                <Skull className="w-3.5 h-3.5" /> MULTI-PHASE APEX BOSS
              </span>
            )}
          </div>

          <span className="text-[11px] text-[#7aa6b4]">
            INFILTRATION BRIEFING
          </span>
        </div>

        {/* Mission Title */}
        <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          {level.name}
        </h2>
        <p className="text-xs text-[#a8c3cd] mt-1 leading-relaxed">
          {level.subtitle}
        </p>

        {/* Mission Specs Grid Cards */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          <div className="bg-[#0c1727] border border-[#45f4e8]/30 rounded-xl p-3 flex flex-col items-center text-center">
            <Skull className="w-4 h-4 text-[#ff397e] mb-1" />
            <div className="text-[10px] text-slate-400 uppercase">Hostiles</div>
            <div className="text-sm font-black text-white mt-0.5">{level.targetCount} Targets</div>
          </div>

          <div className="bg-[#0c1727] border border-[#45f4e8]/30 rounded-xl p-3 flex flex-col items-center text-center">
            <Clock className="w-4 h-4 text-[#ffc857] mb-1" />
            <div className="text-[10px] text-slate-400 uppercase">Par Speed</div>
            <div className="text-sm font-black text-amber-300 mt-0.5">{level.parTime}s</div>
          </div>

          <div className="bg-[#0c1727] border border-[#45f4e8]/30 rounded-xl p-3 flex flex-col items-center text-center">
            <ShieldAlert className="w-4 h-4 text-[#45f4e8] mb-1" />
            <div className="text-[10px] text-slate-400 uppercase">Grid Lasers</div>
            <div className="text-sm font-black text-cyan-300 mt-0.5">
              {level.lasers.length > 0 ? `${level.lasers.length} Active` : 'None'}
            </div>
          </div>
        </div>

        {/* Tactical Intel Tip Box */}
        <div className="bg-[#081323]/80 border border-[#45f4e8]/25 rounded-xl p-3 mb-5 flex items-start gap-2.5 text-xs text-[#d9f4f3]">
          <Info className="w-4 h-4 text-[#45f4e8] shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="text-[#45f4e8] font-bold mr-1">DIRECTIVE:</span>
            <span>{tip}</span>
          </div>
        </div>

        {/* Infiltration Deployment Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="text-[11px] text-[#7aa6b4]">
            AUTODEPLOY IN: <span className="text-[#45f4e8] font-bold">{countdown}s</span>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onDeploy();
            }}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#0e756f] to-[#124d63] hover:from-[#138e87] hover:to-[#17627d] border border-[#45f4e8] text-[#effffb] font-black text-xs uppercase tracking-widest shadow-[0_0_18px_rgba(69,244,232,0.3)] transition-all cursor-pointer flex items-center gap-2"
          >
            <span>INFILTRATE NOW</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#45f4e8]" />
          </button>
        </div>
      </div>
    </div>
  );
};
