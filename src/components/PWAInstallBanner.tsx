import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundManager } from '../audio/soundManager';
import { Download, Share, Smartphone, X } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide
  if (isInstalled) {
    return null;
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
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105 active:scale-95 text-xs sm:text-sm uppercase tracking-wider border border-emerald-300/30 cursor-pointer"
        >
          <Download className="w-4 h-4 animate-bounce" />
          <span>Install Game App</span>
        </button>
      )}

      {isIOS && (
        <button
          onClick={() => {
            soundManager.playClick();
            setShowIOSGuide(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-600 text-xs transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Install on iOS</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                <Share className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Install on iPhone / iPad</h3>
                <p className="text-xs text-slate-400">Play fullscreen without browser bars</p>
              </div>
            </div>

            <ol className="space-y-3 text-sm text-slate-300 border-y border-slate-800 py-4 my-4">
              <li className="flex items-start gap-2">
                <span className="font-bold text-cyan-400">1.</span>
                <span>Tap the <strong className="text-white">Share</strong> button in the Safari toolbar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-cyan-400">2.</span>
                <span>Scroll down and select <strong className="text-white">Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-cyan-400">3.</span>
                <span>Launch <strong className="text-cyan-300">CyberHunter</strong> directly from your home screen.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition uppercase tracking-wider"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
