import React from 'react';
import { soundManager } from '../audio/soundManager';
import {
  Play,
  RotateCcw,
  Home,
  Volume2,
  VolumeX,
  Music,
} from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-sans">
      <div className="w-full max-w-sm bg-slate-950 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100 flex flex-col items-center text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">
          MISSION PAUSED
        </h2>
        <p className="text-xs font-mono text-cyan-400 mt-1 uppercase tracking-widest">
          STANDBY PROTOCOL ACTIVE
        </p>

        {/* Audio controls */}
        <div className="flex items-center gap-3 my-6">
          <button
            onClick={toggleSfx}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition font-mono ${
              mutedStates.sfxMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            {mutedStates.sfxMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>SFX: {mutedStates.sfxMuted ? 'OFF' : 'ON'}</span>
          </button>

          <button
            onClick={toggleMusic}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition font-mono ${
              mutedStates.musicMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <Music className={`w-4 h-4 ${mutedStates.musicMuted ? 'text-slate-500' : 'text-purple-400'}`} />
            <span>BGM: {mutedStates.musicMuted ? 'OFF' : 'ON'}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="w-full space-y-2.5">
          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer font-mono shadow-lg shadow-cyan-500/25"
          >
            <Play className="w-4 h-4 fill-slate-950" /> RESUME INFILTRATION
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onRestart();
            }}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer font-mono"
          >
            <RotateCcw className="w-3.5 h-3.5" /> RESTART MISSION
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onHome();
            }}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider border border-slate-800 flex items-center justify-center gap-2 transition cursor-pointer font-mono"
          >
            <Home className="w-3.5 h-3.5" /> ABORT TO MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
