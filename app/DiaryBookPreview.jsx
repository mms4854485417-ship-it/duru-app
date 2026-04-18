'use client';

import {
  useState, useRef, useCallback, useEffect,
} from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ── 책 치수 (px) ──────────────────────────────────────────────────────────────
const PAGE_W  = 152;   // 단일 페이지 너비
const PAGE_H  = 212;   // 페이지 높이
const SPINE_W = 24;    // 책등 너비
const BOOK_W  = SPINE_W + PAGE_W * 2;

// ── 데이터 ────────────────────────────────────────────────────────────────────
const COVER = { bg: '#F5E8C7', bgEnd: '#E2CFA0', spine: '#C4A060', text: '#5A3E1B' };

const EMOTIONS = [
  { name: '기쁨',   value: 38, color: '#E8B84B', cx: 50, cy: 18 },
  { name: '평온',   value: 27, color: '#6BAED6', cx: 82, cy: 50 },
  { name: '외로움', value: 18, color: '#8FA8A8', cx: 65, cy: 80 },
  { name: '우울',   value: 11, color: '#5D8AA8', cx: 28, cy: 74 },
  { name: '설렘',   value: 6,  color: '#E8908A', cx: 16, cy: 42 },
];

const CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[4,0],[0,2],[1,3]];

const DIARY = [
  {
    date: '3월 14일', emotion: '기쁨', dot: '#E8B84B', page: 24,
    title: '퇴근길 벚꽃',
    body: '퇴근하면서 지하철역 앞 벚꽃길을 지나쳤다. 올해도 어김없이 피었구나 싶었는데, 왠지 모르게 가슴이 찡했다. 작년 이맘때 함께 보던 사람이 생각났다.',
  },
  {
    date: '5월 3일', emotion: '평온', dot: '#6BAED6', page: 58,
    title: '오래된 카페에서',
    body: '오랜만에 혼자 카페에 앉아 책을 읽었다. 창밖으로 비가 내리고 잔잔한 음악이 흘렀다. 이런 오후가 가끔 필요하다는 걸 새삼 느꼈다.',
  },
];

// ── 스프레드 정의 ─────────────────────────────────────────────────────────────
// 각 스프레드: [왼쪽 페이지 타입, 오른쪽 페이지 타입]
const SPREADS = [
  ['blank',    'title'   ],
  ['toc',      'constel' ],
  ['diary-0',  'diary-1' ],
  ['stats',    'blank-end'],
];

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
export default function DiaryBookPreview({ bookTitle = '나의 2026년', onClose }) {
  const [spread,      setSpread]      = useState(0);
  const [flipping,    setFlipping]    = useState(false);
  const [flipDir,     setFlipDir]     = useState(null);   // 'fwd' | 'bwd'
  // 플립이 90도를 넘었는지 — 이 시점에 정적 페이지 콘텐츠를 교체
  const [pastHalf,    setPastHalf]    = useState(false);

  const rotY = useMotionValue(0);

  const canGoFwd = spread < SPREADS.length - 1;
  const canGoBwd = spread > 0;

  // rotY 값을 구독 → 90도를 지나는 순간 pastHalf 플래그 전환
  // 이 타이밍에 정적 배경 페이지 콘텐츠를 교체해서 "번쩍임" 제거
  useEffect(() => {
    const unsub = rotY.on('change', v => {
      if (flipDir === 'fwd')  setPastHalf(v < -90);
      if (flipDir === 'bwd')  setPastHalf(v >  90);
    });
    return unsub;
  }, [rotY, flipDir]);

  // 플립 트리거 ──────────────────────────────────────────────────────────────
  const triggerFlip = useCallback((dir) => {
    if (flipping) return;
    if (dir === 'fwd' && !canGoFwd) return;
    if (dir === 'bwd' && !canGoBwd) return;

    setPastHalf(false);
    setFlipping(true);
    setFlipDir(dir);

    const target = dir === 'fwd' ? -180 : 180;
    animate(rotY, target, {
      duration: 0.72,
      ease: [0.645, 0.045, 0.355, 1.0],
      onComplete: () => {
        setSpread(s => dir === 'fwd' ? s + 1 : s - 1);
        rotY.set(0);
        setPastHalf(false);
        setFlipping(false);
        setFlipDir(null);
      },
    });
  }, [flipping, canGoFwd, canGoBwd, rotY]);

  // 드래그 ───────────────────────────────────────────────────────────────────
  const dragStart = useRef(null);

  function onPointerDown(e, side) {
    if (flipping) return;
    dragStart.current = { x: e.clientX, side };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragStart.current || flipping) return;
    const dx = e.clientX - dragStart.current.x;
    const { side } = dragStart.current;
    if (side === 'right' && canGoFwd) {
      // 오른쪽 드래그 → 앞으로 플립 (값이 음수로)
      const ang = Math.max(-180, Math.min(0, (dx / PAGE_W) * -180));
      rotY.set(ang);
      setFlipping(true); setFlipDir('fwd');
    } else if (side === 'left' && canGoBwd) {
      const ang = Math.min(180, Math.max(0, (dx / PAGE_W) * -180 + 180));
      rotY.set(ang > 0 ? 180 - ang : 0);
      setFlipping(true); setFlipDir('bwd');
    }
  }

  function onPointerUp(e) {
    if (!dragStart.current) return;
    const cur = rotY.get();
    const thresh = dragStart.current.side === 'right' ? -90 : 90;
    dragStart.current = null;

    if (flipDir === 'fwd' && cur < thresh) {
      animate(rotY, -180, { duration: 0.38, ease: [0.4, 0, 0.2, 1], onComplete: () => {
        setSpread(s => s + 1); rotY.set(0); setFlipping(false); setFlipDir(null);
      }});
    } else if (flipDir === 'bwd' && cur > 90) {
      animate(rotY, 180, { duration: 0.38, ease: [0.4, 0, 0.2, 1], onComplete: () => {
        setSpread(s => s - 1); rotY.set(0); setFlipping(false); setFlipDir(null);
      }});
    } else {
      animate(rotY, 0, { duration: 0.3, ease: [0.4, 0, 0.6, 1], onComplete: () => {
        setFlipping(false); setFlipDir(null);
      }});
    }
  }

  // 현재 / 인접 스프레드
  const cur  = SPREADS[spread];
  const next = SPREADS[Math.min(spread + 1, SPREADS.length - 1)];
  const prev = SPREADS[Math.max(spread - 1, 0)];

  return (
    // ⑦ min-h-screen + justify-center 조합 대신 overflow-y-auto + py 패딩으로
    // → 작은 기기에서 책 하단 버튼이 잘리지 않고 자연스럽게 스크롤됨
    <div
      style={{
        minHeight: '100dvh',               // dvh: 모바일 주소창 제외 실제 뷰포트
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '72px 20px 48px',         // 상단 닫기 버튼 + 하단 인디케이터 공간 확보
        background: 'linear-gradient(160deg,#1A1510 0%,#0E0C0A 100%)',
        boxSizing: 'border-box',
      }}
    >
      {/* 닫기 */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'fixed',             // absolute → fixed: 스크롤해도 항상 우상단 고정
            top: 48, right: 20,
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', color: 'white',
            border: 'none', cursor: 'pointer', zIndex: 100,
          }}
        >
          ✕
        </button>
      )}

      {/* 섹션 레이블 */}
      <div className="mb-8 text-center">
        <div
          className="text-[10px] font-bold tracking-[.28em] uppercase mb-1"
          style={{ color: 'rgba(232,184,75,0.6)', fontFamily: 'Georgia, serif' }}
        >
          Preview Edition
        </div>
        <div className="text-[22px] font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>
          {bookTitle}
        </div>
      </div>

      {/* ── 책 오브제 ─────────────────────────────────────────────────────── */}
      <div
        style={{
          perspective: '2800px',
          perspectiveOrigin: '50% 45%',
        }}
      >
        <div
          style={{
            width: BOOK_W,
            height: PAGE_H + 12,
            position: 'relative',
            transformStyle: 'preserve-3d',
          }}
        >

          {/* ── 하드커버 외곽 (3D 상단 면) ───────────────────────────────── */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: BOOK_W, height: 10,
              background: `linear-gradient(90deg, #8B6030 0%, #C4A060 30%, #E8D090 50%, #C4A060 70%, #8B6030 100%)`,
              borderRadius: '4px 4px 0 0',
              transform: 'rotateX(90deg)',
              transformOrigin: 'top center',
              boxShadow: '0 -1px 4px rgba(0,0,0,0.4)',
            }}
          />

          {/* ── 멀티레이어 드롭 섀도 ─────────────────────────────────────── */}
          <div style={{
            position: 'absolute',
            bottom: -8, left: '8%', right: '8%',
            height: 30,
            background: 'rgba(0,0,0,0.55)',
            borderRadius: '50%',
            filter: 'blur(14px)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: -20, left: '4%', right: '4%',
            height: 40,
            background: 'rgba(0,0,0,0.30)',
            borderRadius: '50%',
            filter: 'blur(28px)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: -36, left: 0, right: 0,
            height: 50,
            background: 'rgba(0,0,0,0.15)',
            borderRadius: '50%',
            filter: 'blur(48px)',
          }} />

          {/* ── 책 본체 래퍼 ─────────────────────────────────────────────── */}
          <div
            style={{
              position: 'absolute',
              top: 6, left: 0, right: 0, bottom: 0,
              display: 'flex',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: [
                '2px 0 6px rgba(0,0,0,0.25)',
                '-1px 0 3px rgba(0,0,0,0.15)',
              ].join(','),
            }}
          >

            {/* ── 책등 (Spine) ─────────────────────────────────────────── */}
            <div
              style={{
                width: SPINE_W,
                flexShrink: 0,
                background: `linear-gradient(
                  90deg,
                  #6B4020 0%,
                  #A07040 18%,
                  #D4A860 38%,
                  #C09050 52%,
                  #8B5A28 70%,
                  #6B4020 100%
                )`,
                position: 'relative',
                overflow: 'hidden',
                zIndex: 30,
              }}
            >
              {/* 책등 세로 타이틀 */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(90deg)',
                  whiteSpace: 'nowrap',
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '.18em',
                  color: 'rgba(255,240,200,0.55)',
                  fontFamily: 'Georgia, serif',
                }}
              >
                DURU DIARY 2026
              </div>
              {/* 책등 하이라이트 선 */}
              <div style={{
                position: 'absolute', top: 0, left: 3, bottom: 0, width: 1,
                background: 'rgba(255,255,255,0.18)',
              }} />
              <div style={{
                position: 'absolute', top: 0, right: 3, bottom: 0, width: 1,
                background: 'rgba(0,0,0,0.2)',
              }} />
            </div>

            {/* ── 페이지 영역 ──────────────────────────────────────────── */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                background: '#FDF9F2',
              }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >

              {/* 왼쪽 정적 페이지 */}
              <div
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: PAGE_W, height: '100%',
                  background: '#FEFCF8',
                  zIndex: 1,
                  overflow: 'hidden',
                }}
              >
                {/* 제본 그림자 */}
                <div style={{
                  position: 'absolute', top: 0, right: 0, bottom: 0, width: 20,
                  background: 'linear-gradient(to left, rgba(0,0,0,0.08), transparent)',
                  zIndex: 10, pointerEvents: 'none',
                }} />
                {/* 왼쪽 정적 페이지:
                    - 기본: 현재 스프레드 왼쪽
                    - fwd 플립 후반(90도 이후): 다음 스프레드 왼쪽(뒷면 완료 후 이어짐)
                    - bwd 플립 전반(90도 이전): 현재 왼쪽 유지, 후반: 이전 스프레드 왼쪽 */}
                <PageContent type={
                  flipDir === 'fwd' && pastHalf ? next[0]
                  : flipDir === 'bwd' && pastHalf ? prev[0]
                  : cur[0]
                } />
              </div>

              {/* 오른쪽 정적 페이지 (플립 중일 때 다음 스프레드의 right를 미리 보여줌) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0, right: 0,
                  width: PAGE_W, height: '100%',
                  background: '#FAF7F0',
                  zIndex: 1,
                  overflow: 'hidden',
                  cursor: canGoFwd ? 'pointer' : 'default',
                }}
                onPointerDown={e => onPointerDown(e, 'right')}
                onClick={() => !flipping && triggerFlip('fwd')}
              >
                {/* 제본 그림자 */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0, width: 20,
                  background: 'linear-gradient(to right, rgba(0,0,0,0.07), transparent)',
                  zIndex: 10, pointerEvents: 'none',
                }} />
                {/* 오른쪽 정적 페이지:
                    90도 지나기 전: 현재 right (플립 카드에 가려져 보이지 않음)
                    90도 이후: 다음/이전 스프레드 right (카드가 왼쪽으로 넘어가면서 노출) */}
                <PageContent type={
                  flipDir === 'fwd' && pastHalf ? next[1]
                  : flipDir === 'bwd' && pastHalf ? prev[1]
                  : cur[1]
                } />

                {/* "탭하여 넘기기" 힌트 (첫 스프레드 + 미플립) */}
                {spread === 0 && !flipping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.7, 0] }}
                    transition={{ duration: 2.5, delay: 1.2, repeat: Infinity, repeatDelay: 2 }}
                    style={{
                      position: 'absolute', bottom: 10, right: 10,
                      fontSize: 9, fontWeight: 600, color: '#C0A870',
                      letterSpacing: '.08em', fontFamily: 'Georgia, serif',
                    }}
                  >
                    tap to flip →
                  </motion.div>
                )}

                {/* 모서리 curl 힌트 */}
                {canGoFwd && !flipping && (
                  <PageCornerCurl />
                )}
              </div>

              {/* ── 3D 플립 페이지 ────────────────────────────────────── */}
              {flipping && (
                <motion.div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: flipDir === 'fwd' ? PAGE_W : 0,
                    width: PAGE_W,
                    height: '100%',
                    transformStyle: 'preserve-3d',
                    transformOrigin: flipDir === 'fwd' ? 'left center' : 'right center',
                    rotateY: rotY,
                    zIndex: 20,
                  }}
                >
                  {/* 앞면 */}
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      backfaceVisibility: 'hidden',
                      background: '#FAF7F0',
                      overflow: 'hidden',
                    }}
                  >
                    {/* 앞면 제본 그림자 */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, bottom: 0, width: 20,
                      background: 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)',
                      pointerEvents: 'none', zIndex: 10,
                    }} />
                    {/* 페이지 우측 모서리 그림자 (들림 효과) */}
                    <div style={{
                      position: 'absolute', top: 0, right: 0, bottom: 0, width: 16,
                      background: 'linear-gradient(to left, rgba(0,0,0,0.12), transparent)',
                      pointerEvents: 'none', zIndex: 10,
                    }} />
                    <PageContent type={flipDir === 'fwd' ? cur[1] : prev[1]} />
                    {/* 종이 질감 + 플립 중 가운데 부분이 약간 어두워지는 curl 암부 */}
                    <PaperTexture />
                    {/* 페이지 중앙(접힘선) 쪽 curl 암부 — 종이가 휘면서 빛이 덜 받는 느낌 */}
                    <motion.div
                      style={{
                        position: 'absolute', top: 0, left: 0, bottom: 0,
                        width: '45%',
                        background: 'linear-gradient(to right, rgba(0,0,0,0.10), transparent)',
                        opacity: useTransform(rotY, v => {
                          // 0도(시작)→90도 사이에서 점점 강해짐
                          const pct = Math.min(1, Math.abs(v) / 90);
                          return pct * 0.9;
                        }),
                        pointerEvents: 'none', zIndex: 12,
                      }}
                    />
                  </div>

                  {/* 뒷면 */}
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: '#F5F0E8',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 0, right: 0, bottom: 0, width: 20,
                      background: 'linear-gradient(to left, rgba(0,0,0,0.07), transparent)',
                      pointerEvents: 'none', zIndex: 10,
                    }} />
                    {/* 뒷면 = 다음 스프레드의 왼쪽 페이지
                        rotateY(180deg) + 부모의 -180deg = 순 0deg → 텍스트 방향 자동 정상
                        scaleX(-1) 추가 시 오히려 거울반전 되므로 mirrored prop 제거  */}
                    <PageContent type={flipDir === 'fwd' ? next[0] : cur[0]} />
                    {/* 종이 뒷면 질감 — 더 어두운 그라데이션 */}
                    <PaperTexture dark />
                  </div>

                  {/* 플립 중 동적 광원 그림자 */}
                  <FlipShadow rotY={rotY} dir={flipDir} />
                </motion.div>
              )}

              {/* 페이지 중앙 제본선 */}
              <div style={{
                position: 'absolute', top: 0, left: PAGE_W - 0.5, bottom: 0, width: 1,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(0,0,0,0.14) 35%, rgba(0,0,0,0.14) 65%, rgba(0,0,0,0.04))',
                zIndex: 25,
              }} />
            </div>
          </div>

          {/* ── 하드커버 테두리 오버레이 ─────────────────────────────────── */}
          <div style={{
            position: 'absolute', inset: 6,
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 3,
            pointerEvents: 'none',
            zIndex: 40,
          }} />
        </div>
      </div>

      {/* ── 내비게이션 + 페이지 인디케이터 ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 36 }}>
        <NavBtn
          disabled={!canGoBwd || flipping}
          onClick={() => triggerFlip('bwd')}
          icon={<ChevronLeft size={18} />}
        />

        <div className="flex items-center gap-2">
          {SPREADS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === spread ? 22 : 6,
                background: i === spread ? '#F5E8C7' : 'rgba(255,255,255,0.2)',
              }}
              transition={{ duration: 0.28 }}
              className="rounded-full"
              style={{ height: 5 }}
            />
          ))}
        </div>

        <NavBtn
          disabled={!canGoFwd || flipping}
          onClick={() => triggerFlip('fwd')}
          icon={<ChevronRight size={18} />}
        />
      </div>

      {/* 페이지 번호 */}
      <div
        className="mt-4 text-[11px] font-medium tracking-widest"
        style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Georgia, serif' }}
      >
        {spread * 2 + 1} — {spread * 2 + 2} / {SPREADS.length * 2}
      </div>
    </div>
  );
}

// ── 플립 동적 그림자 ──────────────────────────────────────────────────────────
// 페이지가 90도(수직)에 가까울수록 그림자 강도 최대 → 0도 / 180도에서 사라짐
// sin(angle)을 이용: sin(0°)=0, sin(90°)=1, sin(180°)=0
function FlipShadow({ rotY, dir }) {
  const shadowOpacity = useTransform(rotY, v => {
    // fwd: 0 → -180, bwd: 0 → 180
    const angle = Math.abs(v); // 0~180
    const rad = (angle * Math.PI) / 180;
    return Math.sin(rad) * 0.28; // 최대 0.28 불투명도
  });

  // 그림자 방향: 페이지 앞면일 때는 오른쪽, 뒷면일 때는 왼쪽에서 드리움
  const isBackFace = useTransform(rotY, v =>
    dir === 'fwd' ? v < -90 : v > 90
  );

  return (
    <>
      {/* 페이지 앞면 위 그림자 (우측→좌측) */}
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to left, rgba(0,0,0,0.35) 0%, transparent 60%)',
          opacity: useTransform(rotY, v => {
            const pct = Math.abs(v) / 90; // 0→1 (0°→90°)
            return dir === 'fwd'
              ? Math.max(0, 1 - pct) * 0.25   // 앞면: 90도까지 서서히 사라짐
              : Math.max(0, pct - 1) * 0.25;
          }),
          pointerEvents: 'none', zIndex: 30,
        }}
      />
      {/* 뒷면 위 그림자 (좌측→우측) */}
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 55%)',
          opacity: useTransform(rotY, v => {
            const past = Math.max(0, Math.abs(v) - 90) / 90; // 90°→180°: 0→1
            return past * 0.22;
          }),
          pointerEvents: 'none', zIndex: 30,
        }}
      />
    </>
  );
}

// ── 페이지 모서리 컬 (hover 시 확장) ─────────────────────────────────────────
// 실제 종이 모서리가 살짝 들린 느낌을 주는 레이어드 구조
function PageCornerCurl() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{
        position: 'absolute', bottom: 0, right: 0,
        width: hovered ? 52 : 32, height: hovered ? 52 : 32,
        transition: 'width 0.22s ease, height 0.22s ease',
        pointerEvents: 'all', cursor: 'pointer',
        zIndex: 15,
      }}
    >
      {/* 들린 종이 그림자 */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: '100%', height: '100%',
        background: 'radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.18) 0%, transparent 70%)',
        filter: 'blur(3px)',
        transform: 'translate(3px, 3px)',
        pointerEvents: 'none',
      }} />

      {/* 들린 종이 뒷면 (베이지 톤) */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: '100%', height: '100%',
        background: `linear-gradient(225deg, #E8D4A8 0%, #F0E4C4 50%, transparent 75%)`,
        clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%)',
        pointerEvents: 'none',
      }} />

      {/* 접힘선 하이라이트 */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: '140%', height: 1.5,
        background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.6), rgba(200,168,96,0.4))',
        transform: `rotate(-45deg)`,
        transformOrigin: 'right bottom',
        pointerEvents: 'none',
        opacity: 0.8,
      }} />
    </div>
  );
}

// ── 종이 질감 오버레이 ────────────────────────────────────────────────────────
// dark=false : 앞면 — 밝고 깨끗한 크림 질감, 우측 상단 빛 반사
// dark=true  : 뒷면 — 미세한 황변 + 빛 반사 방향이 반대 (좌측), 약간 더 따뜻한 톤
function PaperTexture({ dark = false }) {
  return (
    <>
      {/* 수평 종이 섬유 라인 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: dark
          ? `repeating-linear-gradient(
               0deg,
               transparent 0px, transparent 2px,
               rgba(160,120,60,0.03) 2px, rgba(160,120,60,0.03) 3px
             )`
          : `repeating-linear-gradient(
               0deg,
               transparent 0px, transparent 3px,
               rgba(0,0,0,0.007) 3px, rgba(0,0,0,0.007) 4px
             )`,
      }} />

      {/* 빛 반사 — 앞면은 우상단, 뒷면은 좌하단 (접힌 방향 반대) */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: dark
          // 뒷면: 좌측에서 들어오는 빛 + 약한 황변 베이스
          ? `radial-gradient(ellipse 80% 60% at 15% 75%, rgba(220,185,120,0.13) 0%, transparent 65%),
             radial-gradient(ellipse 40% 30% at 80% 20%, rgba(240,220,180,0.06) 0%, transparent 50%),
             linear-gradient(160deg, rgba(200,170,110,0.06) 0%, transparent 45%)`
          // 앞면: 우측 상단에서 들어오는 빛
          : `radial-gradient(ellipse 70% 55% at 82% 12%, rgba(255,248,235,0.28) 0%, transparent 60%),
             radial-gradient(ellipse 35% 25% at 20% 85%, rgba(220,200,160,0.08) 0%, transparent 50%)`,
      }} />

      {/* 뒷면 전용: 종이 노화에 의한 미세한 얼룩 */}
      {dark && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 20% 15% at 35% 30%, rgba(180,140,80,0.05) 0%, transparent 100%),
            radial-gradient(ellipse 15% 12% at 70% 65%, rgba(160,130,70,0.04) 0%, transparent 100%)
          `,
        }} />
      )}
    </>
  );
}

// ── 내비게이션 버튼 ───────────────────────────────────────────────────────────
function NavBtn({ onClick, disabled, icon }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.88 }}
      className="w-11 h-11 flex items-center justify-center rounded-full transition-all"
      style={{
        background: disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)',
        color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)',
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {icon}
    </motion.button>
  );
}

// ── 페이지 콘텐츠 라우터 ──────────────────────────────────────────────────────
function PageContent({ type }) {
  const style = { width: '100%', height: '100%' };

  switch (type) {
    case 'blank':     return <div style={style}><BlankPage /></div>;
    case 'blank-end': return <div style={style}><BlankPage end /></div>;
    case 'title':     return <div style={style}><TitlePage /></div>;
    case 'toc':       return <div style={style}><TocPage /></div>;
    case 'constel':   return <div style={style}><ConstellationPage /></div>;
    case 'diary-0':   return <div style={style}><DiaryPage entry={DIARY[0]} /></div>;
    case 'diary-1':   return <div style={style}><DiaryPage entry={DIARY[1]} /></div>;
    case 'stats':     return <div style={style}><StatsPage /></div>;
    default:          return <div style={style} />;
  }
}

// ── 페이지 레이아웃 래퍼 ─────────────────────────────────────────────────────
function Page({ children, style = {} }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      padding: '16px 14px 14px',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Georgia', serif",
      ...style,
    }}>
      {children}
    </div>
  );
}

function PageNumber({ n, right = false }) {
  return (
    <div style={{
      marginTop: 'auto', paddingTop: 8,
      fontSize: 8, fontWeight: 600,
      color: 'rgba(160,140,110,0.6)',
      textAlign: right ? 'right' : 'left',
      fontFamily: 'Georgia, serif',
      letterSpacing: '.1em',
    }}>
      {n}
    </div>
  );
}

// ── 각 페이지 컴포넌트 ────────────────────────────────────────────────────────

function BlankPage({ end = false }) {
  return (
    <Page>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.12 }}>
        {!end && (
          <svg width="32" height="32" viewBox="0 0 26 26" fill="none">
            <ellipse cx="13" cy="5.5" rx="2.6" ry="4" fill="#8B6200" />
            <ellipse cx="7" cy="9" rx="2.6" ry="4" fill="#8B6200" transform="rotate(35 7 9)" />
            <ellipse cx="19" cy="9" rx="2.6" ry="4" fill="#8B6200" transform="rotate(-35 19 9)" />
            <ellipse cx="13" cy="16.5" rx="5" ry="4.2" fill="#8B6200" />
            <ellipse cx="13" cy="21.5" rx="1.8" ry="2.8" fill="#8B6200" />
          </svg>
        )}
      </div>
    </Page>
  );
}

function TitlePage() {
  return (
    <Page>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        {/* 미니 책 아이콘 */}
        <div style={{
          width: 32, height: 42, borderRadius: '2px 6px 6px 2px',
          background: 'linear-gradient(145deg,#F5E8C7,#E2CFA0)',
          boxShadow: '2px 3px 10px rgba(0,0,0,0.14)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#C4A060' }} />
          <div style={{ position: 'absolute', bottom: 6, left: 7, right: 5, fontSize: 5, fontWeight: 900, color: '#8B6200', lineHeight: 1.3 }}>두루</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#2A1F0E', lineHeight: 1.3, marginBottom: 4 }}>
            나의 2026년
          </div>
          <div style={{ width: 24, height: 1, background: '#D0B890', margin: '6px auto' }} />
          <div style={{ fontSize: 8, color: '#C0A870', letterSpacing: '.2em', fontWeight: 600 }}>
            DURU DIARY
          </div>
        </div>

        <div style={{ fontSize: 7.5, color: 'rgba(160,140,110,0.5)', letterSpacing: '.16em' }}>
          HANDMADE HARDCOVER
        </div>
      </div>
      <PageNumber n="i" />
    </Page>
  );
}

function TocPage() {
  const items = [
    { label: '감정 별자리',  page: '01' },
    { label: '봄 — 3월·4월', page: '12' },
    { label: '여름 — 5월·6월', page: '38' },
    { label: '가을 — 9월·10월', page: '72' },
    { label: '겨울 — 11월·12월', page: '98' },
    { label: '한 해를 돌아보며', page: '118' },
  ];
  return (
    <Page>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#C0A870', letterSpacing: '.18em', marginBottom: 12 }}>
        CONTENTS
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(it => (
          <div key={it.label} style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#3A2A14' }}>{it.label}</span>
            <div style={{ flex: 1, borderBottom: '1px dotted rgba(160,130,80,0.22)', marginBottom: 2 }} />
            <span style={{ fontSize: 9, color: '#B09060', fontWeight: 600 }}>{it.page}</span>
          </div>
        ))}
      </div>
      <PageNumber n="ii" />
    </Page>
  );
}

function ConstellationPage() {
  const W = PAGE_W - 28, H = 110;
  const stars = EMOTIONS.map(e => ({
    ...e,
    x: (e.cx / 100) * W,
    y: (e.cy / 100) * H,
    r: 2.5 + (e.value / 38) * 5.5,
  }));

  return (
    <Page style={{ background: '#0C0B09' }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(232,184,75,0.6)', letterSpacing: '.2em', marginBottom: 2 }}>
        EMOTIONAL CONSTELLATION
      </div>
      <div style={{ fontSize: 12, fontWeight: 900, color: 'white', marginBottom: 10 }}>
        감정 별자리
      </div>

      {/* SVG 성좌 */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', flexShrink: 0 }}>
        <defs>
          {stars.map(s => (
            <radialGradient key={s.name} id={`pg-${s.name}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.55" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
        {CONNECTIONS.map(([a, b], i) => (
          <line key={i}
            x1={stars[a].x} y1={stars[a].y}
            x2={stars[b].x} y2={stars[b].y}
            stroke="rgba(255,255,255,0.09)" strokeWidth="0.75"
          />
        ))}
        {stars.map(s => (
          <g key={s.name}>
            <circle cx={s.x} cy={s.y} r={s.r * 3.2} fill={`url(#pg-${s.name})`} />
            <circle cx={s.x} cy={s.y} r={s.r} fill={s.color} />
            <circle cx={s.x - s.r * 0.28} cy={s.y - s.r * 0.28} r={s.r * 0.32} fill="rgba(255,255,255,0.7)" />
            <text
              x={s.cx < 50 ? s.x - s.r - 3 : s.x + s.r + 3}
              y={s.y + 2.5}
              textAnchor={s.cx < 50 ? 'end' : 'start'}
              fontSize="7" fontWeight="600"
              fill="rgba(255,255,255,0.45)"
            >
              {s.name}
            </text>
          </g>
        ))}
      </svg>

      {/* 범례 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 10 }}>
        {EMOTIONS.map(e => (
          <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
            <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              {e.name} {e.value}%
            </span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.18)', marginTop: 'auto', paddingTop: 8 }}>
        01
      </div>
    </Page>
  );
}

function DiaryPage({ entry }) {
  return (
    <Page>
      {/* 감정 태그 + 날짜 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: entry.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 8, fontWeight: 700, color: entry.dot }}>{entry.emotion}</span>
        <span style={{ fontSize: 8, color: 'rgba(160,130,80,0.5)', marginLeft: 'auto' }}>{entry.date}</span>
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: 'rgba(180,150,100,0.12)', marginBottom: 10 }} />

      {/* 제목 */}
      <div style={{ fontSize: 14, fontWeight: 900, color: '#2A1F0E', lineHeight: 1.3, marginBottom: 9 }}>
        {entry.title}
      </div>

      {/* 본문 */}
      <div style={{
        fontSize: 9, color: '#7A6A50', lineHeight: 1.85,
        flex: 1, overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 9, WebkitBoxOrient: 'vertical',
      }}>
        {entry.body}
      </div>

      <PageNumber n={entry.page} right />
    </Page>
  );
}

function StatsPage() {
  const total = EMOTIONS.reduce((s, e) => s + e.value, 0);
  return (
    <Page>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#C0A870', letterSpacing: '.16em', marginBottom: 8 }}>
        YEAR IN REVIEW
      </div>
      <div style={{ fontSize: 13, fontWeight: 900, color: '#2A1F0E', marginBottom: 14 }}>한 해를 돌아보며</div>

      {/* 통계 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { n: '127', label: '편의 일기' },
          { n: '365', label: '일의 기록' },
          { n: '5',   label: '가지 감정' },
          { n: 'A5',  label: '하드커버' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(200,168,96,0.07)',
            borderRadius: 8, padding: '8px 10px',
            border: '1px solid rgba(200,168,96,0.12)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#8B6200', lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 8, color: '#B09060', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 감정 바 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {EMOTIONS.map(e => (
          <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 8, color: '#A09070', width: 28, textAlign: 'right', flexShrink: 0 }}>{e.name}</span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${e.value}%`, background: e.color, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 8, fontWeight: 700, color: e.color, width: 22, flexShrink: 0 }}>{e.value}%</span>
          </div>
        ))}
      </div>

      <PageNumber n="118" right />
    </Page>
  );
}
