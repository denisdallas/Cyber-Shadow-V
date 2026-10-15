import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundManager } from '../audio/soundManager';
import { Download, Share, Smartphone, Check, X, ShieldCheck } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone / installed PWA mode
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold shadow-md">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>STANDALONE ACTIVE</span>
      </div>
    );
  }

  const handleInstallClick = () => {
    soundManager.playClick();
    install();
  };

  return (
    <>
      {isInstallable && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-105 active:scale-95 text-xs sm:text-sm uppercase tracking-wider border border-emerald-300/40 cursor-pointer"
        >
          <Download className="w-4 h-4 animate-bounce text-slate-950" />
          <span>INSTALL APP</span>
        </button>
      )}

      {isIOS && (
        <button
          onClick={() => {
            soundManager.playClick();
            setShowIOSGuide(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 font-extrabold rounded-xl border border-cyan-500/40 text-xs transition cursor-pointer shadow-md font-mono"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>INSTALL ON iOS</span>
        </button>
      )}

      {/* iOS Installation Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-950 border border-cyan-500/40 p-6 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                <Share className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white tracking-wide uppercase font-mono">
                  Install on iPhone / iPad
                </h3>
                <p className="text-xs text-slate-400">Enjoy fullscreen offline gameplay</p>
              </div>
            </div>

            <ol className="space-y-3 text-xs sm:text-sm text-slate-300 border-y border-slate-800 py-4 my-4 font-sans">
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span>
                  Tap the <strong className="text-white">Share</strong> button in the Safari bottom bar.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span>
                  Scroll down and choose <strong className="text-white">Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span>
                  Launch <strong className="text-cyan-300">CyberHunter</strong> directly from your home screen icon.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg"
            >
              UNDERSTOOD
            </button>
          </div>
        </div>
      )}
    </>
  );
};
