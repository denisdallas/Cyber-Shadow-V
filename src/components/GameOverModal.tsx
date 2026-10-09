import React from 'react';
import { GameMetrics, LevelData } from '../types/game';
import { soundManager } from '../audio/soundManager';
import {
  Skull,
  RotateCcw,
  ShoppingBag,
  Home,
  ShieldAlert,
  Coins,
} from 'lucide-react';

interface GameOverModalProps {
  level: LevelData;
  reason: string;
  metrics: GameMetrics;
  onRetry: () => void;
  onOpenShop: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  level,
  reason,
  metrics,
  onRetry,
  onOpenShop,
  onHome,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-md bg-slate-950 border border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100 flex flex-col items-center text-center">
        {/* Skull Icon */}
        <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-500 mb-3 shadow-lg shadow-rose-500/30">
          <Skull className="w-10 h-10 animate-pulse" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
          SYNCHRONIZATION LOST
        </h2>
        <div className="text-xs font-mono text-rose-400 mt-1 uppercase tracking-widest font-bold">
          {level.name}
        </div>

        <p className="text-xs sm:text-sm text-slate-300 bg-rose-950/40 border border-rose-500/30 rounded-xl px-4 py-2 mt-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{reason}</span>
        </p>

        {/* Stats Grid */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 my-4 space-y-2 font-mono text-xs sm:text-sm">
          <div className="flex items-center justify-between text-slate-300">
            <span>Hostiles Neutralized:</span>
            <span className="font-bold text-white">{metrics.kills}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Credits Retained:</span>
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> +{metrics.coinsEarned} C
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-2.5 mt-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onRetry();
            }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-600/25 transition flex items-center justify-center gap-2 cursor-pointer font-mono"
          >
            <RotateCcw className="w-4 h-4" /> RETRY INFILTRATION
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenShop();
              }}
              className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs uppercase tracking-wider border border-cyan-500/30 flex items-center justify-center gap-2 transition cursor-pointer font-mono"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> UPGRADE PERKS
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                onHome();
              }}
              className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer font-mono"
            >
              <Home className="w-3.5 h-3.5" /> MAIN MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
