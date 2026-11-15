import {
  ActiveCar,
  FallingDebris,
  FloatingCallout,
  Particle,
  StackedBlock,
  VehicleBlueprint,
} from '../types/game';

export const WORLD_WIDTH = 390;
export const GROUND_PAD_X = 45;
export const GROUND_PAD_WIDTH = 300;

interface RGB {
  r: number;
  g: number;
  b: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(c1: RGB, c2: RGB, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const r = Math.round(lerp(c1.r, c2.r, clamped));
  const g = Math.round(lerp(c1.g, c2.g, clamped));
  const b = Math.round(lerp(c1.b, c2.b, clamped));
  return `rgb(${r}, ${g}, ${b})`;
}

const SKY_STAGES: { elev: number; top: RGB; bottom: RGB }[] = [
  { elev: 0, top: { r: 125, g: 211, b: 252 }, bottom: { r: 224, g: 242, b: 254 } }, // Crisp morning blue
  { elev: 450, top: { r: 56, g: 189, b: 248 }, bottom: { r: 254, g: 243, b: 199 } }, // Warm afternoon
  { elev: 950, top: { r: 124, g: 58, b: 237 }, bottom: { r: 251, g: 146, b: 60 } }, // Sunset glow
  { elev: 1550, top: { r: 15, g: 23, b: 42 }, bottom: { r: 49, g: 46, b: 129 } }, // Night stratosphere
];

export function drawSkyAndCity(
  ctx: CanvasRenderingContext2D,
  viewWidth: number,
  viewHeight: number,
  groundScreenY: number,
  cameraElevation: number,
  timeSec: number
) {
  // Determine sky stage interpolation
  let stageIdx = 0;
  while (
    stageIdx < SKY_STAGES.length - 2 &&
    cameraElevation > SKY_STAGES[stageIdx + 1].elev
  ) {
    stageIdx++;
  }
  const sA = SKY_STAGES[stageIdx];
  const sB = SKY_STAGES[Math.min(stageIdx + 1, SKY_STAGES.length - 1)];
  const span = Math.max(1, sB.elev - sA.elev);
  const t = Math.max(0, Math.min(1, (cameraElevation - sA.elev) / span));

  const grad = ctx.createLinearGradient(0, 0, 0, viewHeight);
  grad.addColorStop(0, lerpColor(sA.top, sB.top, t));
  grad.addColorStop(1, lerpColor(sA.bottom, sB.bottom, t));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  // Subtle stars at high elevation
  if (cameraElevation > 750) {
    const starAlpha = Math.min(0.85, (cameraElevation - 750) / 600);
    ctx.save();
    for (let i = 0; i < 36; i++) {
      const sx = ((i * 97) % 370) + 10;
      const sy = ((i * 151 + Math.floor(cameraElevation * 0.08)) % (viewHeight * 0.78));
      const twinkle = 0.55 + 0.45 * Math.sin(timeSec * 2.2 + i * 1.7);
      ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * twinkle})`;
      const r = i % 5 === 0 ? 1.8 : 1.1;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Stylized drifting daylight clouds
  const cloudOpacity = Math.max(0, 0.72 - cameraElevation / 1200);
  if (cloudOpacity > 0.02) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${cloudOpacity})`;
    const clouds = [
      { x: 60, elev: 210, scale: 1.0, speed: 7 },
      { x: 255, elev: 340, scale: 0.85, speed: 5 },
      { x: 145, elev: 520, scale: 1.15, speed: 6 },
      { x: 310, elev: 710, scale: 0.9, speed: 4.5 },
    ];
    for (const c of clouds) {
      const cy = groundScreenY - (c.elev - cameraElevation * 0.45);
      if (cy < -60 || cy > viewHeight + 60) continue;
      const cx = ((c.x + timeSec * c.speed) % (viewWidth + 120)) - 60;
      ctx.beginPath();
      ctx.arc(cx, cy, 16 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 16 * c.scale, cy - 5 * c.scale, 20 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 34 * c.scale, cy, 15 * c.scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Distant parallax city skyline
  const farParallaxY = groundScreenY + cameraElevation * 0.32;
  if (farParallaxY > -40) {
    const farBuildings = [
      { x: 0, w: 46, h: 155 },
      { x: 42, w: 38, h: 210 },
      { x: 76, w: 52, h: 130 },
      { x: 124, w: 44, h: 245 },
      { x: 164, w: 58, h: 175 },
      { x: 218, w: 40, h: 225 },
      { x: 254, w: 56, h: 145 },
      { x: 306, w: 48, h: 205 },
      { x: 350, w: 45, h: 165 },
    ];
    ctx.fillStyle = cameraElevation > 900 ? 'rgba(30, 41, 59, 0.72)' : 'rgba(148, 163, 184, 0.36)';
    for (const b of farBuildings) {
      ctx.fillRect(b.x, farParallaxY - b.h, b.w, b.h + 260);
    }
  }

  // Closer midground urban skyline
  const midParallaxY = groundScreenY + cameraElevation * 0.58;
  if (midParallaxY > -40) {
    const midBuildings = [
      { x: -6, w: 42, h: 105 },
      { x: 48, w: 48, h: 140 },
      { x: 112, w: 36, h: 92 },
      { x: 242, w: 42, h: 132 },
      { x: 296, w: 50, h: 115 },
      { x: 354, w: 44, h: 148 },
    ];
    ctx.fillStyle = cameraElevation > 900 ? 'rgba(15, 23, 42, 0.85)' : 'rgba(100, 116, 139, 0.34)';
    for (const b of midBuildings) {
      ctx.fillRect(b.x, midParallaxY - b.h, b.w, b.h + 220);
      // Crisp window grid accents
      ctx.fillStyle =
        cameraElevation > 750 ? 'rgba(253, 224, 71, 0.45)' : 'rgba(255, 255, 255, 0.35)';
      for (let wy = midParallaxY - b.h + 14; wy < midParallaxY - 22; wy += 18) {
        for (let wx = b.x + 8; wx < b.x + b.w - 10; wx += 12) {
          ctx.fillRect(wx, wy, 5, 8);
        }
      }
      ctx.fillStyle = cameraElevation > 900 ? 'rgba(15, 23, 42, 0.85)' : 'rgba(100, 116, 139, 0.34)';
    }
  }
}

export function drawGroundPlatform(
  ctx: CanvasRenderingContext2D,
  viewWidth: number,
  viewHeight: number,
  groundScreenY: number
) {
  if (groundScreenY > viewHeight + 40) return;

  // Street sidewalk curb & asphalt road
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, groundScreenY, viewWidth, viewHeight - groundScreenY + 40);

  // Top asphalt highlight strip
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, groundScreenY, viewWidth, 6);

  // Dashed street lane markings
  ctx.fillStyle = 'rgba(248, 250, 252, 0.45)';
  for (let x = 16; x < viewWidth; x += 44) {
    ctx.fillRect(x, groundScreenY + 26, 22, 4);
  }

  // Designated Parking Landing Pad
  const padX = GROUND_PAD_X;
  const padW = GROUND_PAD_WIDTH;

  ctx.fillStyle = '#1E293B';
  ctx.fillRect(padX, groundScreenY - 8, padW, 12);

  // Hazard amber end caps on parking bay
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(padX, groundScreenY - 8, 14, 12);
  ctx.fillRect(padX + padW - 14, groundScreenY - 8, 14, 12);

  // White parking bay lines
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(padX + 18, groundScreenY - 4, padW - 36, 2.5);
}

export function drawCraneAndCable(
  ctx: CanvasRenderingContext2D,
  viewWidth: number,
  craneScreenY: number,
  carCenterX: number,
  carTopScreenY: number,
  carWidth: number,
  isHoldingCar: boolean,
  swayAngle: number
) {
  // Overhead steel gantry girder
  ctx.save();
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, craneScreenY - 14, viewWidth, 10);

  // Amber industrial diagonal truss markings
  ctx.fillStyle = '#F59E0B';
  for (let x = 0; x < viewWidth; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, craneScreenY - 14);
    ctx.lineTo(x + 12, craneScreenY - 14);
    ctx.lineTo(x + 6, craneScreenY - 4);
    ctx.lineTo(x - 6, craneScreenY - 4);
    ctx.closePath();
    ctx.fill();
  }

  // Rolling trolley carriage
  const trolleyW = 46;
  const trolleyX = carCenterX - trolleyW / 2;
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.roundRect(trolleyX, craneScreenY - 18, trolleyW, 20, 4);
  ctx.fill();

  // Trolley amber beacon & rollers
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(trolleyX + 6, craneScreenY - 13, trolleyW - 12, 5);
  ctx.fillStyle = '#94A3B8';
  ctx.beginPath();
  ctx.arc(trolleyX + 10, craneScreenY - 16, 3.5, 0, Math.PI * 2);
  ctx.arc(trolleyX + trolleyW - 10, craneScreenY - 16, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Steel cable + spreader bar
  const hookY = isHoldingCar ? carTopScreenY - 6 : craneScreenY + 28;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(carCenterX, craneScreenY + 2);
  ctx.lineTo(carCenterX + Math.sin(swayAngle) * 4, hookY - 8);
  ctx.stroke();

  // Spreader bar & claw clamps
  const clampSpan = Math.max(18, Math.min(carWidth * 0.48, 56));
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(carCenterX - clampSpan / 2, hookY);
  ctx.lineTo(carCenterX, hookY - 9);
  ctx.lineTo(carCenterX + clampSpan / 2, hookY);
  ctx.stroke();

  // Hook pulley badge
  ctx.fillStyle = '#F59E0B';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(carCenterX, hookY - 9, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Left & right gripping claws
  const openOffset = isHoldingCar ? 0 : 7;
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(carCenterX - clampSpan / 2 - 3 - openOffset, hookY - 2, 6, 8);
  ctx.fillRect(carCenterX + clampSpan / 2 - 3 + openOffset, hookY - 2, 6, 8);

  ctx.restore();
}

export interface DrawVehicleOptions {
  slicedLeft?: boolean;
  slicedRight?: boolean;
  isPerfect?: boolean;
  alpha?: number;
}

export function drawVehicleClipped(
  ctx: CanvasRenderingContext2D,
  blueprint: VehicleBlueprint,
  spriteX: number,
  bottomY: number,
  spriteWidth: number,
  height: number,
  clipX: number,
  clipWidth: number,
  options: DrawVehicleOptions = {}
) {
  if (clipWidth <= 0.5 || spriteWidth <= 0.5) return;

  const topY = bottomY - height;

  ctx.save();
  if (options.alpha !== undefined) {
    ctx.globalAlpha = options.alpha;
  }

  // Clip strictly to the surviving/debris slice window so car details never distort
  ctx.beginPath();
  ctx.rect(clipX, topY - 14, clipWidth, height + 18);
  ctx.clip();

  const w = spriteWidth;
  const h = height;
  const x = spriteX;
  const y = topY;

  const wheelRadius = Math.max(4.5, Math.min(7.5, w * 0.065));
  const chassisBottom = bottomY - wheelRadius * 0.55;
  const lowerBodyH = h * 0.52;
  const lowerBodyY = chassisBottom - lowerBodyH;

  // Lower chassis main body
  ctx.fillStyle = blueprint.bodyColor;
  ctx.beginPath();
  if (blueprint.id === 'coupe') {
    ctx.roundRect(x, lowerBodyY + 2, w, lowerBodyH - 2, [6, 8, 4, 4]);
  } else {
    ctx.roundRect(x, lowerBodyY, w, lowerBodyH, [5, 5, 4, 4]);
  }
  ctx.fill();

  // Lower body shading band
  ctx.fillStyle = blueprint.bodyShade;
  ctx.fillRect(x + 2, chassisBottom - 5, w - 4, 5);

  // Vehicle-specific upper cabin & silhouette
  const cabinY = y + (blueprint.roofFeature && blueprint.roofFeature !== 'none' ? 5 : 2);
  const cabinH = lowerBodyY - cabinY + 2;

  if (blueprint.id === 'bus') {
    // Tall boxy double-deck style bus body
    ctx.fillStyle = blueprint.cabinColor;
    ctx.beginPath();
    ctx.roundRect(x + 2, cabinY, w - 4, cabinH + 2, [6, 6, 0, 0]);
    ctx.fill();

    // Accent racing stripe
    ctx.fillStyle = blueprint.accentColor;
    ctx.fillRect(x + 2, lowerBodyY + 2, w - 4, 4);

    // Row of panoramic bus windows
    const winCount = Math.max(2, Math.floor((w - 16) / 24));
    const winGap = 5;
    const totalWinW = w - 16 - (winCount - 1) * winGap;
    const winW = Math.max(6, totalWinW / winCount);
    ctx.fillStyle = blueprint.windowColor;
    for (let i = 0; i < winCount; i++) {
      const wx = x + 8 + i * (winW + winGap);
      ctx.beginPath();
      ctx.roundRect(wx, cabinY + 4, winW, cabinH - 6, 2);
      ctx.fill();
    }
  } else if (blueprint.id === 'van') {
    // Delivery van: tall rear cargo box + sloped front cab
    const cargoW = w * 0.72;
    ctx.fillStyle = blueprint.cabinColor;
    ctx.beginPath();
    ctx.roundRect(x + 2, cabinY, cargoW, cabinH + 2, [5, 3, 0, 0]);
    ctx.fill();

    // Front cab windshield
    ctx.fillStyle = blueprint.bodyColor;
    ctx.beginPath();
    ctx.moveTo(x + cargoW, cabinY + 2);
    ctx.lineTo(x + w - 10, cabinY + 2);
    ctx.lineTo(x + w - 3, lowerBodyY + 1);
    ctx.lineTo(x + cargoW, lowerBodyY + 1);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = blueprint.windowColor;
    ctx.beginPath();
    ctx.roundRect(x + cargoW + 3, cabinY + 4, Math.max(6, w - cargoW - 11), cabinH - 4, 2);
    ctx.fill();

    // Side cargo stripe
    ctx.fillStyle = blueprint.accentColor;
    ctx.fillRect(x + 8, lowerBodyY - 2, Math.max(8, cargoW - 14), 4);
  } else if (blueprint.id === 'pickup') {
    // Open rear cargo bed + sturdy cab
    const bedW = w * 0.36;
    const cabX = x + bedW;
    const cabW = w * 0.42;

    // Bed rim
    ctx.fillStyle = blueprint.bodyShade;
    ctx.fillRect(x + 3, lowerBodyY - 4, bedW - 3, 4);

    // Cab
    ctx.fillStyle = blueprint.cabinColor;
    ctx.beginPath();
    ctx.roundRect(cabX, cabinY, cabW, cabinH + 2, [4, 6, 0, 0]);
    ctx.fill();

    // Cab windows
    ctx.fillStyle = blueprint.windowColor;
    ctx.beginPath();
    ctx.roundRect(cabX + 5, cabinY + 3, Math.max(6, cabW - 11), cabinH - 4, 2);
    ctx.fill();
  } else {
    // Sedan / Kei / Taxi / Coupe / Police
    const cabinStartRatio = blueprint.id === 'kei' ? 0.14 : blueprint.id === 'coupe' ? 0.22 : 0.18;
    const cabinEndRatio = blueprint.id === 'kei' ? 0.84 : blueprint.id === 'coupe' ? 0.74 : 0.80;
    const cLeft = x + w * cabinStartRatio;
    const cRight = x + w * cabinEndRatio;
    const cWidth = Math.max(10, cRight - cLeft);

    ctx.fillStyle = blueprint.cabinColor;
    ctx.beginPath();
    ctx.moveTo(cLeft, lowerBodyY + 1);
    ctx.lineTo(cLeft + cWidth * 0.16, cabinY);
    ctx.lineTo(cRight - cWidth * 0.22, cabinY);
    ctx.lineTo(cRight, lowerBodyY + 1);
    ctx.closePath();
    ctx.fill();

    // Windows split by B-pillar
    ctx.fillStyle = blueprint.windowColor;
    const winPadX = Math.max(3, cWidth * 0.14);
    const winW = Math.max(4, cWidth - winPadX * 2);
    ctx.beginPath();
    ctx.roundRect(cLeft + winPadX, cabinY + 3, winW, Math.max(4, cabinH - 5), 2);
    ctx.fill();

    if (winW > 18) {
      ctx.fillStyle = blueprint.cabinColor;
      ctx.fillRect(cLeft + winPadX + winW * 0.48 - 1.5, cabinY + 2, 3, cabinH - 3);
    }

    // Taxi checker / Police door stripe
    if (blueprint.id === 'taxi') {
      ctx.fillStyle = blueprint.accentColor;
      for (let cx = x + 16; cx < x + w - 20; cx += 12) {
        ctx.fillRect(cx, lowerBodyY + 4, 6, 4);
      }
    } else if (blueprint.id === 'police') {
      ctx.fillStyle = blueprint.accentColor;
      ctx.fillRect(x + 4, lowerBodyY + 4, w - 8, 5);
    }
  }

  // Roof accessories
  const roofCenter = x + w * 0.5;
  if (blueprint.roofFeature === 'taxi-sign' && w > 40) {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(roofCenter - 9, cabinY - 5, 18, 5);
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(roofCenter - 7, cabinY - 4, 14, 3);
  } else if (blueprint.roofFeature === 'siren' && w > 40) {
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(roofCenter - 10, cabinY - 5, 10, 5);
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(roofCenter, cabinY - 5, 10, 5);
  } else if (blueprint.roofFeature === 'spoiler' && w > 48) {
    ctx.fillStyle = blueprint.bodyShade;
    ctx.fillRect(x + 4, lowerBodyY - 5, 12, 3);
    ctx.fillRect(x + 8, lowerBodyY - 3, 3, 4);
  } else if (blueprint.roofFeature === 'ac-unit' && w > 54) {
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(roofCenter - 16, cabinY - 4, 32, 4);
  }

  // Headlight & Taillight
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(x + w - 5, lowerBodyY + 3, 5, 5);
  ctx.fillStyle = '#F43F5E';
  ctx.fillRect(x, lowerBodyY + 3, 4, 5);

  // Subtle top outline for crisp legibility against bright sky
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, lowerBodyY + 0.5, w - 1, lowerBodyH - 1);

  // Wheels (drawn cleanly inside chassis bounds)
  const frontWheelX = x + w * 0.78;
  const rearWheelX = x + w * 0.22;
  const wheelY = bottomY - wheelRadius;

  const wheels = w >= 42 ? [rearWheelX, frontWheelX] : [x + w * 0.5];
  for (const wx of wheels) {
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(wx, wheelY, wheelRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.arc(wx, wheelY, wheelRadius * 0.48, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Crisp metallic cut-seam indicator along sliced edges (outside clip so it gleams cleanly)
  if (options.slicedLeft) {
    ctx.save();
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(clipX, topY + 2, 2, height - 4);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.fillRect(clipX + 2, topY + 2, 1, height - 4);
    ctx.restore();
  }
  if (options.slicedRight) {
    ctx.save();
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(clipX + clipWidth - 2, topY + 2, 2, height - 4);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.fillRect(clipX + clipWidth - 3, topY + 2, 1, height - 4);
    ctx.restore();
  }
}

export function drawStackedBlock(
  ctx: CanvasRenderingContext2D,
  block: StackedBlock,
  groundScreenY: number,
  cameraElevation: number
) {
  const bottomY = groundScreenY - (block.elevation - cameraElevation);
  if (bottomY < -60 || bottomY - block.height > groundScreenY + 200) return;

  // Squash & stretch right after landing
  let scaleX = 1;
  let scaleY = 1;
  if (block.landAnim > 0) {
    const wave = Math.sin(block.landAnim * Math.PI * 2) * block.landAnim;
    scaleY = 1 - wave * 0.14;
    scaleX = 1 + wave * 0.08;
  }

  const centerX = block.x + block.width / 2;

  ctx.save();
  ctx.translate(centerX, bottomY);
  ctx.scale(scaleX, scaleY);
  ctx.translate(-centerX, -bottomY);

  drawVehicleClipped(
    ctx,
    block.blueprint,
    block.spriteOriginX,
    bottomY,
    block.spriteOriginWidth,
    block.height,
    block.x,
    block.width,
    {
      slicedLeft: block.slicedLeft,
      slicedRight: block.slicedRight,
      isPerfect: block.isPerfect,
    }
  );

  // Brief bright perfect-alignment gleam on newly landed perfect block
  if (block.isPerfect && block.landAnim > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${block.landAnim * 0.45})`;
    ctx.fillRect(block.x, bottomY - block.height + 2, block.width, block.height - 4);
  }

  ctx.restore();
}

export function drawActiveCar(
  ctx: CanvasRenderingContext2D,
  car: ActiveCar,
  groundScreenY: number,
  cameraElevation: number
) {
  const bottomY = groundScreenY - (car.elevation - cameraElevation);
  const centerX = car.x + car.width / 2;
  const centerY = bottomY - car.height / 2;
  const tilt = car.phase === 'SWINGING' ? Math.sin(car.swayPhase) * 0.035 : 0;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(tilt);
  ctx.translate(-centerX, -centerY);

  drawVehicleClipped(
    ctx,
    car.blueprint,
    car.x,
    bottomY,
    car.width,
    car.height,
    car.x,
    car.width
  );

  ctx.restore();
}

export function drawFallingDebris(
  ctx: CanvasRenderingContext2D,
  debris: FallingDebris,
  groundScreenY: number,
  cameraElevation: number
) {
  const screenCenterY = groundScreenY - (debris.centerElevation - cameraElevation);
  const halfH = debris.height / 2;

  ctx.save();
  ctx.translate(debris.centerX, screenCenterY);
  ctx.rotate(debris.angle);

  drawVehicleClipped(
    ctx,
    debris.blueprint,
    debris.localSpriteX,
    halfH,
    debris.spriteWidth,
    debris.height,
    debris.clipLocalX,
    debris.clipWidth,
    {
      alpha: debris.alpha,
      slicedLeft: !debris.isFullMiss && debris.clipLocalX > debris.localSpriteX + 1,
      slicedRight:
        !debris.isFullMiss &&
        debris.clipLocalX + debris.clipWidth < debris.localSpriteX + debris.spriteWidth - 1,
    }
  );

  ctx.restore();
}

export function drawParticlesAndCallouts(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  callouts: FloatingCallout[],
  groundScreenY: number,
  cameraElevation: number
) {
  for (const p of particles) {
    const sy = groundScreenY - (p.elevation - cameraElevation);
    const t = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = t;
    if (p.kind === 'ring') {
      const radius = p.size * (1 + (1 - t) * 2.2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.5 * t;
      ctx.beginPath();
      ctx.ellipse(p.x, sy, radius * 1.9, radius * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, sy, p.size * (0.4 + 0.6 * t), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  for (const c of callouts) {
    const sy = groundScreenY - (c.elevation - cameraElevation);
    const t = Math.max(0, c.life / c.maxLife);
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 1.4);
    ctx.textAlign = 'center';
    ctx.font = '800 18px "Outfit", "Noto Sans TC", sans-serif';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.strokeText(c.text, c.x, sy);
    ctx.fillStyle = c.color;
    ctx.fillText(c.text, c.x, sy);

    if (c.subtext) {
      ctx.font = '700 12px "JetBrains Mono", "Noto Sans TC", monospace';
      ctx.strokeText(c.subtext, c.x, sy + 17);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(c.subtext, c.x, sy + 17);
    }
    ctx.restore();
  }
}
