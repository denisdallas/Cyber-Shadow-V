import React, { useState, useEffect } from 'react';
import { soundManager } from '../audio/soundManager';
import { Terminal, Shield, Sparkles, ChevronRight, Zap } from 'lucide-react';

interface BootLoadingScreenProps {
  onComplete: () => void;
}

const BOOT_LOGS = [
  'INITIALIZING SHADOW ENGINE KERNEL...',
  'MOUNTING TOP-DOWN RAYCAST VISION CONES...',
  'CALIBRATING LASER DETECTION MATRICES...',
  'SYNTHESIZING PROCEDURAL CYBERWAVE SOUNDTRACK...',
  'VERIFYING PWA CACHE BUFFERS...',
  '10 INFILTRATION SECTORS LOADED // THREAT LEVEL: MAXIMUM',
  'SYSTEM READY: SHADOW PROTOCOLS ARMED',
];

export const BootLoadingScreen: React.FC<BootLoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentLogIdx, setCurrentLogIdx] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const handleStart = () => {
    soundManager.playClick();
    soundManager.startBGM();
    onComplete();
  };

  const handleSkip = () => {
    setProgress(100);
    setIsReady(true);
  };

  useEffect(() => {
    // Keyboard listener for Space/Enter
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (isReady) {
          handleStart();
        } else {
          handleSkip();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReady]);

  useEffect(() => {
    // Progress interval (0 to 100 over ~1.6 seconds)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsReady(true);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 8) + 5;
        return Math.min(100, next);
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Advance log messages based on progress
    const idx = Math.min(
      BOOT_LOGS.length - 1,
      Math.floor((progress / 100) * BOOT_LOGS.length)
    );
    setCurrentLogIdx(idx);
  }, [progress]);

  return (
    <div
      id="loadingScreen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#040812] select-none font-mono text-slate-100 overflow-hidden"
    >
      {/* Retro Scanlines and Radial Vignette */}
      <div className="vignette" />
      <div className="scanlines" />

      {/* Center Boot Console Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
        {/* Glowing Brand Title from user's snippet */}
        <div className="text-4xl sm:text-5xl font-black tracking-tighter uppercase text-[#d6fffb] drop-shadow-[0_0_24px_rgba(69,244,232,0.45)] mb-1 flex items-center gap-2">
          <span>CYBER</span>
          <span className="text-[#45f4e8]">SHADOW</span>
        </div>

        <div className="text-[11px] tracking-[0.25em] text-[#7aa6b4] uppercase mb-6 font-bold flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#45f4e8]" />
          <span>TOP-DOWN STEALTH PROTOCOL</span>
        </div>

        {/* Terminal Boot Log Card */}
        <div className="w-full bg-[#0a1220]/90 border border-[#45f4e8]/30 rounded-xl p-3.5 mb-5 text-left shadow-lg shadow-[#45f4e8]/10 text-xs text-[#a8c3cd] backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-[#7aa6b4] uppercase">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#45f4e8]" />
              <span>SYSTEM BOOT LOG</span>
            </span>
            <span className="text-[#45f4e8] font-bold">STATUS: {progress}%</span>
          </div>

          <div className="h-16 flex flex-col justify-end text-[11px] font-mono leading-relaxed space-y-1">
            {BOOT_LOGS.slice(Math.max(0, currentLogIdx - 2), currentLogIdx + 1).map((log, i) => (
              <div
                key={i}
                className={`truncate flex items-center gap-1.5 ${
                  i === Math.min(2, currentLogIdx)
                    ? 'text-[#45f4e8] font-bold'
                    : 'text-slate-400 opacity-60'
                }`}
              >
                <span className="text-slate-400">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Neon Progress Bar (.loader) */}
        <div className="w-full bg-[#0d1829] border border-[#45f4e8]/40 rounded-full h-3 p-0.5 mb-4 shadow-inner overflow-hidden">
          <div
            className="h-full rounded-full cyber-loader-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Percentage Indicator */}
        <div className="flex items-center justify-between w-full text-[11px] text-[#7aa6b4] mb-6">
          <span>LOADING MATRICES</span>
          <span className="text-[#45f4e8] font-bold tracking-wider">{progress}% COMPLETE</span>
        </div>

        {/* Interactive Action Button (unlocks audio context) */}
        {isReady ? (
          <button
            onClick={handleStart}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#0e756f] via-[#124d63] to-[#0e756f] hover:from-[#138e87] hover:to-[#17627d] border border-[#45f4e8] text-[#effffb] font-black text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(69,244,232,0.35)] transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 animate-pulse"
          >
            <Zap className="w-4 h-4 text-[#ffc857] fill-[#ffc857]" />
            <span>INITIALIZE PROTOCOL</span>
            <ChevronRight className="w-4 h-4 text-[#45f4e8]" />
          </button>
        ) : (
          <>
            <div className="w-full py-3.5 px-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-[#45f4e8]" />
              <span>CALIBRATING SENSORS...</span>
            </div>
            <button
              onClick={handleSkip}
              className="mt-3 text-[10px] text-slate-500 hover:text-[#45f4e8] transition-colors cursor-pointer uppercase tracking-widest"
            >
              [ CLICK OR PRESS SPACE TO SKIP ]
            </button>
          </>
        )}
      </div>
    </div>
  );
};
