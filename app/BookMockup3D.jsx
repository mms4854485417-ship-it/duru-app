'use client';

/**
 * BookMockup3D — 360° 회전 3D 하드커버 북 목업
 *
 * 설치:
 *   npm install @react-three/fiber @react-three/drei three
 *
 * 사용:
 *   <BookMockup3D coverColor="#8FA8C0" title="나의 2026년" pageCount={29} />
 */

import { useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────
// Color utilities
// ─────────────────────────────────────────────────────────────────

/** 밝기(0~1) */
const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

/** 밝기 조정 (양수 = 밝게, 음수 = 어둡게) */
const adj = (h, a) =>
  '#' +
  [1, 3, 5]
    .map((i) =>
      Math.max(0, Math.min(255, parseInt(h.slice(i, i + 2), 16) + a))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');

// ─────────────────────────────────────────────────────────────────
// 인쇄 용지 사양 — 미색 모조지 120g
// ─────────────────────────────────────────────────────────────────

/**
 * PAPER_SPEC: 두루 다이어리 내지 용지 사양
 *
 * 미색 모조지 120g/m²
 * - 일반 백상지(80g)보다 두껍고 손에 착 감기는 질감
 * - 잉크 번짐이 적어 필기 및 인쇄 모두 선명
 * - 크림 화이트 계열(#F5F0E4)로 눈 피로 최소화
 */
export const PAPER_SPEC = {
  name: '미색 모조지',
  weight: 120,               // g/m²
  thicknessPerLeafMm: 0.138, // 단면 기준 1장 두께 (mm) — 120g 기준
  color: '#F5F0E4',          // 미색 (Cream White)
  note: '눈 피로 최소화 · 번짐 없는 고급 인쇄',
};

/**
 * calcSpineWidth — 페이지 수에 따른 책등(Spine) 두께 계산
 *
 * @param {number} totalEntries  수록 일기 편 수 (기본값 29)
 * @returns {{ spineWidthMm: number, BD: number }}
 *   - spineWidthMm : 실제 책등 폭 (mm) — 인쇄 발주 스펙
 *   - BD           : Three.js 3D 모델 두께 값 (시각적 스케일)
 *
 * 계산 공식 (미색 모조지 120g 기준):
 *   innerMm      = totalEntries × 0.1mm  (일기 1편당 0.1mm 산정)
 *   coverMm      = 3.5mm (하드커버 보드 양면)
 *   spineWidthMm = innerMm + coverMm
 *
 *   예시: 29편 → 29 × 0.1 + 3.5 = 6.4mm 책등
 *
 * 3D 시각 스케일 (BD):
 *   totalPages = entries × 2 + 12 (편집 페이지 포함 기준)
 *   BD = 0.22 + (totalPages - 40) / 80 × 0.22
 *   → 29편(70p) 기준 BD = 0.30 (현재 기본값과 동일)
 *   → 최소 0.22 보장
 */
export function calcSpineWidth(totalEntries = 29) {
  // 실물 책등 두께: 일기 1편당 0.1mm (미색 모조지 120g 기준)
  const innerMm = totalEntries * 0.1;
  const coverMm = 3.5; // 하드커버 보드 양면
  const spineWidthMm = Math.round((innerMm + coverMm) * 10) / 10;

  // 3D 시각 스케일 (시각적 비율 유지를 위해 페이지 수 기반으로 산출)
  const totalPages = totalEntries * 2 + 12;
  const BD = Math.max(0.22, 0.22 + ((totalPages - 40) / 80) * 0.22);

  return { spineWidthMm, BD, totalPages };
}

// ─────────────────────────────────────────────────────────────────
// Canvas texture builders
// ─────────────────────────────────────────────────────────────────

/** 두루 엠블럼 (튤립형) */
function drawEmblem(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  // 중앙 꽃잎
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.44, r * 0.3, r * 0.64, 0, 0, Math.PI * 2);
  ctx.fill();
  // 왼쪽 꽃잎
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.42, cy - r * 0.06, r * 0.26, r * 0.53, 0.64, 0, Math.PI * 2);
  ctx.fill();
  // 오른쪽 꽃잎
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.42, cy - r * 0.06, r * 0.26, r * 0.53, -0.64, 0, Math.PI * 2);
  ctx.fill();
  // 줄기
  ctx.fillRect(cx - r * 0.07, cy + r * 0.2, r * 0.14, r * 0.7);
  // 뿌리
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.9, r * 0.24, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** 린넨 직물 느낌 노이즈 레이어 */
function drawLinen(ctx, W, H) {
  // 수평 실
  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = `rgba(255,255,255,${0.012 + Math.random() * 0.028})`;
    ctx.fillRect(0, y, W, 1);
  }
  // 수직 실
  for (let x = 0; x < W; x += 4) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.01})`;
    ctx.fillRect(x, 0, 1, H);
  }
  // 대각선 그레인
  for (let i = -H; i < W + H; i += 6) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.008})`;
    ctx.fillRect(i, 0, 1, H);
  }
}

/**
 * 앞표지
 * @param {string} color       커버 HEX 색상
 * @param {string} title       책 제목
 * @param {'center'|'bottom-left'} layout  제목 정렬 레이아웃
 */
function buildFrontTex(color, title, layout = 'center') {
  const [W, H] = [512, 740];
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 커버 그라디언트
  const bg = ctx.createLinearGradient(0, 0, W * 0.6, H);
  bg.addColorStop(0, adj(color, 12));
  bg.addColorStop(1, adj(color, -32));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawLinen(ctx, W, H);

  // 빛 반사 하이라이트
  const hl = ctx.createLinearGradient(0, 0, W * 0.62, 0);
  hl.addColorStop(0, 'rgba(255,255,255,0.17)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(0, 0, W, H);

  // 오른쪽 가장자리 어둡게 (책등 그림자)
  const edge = ctx.createLinearGradient(W * 0.85, 0, W, 0);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, W, H);

  const isLight = lum(color) > 0.46;
  const ink = isLight ? 'rgba(0,0,0,0.80)' : 'rgba(255,255,255,0.93)';
  const dim = isLight ? 'rgba(0,0,0,0.36)' : 'rgba(255,255,255,0.46)';

  // DURU DIARY 라벨
  ctx.fillStyle = dim;
  ctx.font = '700 17px Arial, Helvetica, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('DURU  DIARY', 52, 82);
  ctx.letterSpacing = '0px';

  // 제목 (2줄 자동 분리)
  const words = title.trim().split(/\s+/);
  const half = Math.ceil(words.length / 2);
  const lines =
    words.length <= 1 ? [title] : [words.slice(0, half).join(' '), words.slice(half).join(' ')];
  const fs = lines.some((l) => l.length > 6) ? 56 : 70;

  if (layout === 'bottom-left') {
    // ── 좌측 하단 정렬 레이아웃 ──
    // 제목 하단부에 배치
    const titleBaseY = H - 200;
    ctx.fillStyle = ink;
    ctx.font = `900 ${fs}px Georgia, serif`;
    ctx.textAlign = 'left';
    lines.forEach((line, i) => ctx.fillText(line, 52, titleBaseY + i * (fs + 10)));

    // 구분선 (제목 아래)
    const ruleY = titleBaseY + lines.length * (fs + 10) + 14;
    ctx.strokeStyle = dim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(52, ruleY);
    ctx.lineTo(200, ruleY);
    ctx.stroke();

    // 날짜 라벨
    ctx.fillStyle = dim;
    ctx.font = '500 14px Arial, sans-serif';
    ctx.fillText('2026', 52, ruleY + 26);
  } else {
    // ── 중앙 정렬 레이아웃 (기본) ──
    ctx.fillStyle = ink;
    ctx.font = `900 ${fs}px Georgia, serif`;
    ctx.textAlign = 'center';
    lines.forEach((line, i) => ctx.fillText(line, W / 2, 230 + i * (fs + 14)));
    ctx.textAlign = 'left';

    // 구분선
    ctx.strokeStyle = dim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 80, 430);
    ctx.lineTo(W / 2 + 80, 430);
    ctx.stroke();

    // 날짜 라벨
    ctx.fillStyle = dim;
    ctx.font = '500 14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('2026', W / 2, 458);
    ctx.textAlign = 'left';
  }

  // 엠블럼 (우측 하단)
  drawEmblem(ctx, W - 66, H - 60, 22, dim);

  return new THREE.CanvasTexture(canvas);
}

/** 책등 */
function buildSpineTex(color, title) {
  const [W, H] = [128, 740];
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 볼록한 곡면 시뮬레이션 — 중앙이 밝고 양쪽이 어두운 그라디언트
  const bg = ctx.createLinearGradient(0, 0, W, 0);
  bg.addColorStop(0, adj(color, -58));
  bg.addColorStop(0.22, adj(color, -28));
  bg.addColorStop(0.45, adj(color, -8));
  bg.addColorStop(0.5, adj(color, 0));
  bg.addColorStop(0.55, adj(color, -8));
  bg.addColorStop(0.78, adj(color, -28));
  bg.addColorStop(1, adj(color, -58));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawLinen(ctx, W, H);

  // 중앙 세로 하이라이트
  const center = ctx.createLinearGradient(0, 0, W, 0);
  center.addColorStop(0, 'rgba(255,255,255,0)');
  center.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  center.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = center;
  ctx.fillRect(0, 0, W, H);

  const isLight = lum(color) > 0.46;
  const ink = isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.84)';
  const dim = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.38)';

  // 상단 엠블럼
  drawEmblem(ctx, W / 2, 44, 14, dim);

  // 제목 (중앙 세로, 아래→위 방향)
  ctx.save();
  ctx.translate(W / 2, H / 2 + 10);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = '700 22px Georgia, serif';
  ctx.fillText(title, 0, 6);
  ctx.restore();

  // 하단 DURU 라벨
  ctx.save();
  ctx.translate(W / 2, H - 40);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = dim;
  ctx.font = '600 12px Arial, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('DURU', 0, 5);
  ctx.restore();

  return new THREE.CanvasTexture(canvas);
}

/** 뒷표지 */
function buildBackTex(color) {
  const [W, H] = [512, 740];
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, adj(color, -16));
  bg.addColorStop(1, adj(color, -42));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawLinen(ctx, W, H);

  const isLight = lum(color) > 0.46;
  const dim = isLight ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.2)';

  // 중앙 대형 엠블럼
  drawEmblem(ctx, W / 2, H / 2 - 20, 58, dim);

  // 바코드 디테일
  for (let i = 0; i < 32; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.09})`;
    ctx.fillRect(88 + i * 9, H - 92, i % 4 === 0 ? 7 : 3, 34);
  }
  // 바코드 라벨
  const isL2 = lum(color) > 0.46;
  ctx.fillStyle = isL2 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.25)';
  ctx.font = '500 10px monospace';
  ctx.fillText('ISBN 979-11-DURU-2026', 88, H - 52);

  return new THREE.CanvasTexture(canvas);
}

/**
 * 내지 옆면 (책등 반대쪽)
 * 미색 모조지 120g 크림 컬러 (#F5F0E4) 반영
 */
function buildPagesTex() {
  const [W, H] = [64, 512];
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 미색 모조지 기본색 (크림 화이트)
  ctx.fillStyle = PAPER_SPEC.color; // '#F5F0E4'
  ctx.fillRect(0, 0, W, H);

  // 페이지 쌓임 레이어 효과 (크림 톤 기반)
  for (let y = 0; y < H; y += 3) {
    const v = 210 + Math.floor(Math.random() * 22);
    const warm = Math.floor(Math.random() * 8);
    ctx.fillStyle = `rgb(${v},${v - 3 - warm},${v - 10 - warm})`;
    ctx.fillRect(0, y, W, 1);
  }
  // 미세 페이지 구분선
  for (let y = 0; y < H; y += 12) {
    ctx.fillStyle = 'rgba(140,120,100,0.07)';
    ctx.fillRect(0, y, W, 1);
  }

  // 양쪽 가장자리 그림자
  const eg = ctx.createLinearGradient(0, 0, W, 0);
  eg.addColorStop(0, 'rgba(0,0,0,0.16)');
  eg.addColorStop(0.2, 'rgba(0,0,0,0)');
  eg.addColorStop(0.8, 'rgba(0,0,0,0)');
  eg.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = eg;
  ctx.fillRect(0, 0, W, H);

  return new THREE.CanvasTexture(canvas);
}

/** 상단/하단면 */
function buildTopBotTex() {
  const [W, H] = [512, 64];
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 미색 톤 반영
  ctx.fillStyle = '#F0EBE0';
  ctx.fillRect(0, 0, W, H);

  for (let x = 0; x < W; x += 3) {
    const v = 205 + Math.floor(Math.random() * 24);
    const warm = Math.floor(Math.random() * 6);
    ctx.fillStyle = `rgb(${v},${v - 2 - warm},${v - 8 - warm})`;
    ctx.fillRect(x, 0, 1, H);
  }

  // 앞 가장자리 하이라이트
  const hl = ctx.createLinearGradient(0, 0, 0, H);
  hl.addColorStop(0, 'rgba(255,255,255,0.18)');
  hl.addColorStop(0.3, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(0, 0, W, H);

  return new THREE.CanvasTexture(canvas);
}

// ─────────────────────────────────────────────────────────────────
// Book dimensions (A5 비율)
// ─────────────────────────────────────────────────────────────────
const BW = 1.48; // 너비  (A5 148mm 기준)
const BH = 2.10; // 높이  (A5 210mm 기준)
const BD_DEFAULT = 0.30; // 기본 두께 (29편 기준)

// ─────────────────────────────────────────────────────────────────
// Book mesh
// ─────────────────────────────────────────────────────────────────
function Book({ coverColor, title, pageCount, titleLayout }) {
  // 페이지 수에 따른 책등 두께 동적 계산
  const { BD: bd } = calcSpineWidth(pageCount);

  const mats = useMemo(() => {
    const frontTex = buildFrontTex(coverColor, title, titleLayout);
    const spineTex = buildSpineTex(coverColor, title);
    const backTex  = buildBackTex(coverColor);
    const pagesTex = buildPagesTex();
    const tbTex    = buildTopBotTex();

    // BoxGeometry 면 순서: +X, -X, +Y, -Y, +Z, -Z
    // 카메라가 +Z 방향을 보면: front=+Z, back=-Z, spine=-X(왼쪽), pages=+X(오른쪽)
    return [
      new THREE.MeshStandardMaterial({ map: pagesTex, roughness: 0.93, metalness: 0 }),          // +X 내지 옆면
      new THREE.MeshStandardMaterial({ map: spineTex, roughness: 0.78, metalness: 0 }),          // -X 책등
      new THREE.MeshStandardMaterial({ map: tbTex,    roughness: 0.90, metalness: 0 }),          // +Y 상단
      new THREE.MeshStandardMaterial({ map: tbTex,    roughness: 0.90, metalness: 0 }),          // -Y 하단
      new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.72, metalness: 0.014 }),      // +Z 앞표지
      new THREE.MeshStandardMaterial({ map: backTex,  roughness: 0.80, metalness: 0 }),          // -Z 뒷표지
    ];
  }, [coverColor, title, titleLayout]);

  // 언마운트 시 메모리 해제
  useEffect(
    () => () => mats.forEach((m) => { m.map?.dispose(); m.dispose(); }),
    [mats],
  );

  return (
    <group>
      {/* 메인 책 본체 — 책등 두께 bd는 페이지 수 기반으로 동적 계산 */}
      <mesh material={mats} castShadow receiveShadow>
        <boxGeometry args={[BW, BH, bd]} />
      </mesh>

      {/*
        하드커버 바인딩 힌지 디테일 — 책등-표지 접합선
        실제 하드커버 책의 홈(groove) 표현
      */}
      <mesh position={[-BW / 2 + bd * 0.08, 0, bd / 2 - 0.018]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, BH * 0.999, 8]} />
        <meshStandardMaterial color={adj(coverColor, -62)} roughness={0.85} />
      </mesh>
      <mesh position={[-BW / 2 + bd * 0.08, 0, -bd / 2 + 0.018]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, BH * 0.999, 8]} />
        <meshStandardMaterial color={adj(coverColor, -62)} roughness={0.85} />
      </mesh>

      {/* 책등 외곽 라운딩 엣지 액센트 */}
      <mesh position={[-BW / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.024, BH * 0.999, 12]} />
        <meshStandardMaterial color={adj(coverColor, -55)} roughness={0.80} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────
export default function BookMockup3D({
  coverColor  = '#F5E8C7',
  title       = '나의 2026년',
  height      = 520,
  pageCount   = 29,           // 수록 일기 편 수 → 책등 두께 자동 계산
  titleLayout = 'center',     // 'center' | 'bottom-left'
}) {
  return (
    <div
      style={{
        width: '100%',
        height,
        background: '#F9F9F9',
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      <Canvas
        camera={{ position: [0.7, 0.3, 4.6], fov: 32 }}
        shadows
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#F9F9F9']} />

        {/* 조명 */}
        <ambientLight intensity={0.60} />
        {/* 메인 키 라이트 (좌상단) */}
        <directionalLight
          position={[3, 5.5, 4]}
          intensity={1.25}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={20}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
        />
        {/* 필 라이트 (우하단 뒤) */}
        <directionalLight position={[-4, 1.5, -2]} intensity={0.22} />
        {/* 림 라이트 (앞 상단) */}
        <pointLight position={[1, 3, 5.5]} intensity={0.52} />

        {/* 책 — pageCount + titleLayout 전달 */}
        <Book coverColor={coverColor} title={title} pageCount={pageCount} titleLayout={titleLayout} />

        {/* 바닥 콘택트 섀도우 */}
        <ContactShadows
          position={[0, -BH / 2 - 0.05, 0]}
          opacity={0.30}
          scale={7}
          blur={3.0}
          far={4}
          color="#2A2520"
        />

        {/* 360° 궤도 컨트롤 + 관성 감쇠 + 자동 회전 */}
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={2.4}
          maxDistance={9}
          minPolarAngle={Math.PI * 0.14}
          maxPolarAngle={Math.PI * 0.76}
          autoRotate
          autoRotateSpeed={0.75}
          enableDamping
          dampingFactor={0.055}
        />
      </Canvas>
    </div>
  );
}
