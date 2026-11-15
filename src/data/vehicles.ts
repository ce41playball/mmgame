import { VehicleBlueprint } from '../types/game';

export const VEHICLE_ROSTER: VehicleBlueprint[] = [
  {
    id: 'kei',
    name: '都市輕型車',
    subtitle: '入門經典 · 靈巧車身',
    unlockFloor: 0,
    height: 34,
    idealWidth: 164,
    bodyColor: '#F97316',
    bodyShade: '#C2410C',
    cabinColor: '#FB923C',
    accentColor: '#FEF3C7',
    windowColor: '#1E293B',
    roofFeature: 'none',
  },
  {
    id: 'taxi',
    name: '都會計程車',
    subtitle: '第 2 層登場 · 黃色頂燈',
    unlockFloor: 2,
    height: 35,
    idealWidth: 164,
    bodyColor: '#FACC15',
    bodyShade: '#CA8A04',
    cabinColor: '#FDE047',
    accentColor: '#1E293B',
    windowColor: '#0F172A',
    roofFeature: 'taxi-sign',
  },
  {
    id: 'coupe',
    name: '街頭雙門跑車',
    subtitle: '第 5 層登場 · 流線尾翼',
    unlockFloor: 5,
    height: 31,
    idealWidth: 166,
    bodyColor: '#EF4444',
    bodyShade: '#B91C1C',
    cabinColor: '#F87171',
    accentColor: '#F8FAFC',
    windowColor: '#0F172A',
    roofFeature: 'spoiler',
  },
  {
    id: 'van',
    name: '城市快遞廂車',
    subtitle: '第 8 層登場 · 加高車廂',
    unlockFloor: 8,
    height: 41,
    idealWidth: 168,
    bodyColor: '#0EA5E9',
    bodyShade: '#0369A1',
    cabinColor: '#38BDF8',
    accentColor: '#F8FAFC',
    windowColor: '#0F172A',
    roofFeature: 'rack',
  },
  {
    id: 'pickup',
    name: '重裝皮卡車',
    subtitle: '第 12 層登場 · 開放貨斗',
    unlockFloor: 12,
    height: 37,
    idealWidth: 168,
    bodyColor: '#10B981',
    bodyShade: '#047857',
    cabinColor: '#34D399',
    accentColor: '#ECFDF5',
    windowColor: '#0F172A',
    roofFeature: 'rack',
  },
  {
    id: 'police',
    name: '巡邏警車',
    subtitle: '第 16 層登場 · 警示頂燈',
    unlockFloor: 16,
    height: 35,
    idealWidth: 166,
    bodyColor: '#F8FAFC',
    bodyShade: '#CBD5E1',
    cabinColor: '#1E293B',
    accentColor: '#2563EB',
    windowColor: '#0F172A',
    roofFeature: 'siren',
  },
  {
    id: 'bus',
    name: '雙層觀光巴士',
    subtitle: '第 20 層登場 · 巨型車身',
    unlockFloor: 20,
    height: 44,
    idealWidth: 174,
    bodyColor: '#6366F1',
    bodyShade: '#4338CA',
    cabinColor: '#818CF8',
    accentColor: '#FDE047',
    windowColor: '#0F172A',
    roofFeature: 'ac-unit',
  },
];

export function pickVehicleForFloor(floor: number): VehicleBlueprint {
  const unlocked = VEHICLE_ROSTER.filter((v) => floor >= v.unlockFloor);
  if (unlocked.length === 0) return VEHICLE_ROSTER[0];
  // First 3 floors introduce initial vehicles cleanly in order
  if (floor === 0) return VEHICLE_ROSTER[0];
  if (floor === 1) return VEHICLE_ROSTER[0];
  if (floor === 2) return VEHICLE_ROSTER[1];

  // Whenever a brand-new vehicle unlocks on an exact milestone floor, showcase it immediately
  const milestone = VEHICLE_ROSTER.find((v) => v.unlockFloor === floor);
  if (milestone) return milestone;

  // Otherwise rotate playfully across unlocked urban vehicles
  const idx = (floor * 3 + Math.floor(floor / 4)) % unlocked.length;
  return unlocked[idx];
}
