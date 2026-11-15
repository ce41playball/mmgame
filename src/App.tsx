import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { ArcadeSidebar } from './components/ArcadeSidebar';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { GameOverlays } from './components/GameOverlays';
import { VEHICLE_ROSTER } from './data/vehicles';
import {
  loadBestRecords,
  loadMutedPreference,
  saveMutedPreference,
  saveRunToRecords,
} from './storage/records';
import { BestRecords, GameState, RunStats } from './types/game';

const INITIAL_STATS: RunStats = {
  floor: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfectCount: 0,
  currentWidth: VEHICLE_ROSTER[0].idealWidth,
  nextVehicle: VEHICLE_ROSTER[0],
  lastActionLabel: '準備就緒 · 點擊落車',
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [runId, setRunId] = useState<number>(1);
  const [stats, setStats] = useState<RunStats>(INITIAL_STATS);
  const [records, setRecords] = useState<BestRecords>(() => loadBestRecords());
  const [isNewBestScore, setIsNewBestScore] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(() => {
    const pref = loadMutedPreference();
    soundEngine.setMuted(pref);
    return pref;
  });

  const canvasRef = useRef<GameCanvasHandle | null>(null);

  const handleStartOrRestart = useCallback(() => {
    soundEngine.unlock();
    setIsNewBestScore(false);
    setStats(INITIAL_STATS);
    setRunId((id) => id + 1);
    setGameState('PLAYING');
  }, []);

  const handleToggleMute = useCallback(() => {
    soundEngine.unlock();
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      saveMutedPreference(next);
      return next;
    });
  }, []);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') return 'PAUSED';
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, []);

  const handleBackToTitle = useCallback(() => {
    setIsNewBestScore(false);
    setStats(INITIAL_STATS);
    setRunId((id) => id + 1);
    setGameState('TITLE_MENU');
  }, []);

  const handleGameOver = useCallback((finalStats: RunStats) => {
    const result = saveRunToRecords(
      finalStats.score,
      finalStats.floor,
      finalStats.maxCombo
    );
    setRecords(result.records);
    setIsNewBestScore(result.isNewBestScore && finalStats.score > 0);
    setGameState('GAME_OVER');
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.code === 'Space' || e.code === 'ArrowDown') {
        e.preventDefault();
        if (gameState === 'PLAYING') {
          canvasRef.current?.triggerDrop();
        } else if (gameState === 'TITLE_MENU' || gameState === 'GAME_OVER') {
          handleStartOrRestart();
        }
      } else if (e.key === 'p' || e.key === 'P' || e.code === 'Escape') {
        if (gameState === 'PLAYING' || gameState === 'PAUSED') {
          e.preventDefault();
          handleTogglePause();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key === 'r' || e.key === 'R') {
        if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAME_OVER') {
          e.preventDefault();
          handleStartOrRestart();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, handleStartOrRestart, handleToggleMute, handleTogglePause]);

  return (
    <main className="flex h-dvh w-full items-center justify-center bg-slate-950 lg:px-8 lg:py-6">
      <div className="flex h-full w-full max-w-5xl items-stretch justify-center lg:gap-8">
        {/* Primary Vertical Playfield (Full-screen on mobile, crisp arcade cabinet proportion on desktop) */}
        <section
          aria-label="遊戲舞台"
          className="relative h-full w-full overflow-hidden bg-sky-100 lg:max-w-[440px] lg:rounded-2xl lg:border lg:border-slate-800 lg:shadow-2xl"
        >
          <GameHUD
            gameState={gameState}
            stats={stats}
            bestScore={records.bestScore}
            muted={muted}
            onToggleMute={handleToggleMute}
            onTogglePause={handleTogglePause}
          />

          <GameCanvas
            ref={canvasRef}
            gameState={gameState}
            runId={runId}
            onStatsChange={setStats}
            onGameOver={handleGameOver}
          />

          <GameOverlays
            gameState={gameState}
            stats={stats}
            records={records}
            isNewBestScore={isNewBestScore}
            onStartGame={handleStartOrRestart}
            onResumeGame={() => setGameState('PLAYING')}
            onRestartGame={handleStartOrRestart}
            onBackToTitle={handleBackToTitle}
          />
        </section>

        {/* Desktop Auxiliary Arcade Console */}
        <ArcadeSidebar
          gameState={gameState}
          stats={stats}
          records={records}
        />
      </div>
    </main>
  );
}
