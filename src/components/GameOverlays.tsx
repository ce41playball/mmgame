import { Play, RotateCcw, Trophy } from 'lucide-react';
import { BestRecords, GameState, RunStats } from '../types/game';

interface GameOverlaysProps {
  gameState: GameState;
  stats: RunStats;
  records: BestRecords;
  isNewBestScore: boolean;
  onStartGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onBackToTitle: () => void;
}

export function GameOverlays({
  gameState,
  stats,
  records,
  isNewBestScore,
  onStartGame,
  onResumeGame,
  onRestartGame,
  onBackToTitle,
}: GameOverlaysProps) {
  if (gameState === 'PLAYING') {
    if (stats.floor === 0) {
      return (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
          <p className="rounded-xl bg-slate-950/75 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm">
            點擊畫面任一處或按空白鍵，讓汽車落到停車基座上
          </p>
        </div>
      );
    }
    return null;
  }

  if (gameState === 'TITLE_MENU') {
    return (
      <div
        className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/32 p-5 backdrop-blur-[2px]"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-[336px] rounded-2xl bg-white/95 p-6 text-slate-900 shadow-2xl border border-slate-200/80">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wide text-orange-600">
              2D 都市街機疊疊樂
            </p>
            <h1
              className="text-3xl font-extrabold tracking-tight text-slate-950"
              style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
            >
              SkyStack 汽車疊疊樂
            </h1>
          </div>

          <ol className="mt-5 space-y-2.5 border-t border-slate-200 pt-4 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-xs font-bold text-orange-600 pt-0.5 tabular-nums">
                01
              </span>
              <span>上方吊臂會左右移動懸掛各式都市車輛，抓準時機點擊落車。</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-xs font-bold text-orange-600 pt-0.5 tabular-nums">
                02
              </span>
              <span>沒有與下方車身對齊的多餘部位會即時裁切掉落，車寬將會變窄。</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-xs font-bold text-orange-600 pt-0.5 tabular-nums">
                03
              </span>
              <span>連續精準對齊可觸發完美連擊加分並修復車寬；完全沒疊到即結束遊戲。</span>
            </li>
          </ol>

          {records.totalGames > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3.5 text-xs text-slate-600">
              <span>本機最佳紀錄</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {records.bestScore} 分 · {records.bestFloor} 層 · x{records.bestCombo} 連擊
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onStartGame}
            className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-base font-bold text-white shadow-sm transition-transform hover:bg-orange-500 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 whitespace-nowrap"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>開始遊戲</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'PAUSED') {
    return (
      <div
        className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/45 p-5 backdrop-blur-xs"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-[300px] rounded-2xl bg-white p-6 text-slate-900 shadow-2xl border border-slate-200">
          <h2
            className="text-2xl font-bold text-slate-950"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            遊戲已暫停
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            目前第 <span className="font-mono font-bold tabular-nums">{stats.floor}</span> 層 · 分數{' '}
            <span className="font-mono font-bold tabular-nums">{stats.score}</span>
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResumeGame}
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition-transform hover:bg-orange-500 active:scale-[0.98] whitespace-nowrap"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>繼續遊戲</span>
            </button>
            <button
              type="button"
              onClick={onRestartGame}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              <span>重新開始</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GAME_OVER
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/50 p-5 backdrop-blur-[2px]"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-[330px] rounded-2xl bg-white/96 p-6 text-slate-900 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">本局結算</p>
            <h2
              className="mt-0.5 text-2xl font-extrabold text-slate-950"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              疊塔結束
            </h2>
          </div>
          {isNewBestScore && (
            <div className="flex items-center gap-1 text-xs font-bold text-orange-600">
              <Trophy className="h-4 w-4" />
              <span>刷新紀錄</span>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-y border-slate-200 py-4">
          <div>
            <p className="text-xs text-slate-500">最終分數</p>
            <p
              className="mt-0.5 font-mono text-2xl font-bold text-slate-950 tabular-nums"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {stats.score}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">堆疊層數</p>
            <p
              className="mt-0.5 font-mono text-2xl font-bold text-slate-950 tabular-nums"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {stats.floor}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">最高連擊</p>
            <p
              className="mt-0.5 font-mono text-2xl font-bold text-orange-600 tabular-nums"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              x{stats.maxCombo}
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500">
          <span>完美對齊 {stats.perfectCount} 次</span>
          <span className="font-mono tabular-nums">
            歷史最高 {records.bestScore} 分 · {records.bestFloor} 層
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onRestartGame}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-base font-bold text-white shadow-sm transition-transform hover:bg-orange-500 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4" />
            <span>再玩一次</span>
          </button>
          <button
            type="button"
            onClick={onBackToTitle}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap"
          >
            返回首頁說明
          </button>
        </div>
      </div>
    </div>
  );
}
