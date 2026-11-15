import { VEHICLE_ROSTER } from '../data/vehicles';
import { BestRecords, GameState, RunStats, VehicleBlueprint } from '../types/game';

interface ArcadeSidebarProps {
  gameState: GameState;
  stats: RunStats;
  records: BestRecords;
}

function VehicleMiniIcon({ vehicle }: { vehicle: VehicleBlueprint }) {
  return (
    <svg
      width="56"
      height="28"
      viewBox="0 0 56 28"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Cabin */}
      {vehicle.id === 'bus' ? (
        <rect x="6" y="4" width="44" height="12" rx="3" fill={vehicle.cabinColor} />
      ) : vehicle.id === 'van' ? (
        <path
          d="M6 5 H37 L47 13 V16 H6 Z"
          fill={vehicle.cabinColor}
        />
      ) : vehicle.id === 'pickup' ? (
        <rect x="22" y="6" width="18" height="10" rx="2" fill={vehicle.cabinColor} />
      ) : (
        <path
          d="M12 14 L17 6 H37 L43 14 Z"
          fill={vehicle.cabinColor}
        />
      )}
      {/* Lower body */}
      <rect x="4" y="13" width="48" height="10" rx="3" fill={vehicle.bodyColor} />
      {/* Wheels */}
      <circle cx="15" cy="23" r="4" fill="#0F172A" />
      <circle cx="15" cy="23" r="1.8" fill="#CBD5E1" />
      <circle cx="41" cy="23" r="4" fill="#0F172A" />
      <circle cx="41" cy="23" r="1.8" fill="#CBD5E1" />
    </svg>
  );
}

export function ArcadeSidebar({
  gameState,
  stats,
  records,
}: ArcadeSidebarProps) {
  const highestUnlockedFloor = Math.max(stats.floor, records.bestFloor);

  return (
    <aside className="hidden lg:flex w-full max-w-[420px] flex-col justify-between gap-6 rounded-2xl border border-slate-800 bg-slate-900/95 p-6 text-slate-100">
      <div className="space-y-6">
        {/* Title & Current Vehicle */}
        <div className="space-y-1 border-b border-slate-800 pb-4">
          <p className="text-xs font-semibold text-orange-400">
            SkyStack 都市汽車疊疊樂
          </p>
          <h2
            className="text-2xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            塔式吊臂控制台
          </h2>
          <p className="text-sm text-slate-400">
            {gameState === 'PLAYING'
              ? stats.lastActionLabel
              : '單指點擊或空白鍵控制吊鉤，層層疊出都市最高車塔。'}
          </p>
        </div>

        {/* Live Telemetry */}
        <div className="grid grid-cols-3 gap-4 border-b border-slate-800 pb-5">
          <div>
            <p className="text-xs text-slate-400">當前車寬</p>
            <p className="mt-1 font-mono text-xl font-bold text-white tabular-nums">
              {stats.currentWidth}px
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">完美對齊</p>
            <p className="mt-1 font-mono text-xl font-bold text-emerald-400 tabular-nums">
              {stats.perfectCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">本局最高連擊</p>
            <p className="mt-1 font-mono text-xl font-bold text-orange-400 tabular-nums">
              x{stats.maxCombo}
            </p>
          </div>
        </div>

        {/* Local Best Records */}
        <div className="space-y-2 border-b border-slate-800 pb-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">本機最高紀錄</h3>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              累計 {records.totalGames} 局
            </span>
          </div>
          <div className="flex items-baseline justify-between text-sm text-slate-300">
            <span>最高分數 · 最高樓層 · 最佳連擊</span>
            <span className="font-mono font-bold text-white tabular-nums">
              {records.bestScore} · {records.bestFloor}F · x{records.bestCombo}
            </span>
          </div>
        </div>

        {/* Vehicle Progression Roster */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-slate-200">登場都市車款</h3>
            <span className="text-xs text-slate-400">
              目前吊掛：{stats.nextVehicle.name}
            </span>
          </div>
          <div className="divide-y divide-slate-800/80">
            {VEHICLE_ROSTER.map((vehicle) => {
              const isUnlocked = highestUnlockedFloor >= vehicle.unlockFloor;
              const isCurrent = stats.nextVehicle.id === vehicle.id && gameState === 'PLAYING';
              return (
                <div
                  key={vehicle.id}
                  className={`flex items-center justify-between gap-3 py-2 transition-opacity ${
                    isUnlocked ? 'opacity-100' : 'opacity-45'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <VehicleMiniIcon vehicle={vehicle} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {vehicle.name}
                        {isCurrent && (
                          <span className="ml-2 text-xs font-medium text-orange-400">
                            吊掛中
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {vehicle.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-slate-400 shrink-0 tabular-nums">
                    {isUnlocked ? '已解鎖' : `${vehicle.unlockFloor}F`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Keyboard Controls */}
      <div className="border-t border-slate-800 pt-4 text-xs text-slate-400">
        快捷操作：空白鍵 / ↓ 落車 · P 暫停 · M 靜音 · R 重開本局
      </div>
    </aside>
  );
}
