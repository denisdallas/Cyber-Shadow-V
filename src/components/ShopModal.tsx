import React, { useState } from 'react';
import { PlayerStats } from '../types/game';
import { SKINS, BLADE_TRAILS, PERK_CONFIG } from '../game/shopData';
import { soundManager } from '../audio/soundManager';
import {
  X,
  Zap,
  Check,
  Lock,
  Sparkles,
  Shield,
  Wind,
  Gauge,
  Maximize2,
} from 'lucide-react';

interface ShopModalProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  stats,
  onUpdateStats,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'trails' | 'perks'>('skins');

  const handleBuySkin = (skinId: string, price: number) => {
    if (stats.coins < price) return;
    soundManager.playCoin();
    const updated: PlayerStats = {
      ...stats,
      coins: stats.coins - price,
      unlockedSkins: [...stats.unlockedSkins, skinId],
      equippedSkin: skinId,
    };
    onUpdateStats(updated);
  };

  const handleEquipSkin = (skinId: string) => {
    soundManager.playClick();
    onUpdateStats({ ...stats, equippedSkin: skinId });
  };

  const handleBuyTrail = (trailId: string, price: number) => {
    if (stats.coins < price) return;
    soundManager.playCoin();
    const updated: PlayerStats = {
      ...stats,
      coins: stats.coins - price,
      unlockedTrails: [...stats.unlockedTrails, trailId],
      equippedTrail: trailId,
    };
    onUpdateStats(updated);
  };

  const handleEquipTrail = (trailId: string) => {
    soundManager.playClick();
    onUpdateStats({ ...stats, equippedTrail: trailId });
  };

  const handleUpgradePerk = (perkKey: keyof typeof PERK_CONFIG) => {
    const config = PERK_CONFIG[perkKey];
    const currentLevel = stats.perks[perkKey] || 0;
    if (currentLevel >= config.maxLevel) return;

    const price = Math.round(config.basePrice * Math.pow(config.priceMultiplier, currentLevel));
    if (stats.coins < price) return;

    soundManager.playCoin();
    const updated: PlayerStats = {
      ...stats,
      coins: stats.coins - price,
      perks: {
        ...stats.perks,
        [perkKey]: currentLevel + 1,
      },
    };
    onUpdateStats(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="w-full max-w-4xl bg-slate-950 border border-cyan-500/40 rounded-3xl p-5 sm:p-8 shadow-2xl relative text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400 tracking-tight">
              CYBERNETICS BLACK MARKET
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-mono">AVAILABLE CREDITS:</span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black font-mono text-sm">
                <Zap className="w-4 h-4 fill-amber-400" />
                {stats.coins.toLocaleString()}
              </div>
            </div>
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

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-5 border-b border-slate-800 pb-3">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('skins');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition font-mono cursor-pointer ${
              activeTab === 'skins'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            ASSASSIN SUITS
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('trails');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition font-mono cursor-pointer ${
              activeTab === 'trails'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            BLADE TRAILS
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('perks');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition font-mono cursor-pointer ${
              activeTab === 'perks'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            PERKS & AUGMENTS
          </button>
        </div>

        {/* Tab Content */}
        <div className="my-6 overflow-y-auto pr-1">
          {/* SKINS TAB */}
          {activeTab === 'skins' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {SKINS.map((skin) => {
                const isUnlocked = stats.unlockedSkins.includes(skin.id);
                const isEquipped = stats.equippedSkin === skin.id;
                const canAfford = stats.coins >= skin.price;

                return (
                  <div
                    key={skin.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                      isEquipped
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/20'
                        : isUnlocked
                        ? 'bg-slate-900/80 border-slate-700'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Avatar Preview */}
                      <div className="h-28 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center relative overflow-hidden mb-3">
                        <div
                          className="w-14 h-14 rounded-full border-2 flex items-center justify-center relative"
                          style={{
                            borderColor: skin.color,
                            boxShadow: `0 0 20px ${skin.glowColor}55`,
                            backgroundColor: '#0f172a',
                          }}
                        >
                          <div
                            className="w-4 h-2 rounded-full"
                            style={{
                              backgroundColor: skin.visorColor,
                              boxShadow: `0 0 10px ${skin.visorColor}`,
                            }}
                          />
                        </div>
                      </div>

                      <h4 className="font-extrabold text-white text-base">{skin.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{skin.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      {isEquipped ? (
                        <div className="w-full py-2 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 font-mono">
                          <Check className="w-4 h-4" /> EQUIPPED
                        </div>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipSkin(skin.id)}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition font-mono cursor-pointer"
                        >
                          EQUIP SUIT
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuySkin(skin.id, skin.price)}
                          disabled={!canAfford}
                          className={`w-full py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition font-mono flex items-center justify-center gap-1.5 cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                              : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>UNLOCK ({skin.price} C)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BLADE TRAILS TAB */}
          {activeTab === 'trails' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {BLADE_TRAILS.map((trail) => {
                const isUnlocked = stats.unlockedTrails.includes(trail.id);
                const isEquipped = stats.equippedTrail === trail.id;
                const canAfford = stats.coins >= trail.price;

                return (
                  <div
                    key={trail.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                      isEquipped
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/20'
                        : isUnlocked
                        ? 'bg-slate-900/80 border-slate-700'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Trail Arc Preview */}
                      <div className="h-28 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center relative overflow-hidden mb-3">
                        <div
                          className="w-24 h-4 rounded-full"
                          style={{
                            backgroundColor: trail.color,
                            boxShadow: `0 0 25px ${trail.color}`,
                          }}
                        />
                      </div>

                      <h4 className="font-extrabold text-white text-base">{trail.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{trail.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      {isEquipped ? (
                        <div className="w-full py-2 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 font-mono">
                          <Check className="w-4 h-4" /> EQUIPPED
                        </div>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipTrail(trail.id)}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition font-mono cursor-pointer"
                        >
                          EQUIP TRAIL
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyTrail(trail.id, trail.price)}
                          disabled={!canAfford}
                          className={`w-full py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition font-mono flex items-center justify-center gap-1.5 cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                              : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>UNLOCK ({trail.price} C)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PERKS & AUGMENTS TAB */}
          {activeTab === 'perks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(PERK_CONFIG) as Array<keyof typeof PERK_CONFIG>).map((perkKey) => {
                const config = PERK_CONFIG[perkKey];
                const currentLevel = stats.perks[perkKey] || 0;
                const isMax = currentLevel >= config.maxLevel;
                const nextPrice = Math.round(config.basePrice * Math.pow(config.priceMultiplier, currentLevel));
                const canAfford = stats.coins >= nextPrice;

                const getIcon = () => {
                  switch (perkKey) {
                    case 'speed':
                      return <Gauge className="w-6 h-6 text-cyan-400" />;
                    case 'strikeRange':
                      return <Maximize2 className="w-6 h-6 text-emerald-400" />;
                    case 'smokeCapacity':
                      return <Wind className="w-6 h-6 text-purple-400" />;
                    case 'cyberShield':
                      return <Shield className="w-6 h-6 text-amber-400" />;
                  }
                };

                return (
                  <div
                    key={perkKey}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                            {getIcon()}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-white text-base">{config.name}</h4>
                            <div className="text-xs font-mono text-cyan-400 font-bold mt-0.5">
                              LEVEL {currentLevel} / {config.maxLevel}
                            </div>
                          </div>
                        </div>

                        {/* Level Bars */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: config.maxLevel }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-3.5 h-6 rounded-md ${
                                idx < currentLevel ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-3">{config.description}</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                      {isMax ? (
                        <div className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 font-mono">
                          <Check className="w-4 h-4 text-emerald-400" /> MAX AUGMENT REACHED
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUpgradePerk(perkKey)}
                          disabled={!canAfford}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition font-mono flex items-center justify-center gap-2 cursor-pointer ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                          <span>UPGRADE AUGMENT ({nextPrice} C)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
