import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { soundEngine } from '../audio/soundEngine';
import { pickVehicleForFloor, VEHICLE_ROSTER } from '../data/vehicles';
import {
  drawActiveCar,
  drawCraneAndCable,
  drawFallingDebris,
  drawGroundPlatform,
  drawParticlesAndCallouts,
  drawSkyAndCity,
  drawStackedBlock,
  GROUND_PAD_WIDTH,
  GROUND_PAD_X,
  WORLD_WIDTH,
} from '../engine/carRenderer';
import {
  ActiveCar,
  FallingDebris,
  FloatingCallout,
  GameState,
  Particle,
  RunStats,
  StackedBlock,
} from '../types/game';

export interface GameCanvasHandle {
  triggerDrop: () => void;
}

interface GameCanvasProps {
  gameState: GameState;
  runId: number;
  onStatsChange: (stats: RunStats) => void;
  onGameOver: (finalStats: RunStats) => void;
}

const PERFECT_TOLERANCE = 5.5;
const CRANE_TRAVEL_MARGIN = 16;
const GRAVITY = -2650;
const INITIAL_DROP_VY = -340;
const CRANE_SCREEN_Y = 84;
const CABLE_LENGTH = 44;

interface EngineState {
  stackedBlocks: StackedBlock[];
  activeCar: ActiveCar | null;
  debris: FallingDebris[];
  particles: Particle[];
  callouts: FloatingCallout[];
  cameraElevation: number;
  targetCameraElevation: number;
  shakeTimer: number;
  shakeIntensity: number;
  floor: number;
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  currentWidth: number;
  nextId: number;
  timeSec: number;
  worldHeight: number;
  lastActionLabel: string;
}

function createInitialEngineState(worldHeight: number): EngineState {
  const starter = pickVehicleForFloor(0);
  const startWidth = starter.idealWidth;
  return {
    stackedBlocks: [],
    activeCar: {
      blueprint: starter,
      x: (WORLD_WIDTH - startWidth) / 2,
      width: startWidth,
      height: starter.height,
      elevation: 400,
      vx: 155,
      vy: 0,
      direction: 1,
      phase: 'SWINGING',
      swayPhase: 0,
    },
    debris: [],
    particles: [],
    callouts: [],
    cameraElevation: 0,
    targetCameraElevation: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    floor: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectCount: 0,
    currentWidth: startWidth,
    nextId: 1,
    timeSec: 0,
    worldHeight,
    lastActionLabel: '準備就緒 · 點擊落車',
  };
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  function GameCanvas({ gameState, runId, onStatsChange, onGameOver }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<EngineState>(createInitialEngineState(700));
    const gameStateRef = useRef<GameState>(gameState);
    const reducedMotionRef = useRef<boolean>(false);

    useEffect(() => {
      gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotionRef.current = mq.matches;
      const listener = (e: MediaQueryListEvent) => {
        reducedMotionRef.current = e.matches;
      };
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }, []);

    const emitStats = useCallback(
      (eng: EngineState) => {
        const nextVehicle =
          eng.activeCar?.blueprint ?? pickVehicleForFloor(eng.floor);
        onStatsChange({
          floor: eng.floor,
          score: eng.score,
          combo: eng.combo,
          maxCombo: eng.maxCombo,
          perfectCount: eng.perfectCount,
          currentWidth: Math.round(eng.currentWidth),
          nextVehicle,
          lastActionLabel: eng.lastActionLabel,
        });
      },
      [onStatsChange]
    );

    const spawnNextCar = useCallback((eng: EngineState, floor: number, width: number) => {
      const blueprint = pickVehicleForFloor(floor);
      const speed = 158 + 215 * (1 - Math.exp(-floor / 18));
      const fromLeft = floor % 2 === 0;
      const minX = CRANE_TRAVEL_MARGIN;
      const maxX = Math.max(minX + 10, WORLD_WIDTH - CRANE_TRAVEL_MARGIN - width);
      const startX = fromLeft ? minX : maxX;

      const groundScreenY = eng.worldHeight - 76;
      const craneElevation = groundScreenY - CRANE_SCREEN_Y + eng.cameraElevation;
      const carElevation = craneElevation - CABLE_LENGTH - blueprint.height;

      eng.activeCar = {
        blueprint,
        x: startX,
        width,
        height: blueprint.height,
        elevation: carElevation,
        vx: speed,
        vy: 0,
        direction: fromLeft ? 1 : -1,
        phase: 'SWINGING',
        swayPhase: 0,
      };
    }, []);

    // Reset game state whenever a new run starts
    useEffect(() => {
      const eng = createInitialEngineState(engineRef.current.worldHeight);
      spawnNextCar(eng, 0, VEHICLE_ROSTER[0].idealWidth);
      engineRef.current = eng;
      emitStats(eng);
    }, [runId, spawnNextCar, emitStats]);

    const triggerDrop = useCallback(() => {
      if (gameStateRef.current !== 'PLAYING') return;
      const eng = engineRef.current;
      if (!eng.activeCar || eng.activeCar.phase !== 'SWINGING') return;

      soundEngine.unlock();
      soundEngine.playDrop();
      eng.activeCar.phase = 'FALLING';
      eng.activeCar.vy = INITIAL_DROP_VY;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        triggerDrop,
      }),
      [triggerDrop]
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let cssWidth = container.clientWidth || 390;
      let cssHeight = container.clientHeight || 700;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);

      const syncSize = () => {
        cssWidth = Math.max(280, container.clientWidth);
        cssHeight = Math.max(420, container.clientHeight);
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
        const scale = cssWidth / WORLD_WIDTH;
        engineRef.current.worldHeight = cssHeight / scale;
      };

      syncSize();
      const ro = new ResizeObserver(syncSize);
      ro.observe(container);

      const spawnDust = (
        eng: EngineState,
        x: number,
        width: number,
        elevation: number,
        color: string,
        count: number
      ) => {
        for (let i = 0; i < count; i++) {
          const rx = x + Math.random() * width;
          eng.particles.push({
            x: rx,
            elevation: elevation + 2,
            vx: (Math.random() - 0.5) * 110,
            vy: 35 + Math.random() * 85,
            size: 2.5 + Math.random() * 3,
            color,
            life: 0.36 + Math.random() * 0.22,
            maxLife: 0.58,
            kind: 'dust',
          });
        }
      };

      const spawnSliceSparks = (
        eng: EngineState,
        seamX: number,
        elevation: number,
        height: number
      ) => {
        for (let i = 0; i < 10; i++) {
          eng.particles.push({
            x: seamX,
            elevation: elevation + Math.random() * height,
            vx: (Math.random() - 0.5) * 140,
            vy: 40 + Math.random() * 120,
            size: 2.2 + Math.random() * 2.2,
            color: i % 2 === 0 ? '#FEF08A' : '#FB923C',
            life: 0.32 + Math.random() * 0.2,
            maxLife: 0.52,
            kind: 'spark',
          });
        }
      };

      const handleLanding = (eng: EngineState, car: ActiveCar, landingElevation: number) => {
        const topBlock =
          eng.stackedBlocks.length > 0
            ? eng.stackedBlocks[eng.stackedBlocks.length - 1]
            : null;

        const targetLeft = topBlock ? topBlock.x : GROUND_PAD_X;
        const targetRight = topBlock
          ? topBlock.x + topBlock.width
          : GROUND_PAD_X + GROUND_PAD_WIDTH;

        const dropLeft = car.x;
        const dropRight = car.x + car.width;

        const overlapLeft = Math.max(dropLeft, targetLeft);
        const overlapRight = Math.min(dropRight, targetRight);
        const overlapWidth = overlapRight - overlapLeft;

        // Completely missed the tower or parking pad -> GAME OVER
        if (overlapWidth <= 2.5) {
          const dropCenter = dropLeft + car.width / 2;
          const targetCenter = (targetLeft + targetRight) / 2;
          const missDir = dropCenter >= targetCenter ? 1 : -1;

          eng.debris.push({
            id: eng.nextId++,
            blueprint: car.blueprint,
            centerX: dropCenter,
            centerElevation: landingElevation + car.height / 2,
            localSpriteX: -car.width / 2,
            spriteWidth: car.width,
            clipLocalX: -car.width / 2,
            clipWidth: car.width,
            height: car.height,
            vx: missDir * 72,
            vy: -140,
            angle: 0,
            angularVelocity: missDir * 3.1,
            alpha: 1,
            isFullMiss: true,
          });

          eng.activeCar = null;
          eng.lastActionLabel = '未對齊車塔 · 墜落出局';
          if (!reducedMotionRef.current) {
            eng.shakeTimer = 0.28;
            eng.shakeIntensity = 6;
          }
          soundEngine.playGameOver();

          const finalStats: RunStats = {
            floor: eng.floor,
            score: eng.score,
            combo: eng.combo,
            maxCombo: eng.maxCombo,
            perfectCount: eng.perfectCount,
            currentWidth: Math.round(eng.currentWidth),
            nextVehicle: car.blueprint,
            lastActionLabel: eng.lastActionLabel,
          };
          onStatsChange(finalStats);
          onGameOver(finalStats);
          return;
        }

        // Check for Perfect Alignment (only applies once tower has at least 1 car)
        const dropCenter = dropLeft + car.width / 2;
        const targetCenter = (targetLeft + targetRight) / 2;
        const isPerfect =
          topBlock !== null && Math.abs(dropCenter - targetCenter) <= PERFECT_TOLERANCE;

        if (isPerfect && topBlock) {
          eng.combo += 1;
          eng.maxCombo = Math.max(eng.maxCombo, eng.combo);
          eng.perfectCount += 1;

          // Consecutive 3+ perfect combo widens car width slightly back toward idealWidth
          let finalWidth = topBlock.width;
          let finalX = topBlock.x;
          let didExpand = false;
          if (eng.combo >= 3 && finalWidth < car.blueprint.idealWidth) {
            const expanded = Math.min(car.blueprint.idealWidth, finalWidth + 10);
            const deltaW = expanded - finalWidth;
            finalX = Math.max(
              CRANE_TRAVEL_MARGIN,
              Math.min(WORLD_WIDTH - CRANE_TRAVEL_MARGIN - expanded, finalX - deltaW / 2)
            );
            finalWidth = expanded;
            didExpand = true;
          }

          const points = 20 + eng.combo * 10;
          eng.score += points;
          eng.floor += 1;
          eng.currentWidth = finalWidth;

          eng.stackedBlocks.push({
            id: eng.nextId++,
            floor: eng.floor,
            blueprint: car.blueprint,
            x: finalX,
            width: finalWidth,
            spriteOriginX: finalX,
            spriteOriginWidth: finalWidth,
            elevation: landingElevation,
            height: car.height,
            isPerfect: true,
            wasExpanded: didExpand,
            landAnim: 1,
            slicedLeft: false,
            slicedRight: false,
          });

          eng.particles.push({
            x: finalX + finalWidth / 2,
            elevation: landingElevation + 2,
            vx: 0,
            vy: 0,
            size: finalWidth * 0.36,
            color: didExpand ? '#10B981' : '#FACC15',
            life: 0.45,
            maxLife: 0.45,
            kind: 'ring',
          });
          spawnDust(eng, finalX, finalWidth, landingElevation, '#FEF08A', 8);

          eng.callouts.push({
            id: eng.nextId++,
            x: finalX + finalWidth / 2,
            elevation: landingElevation + car.height + 16,
            text: didExpand ? `完美 x${eng.combo} · 車寬修復!` : `PERFECT! x${eng.combo}`,
            subtext: `+${points}`,
            color: didExpand ? '#10B981' : '#FACC15',
            life: 0.95,
            maxLife: 0.95,
          });

          eng.lastActionLabel = didExpand
            ? `連擊 x${eng.combo} · 車寬修復`
            : `完美對齊 · 連擊 x${eng.combo}`;
          soundEngine.playPerfect(eng.combo, didExpand);
        } else {
          // Standard landing (or first floor on ground pad) with overhang slicing
          eng.combo = 0;

          const slicedLeft = dropLeft < targetLeft - 0.5;
          const slicedRight = dropRight > targetRight + 0.5;
          const hasSlice = slicedLeft || slicedRight;

          // Spawn clipped falling debris for any overhanging left/right segments
          if (slicedLeft) {
            const cutW = targetLeft - dropLeft;
            const fragCenter = dropLeft + cutW / 2;
            eng.debris.push({
              id: eng.nextId++,
              blueprint: car.blueprint,
              centerX: fragCenter,
              centerElevation: landingElevation + car.height / 2,
              localSpriteX: dropLeft - fragCenter,
              spriteWidth: car.width,
              clipLocalX: dropLeft - fragCenter,
              clipWidth: cutW,
              height: car.height,
              vx: -62 - Math.random() * 25,
              vy: 45,
              angle: 0,
              angularVelocity: -3.2,
              alpha: 1,
              isFullMiss: false,
            });
            spawnSliceSparks(eng, targetLeft, landingElevation, car.height);
          }

          if (slicedRight) {
            const cutW = dropRight - targetRight;
            const fragCenter = targetRight + cutW / 2;
            eng.debris.push({
              id: eng.nextId++,
              blueprint: car.blueprint,
              centerX: fragCenter,
              centerElevation: landingElevation + car.height / 2,
              localSpriteX: dropLeft - fragCenter,
              spriteWidth: car.width,
              clipLocalX: targetRight - fragCenter,
              clipWidth: cutW,
              height: car.height,
              vx: 62 + Math.random() * 25,
              vy: 45,
              angle: 0,
              angularVelocity: 3.2,
              alpha: 1,
              isFullMiss: false,
            });
            spawnSliceSparks(eng, targetRight, landingElevation, car.height);
          }

          const points =
            topBlock === null
              ? 10
              : 10 + Math.max(1, Math.round((overlapWidth / car.width) * 10));

          eng.score += points;
          eng.floor += 1;
          eng.currentWidth = overlapWidth;

          eng.stackedBlocks.push({
            id: eng.nextId++,
            floor: eng.floor,
            blueprint: car.blueprint,
            x: overlapLeft,
            width: overlapWidth,
            spriteOriginX: dropLeft,
            spriteOriginWidth: car.width,
            elevation: landingElevation,
            height: car.height,
            isPerfect: false,
            wasExpanded: false,
            landAnim: 1,
            slicedLeft,
            slicedRight,
          });

          spawnDust(eng, overlapLeft, overlapWidth, landingElevation, '#E2E8F0', 6);
          eng.callouts.push({
            id: eng.nextId++,
            x: overlapLeft + overlapWidth / 2,
            elevation: landingElevation + car.height + 14,
            text: hasSlice ? '裁切疊高' : topBlock === null ? '穩固起點!' : '成功堆疊',
            subtext: `+${points}`,
            color: '#FFFFFF',
            life: 0.72,
            maxLife: 0.72,
          });

          eng.lastActionLabel = hasSlice
            ? `第 ${eng.floor} 層 · 已消去多餘車身`
            : `第 ${eng.floor} 層 · 穩固著陸`;
          soundEngine.playLand(hasSlice);

          if (hasSlice && !reducedMotionRef.current) {
            eng.shakeTimer = 0.12;
            eng.shakeIntensity = 2.5;
          }
        }

        // Advance camera target elevation so stack top stays comfortably positioned
        const newTopElevation = landingElevation + car.height;
        const desiredClearance = eng.worldHeight * 0.28;
        eng.targetCameraElevation = Math.max(0, newTopElevation - desiredClearance);

        // Spawn next vehicle from crane
        spawnNextCar(eng, eng.floor, eng.currentWidth);
        emitStats(eng);
      };

      let lastTime = performance.now();
      let rafId = 0;

      const tick = (now: number) => {
        const rawDt = (now - lastTime) / 1000;
        lastTime = now;
        const dt = Math.min(0.05, Math.max(0, rawDt));

        const eng = engineRef.current;
        const state = gameStateRef.current;

        if (state !== 'PAUSED') {
          eng.timeSec += dt;

          // Smooth camera spring follow
          eng.cameraElevation +=
            (eng.targetCameraElevation - eng.cameraElevation) *
            Math.min(1, dt * 6.5);

          // Screen shake decay
          if (eng.shakeTimer > 0) {
            eng.shakeTimer = Math.max(0, eng.shakeTimer - dt);
          }

          // Animate landing squash & stretch
          for (const b of eng.stackedBlocks) {
            if (b.landAnim > 0) {
              b.landAnim = Math.max(0, b.landAnim - dt * 3.8);
            }
          }

          // Update active car (swings in TITLE_MENU for lively preview, swings/falls in PLAYING)
          if (eng.activeCar && (state === 'PLAYING' || state === 'TITLE_MENU')) {
            const car = eng.activeCar;
            const groundScreenY = eng.worldHeight - 76;
            const craneElevation =
              groundScreenY - CRANE_SCREEN_Y + eng.cameraElevation;

            if (car.phase === 'SWINGING') {
              car.elevation = craneElevation - CABLE_LENGTH - car.height;
              car.x += car.vx * car.direction * dt;
              car.swayPhase += dt * 4.2;

              const minX = CRANE_TRAVEL_MARGIN;
              const maxX = Math.max(
                minX + 4,
                WORLD_WIDTH - CRANE_TRAVEL_MARGIN - car.width
              );
              if (car.x <= minX) {
                car.x = minX;
                car.direction = 1;
              } else if (car.x >= maxX) {
                car.x = maxX;
                car.direction = -1;
              }
            } else if (car.phase === 'FALLING' && state === 'PLAYING') {
              car.vy += GRAVITY * dt;
              car.elevation += car.vy * dt;

              const topBlock =
                eng.stackedBlocks.length > 0
                  ? eng.stackedBlocks[eng.stackedBlocks.length - 1]
                  : null;
              const targetElevation = topBlock
                ? topBlock.elevation + topBlock.height
                : 0;

              if (car.elevation <= targetElevation) {
                handleLanding(eng, car, targetElevation);
              }
            }
          }

          // Update falling debris physics
          for (let i = eng.debris.length - 1; i >= 0; i--) {
            const d = eng.debris[i];
            d.vy += GRAVITY * 0.72 * dt;
            d.centerX += d.vx * dt;
            d.centerElevation += d.vy * dt;
            d.angle += d.angularVelocity * dt;
            d.alpha -= dt * 0.55;
            if (d.alpha <= 0 || d.centerElevation < eng.cameraElevation - 300) {
              eng.debris.splice(i, 1);
            }
          }

          // Update particles
          for (let i = eng.particles.length - 1; i >= 0; i--) {
            const p = eng.particles[i];
            p.life -= dt;
            if (p.kind !== 'ring') {
              p.vy += GRAVITY * 0.35 * dt;
              p.x += p.vx * dt;
              p.elevation += p.vy * dt;
            }
            if (p.life <= 0) {
              eng.particles.splice(i, 1);
            }
          }

          // Update floating callouts
          for (let i = eng.callouts.length - 1; i >= 0; i--) {
            const c = eng.callouts[i];
            c.life -= dt;
            c.elevation += 26 * dt;
            if (c.life <= 0) {
              eng.callouts.splice(i, 1);
            }
          }
        }

        // --- RENDER FRAME ---
        const scale = cssWidth / WORLD_WIDTH;
        const worldH = eng.worldHeight;
        const groundScreenY = worldH - 76;

        ctx.save();
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

        if (eng.shakeTimer > 0 && !reducedMotionRef.current) {
          const sx = (Math.random() - 0.5) * eng.shakeIntensity * 2;
          const sy = (Math.random() - 0.5) * eng.shakeIntensity * 2;
          ctx.translate(sx, sy);
        }

        drawSkyAndCity(
          ctx,
          WORLD_WIDTH,
          worldH,
          groundScreenY,
          eng.cameraElevation,
          eng.timeSec
        );

        drawGroundPlatform(ctx, WORLD_WIDTH, worldH, groundScreenY);

        // Draw stacked tower blocks from bottom to top
        for (const block of eng.stackedBlocks) {
          drawStackedBlock(ctx, block, groundScreenY, eng.cameraElevation);
        }

        // Subtle landing shadow on top surface while active car is falling
        if (eng.activeCar && eng.activeCar.phase === 'FALLING') {
          const topBlock =
            eng.stackedBlocks.length > 0
              ? eng.stackedBlocks[eng.stackedBlocks.length - 1]
              : null;
          const targetElev = topBlock ? topBlock.elevation + topBlock.height : 0;
          const shadowY = groundScreenY - (targetElev - eng.cameraElevation);
          const car = eng.activeCar;
          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
          ctx.fillRect(car.x + 4, shadowY - 2, Math.max(0, car.width - 8), 3);
          ctx.restore();
        }

        // Draw overhead crane + active hanging/falling car
        if (eng.activeCar) {
          const car = eng.activeCar;
          const carTopScreenY =
            groundScreenY - (car.elevation + car.height - eng.cameraElevation);
          drawCraneAndCable(
            ctx,
            WORLD_WIDTH,
            CRANE_SCREEN_Y,
            car.x + car.width / 2,
            carTopScreenY,
            car.width,
            car.phase === 'SWINGING',
            car.swayPhase
          );
          drawActiveCar(ctx, car, groundScreenY, eng.cameraElevation);
        } else {
          drawCraneAndCable(
            ctx,
            WORLD_WIDTH,
            CRANE_SCREEN_Y,
            WORLD_WIDTH / 2,
            CRANE_SCREEN_Y + 30,
            60,
            false,
            0
          );
        }

        // Draw sliced-off / missed falling debris
        for (const d of eng.debris) {
          drawFallingDebris(ctx, d, groundScreenY, eng.cameraElevation);
        }

        // Draw particles & floating callouts
        drawParticlesAndCallouts(
          ctx,
          eng.particles,
          eng.callouts,
          groundScreenY,
          eng.cameraElevation
        );

        ctx.restore();

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(rafId);
        ro.disconnect();
      };
    }, [emitStats, onGameOver, onStatsChange, spawnNextCar]);

    return (
      <div
        ref={containerRef}
        className="relative h-full w-full select-none overflow-hidden touch-manipulation"
        onPointerDown={(e) => {
          if (e.button !== 0 && e.pointerType === 'mouse') return;
          triggerDrop();
        }}
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full cursor-pointer"
          aria-label="SkyStack 汽車疊疊樂遊戲畫布，點擊螢幕即可釋放上方吊臂車輛"
        />
      </div>
    );
  }
);
