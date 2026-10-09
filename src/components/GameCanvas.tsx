import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import { SKINS, BLADE_TRAILS } from '../game/shopData';
import { Point } from '../types/game';

interface GameCanvasProps {
  engine: GameEngine | null;
  onPause: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, onPause }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const isPointerDownRef = useRef(false);

  // Camera state for smooth tracking
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle window resizing & DPI
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: clientHeight || 600,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Screen coordinate to world coordinate converter
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      const cam = cameraRef.current;
      return {
        x: screenX + cam.x,
        y: screenY + cam.y,
      };
    },
    []
  );

  // Pointer event listeners (Touch & Mouse unified)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!engine) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPt = screenToWorld(screenX, screenY);

    engine.handlePointerMoveOrClick(worldPt.x, worldPt.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!engine || !isPointerDownRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPt = screenToWorld(screenX, screenY);

    engine.handlePointerMoveOrClick(worldPt.x, worldPt.y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    isPointerDownRef.current = false;
  };

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engine) return;
      if (e.code === 'KeyP' || e.code === 'Escape') {
        onPause();
        return;
      }
      engine.handleKeyDown(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engine) return;
      engine.handleKeyUp(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, onPause]);

  // Main Render Loop
  useEffect(() => {
    if (!engine) return;
    let animId: number;

    const render = (time: number) => {
      engine.update(time);

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const viewW = dimensions.width;
      const viewH = dimensions.height;

      // Update camera centered on player
      const targetCamX = engine.player.x - viewW / 2;
      const targetCamY = engine.player.y - viewH / 2;

      // Smooth camera interpolation
      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.12;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.12;

      const shake = engine.getScreenShakeOffset();

      ctx.save();
      ctx.clearRect(0, 0, viewW, viewH);

      // Translate camera + shake
      ctx.translate(-cameraRef.current.x + shake.x, -cameraRef.current.y + shake.y);

      // 1. Draw Cyberpunk Floor Grid
      drawFloorGrid(ctx, cameraRef.current.x, cameraRef.current.y, viewW, viewH);

      // 2. Draw Vents / Secret Routes
      drawVents(ctx, engine);

      // 3. Draw Laser Traps
      drawLaserTraps(ctx, engine);

      // 4. Draw Guard Flashlight Vision Cones (Raytraced)
      drawGuardVisionCones(ctx, engine);

      // 5. Draw Walls & Maze Obstacles
      drawWalls(ctx, engine);

      // 6. Draw Smoke Clouds
      drawSmokeClouds(ctx, engine);

      // 6.5 Draw Distraction Lures & Sonar Waves
      drawDistractionLures(ctx, engine);

      // 6.8 Draw Distraction Aiming Reticle & Trajectory
      if (engine.player.isAimingDistraction) {
        drawAimingReticle(ctx, engine);
      }

      // 7. Draw Waypoint Marker
      if (engine.player.targetPos && !engine.player.isAimingDistraction) {
        drawWaypoint(ctx, engine.player.targetPos);
      }

      // 8. Draw Blade Trail History
      drawBladeTrail(ctx, engine);

      // 9. Draw Guards
      drawGuards(ctx, engine);

      // 10. Draw Player
      drawPlayer(ctx, engine);

      // 11. Draw Particles & Combat Sparks
      drawParticles(ctx, engine);

      // 12. Draw Floating Combat Text
      drawFloatingTexts(ctx, engine);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine, dimensions, screenToWorld]);

  // Drawing Helper Functions
  const drawFloorGrid = (
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number
  ) => {
    const gridSize = 40;
    const startX = Math.floor(camX / gridSize) * gridSize;
    const startY = Math.floor(camY / gridSize) * gridSize;
    const endX = camX + viewW + gridSize;
    const endY = camY + viewH + gridSize;

    // Dark sleek background
    ctx.fillStyle = '#06090e';
    ctx.fillRect(camX - 20, camY - 20, viewW + 40, viewH + 40);

    // Subtle neon grid lines
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Occasional neon circuit crosshairs on grid junctions
    ctx.fillStyle = 'rgba(0, 245, 212, 0.08)';
    for (let x = startX; x <= endX; x += gridSize * 3) {
      for (let y = startY; y <= endY; y += gridSize * 3) {
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }
  };

  const drawVents = (ctx: CanvasRenderingContext2D, eng: GameEngine) => {
    for (const v of eng.vents) {
      // Vent metallic frame
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(v.x, v.y, v.w, v.h);

      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(v.x, v.y, v.w, v.h);

      // Grate slits
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 8; i < v.w; i += 8) {
        ctx.moveTo(v.x + i, v.y + 4);
        ctx.lineTo(v.x + i, v.y + v.h - 4);
      }
      ctx.stroke();

      // If connected to another vent, draw faint dashed conduit line
      if (v.connectedVentId) {
        const other = eng.vents.find((ov) => ov.id === v.connectedVentId);
        if (other && other.x > v.x) {
          ctx.strokeStyle = 'rgba(0, 245, 212, 0.12)';
          ctx.setLineDash([4, 8]);
          ctx.beginPath();
          ctx.moveTo(v.x + v.w / 2, v.y + v.h / 2);
          ctx.lineTo(other.x + other.w / 2, other.y + other.h / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
  };

  const drawLaserTraps = (ctx: CanvasRenderingContext2D, eng: GameEngine) => {
    for (const lz of eng.lasers) {
      // Emitter nodes at ends
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(lz.x1, lz.y1, 6, 0, Math.PI * 2);
      ctx.arc(lz.x2, lz.y2, 6, 0, Math.PI * 2);
      ctx.fill();

      if (lz.active) {
        // Outer laser glow
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.45)';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(lz.x1, lz.y1);
        ctx.lineTo(lz.x2, lz.y2);
        ctx.stroke();

        // Inner hot laser beam
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(lz.x1, lz.y1);
        ctx.lineTo(lz.x2, lz.y2);
        ctx.stroke();

        // Laser core white beam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lz.x1, lz.y1);
        ctx.lineTo(lz.x2, lz.y2);
        ctx.stroke();
      } else {
        // Inactive dotted line
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(lz.x1, lz.y1);
        ctx.lineTo(lz.x2, lz.y2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  };

  const drawGuardVisionCones = (ctx: CanvasRenderingContext2D, eng: GameEngine) => {
    for (const g of eng.guards) {
      if (g.state === 'dead') continue;

      const conePts = eng.computeGuardVisionCone(g, 26);
      if (conePts.length < 2) continue;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      for (const pt of conePts) {
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();

      // Vision cone gradient
      const isAlert = g.state === 'alert' || g.state === 'attacking';
      const radGrad = ctx.createRadialGradient(g.x, g.y, 5, g.x, g.y, g.visionRange);

      if (isAlert) {
        radGrad.addColorStop(0, 'rgba(255, 0, 85, 0.55)');
        radGrad.addColorStop(0.7, 'rgba(255, 0, 85, 0.35)');
        radGrad.addColorStop(1, 'rgba(255, 0, 85, 0.05)');
      } else {
        radGrad.addColorStop(0, 'rgba(255, 230, 100, 0.28)');
        radGrad.addColorStop(0.7, 'rgba(255, 210, 50, 0.15)');
        radGrad.addColorStop(1, 'rgba(255, 210, 50, 0.01)');
      }

      ctx.fillStyle = radGrad;
      ctx.fill();

      // Vision cone outer perimeter stroke
      ctx.strokeStyle = isAlert ? 'rgba(255, 0, 85, 0.5)' : 'rgba(255, 220, 80, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  };

  const drawWalls = (ctx: CanvasRenderingContext2D, eng: GameEngine) => {
    for (const w of eng.walls) {
      // Wall base body (dark cyber metallic)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(w.x, w.y, w.w, w.h);

      // Inner bevel / pattern
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);

      // Cyber border glow
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    }
  };

  const drawSmokeClouds = (ctx: CanvasRenderingContext2D, eng: GameEngine) => {
    for (const s of eng.smokeClouds) {
      const alpha = Math.max(0, 1 - s.lifetime / s.duration) * 0.75;
      const grad = ctx.createRadialGradient(s.x, s.y, 10, s.x, s.y, s.radius);
      grad.addColorStop(0, `rgba(148, 163, 184, ${alpha})`);
      grad.addColorStop(0.6, `rgba(100, 116, 139, ${alpha * 0.7})`);
      grad.addColorStop(1, 'rgba(71, 85, 105, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawDistractionLures = (ctx: CanvasRenderingContext2D, eng: GameEngine) => {
    for (const lure of eng.distractionLures) {
      if (!lure.landed) {
        const heightOffset = Math.sin(lure.progress * Math.PI) * 45;

        // Shadow on ground
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(lure.x, lure.y, 7, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Projectile in air
        ctx.translate(lure.x, lure.y - heightOffset);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        // Expanding sonar soundwave ripples
        const currentRadius = lure.soundRadius * Math.min(1, lure.soundWaveLife * 1.15);
        const alpha = Math.max(0, (1 - lure.soundWaveLife) * 0.7);

        ctx.save();
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(lure.x, lure.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Secondary ripple
        if (currentRadius > 30) {
          ctx.strokeStyle = `rgba(0, 245, 212, ${alpha * 0.6})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(lure.x, lure.y, currentRadius * 0.6, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  };

  const drawAimingReticle = (ctx: CanvasRenderingContext2D, eng: GameEngine) => {
    const target = eng.player.targetPos || {
      x: eng.player.x + Math.cos(eng.player.angle) * 180,
      y: eng.player.y + Math.sin(eng.player.angle) * 180,
    };

    // Calculate clamped target
    const maxThrow = 260;
    const dx = target.x - eng.player.x;
    const dy = target.y - eng.player.y;
    const dist = Math.hypot(dx, dy);
    let finalX = target.x;
    let finalY = target.y;
    if (dist > maxThrow) {
      finalX = eng.player.x + (dx / dist) * maxThrow;
      finalY = eng.player.y + (dy / dist) * maxThrow;
    }

    ctx.save();
    // Dashed trajectory line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(eng.player.x, eng.player.y);
    ctx.lineTo(finalX, finalY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sound influence radius preview
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(finalX, finalY, 230, 0, Math.PI * 2);
    ctx.stroke();

    // Aim crosshair reticle
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(finalX, finalY, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(finalX - 20, finalY);
    ctx.lineTo(finalX + 20, finalY);
    ctx.moveTo(finalX, finalY - 20);
    ctx.lineTo(finalX, finalY + 20);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('THROW DECOY (TAP)', finalX, finalY + 30);
    ctx.restore();
  };

  const drawWaypoint = (ctx: CanvasRenderingContext2D, target: Point) => {
    ctx.save();
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 245, 212, 0.4)';
    ctx.beginPath();
    ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawBladeTrail = (ctx: CanvasRenderingContext2D, eng: GameEngine) => {
    if (eng.bladeHistory.length < 2) return;
    const trailColor = BLADE_TRAILS.find((t) => t.id === eng.player.trailId)?.color || '#00f5d4';

    ctx.save();
    for (let i = 1; i < eng.bladeHistory.length; i++) {
      const p1 = eng.bladeHistory[i - 1];
      const p2 = eng.bladeHistory[i];
      const progress = i / eng.bladeHistory.length;

      ctx.strokeStyle = trailColor;
      ctx.lineWidth = progress * 6;
      ctx.globalAlpha = progress * 0.55;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawGuards = (ctx: CanvasRenderingContext2D, eng: GameEngine) => {
    for (const g of eng.guards) {
      if (g.state === 'dead') continue;

      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle);

      // Weapon barrel
      ctx.fillStyle = '#475569';
      ctx.fillRect(8, -2, 14, 4);

      // Guard Body
      if (g.type === 'boss') {
        // Boss heavy mech
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Dual shoulders
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-6, -g.radius - 4, 12, 8);
        ctx.fillRect(-6, g.radius - 4, 12, 8);
      } else if (g.type === 'armored') {
        // Heavy armor plates
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (g.type === 'shielded') {
        // Riot guard
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
        ctx.fill();

        // Frontal shield arc
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, g.radius + 4, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      } else if (g.type === 'sniper') {
        // Sniper
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c4b5fd';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Long barrel
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(8, -1.5, 20, 3);
      } else {
        // Standard guard
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Visor / Flashlight origin
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(6, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Alert "!" or Suspicious "?" icon above guard head
      if (g.state === 'alert' || g.state === 'attacking') {
        ctx.save();
        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 10;
        ctx.fillText('!', g.x, g.y - g.radius - 12);
        ctx.restore();
      } else if (g.state === 'suspicious') {
        ctx.save();
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10;
        ctx.fillText('?', g.x, g.y - g.radius - 12);
        ctx.restore();
      }

      // HP Bar for Armored or Boss guards
      if (g.maxHp > 1) {
        const barW = 32;
        const barH = 5;
        const hpPercent = g.hp / g.maxHp;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(g.x - barW / 2, g.y - g.radius - 8, barW, barH);
        ctx.fillStyle = hpPercent > 0.5 ? '#10b981' : '#f59e0b';
        ctx.fillRect(g.x - barW / 2, g.y - g.radius - 8, barW * hpPercent, barH);
      }
    }
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, eng: GameEngine) => {
    const p = eng.player;
    const skin = SKINS.find((s) => s.id === p.skinId) || SKINS[0];

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    // If in vent, camouflage transparency
    if (p.inVent) {
      ctx.globalAlpha = 0.35;
    }

    // Strike Range ring (tactical indicator)
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, p.strikeRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Deflector Shield Bubble
    if (p.shieldActive) {
      ctx.strokeStyle = 'rgba(255, 190, 11, 0.7)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ffbe0b';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Dual Blade daggers
    ctx.fillStyle = skin.color;
    ctx.fillRect(6, -8, 8, 3);
    ctx.fillRect(6, 5, 8, 3);

    // Assassin Hood body
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer neon glow ring
    ctx.strokeStyle = skin.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Glowing Visor
    ctx.fillStyle = skin.visorColor;
    ctx.shadowColor = skin.visorColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(4, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Melee Knife Attack Slash Arc
    if (p.isAttacking) {
      ctx.strokeStyle = skin.color;
      ctx.lineWidth = 4;
      ctx.shadowColor = skin.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, p.strikeRange, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, eng: GameEngine) => {
    for (const pt of eng.particles) {
      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;

      if (pt.shape === 'square') {
        ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  const drawFloatingTexts = (ctx: CanvasRenderingContext2D, eng: GameEngine) => {
    for (const ft of eng.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none touch-none"
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-crosshair touch-none"
      />
    </div>
  );
};
