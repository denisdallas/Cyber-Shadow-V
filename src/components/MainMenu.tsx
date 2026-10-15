import React, { useState } from 'react';
import { PlayerStats, DailyMission } from '../types/game';
import { CAMPAIGN_LEVELS } from '../game/levels';
import { soundManager } from '../audio/soundManager';
import { PWAInstallBanner } from './PWAInstallBanner';
import { getOrGenerateDailyMissions } from '../game/dailyMissions';
import {
  Play,
  Flame,
  ShoppingBag,
  Volume2,
  VolumeX,
  Music,
  Shield,
  Crosshair,
  Award,
  Zap,
  CheckCircle2,
  Calendar,
  Gift,
  EyeOff,
  Radio,
  Wind,
  Footprints,
} from 'lucide-react';

interface MainMenuProps {
  stats: PlayerStats;
  onStartCampaign: () => void;
  onOpenLevelSelect: () => void;
  onStartEndless: () => void;
  onOpenShop: () => void;
  onClaimDailyMission: (missionId: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  stats,
  onOpenLevelSelect,
  onStartEndless,
  onOpenShop,
  onClaimDailyMission,
}) => {
  const [mutedStates, setMutedStates] = useState(soundManager.getMutedState());

  const toggleSfx = () => {
    soundManager.toggleMute();
    setMutedStates(soundManager.getMutedState());
  };

  const toggleMusic = () => {
    soundManager.toggleMusic();
    setMutedStates(soundManager.getMutedState());
  };

  const dailyState = getOrGenerateDailyMissions(stats.dailyMissions);
  const unclaimedCount = dailyState.missions.filter(
    (m) => m.current >= m.target && !m.claimed
  ).length;

  const getMissionIcon = (type: DailyMission['type']) => {
    switch (type) {
      case 'kills':
        return <Crosshair className="w-4 h-4 text-rose-400" />;
      case 'ghost_runs':
        return <EyeOff className="w-4 h-4 text-purple-400" />;
      case 'combo':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'distractions':
        return <Radio className="w-4 h-4 text-sky-400" />;
      case 'vents':
        return <Footprints className="w-4 h-4 text-emerald-400" />;
      case 'smoke':
        return <Wind className="w-4 h-4 text-cyan-400" />;
      case 'endless_wave':
        return <Award className="w-4 h-4 text-amber-400" />;
      default:
        return <Zap className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-3 sm:p-6 bg-[#070a0f] text-slate-100 overflow-y-auto select-none font-sans">
      {/* Background Cyberpunk Grid & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/30 via-slate-950/80 to-[#05070a] pointer-events-none" />
      <div className="cyber-scanlines absolute inset-0 opacity-40 pointer-events-none" />

      {/* Top Header: Credits & Audio & Install */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between gap-3">
        {/* Credits Badge */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 rounded-2xl px-3.5 py-2 shadow-lg shadow-amber-950/30">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-xs text-amber-400 font-bold uppercase tracking-wider font-mono">CREDITS:</span>
          <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
            {stats.coins.toLocaleString()}
          </span>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <PWAInstallBanner />

          {/* Sound Controls */}
          <button
            onClick={toggleSfx}
            title="Toggle SFX"
            className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
          >
            {mutedStates.sfxMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>
          <button
            onClick={toggleMusic}
            title="Toggle Music"
            className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Music className={`w-5 h-5 ${mutedStates.musicMuted ? 'text-slate-500' : 'text-purple-400'}`} />
          </button>
        </div>
      </div>

      {/* Hero Title Section */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-4 max-w-2xl w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase mb-3 shadow-lg shadow-cyan-950/50">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Top-Down Stealth Action
        </div>

        {/* Logo Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-500 drop-shadow-[0_0_35px_rgba(0,245,212,0.4)]">
          CYBER HUNTER
        </h1>
        <div className="text-base sm:text-xl font-bold tracking-widest uppercase text-rose-500 mt-0.5 neon-text-red font-mono">
          STEALTH ASSASSIN
        </div>

        {/* Action Menu Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 w-full max-w-md">
          {/* Campaign Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenLevelSelect();
            }}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-cyan-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-cyan-200/40 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>PLAY CAMPAIGN</span>
          </button>

          {/* Endless Survival Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onStartEndless();
            }}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-rose-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-rose-400/40 cursor-pointer"
          >
            <Flame className="w-5 h-5 text-amber-300" />
            <span>ENDLESS ARENA</span>
          </button>
        </div>

        {/* Secondary Navigation Row: Shop & Daily Missions Button */}
        <div className="flex items-center gap-3 mt-3 w-full max-w-md">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenShop();
            }}
            className="w-1/2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 font-extrabold text-xs uppercase tracking-wider border border-cyan-500/30 transition-all hover:border-cyan-400/60 shadow-lg cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span>CYBER SHOP</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              document.getElementById('daily-missions-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-1/2 relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-extrabold text-xs uppercase tracking-wider border border-amber-500/30 transition-all hover:border-amber-400/60 shadow-lg cursor-pointer font-mono"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>DAILY MISSIONS</span>
            {unclaimedCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute -top-1 -right-1" />
            )}
            {unclaimedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] ml-1">
                {unclaimedCount}
              </span>
            )}
          </button>
        </div>

        {/* Daily Missions Embedded Panel */}
        <div id="daily-missions-section" className="w-full max-w-xl mt-4 bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 shadow-xl text-left">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-amber-300 font-mono">
                DAILY OBJECTIVES PROTOCOL
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              DATE: {dailyState.date}
            </span>
          </div>

          {/* 3 Daily Objectives */}
          <div className="space-y-2.5">
            {dailyState.missions.map((mission) => {
              const isReadyToClaim = mission.current >= mission.target && !mission.claimed;
              const progressPct = Math.min(100, (mission.current / mission.target) * 100);

              return (
                <div
                  key={mission.id}
                  className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                    mission.claimed
                      ? 'bg-slate-900/40 border-slate-800/80 opacity-70'
                      : isReadyToClaim
                      ? 'bg-amber-950/20 border-amber-500/60 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      {getMissionIcon(mission.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white truncate">
                          {mission.title}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 shrink-0">
                          +{mission.reward} C
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {mission.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              mission.claimed
                                ? 'bg-slate-600'
                                : isReadyToClaim
                                ? 'bg-emerald-400'
                                : 'bg-gradient-to-r from-cyan-500 to-sky-400'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 shrink-0">
                          {mission.current} / {mission.target}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Claim Button / Status */}
                  <div className="shrink-0 self-end sm:self-center">
                    {mission.claimed ? (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400/80 font-mono px-2 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> CLAIMED
                      </div>
                    ) : isReadyToClaim ? (
                      <button
                        onClick={() => {
                          soundManager.playClaimReward();
                          onClaimDailyMission(mission.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs font-mono uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3 fill-slate-950" />
                        <span>CLAIM</span>
                      </button>
                    ) : (
                      <div className="text-[10px] font-mono text-slate-500 px-2 py-1">
                        IN PROGRESS
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Summary Bar & Controls Guide */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 sm:p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">Missions Cleared</div>
          <div className="text-sm sm:text-base font-bold text-white flex items-center justify-center gap-1.5 mt-0.5">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>{stats.levelsCompleted.length} / {CAMPAIGN_LEVELS.length}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 sm:p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">Highest Wave</div>
          <div className="text-sm sm:text-base font-bold text-white flex items-center justify-center gap-1.5 mt-0.5">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Wave {stats.highestWave}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 sm:p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">Total Neutralized</div>
          <div className="text-sm sm:text-base font-bold text-white flex items-center justify-center gap-1.5 mt-0.5">
            <Crosshair className="w-4 h-4 text-rose-400" />
            <span>{stats.totalKills} Guards</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 sm:p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">Deflector Armor</div>
          <div className="text-sm sm:text-base font-bold text-white flex items-center justify-center gap-1.5 mt-0.5">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>{stats.perks.cyberShield > 0 ? 'ONLINE' : 'LOCKED'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
