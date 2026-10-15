import {
  Guard,
  LaserTrap,
  LevelData,
  Particle,
  Player,
  Point,
  SmokeCloud,
  Vent,
  Wall,
  FloatingText,
  GameMetrics,
  DistractionLure,
  BossTelemetry,
} from '../types/game';
import { soundManager } from '../audio/soundManager';
import { SKINS, BLADE_TRAILS } from './shopData';

export interface GameEngineOptions {
  levelData: LevelData;
  equippedSkinId: string;
  equippedTrailId: string;
  perks: {
    speed: number;
    strikeRange: number;
    smokeCapacity: number;
    cyberShield: number;
  };
  onVictory: (metrics: GameMetrics) => void;
  onDefeat: (reason: string, metrics: GameMetrics) => void;
  onStatsUpdate: (metrics: GameMetrics, guardsLeft: number, boss?: BossTelemetry | null) => void;
}

export class GameEngine {
  public level: LevelData;
  public player: Player;
  public guards: Guard[];
  public walls: Wall[];
  public lasers: LaserTrap[];
  public vents: Vent[];
  public smokeClouds: SmokeCloud[] = [];
  public distractionLures: DistractionLure[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public bladeHistory: Point[] = [];
  public spawnGraceTimer: number = 3.0; // 3.0s Infiltration Cloak on level start to guarantee zero instant kills
  private laserAlarmCooldown: number = 0;

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastTime: number = 0;
  private screenShake: number = 0;
  private keysDown: Set<string> = new Set();

  public metrics: GameMetrics = {
    kills: 0,
    combo: 0,
    maxCombo: 0,
    comboTimer: 0,
    alarmsTriggered: 0,
    timeElapsed: 0,
    coinsEarned: 0,
    distractionsUsed: 0,
    ventsUsed: 0,
    smokeUsed: 0,
  };

  private callbacks: {
    onVictory: (metrics: GameMetrics) => void;
    onDefeat: (reason: string, metrics: GameMetrics) => void;
    onStatsUpdate: (metrics: GameMetrics, guardsLeft: number, boss?: BossTelemetry | null) => void;
  };

  constructor(options: GameEngineOptions) {
    this.level = JSON.parse(JSON.stringify(options.levelData));
    this.callbacks = {
      onVictory: options.onVictory,
      onDefeat: options.onDefeat,
      onStatsUpdate: options.onStatsUpdate,
    };

    const baseSpeed = 3.6 * (1 + options.perks.speed * 0.1);
    const baseStrikeRange = 46 * (1 + options.perks.strikeRange * 0.15);
    const baseSmokeBombs = 1 + options.perks.smokeCapacity;

    this.player = {
      x: this.level.playerStart.x,
      y: this.level.playerStart.y,
      vx: 0,
      vy: 0,
      radius: 15,
      speed: baseSpeed,
      angle: 0,
      targetPos: null,
      inVent: false,
      ventId: null,
      smokeBombs: baseSmokeBombs,
      maxSmokeBombs: baseSmokeBombs,
      distractionCount: 3,
      maxDistractions: 3,
      isAimingDistraction: false,
      hasShield: options.perks.cyberShield > 0,
      shieldActive: options.perks.cyberShield > 0,
      strikeRange: baseStrikeRange,
      skinId: options.equippedSkinId,
      trailId: options.equippedTrailId,
      isAttacking: false,
      attackCooldown: 0,
      attackAnimTimer: 0,
    };

    this.walls = [...this.level.walls];
    this.lasers = this.level.lasers.map((l) => ({ ...l }));
    this.vents = this.level.vents.map((v) => ({ ...v }));
    this.guards = this.level.guards.map((g) => ({
      ...g,
      state: 'patrol',
      alertTimer: 0,
      waitTimer: 0,
      lastKnownPlayerPos: null,
      investigatePos: null,
      investigateTimer: 0,
      patrolForward: true,
      shootCooldown: 0.65, // reaction time window to strike
    }));
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    soundManager.startBGM();
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public stop() {
    this.isRunning = false;
    soundManager.stopBGM();
  }

  public handleKeyDown(code: string) {
    this.keysDown.add(code);
    if (code === 'KeyE' || code === 'Space') {
      this.deploySmokeBomb();
    } else if (code === 'KeyQ') {
      this.triggerDistractionAimOrQuickThrow();
    }
  }

  public handleKeyUp(code: string) {
    this.keysDown.delete(code);
  }

  public handlePointerMoveOrClick(worldX: number, worldY: number) {
    if (this.player.isAimingDistraction) {
      this.throwDistraction(worldX, worldY);
      this.player.isAimingDistraction = false;
      return;
    }
    this.player.targetPos = { x: worldX, y: worldY };
  }

  public clearPointerTarget() {
    this.player.targetPos = null;
  }

  public toggleAimDistraction() {
    if (this.player.distractionCount <= 0) return;
    this.player.isAimingDistraction = !this.player.isAimingDistraction;
    soundManager.playClick();
  }

  public triggerDistractionAimOrQuickThrow() {
    if (this.player.distractionCount <= 0) return;
    if (this.player.targetPos) {
      this.throwDistraction(this.player.targetPos.x, this.player.targetPos.y);
    } else {
      const throwDist = 180;
      const targetX = this.player.x + Math.cos(this.player.angle) * throwDist;
      const targetY = this.player.y + Math.sin(this.player.angle) * throwDist;
      this.throwDistraction(targetX, targetY);
    }
  }

  public throwDistraction(targetX: number, targetY: number) {
    if (this.player.distractionCount <= 0) return;
    this.player.distractionCount--;
    this.metrics.distractionsUsed++;

    const maxThrow = 260;
    const dx = targetX - this.player.x;
    const dy = targetY - this.player.y;
    const dist = Math.hypot(dx, dy);

    let finalX = targetX;
    let finalY = targetY;
    if (dist > maxThrow) {
      finalX = this.player.x + (dx / dist) * maxThrow;
      finalY = this.player.y + (dy / dist) * maxThrow;
    }

    soundManager.playLureThrow();

    this.distractionLures.push({
      id: `lure-${Date.now()}-${Math.random()}`,
      startX: this.player.x,
      startY: this.player.y,
      targetX: finalX,
      targetY: finalY,
      x: this.player.x,
      y: this.player.y,
      progress: 0,
      duration: 0.45,
      landed: false,
      soundRadius: 230,
      soundWaveLife: 0,
      maxSoundWaveLife: 0.8,
    });
  }

  public deploySmokeBomb() {
    if (this.player.smokeBombs <= 0) return;
    this.player.smokeBombs--;
    this.metrics.smokeUsed++;
    soundManager.playSmokeHiss();

    const smoke: SmokeCloud = {
      id: `smoke-${Date.now()}-${Math.random()}`,
      x: this.player.x,
      y: this.player.y,
      radius: 20,
      maxRadius: 130,
      lifetime: 0,
      duration: 6.5, // 6.5 seconds of blinding cover
    };
    this.smokeClouds.push(smoke);

    // Spawn initial smoke particles
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2.5;
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#94a3b8',
        size: 8 + Math.random() * 12,
        alpha: 0.7,
        life: 0,
        maxLife: 2 + Math.random() * 2,
        shape: 'circle',
      });
    }

    this.addFloatingText('SMOKE SCREEN', this.player.x, this.player.y - 30, '#00f5d4');
  }

  public update(now: number) {
    if (!this.isRunning || this.isPaused) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.metrics.timeElapsed += dt;

    // Decay spawn grace infiltration cloak
    if (this.spawnGraceTimer > 0) {
      this.spawnGraceTimer = Math.max(0, this.spawnGraceTimer - dt);
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 15);
    }

    // Combo timer
    if (this.metrics.combo > 0) {
      this.metrics.comboTimer -= dt;
      if (this.metrics.comboTimer <= 0) {
        this.metrics.combo = 0;
      }
    }

    this.updateLasers(dt);
    this.updateSmokeClouds(dt);
    this.updateDistractionLures(dt);
    this.updatePlayer(dt);
    this.updateGuards(dt);
    this.checkAssassinations(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    const aliveGuards = this.guards.filter((g) => g.state !== 'dead').length;
    this.callbacks.onStatsUpdate(this.metrics, aliveGuards, this.getBossTelemetry());

    // Check Victory
    if (aliveGuards === 0) {
      this.stop();
      soundManager.playVictory();
      this.callbacks.onVictory(this.metrics);
    }
  }

  public getBossTelemetry(): BossTelemetry | null {
    const boss = this.guards.find((g) => g.type === 'boss' && g.state !== 'dead');
    if (!boss) return null;
    return {
      id: boss.id,
      name: boss.bossTitle || 'SECTOR BOSS',
      subtitle: boss.bossSubtitle || 'Multi-Phase Encounter',
      phase: boss.bossPhase || 1,
      maxPhases: boss.maxBossPhases || 1,
      hp: boss.hp,
      maxHp: boss.maxHp,
      attackState: boss.bossAttackState,
      shieldActive: !!boss.bossShieldActive,
    };
  }

  private updateDistractionLures(dt: number) {
    for (let i = this.distractionLures.length - 1; i >= 0; i--) {
      const lure = this.distractionLures[i];

      if (!lure.landed) {
        lure.progress += dt / lure.duration;

        lure.x = lure.startX + (lure.targetX - lure.startX) * Math.min(1, lure.progress);
        lure.y = lure.startY + (lure.targetY - lure.startY) * Math.min(1, lure.progress);

        if (Math.random() < 0.6) {
          this.particles.push({
            x: lure.x,
            y: lure.y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            color: '#38bdf8',
            size: 2.5,
            alpha: 0.9,
            life: 0,
            maxLife: 0.3,
            shape: 'square',
          });
        }

        if (lure.progress >= 1) {
          lure.landed = true;
          lure.x = lure.targetX;
          lure.y = lure.targetY;

          soundManager.playLureImpact();
          this.addFloatingText('*DISTRACTION*', lure.x, lure.y - 25, '#38bdf8');

          for (let p = 0; p < 16; p++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3.5;
            this.particles.push({
              x: lure.x,
              y: lure.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color: '#38bdf8',
              size: 3,
              alpha: 1,
              life: 0,
              maxLife: 0.4,
              shape: 'circle',
            });
          }

          let alertedAny = false;
          for (const guard of this.guards) {
            if (guard.state === 'dead' || guard.state === 'attacking') continue;
            const distToSound = Math.hypot(guard.x - lure.targetX, guard.y - lure.targetY);

            if (distToSound <= lure.soundRadius) {
              guard.state = 'suspicious';
              guard.investigatePos = { x: lure.targetX, y: lure.targetY };
              guard.investigateTimer = 0;
              guard.waitTimer = 0;
              guard.angle = Math.atan2(lure.targetY - guard.y, lure.targetX - guard.x);
              alertedAny = true;
            }
          }

          if (alertedAny) {
            soundManager.playSuspicious();
          }
        }
      } else {
        lure.soundWaveLife += dt / lure.maxSoundWaveLife;
        if (lure.soundWaveLife >= 1) {
          this.distractionLures.splice(i, 1);
        }
      }
    }
  }

  private updateLasers(dt: number) {
    if (this.laserAlarmCooldown > 0) {
      this.laserAlarmCooldown -= dt;
    }

    for (const laser of this.lasers) {
      const prevActive = laser.active;
      const prevWarning = laser.isWarning;

      laser.timer = (laser.timer + dt) % laser.cycleTime;
      laser.active = laser.timer < laser.activeDuration;

      const warningDuration = laser.warningDuration ?? 0.9;
      // Laser warning triggers right before active duration begins
      laser.isWarning = !laser.active && laser.timer >= (laser.cycleTime - warningDuration);

      // Procedural audio cues on state transitions
      if (laser.isWarning && !prevWarning) {
        soundManager.playLaserWarningHum();
      }
      if (laser.active && !prevActive) {
        soundManager.playLaserPowerOn();
      }

      // Warning pre-activation sparks (Amber)
      if (laser.isWarning && Math.random() < 0.3) {
        const u = Math.random();
        this.particles.push({
          x: laser.x1 + (laser.x2 - laser.x1) * u,
          y: laser.y1 + (laser.y2 - laser.y1) * u,
          vx: (Math.random() - 0.5) * 2.5,
          vy: (Math.random() - 0.5) * 2.5,
          color: '#f59e0b',
          size: 2.5,
          alpha: 0.9,
          life: 0,
          maxLife: 0.25,
          shape: 'square',
        });
      }

      // Active lethal sparks (Red/White)
      if (laser.active && Math.random() < 0.25) {
        const u = Math.random();
        this.particles.push({
          x: laser.x1 + (laser.x2 - laser.x1) * u,
          y: laser.y1 + (laser.y2 - laser.y1) * u,
          vx: (Math.random() - 0.5) * 2.5,
          vy: (Math.random() - 0.5) * 2.5,
          color: Math.random() > 0.5 ? '#ff0055' : '#ffffff',
          size: 2,
          alpha: 0.9,
          life: 0,
          maxLife: 0.2,
          shape: 'circle',
        });
      }

      // Check player crossing active laser beam (spawn grace & safe room protect player)
      if (laser.active && !this.player.inVent && this.spawnGraceTimer <= 0 && !this.isPlayerInSafeZone()) {
        if (this.lineCircleIntersect(laser.x1, laser.y1, laser.x2, laser.y2, this.player.x, this.player.y, this.player.radius)) {
          if (this.laserAlarmCooldown <= 0) {
            this.laserAlarmCooldown = 2.0; // Debounce so it only raises alarm once per trip
            this.triggerAlarm(this.player.x, this.player.y, 'Security Laser Grid Breached!');
          }
        }
      }
    }
  }

  private updateSmokeClouds(dt: number) {
    for (let i = this.smokeClouds.length - 1; i >= 0; i--) {
      const s = this.smokeClouds[i];
      s.lifetime += dt;
      if (s.radius < s.maxRadius) {
        s.radius = Math.min(s.maxRadius, s.radius + dt * 75);
      }
      if (s.lifetime >= s.duration) {
        this.smokeClouds.splice(i, 1);
      }
    }
  }

  private updatePlayer(dt: number) {
    let dx = 0;
    let dy = 0;

    // Keyboard inputs
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) dy -= 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) dy += 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) dx -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) dx += 1;

    let moving = false;
    let targetSpeed = this.player.speed;
    // Adrenaline speed surge when combo is active
    if (this.metrics.combo > 1) {
      targetSpeed *= 1 + Math.min(this.metrics.combo * 0.05, 0.25);
    }

    if (dx !== 0 || dy !== 0) {
      this.player.targetPos = null; // Keyboard overrides targetPos
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.player.angle = Math.atan2(dy, dx);
      this.player.vx = dx * targetSpeed;
      this.player.vy = dy * targetSpeed;
      moving = true;
    } else if (this.player.targetPos) {
      const dist = Math.hypot(this.player.targetPos.x - this.player.x, this.player.targetPos.y - this.player.y);
      if (dist > 8) {
        const pAngle = Math.atan2(this.player.targetPos.y - this.player.y, this.player.targetPos.x - this.player.x);
        this.player.angle = pAngle;
        this.player.vx = Math.cos(pAngle) * targetSpeed;
        this.player.vy = Math.sin(pAngle) * targetSpeed;
        moving = true;
      } else {
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.targetPos = null;
      }
    } else {
      this.player.vx = 0;
      this.player.vy = 0;
    }

    if (moving) {
      // Step sound occasionally
      if (Math.random() < 0.08) {
        soundManager.playFootstep();
      }

      // Trail history
      this.bladeHistory.push({ x: this.player.x, y: this.player.y });
      if (this.bladeHistory.length > 12) {
        this.bladeHistory.shift();
      }

      // Move with collision checking against walls
      const nextX = this.player.x + this.player.vx;
      const nextY = this.player.y + this.player.vy;

      if (!this.checkWallCollision(nextX, this.player.y, this.player.radius)) {
        this.player.x = nextX;
      }
      if (!this.checkWallCollision(this.player.x, nextY, this.player.radius)) {
        this.player.y = nextY;
      }
    } else {
      if (this.bladeHistory.length > 0) {
        this.bladeHistory.shift();
      }
    }

    // Check Vents interaction
    let onVent = false;
    for (const vent of this.vents) {
      const ventCenterX = vent.x + vent.w / 2;
      const ventCenterY = vent.y + vent.h / 2;
      const dist = Math.hypot(ventCenterX - this.player.x, ventCenterY - this.player.y);

      if (dist < 28) {
        onVent = true;
        if (!this.player.inVent) {
          this.player.inVent = true;
          this.player.ventId = vent.id;
          this.addFloatingText('INSIDE VENT (HIDDEN)', this.player.x, this.player.y - 25, '#38bdf8');
          // If connected vent exists and moving toward it, teleport across duct!
          if (vent.connectedVentId && (moving || this.player.targetPos)) {
            const targetVent = this.vents.find((v) => v.id === vent.connectedVentId);
            if (targetVent) {
              this.player.x = targetVent.x + targetVent.w / 2;
              this.player.y = targetVent.y + targetVent.h / 2;
              this.player.targetPos = null;
              this.metrics.ventsUsed++;
              this.addFloatingText('DUCT SHORTCUT USED', this.player.x, this.player.y - 25, '#00f5d4');
              soundManager.playClick();
            }
          }
        }
        break;
      }
    }

    if (!onVent && this.player.inVent) {
      this.player.inVent = false;
      this.player.ventId = null;
    }

    if (this.player.attackAnimTimer > 0) {
      this.player.attackAnimTimer -= dt;
      if (this.player.attackAnimTimer <= 0) {
        this.player.isAttacking = false;
      }
    }
  }

  private updateGuards(dt: number) {
    const isPlayerInSmoke = this.isPointInSmoke(this.player.x, this.player.y);

    for (const guard of this.guards) {
      if (guard.state === 'dead') continue;

      // Multi-Phase Boss Encounter Logic
      if (guard.type === 'boss') {
        guard.bossSpecialTimer = (guard.bossSpecialTimer || 0) + dt;

        // BOSS 1: THE APEX INQUISITOR
        if (guard.id === 'boss-1') {
          if (guard.bossPhase === 1) {
            guard.angle += guard.sweepAngleSpeed * 1.5;
            guard.bossAttackState = 'idle';
          } else {
            // Phase 2: Overdrive! Fast sweep + Rotating Twin Laser Sweep
            guard.angle += guard.sweepAngleSpeed * 2.2;
            const cycle = (guard.bossSpecialTimer % 4.8);
            if (cycle < 1.8) {
              guard.bossAttackState = 'laser_sweep';
              guard.laserSweepAngle = (guard.laserSweepAngle || 0) + dt * 2.4;
              if (cycle < dt * 2) {
                soundManager.playBossLaserSweep();
              }
              // Check rotating twin laser intersection
              if (!this.player.inVent && this.spawnGraceTimer <= 0 && !this.isPlayerInSafeZone()) {
                const beamLen = 290;
                const b1 = guard.laserSweepAngle;
                const b2 = guard.laserSweepAngle + Math.PI;
                const hit1 = this.lineCircleIntersect(guard.x, guard.y, guard.x + Math.cos(b1) * beamLen, guard.y + Math.sin(b1) * beamLen, this.player.x, this.player.y, this.player.radius);
                const hit2 = this.lineCircleIntersect(guard.x, guard.y, guard.x + Math.cos(b2) * beamLen, guard.y + Math.sin(b2) * beamLen, this.player.x, this.player.y, this.player.radius);

                if (hit1 || hit2) {
                  if (this.laserAlarmCooldown <= 0) {
                    this.laserAlarmCooldown = 1.4;
                    this.triggerAlarm(this.player.x, this.player.y, 'OVERDRIVE LASER SWEEP!');
                  }
                }
              }
            } else {
              guard.bossAttackState = 'idle';
            }
          }
        }

        // BOSS 2: LORD VANGUARD & OVERLORD AI
        if (guard.id === 'boss-vanguard') {
          guard.angle += guard.sweepAngleSpeed * 1.4;

          if (guard.bossPhase === 1) {
            // Phase 1: Kinetic Bastion Shield
            guard.bossShieldActive = true;
            guard.bossAttackState = 'idle';
          } else if (guard.bossPhase === 2) {
            // Phase 2: Orbital Laser Target Painter
            guard.bossShieldActive = false;
            guard.bossAttackState = 'orbital_strike';

            if (!guard.targetedStrikePos) {
              if (guard.bossSpecialTimer >= 4.2) {
                guard.bossSpecialTimer = 0;
                guard.targetedStrikePos = { x: this.player.x, y: this.player.y };
                guard.targetedStrikeTimer = 1.35;
                soundManager.playBossCharge();
                this.addFloatingText('⚠️ ORBITAL TARGET LOCK! EVADE!', this.player.x, this.player.y - 30, '#ff0055');
              }
            } else {
              guard.targetedStrikeTimer = (guard.targetedStrikeTimer || 0) - dt;

              // Reticle warning sparks
              if (Math.random() < 0.4) {
                this.particles.push({
                  x: guard.targetedStrikePos.x + (Math.random() - 0.5) * 32,
                  y: guard.targetedStrikePos.y + (Math.random() - 0.5) * 32,
                  vx: (Math.random() - 0.5) * 2,
                  vy: (Math.random() - 0.5) * 2,
                  color: '#ff0055',
                  size: 3,
                  alpha: 1,
                  life: 0,
                  maxLife: 0.25,
                  shape: 'square',
                });
              }

              if (guard.targetedStrikeTimer <= 0) {
                const strikeX = guard.targetedStrikePos.x;
                const strikeY = guard.targetedStrikePos.y;
                guard.targetedStrikePos = null;
                this.screenShake = 16;
                soundManager.playGunshot();

                // Blast detonation burst
                for (let p = 0; p < 30; p++) {
                  const ang = Math.random() * Math.PI * 2;
                  const spd = 3 + Math.random() * 6;
                  this.particles.push({
                    x: strikeX,
                    y: strikeY,
                    vx: Math.cos(ang) * spd,
                    vy: Math.sin(ang) * spd,
                    color: Math.random() > 0.5 ? '#ff0055' : '#f59e0b',
                    size: 4,
                    alpha: 1,
                    life: 0,
                    maxLife: 0.5,
                    shape: 'circle',
                  });
                }

                // Blast radius collision
                const distToBlast = Math.hypot(this.player.x - strikeX, this.player.y - strikeY);
                if (distToBlast <= 68 && !this.player.inVent && this.spawnGraceTimer <= 0 && !this.isPlayerInSafeZone()) {
                  if (this.player.shieldActive) {
                    this.player.shieldActive = false;
                    soundManager.playShieldDeflect();
                    this.addFloatingText('DEFLECTOR CRUSHED BY ORBITAL BEAM!', this.player.x, this.player.y - 30, '#ffbe0b');
                  } else {
                    this.stop();
                    soundManager.playDefeat();
                    this.callbacks.onDefeat('Incinerated by Orbital Laser Strike.', this.metrics);
                    return;
                  }
                }
              }
            }
          } else if (guard.bossPhase === 3) {
            // Phase 3: AI Overlord Matrix Meltdown (Quad-beam rotating laser vortex)
            guard.bossAttackState = 'laser_sweep';
            guard.laserSweepAngle = (guard.laserSweepAngle || 0) + dt * 1.5;

            // Collision check against quad laser vortex
            if (!this.player.inVent && this.spawnGraceTimer <= 0 && !this.isPlayerInSafeZone()) {
              const beamLen = 330;
              for (let b = 0; b < 4; b++) {
                const bAngle = guard.laserSweepAngle + (b * Math.PI) / 2;
                const bx = guard.x + Math.cos(bAngle) * beamLen;
                const by = guard.y + Math.sin(bAngle) * beamLen;
                if (this.lineCircleIntersect(guard.x, guard.y, bx, by, this.player.x, this.player.y, this.player.radius)) {
                  if (this.laserAlarmCooldown <= 0) {
                    this.laserAlarmCooldown = 1.3;
                    this.triggerAlarm(this.player.x, this.player.y, 'MATRIX MELTDOWN BEAM HIT!');
                  }
                }
              }
            }
          }
        }
      }

      // Check guard vision towards player
      const canSee = !this.player.inVent && !isPlayerInSmoke && this.canGuardSeePlayer(guard);

      if (canSee) {
        if (guard.state !== 'alert' && guard.state !== 'attacking') {
          guard.state = 'alert';
          guard.alertTimer = 0;
          guard.shootCooldown = 1.35; // Crucial reaction window so player has time to react, hide, or strike
          this.metrics.alarmsTriggered++;
          soundManager.playAlert();
          this.triggerAlarm(this.player.x, this.player.y, 'INTRUDER SPOTTED!');
        }

        // Guard turns directly towards player
        const targetAngle = Math.atan2(this.player.y - guard.y, this.player.x - guard.x);
        guard.angle = targetAngle;
        guard.lastKnownPlayerPos = { x: this.player.x, y: this.player.y };
        guard.investigatePos = null; // Alert overrides distraction investigation

        // Countdown shoot timer
        guard.shootCooldown -= dt;
        if (guard.shootCooldown <= 0) {
          // Guard fires at player!
          soundManager.playGunshot();
          this.screenShake = 12;

          // Check if Cyber Deflector shield saves the player
          if (this.player.shieldActive) {
            this.player.shieldActive = false;
            soundManager.playShieldDeflect();
            this.addFloatingText('DEFLECTOR SHIELD BROKEN!', this.player.x, this.player.y - 30, '#ffbe0b');
            // Shield knockback guards
            guard.shootCooldown = 1.0;
          } else {
            // Player eliminated!
            this.stop();
            soundManager.playDefeat();
            this.callbacks.onDefeat('Caught in guard line-of-fire.', this.metrics);
            return;
          }
        }
      } else {
        // Not seeing player currently
        if (guard.state === 'alert') {
          guard.alertTimer += dt;
          if (guard.alertTimer > 4.0) {
            // Cool down back to patrol
            guard.state = 'patrol';
            guard.shootCooldown = 0.65;
          }
        }

        // 1. INVESTIGATING DISTRACTION SOUND
        if (guard.state === 'suspicious') {
          if (guard.investigatePos) {
            const distToNoise = Math.hypot(guard.investigatePos.x - guard.x, guard.investigatePos.y - guard.y);

            if (distToNoise > 15) {
              const desiredAngle = Math.atan2(guard.investigatePos.y - guard.y, guard.investigatePos.x - guard.x);
              guard.angle = desiredAngle;
              const moveSpeed = guard.speed * 1.15;
              const nextX = guard.x + Math.cos(desiredAngle) * moveSpeed;
              const nextY = guard.y + Math.sin(desiredAngle) * moveSpeed;

              if (!this.checkWallCollision(nextX, nextY, guard.radius)) {
                guard.x = nextX;
                guard.y = nextY;
              } else {
                guard.investigateTimer = 2.0; // Stop if wall blocked
              }
            } else {
              // At distraction spot: pause and search
              guard.investigateTimer += dt;
              guard.angle += guard.sweepAngleSpeed * 2.2; // Sweep head searching

              if (guard.investigateTimer > 2.8) {
                // Done investigating decoy!
                guard.state = 'patrol';
                guard.investigatePos = null;
                guard.investigateTimer = 0;
              }
            }
          } else {
            guard.state = 'patrol';
          }
        }
        // 2. REGULAR PATROL ROUTE WAYPOINT MOVEMENT
        else if (guard.state === 'patrol') {
          if (guard.patrolPoints.length > 0) {
            const targetPt = guard.patrolPoints[guard.currentPatrolIdx];
            const distToPt = Math.hypot(targetPt.x - guard.x, targetPt.y - guard.y);

            if (distToPt > 6) {
              const desiredAngle = Math.atan2(targetPt.y - guard.y, targetPt.x - guard.x);
              guard.angle = desiredAngle;
              const moveSpeed = guard.speed;
              const nextX = guard.x + Math.cos(desiredAngle) * moveSpeed;
              const nextY = guard.y + Math.sin(desiredAngle) * moveSpeed;

              if (!this.checkWallCollision(nextX, nextY, guard.radius)) {
                guard.x = nextX;
                guard.y = nextY;
              } else {
                this.advanceGuardWaypoint(guard);
              }
            } else {
              // Wait and scan at destination waypoint
              guard.waitTimer += dt;
              guard.angle += guard.sweepAngleSpeed;

              if (guard.waitTimer > 1.8) {
                guard.waitTimer = 0;
                this.advanceGuardWaypoint(guard);
              }
            }
          } else {
            // Stationary guard sweeping
            guard.angle += guard.sweepAngleSpeed;
          }
        }
      }
    }
  }

  // Advance guard waypoints along their distinct sequence, reversing or cycling smoothly
  private advanceGuardWaypoint(guard: Guard) {
    if (guard.patrolPoints.length <= 1) return;

    if (guard.patrolForward) {
      if (guard.currentPatrolIdx < guard.patrolPoints.length - 1) {
        guard.currentPatrolIdx++;
      } else {
        // Reached terminal destination: turn around and reverse patrol direction
        guard.patrolForward = false;
        guard.currentPatrolIdx = Math.max(0, guard.patrolPoints.length - 2);
      }
    } else {
      if (guard.currentPatrolIdx > 0) {
        guard.currentPatrolIdx--;
      } else {
        // Reached origin destination: reverse forward
        guard.patrolForward = true;
        guard.currentPatrolIdx = Math.min(1, guard.patrolPoints.length - 1);
      }
    }
  }

  public isPlayerInSafeZone(): boolean {
    if (!this.level.safeZone) return false;
    const { x1, y1, x2, y2 } = this.level.safeZone;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return this.player.x >= minX && this.player.x <= maxX && this.player.y >= minY && this.player.y <= maxY;
  }

  private canGuardSeePlayer(guard: Guard): boolean {
    // Player is completely protected from line of fire detection during spawn grace period or inside safe staging airlock
    if (this.spawnGraceTimer > 0) return false;
    if (this.isPlayerInSafeZone()) return false;

    const dx = this.player.x - guard.x;
    const dy = this.player.y - guard.y;
    const dist = Math.hypot(dx, dy);

    if (dist > guard.visionRange) return false;

    // Check angle within FOV
    const angleToPlayer = Math.atan2(dy, dx);
    let diff = Math.abs(angleToPlayer - guard.angle);
    while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

    if (diff > guard.fov / 2) return false;

    // Raycast wall occlusion between guard and player
    return !this.isLineBlockedByWall(guard.x, guard.y, this.player.x, this.player.y);
  }

  private checkAssassinations(_dt: number) {
    if (this.player.isAttacking) return;

    for (const guard of this.guards) {
      if (guard.state === 'dead') continue;

      const dx = guard.x - this.player.x;
      const dy = guard.y - this.player.y;
      const dist = Math.hypot(dx, dy);

      // Check within melee strike range
      if (dist <= this.player.strikeRange + guard.radius) {
        // Line of sight check between assassin and guard
        if (this.isLineBlockedByWall(this.player.x, this.player.y, guard.x, guard.y)) {
          continue;
        }

        // Shield check: Shielded guard or Boss Kinetic Shield blocks frontal attacks
        if (guard.type === 'shielded' || (guard.type === 'boss' && guard.bossShieldActive)) {
          const guardToPlayerAngle = Math.atan2(this.player.y - guard.y, this.player.x - guard.x);
          let shieldAngleDiff = Math.abs(guardToPlayerAngle - guard.angle);
          while (shieldAngleDiff > Math.PI) shieldAngleDiff = Math.abs(shieldAngleDiff - Math.PI * 2);

          // If striking within frontal 100 degrees of guard shield and not blinded by smoke:
          if (shieldAngleDiff < Math.PI / 1.8 && !this.isPointInSmoke(guard.x, guard.y)) {
            // Attack deflected by shield!
            soundManager.playShieldDeflect();
            this.addFloatingText(guard.type === 'boss' ? 'KINETIC SHIELD BLOCKED!' : 'SHIELD BLOCKED!', guard.x, guard.y - 30, '#ef4444');
            this.player.attackCooldown = 0.3;
            continue;
          }
        }

        // Execute assassination strike!
        this.executeTakedown(guard);
        break;
      }
    }
  }

  private executeTakedown(guard: Guard) {
    this.player.isAttacking = true;
    this.player.attackAnimTimer = 0.22;
    this.player.angle = Math.atan2(guard.y - this.player.y, guard.x - this.player.x);
    this.screenShake = 6;

    soundManager.playSlash();

    // Spawn slash trail particles
    const trailColor = BLADE_TRAILS.find((t) => t.id === this.player.trailId)?.color || '#00f5d4';
    for (let i = 0; i < 16; i++) {
      const pAngle = this.player.angle + (Math.random() - 0.5) * 1.5;
      const pSpeed = 3 + Math.random() * 5;
      this.particles.push({
        x: guard.x,
        y: guard.y,
        vx: Math.cos(pAngle) * pSpeed,
        vy: Math.sin(pAngle) * pSpeed,
        color: trailColor,
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
        shape: 'square',
      });
    }

    // MULTI-PHASE BOSS DAMAGE & PHASE TRANSITION
    if (guard.type === 'boss') {
      guard.hp--;
      guard.bossPhaseHp = Math.max(0, (guard.bossPhaseHp ?? guard.hp + 1) - 1);

      if (guard.hp > 0) {
        soundManager.playShieldDeflect();
        this.addFloatingText(`BOSS DAMAGED! [${guard.hp}/${guard.maxHp}]`, guard.x, guard.y - 30, '#f59e0b');
        guard.waitTimer = 0.4;
        return;
      }

      // Current phase HP reached 0: Check if another phase exists!
      const currentPhase = guard.bossPhase || 1;
      const maxPhases = guard.maxBossPhases || 1;

      if (currentPhase < maxPhases) {
        // ADVANCE TO NEXT BOSS PHASE!
        guard.bossPhase = currentPhase + 1;
        guard.maxHp = guard.maxBossPhaseHp || 4;
        guard.hp = guard.maxHp;
        guard.bossPhaseHp = guard.maxHp;

        // In Phase 2+, Lord Vanguard sheds frontal kinetic barrier
        if (guard.id === 'boss-vanguard' && guard.bossPhase >= 2) {
          guard.bossShieldActive = false;
        }

        soundManager.playBossPhaseShift();
        this.screenShake = 18;
        this.addFloatingText(`⚡ PHASE ${guard.bossPhase} ENGAGED: OVERDRIVE! ⚡`, guard.x, guard.y - 45, '#ff0055');

        // Shockwave EMP ring
        for (let i = 0; i < 36; i++) {
          const angle = (i / 36) * Math.PI * 2;
          const speed = 4 + Math.random() * 5;
          this.particles.push({
            x: guard.x,
            y: guard.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#ff0055',
            size: 3.5,
            alpha: 1,
            life: 0,
            maxLife: 0.6,
            shape: 'square',
          });
        }

        // Spawn reinforcement minion from vent
        if (this.vents.length > 0) {
          const vent = this.vents[Math.floor(Math.random() * this.vents.length)];
          const newType = guard.bossPhase === 3 ? 'armored' : 'shielded';
          this.guards.push({
            id: `boss-reinforce-${Date.now()}`,
            type: newType,
            x: vent.x + vent.w / 2,
            y: vent.y + vent.h / 2,
            radius: newType === 'armored' ? 19 : 17,
            speed: 1.35,
            angle: 0,
            fov: Math.PI / 3,
            visionRange: 175,
            state: 'alert',
            alertTimer: 0,
            waitTimer: 0,
            patrolPoints: [{ x: vent.x, y: vent.y }, { x: guard.x, y: guard.y }],
            currentPatrolIdx: 0,
            patrolForward: true,
            shootCooldown: 1.2,
            sweepAngleSpeed: 0.025,
            hp: newType === 'armored' ? 2 : 1,
            maxHp: newType === 'armored' ? 2 : 1,
            lastKnownPlayerPos: { x: this.player.x, y: this.player.y },
            investigatePos: null,
            investigateTimer: 0,
          });
          this.addFloatingText('MINION REINFORCEMENTS!', vent.x, vent.y - 20, '#ff5400');
        }

        this.metrics.coinsEarned += 80;
        return;
      }

      // FINAL PHASE CLEARED! BOSS ANNIHILATED!
      guard.state = 'dead';
      soundManager.playBossDefeat();
      this.screenShake = 22;
      this.addFloatingText('★ CLIMAX BOSS DESTROYED! ★', guard.x, guard.y - 45, '#00f5d4');
    } else {
      // Standard or Armored guard damage
      guard.hp--;

      if (guard.hp > 0) {
        soundManager.playShieldDeflect();
        this.addFloatingText(`ARMOR CRACKED! [${guard.hp}/${guard.maxHp}]`, guard.x, guard.y - 30, '#f59e0b');
        guard.waitTimer = 0.4;
        return;
      }

      // Guard Killed!
      guard.state = 'dead';
      soundManager.playAssassinate();
    }

    // Increment combos and stats
    this.metrics.kills++;
    this.metrics.combo++;
    this.metrics.comboTimer = 5.0; // 5 seconds combo window
    if (this.metrics.combo > this.metrics.maxCombo) {
      this.metrics.maxCombo = this.metrics.combo;
    }

    // Chime ascending sound
    soundManager.playCombo(this.metrics.combo);

    // Coins reward
    const baseReward = guard.type === 'boss' ? 80 : guard.type === 'armored' ? 25 : 15;
    const earnedCoins = baseReward * Math.max(1, this.metrics.combo);
    this.metrics.coinsEarned += earnedCoins;
    soundManager.playCoin();

    // Floating text
    const comboPrefix = this.metrics.combo > 1 ? `x${this.metrics.combo} COMBO! ` : '';
    this.addFloatingText(`${comboPrefix}+${earnedCoins} CREDITS`, guard.x, guard.y - 35, '#00f5d4');

    // Cyber disintegration particles (digital burst)
    const bloodColors = ['#ff0055', '#ff5400', '#00f5d4', '#ffffff'];
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: guard.x,
        y: guard.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: bloodColors[Math.floor(Math.random() * bloodColors.length)],
        size: 2.5 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.5,
        shape: 'square',
      });
    }
  }

  private triggerAlarm(locX: number, locY: number, message: string) {
    soundManager.playLaserAlarm();
    this.screenShake = 8;
    this.addFloatingText(message, locX, locY - 30, '#ff0055');

    // Alert all guards in proximity
    for (const g of this.guards) {
      if (g.state === 'dead') continue;
      const dist = Math.hypot(g.x - locX, g.y - locY);
      if (dist < 400) {
        g.state = 'alert';
        g.alertTimer = 0;
        g.angle = Math.atan2(locY - g.y, locX - g.x);
      }
    }
  }

  public isPointInSmoke(x: number, y: number): boolean {
    for (const smoke of this.smokeClouds) {
      const dist = Math.hypot(smoke.x - x, smoke.y - y);
      if (dist <= smoke.radius) return true;
    }
    return false;
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= dt * 25; // drift upward
      ft.life += dt;
      ft.alpha = Math.max(0, 1 - ft.life / 1.2);
      if (ft.life >= 1.2) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private addFloatingText(text: string, x: number, y: number, color: string) {
    this.floatingTexts.push({
      id: `ft-${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      color,
      size: 13,
      alpha: 1,
      life: 0,
    });
  }

  public checkWallCollision(x: number, y: number, radius: number): boolean {
    for (const w of this.walls) {
      // Find closest point on wall AABB
      const closestX = Math.max(w.x, Math.min(x, w.x + w.w));
      const closestY = Math.max(w.y, Math.min(y, w.y + w.h));
      const dist = Math.hypot(x - closestX, y - closestY);
      if (dist < radius) return true;
    }
    return false;
  }

  public isLineBlockedByWall(x1: number, y1: number, x2: number, y2: number): boolean {
    for (const w of this.walls) {
      if (this.lineRectIntersect(x1, y1, x2, y2, w.x, w.y, w.w, w.h)) {
        return true;
      }
    }
    return false;
  }

  private lineRectIntersect(x1: number, y1: number, x2: number, y2: number, rx: number, ry: number, rw: number, rh: number): boolean {
    // 4 edges of rectangle
    if (this.lineLineIntersect(x1, y1, x2, y2, rx, ry, rx + rw, ry)) return true;
    if (this.lineLineIntersect(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh)) return true;
    if (this.lineLineIntersect(x1, y1, x2, y2, rx + rw, ry + rh, rx, ry + rh)) return true;
    if (this.lineLineIntersect(x1, y1, x2, y2, rx, ry + rh, rx, ry)) return true;
    return false;
  }

  private lineLineIntersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  private lineCircleIntersect(x1: number, y1: number, x2: number, y2: number, cx: number, cy: number, r: number): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) return Math.hypot(cx - x1, cy - y1) <= r;
    const u = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / (len * len)));
    const px = x1 + u * dx;
    const py = y1 + u * dy;
    return Math.hypot(cx - px, cy - py) <= r;
  }

  public getScreenShakeOffset(): Point {
    if (this.screenShake <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.screenShake,
      y: (Math.random() - 0.5) * this.screenShake,
    };
  }

  // Raycast vision polygon for guard flashlight rendering against walls
  public computeGuardVisionCone(guard: Guard, numRays: number = 28): Point[] {
    const points: Point[] = [];
    const halfFov = guard.fov / 2;
    const startAngle = guard.angle - halfFov;
    const step = guard.fov / (numRays - 1);

    for (let i = 0; i < numRays; i++) {
      const rayAngle = startAngle + step * i;
      const rayCos = Math.cos(rayAngle);
      const raySin = Math.sin(rayAngle);
      let closestDist = guard.visionRange;

      // Test ray collision against all walls
      for (const w of this.walls) {
        // Segments of wall
        const segments = [
          [w.x, w.y, w.x + w.w, w.y],
          [w.x + w.w, w.y, w.x + w.w, w.y + w.h],
          [w.x + w.w, w.y + w.h, w.x, w.y + w.h],
          [w.x, w.y + w.h, w.x, w.y],
        ];

        for (const [x3, y3, x4, y4] of segments) {
          const x1 = guard.x;
          const y1 = guard.y;
          const x2 = guard.x + rayCos * closestDist;
          const y2 = guard.y + raySin * closestDist;

          const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
          if (denom !== 0) {
            const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
            const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
            if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
              closestDist *= ua;
            }
          }
        }
      }

      points.push({
        x: guard.x + rayCos * closestDist,
        y: guard.y + raySin * closestDist,
      });
    }

    return points;
  }
}
