export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type VehicleKind =
  | 'kei'
  | 'taxi'
  | 'coupe'
  | 'van'
  | 'pickup'
  | 'bus'
  | 'police';

export interface VehicleBlueprint {
  id: VehicleKind;
  name: string;
  subtitle: string;
  unlockFloor: number;
  height: number;
  idealWidth: number;
  bodyColor: string;
  bodyShade: string;
  cabinColor: string;
  accentColor: string;
  windowColor: string;
  roofFeature?: 'taxi-sign' | 'siren' | 'rack' | 'ac-unit' | 'spoiler' | 'none';
}

export interface StackedBlock {
  id: number;
  floor: number;
  blueprint: VehicleBlueprint;
  /** Effective surviving left X in logical world space */
  x: number;
  /** Effective surviving width in logical world space */
  width: number;
  /** Original full car left X at moment of landing (used for proportional sprite clipping) */
  spriteOriginX: number;
  /** Original full car width at moment of landing */
  spriteOriginWidth: number;
  /** Bottom elevation in world units (ground pad top = 0) */
  elevation: number;
  height: number;
  isPerfect: boolean;
  wasExpanded: boolean;
  /** Animation timer in seconds since landing (for squash & stretch + flash) */
  landAnim: number;
  /** Left/right cut flags for rendering clean metallic cut seams */
  slicedLeft: boolean;
  slicedRight: boolean;
}

export interface ActiveCar {
  blueprint: VehicleBlueprint;
  /** Current horizontal position of the car's left edge in world units */
  x: number;
  width: number;
  height: number;
  /** Bottom elevation in world units */
  elevation: number;
  vx: number;
  vy: number;
  direction: 1 | -1;
  phase: 'SWINGING' | 'FALLING';
  swayPhase: number;
}

export interface FallingDebris {
  id: number;
  blueprint: VehicleBlueprint;
  /** Current center X/Y in world space */
  centerX: number;
  centerElevation: number;
  /** Original car sprite origin relative to center at spawn, so clipped fragment renders faithfully */
  localSpriteX: number;
  spriteWidth: number;
  clipLocalX: number;
  clipWidth: number;
  height: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  alpha: number;
  isFullMiss: boolean;
}

export interface Particle {
  x: number;
  elevation: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  kind: 'spark' | 'dust' | 'ring';
}

export interface FloatingCallout {
  id: number;
  x: number;
  elevation: number;
  text: string;
  subtext?: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface RunStats {
  floor: number;
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  currentWidth: number;
  nextVehicle: VehicleBlueprint;
  lastActionLabel: string;
}

export interface BestRecords {
  bestScore: number;
  bestFloor: number;
  bestCombo: number;
  totalGames: number;
}
