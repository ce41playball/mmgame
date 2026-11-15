import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { GameState, RunStats } from '../types/game';

interface GameHUDProps {
  gameState: GameState;
  stats: RunStats;
  bestScore: number;
  muted: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
}

export function GameHUD({
  gameState,
  stats,
  bestScore,
  muted,
  onToggleMute,
  onTogglePause,
}: GameHUDProps) {
  const showActiveMetrics = gameState === 'PLAYING' || gameState === 'PAUSED';

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 bg-white/88 px-3 py-1.5 backdrop-blur-md border-b border-slate-900/10">
      {/* Left: Score & Best */}
      <div className="flex min-w-0 items-baseline gap-2.5">
        <div className="flex flex-col leading-none">
          <span className="text-[11px] font-medium text-slate-500">分數</span>
          <span
            className="font-mono text-xl font-bold tracking-tight text-slate-950 tabular-nums"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {stats.score}
          </span>
        </div>

        <span className="text-slate-300" aria-hidden="true">
          ·
        </span>

        <div className="flex flex-col leading-none">
          <span className="text-[11px] font-medium text-slate-500">樓層</span>
          <span
            className="font-mono text-base font-bold text-slate-800 tabular-nums"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {stats.floor}
          </span>
        </div>

        {showActiveMetrics && stats.combo > 0 && (
          <>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-[11px] font-medium text-orange-600">連擊</span>
              <span
                className="font-mono text-base font-bold text-orange-600 tabular-nums"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                x{stats.combo}
              </span>
            </div>
          </>
        )}

        {!showActiveMetrics && bestScore > 0 && (
          <>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-[11px] font-medium text-slate-500">最高</span>
              <span
                className="font-mono text-base font-bold text-slate-700 tabular-nums"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {bestScore}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right: Functional audio & pause controls (>=44x44px hitboxes) */}
      <div className="pointer-events-auto flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          aria-label={muted ? '開啟音效' : '靜音'}
          title={muted ? '開啟音效 (M)' : '靜音 (M)'}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-900/8 active:scale-95 focus-visible:outline-2 focus-visible:outline-orange-600"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        {showActiveMetrics && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePause();
            }}
            aria-label={gameState === 'PAUSED' ? '繼續遊戲' : '暫停遊戲'}
            title={gameState === 'PAUSED' ? '繼續遊戲 (P)' : '暫停遊戲 (P)'}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-800 transition-colors hover:bg-slate-900/8 active:scale-95 focus-visible:outline-2 focus-visible:outline-orange-600"
          >
            {gameState === 'PAUSED' ? (
              <Play className="h-5 w-5 fill-current" />
            ) : (
              <Pause className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}
