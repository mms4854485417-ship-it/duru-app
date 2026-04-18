'use client';

/**
 * SpineBookshelf — 가상 책꽂이 기반 책등 두께 시각화 컴포넌트
 *
 * 기능:
 *  - 실시간 일기 편 수 슬라이더 → 책등 두께(mm) 계산
 *  - CSS 트랜지션으로 DURU 책 두께 애니메이션
 *  - 책등 하단 감정 컬러 밴드 인쇄 미리보기
 *  - 인근 서적들로 구성된 실제 책꽂이 분위기
 *  - 금박 두루 엠블럼 + 린넨 텍스처 오버레이
 */

import { useState, useMemo } from 'react';

// ── 연도별 테마는 YEARLY_THEMES에서 관리 (page.jsx 참조) ──────────

// ── 이웃 장식 서적 ───────────────────────────────────────────────
const LEFT_BOOKS  = [
  { w: 19, h: 204, top: '#D0C0A0', btm: '#A89880', title: '2023' },
  { w: 27, h: 220, top: '#96A4B4', btm: '#768494', title: 'Notes' },
  { w: 14, h: 194, top: '#B2A6C4', btm: '#928698', title: '' },
];
const RIGHT_BOOKS = [
  { w: 22, h: 210, top: '#A6B2A2', btm: '#868E82', title: '봄' },
  { w: 31, h: 224, top: '#A2A6B6', btm: '#828496', title: '2025' },
  { w: 16, h: 198, top: '#C2A89C', btm: '#A2887C', title: 'Nov' },
];

// ── 유틸: 헥스 색상 어둡게 ──────────────────────────────────────
const darken = (hex, amt) =>
  '#' + [1, 3, 5].map(i =>
    Math.max(0, Math.min(255, parseInt(hex.slice(i, i + 2), 16) - amt))
      .toString(16).padStart(2, '0'),
  ).join('');

// ── 장식 서적 컴포넌트 ───────────────────────────────────────────
function DecoBook({ w, h, top, btm, title }) {
  return (
    <div
      className="shelf-book"
      style={{
        width: w,
        height: h,
        alignSelf: 'flex-end',
        background: `linear-gradient(170deg, ${top} 0%, ${btm} 100%)`,
        borderRadius: '2px 2px 1px 1px',
        position: 'relative',
        boxShadow: '2px 0 8px rgba(0,0,0,0.28), inset -2px 0 5px rgba(0,0,0,0.18)',
        flexShrink: 0,
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* 책등 수평선 장식 */}
      <div style={{ position: 'absolute', top: 14, left: '20%', right: '20%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[0, 1].map(i => <div key={i} style={{ height: 0.5, background: 'rgba(255,255,255,0.18)' }} />)}
      </div>
      {/* 제목 (세로) */}
      {title && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) rotate(-90deg)',
          fontSize: 7, fontWeight: 700,
          color: 'rgba(255,255,255,0.55)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.12em',
          fontFamily: 'Georgia, serif',
        }}>{title}</div>
      )}
    </div>
  );
}

// ── 두루 책 컴포넌트 (단일 에디션 — 공압 엠블럼) ─────────────────
function DuruBook({ spineWidthPx, coverColor, year }) {
  const SPINE_H = 232;
  const dark    = darken(coverColor, 22);

  return (
    <div
      className="duru-spine"
      style={{
        width: spineWidthPx, height: SPINE_H,
        alignSelf: 'flex-end', borderRadius: '2px 2px 1px 1px',
        position: 'relative', flexShrink: 0, overflow: 'hidden',
        boxShadow: '4px 0 14px rgba(0,0,0,0.45), -1px 0 4px rgba(0,0,0,0.25), inset -3px 0 10px rgba(0,0,0,0.22)',
      }}
    >
      {/* 표지 — 전체 높이 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(160deg, ${coverColor} 0%, ${dark} 100%)`,
      }}>
        {/* 린넨 텍스처 오버레이 */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82%200.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay', pointerEvents: 'none',
        }} />

        {/* 공압(Blind Deboss) 엠블럼 */}
        <div style={{
          position: 'absolute', top: 12, left: '50%',
          transform: 'translateX(-50%)',
          filter: 'drop-shadow(0 1px 0 rgba(255,255,255,.18)) drop-shadow(0 -1px 1px rgba(0,0,0,.22))',
        }}>
          <svg
            width={Math.max(10, spineWidthPx * 0.44)}
            height={Math.max(10, spineWidthPx * 0.44)}
            viewBox="0 0 26 26" fill="none"
          >
            <ellipse cx="13" cy="5.5"  rx="2.6" ry="4"   fill="rgba(0,0,0,.12)" />
            <ellipse cx="7"  cy="9"    rx="2.6" ry="4"   fill="rgba(0,0,0,.12)" transform="rotate(35 7 9)" />
            <ellipse cx="19" cy="9"    rx="2.6" ry="4"   fill="rgba(0,0,0,.12)" transform="rotate(-35 19 9)" />
            <ellipse cx="13" cy="16.5" rx="5"   ry="4.2" fill="rgba(0,0,0,.12)" />
            <ellipse cx="13" cy="21.5" rx="1.8" ry="2.8" fill="rgba(0,0,0,.12)" />
          </svg>
        </div>

        {/* 세로 연도 텍스트 (폭이 36px 이상) */}
        {spineWidthPx >= 36 && (
          <div style={{
            position: 'absolute', top: '55%', left: '50%',
            transform: 'translate(-50%, -50%) rotate(-90deg)',
            fontSize: Math.max(6, Math.min(10, spineWidthPx * 0.20)),
            fontWeight: 700,
            color: 'transparent',
            textShadow: '0 1px 0 rgba(255,255,255,.20), 0 -1px 1px rgba(0,0,0,.18)',
            whiteSpace: 'nowrap', letterSpacing: '0.16em',
            fontFamily: 'Georgia, serif',
          }}>DURU {year}</div>
        )}
      </div>

      {/* 우측 모서리 음영 */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: Math.max(4, spineWidthPx * 0.13),
        background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.28))',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function SpineBookshelf({
  coverColor = '#A7AECB',
  diaryCount: initCount = 29,
  year       = 2026,
  material   = 'Rough_Linen',
  onCountChange,
}) {
  const [count, setCount] = useState(initCount);

  const { spineWidthMm, spineWidthPx } = useMemo(() => {
    const mm = parseFloat((count * 0.1 + 3.5).toFixed(1));
    const px = Math.round(24 + ((count - 10) / 90) * 64);
    return { spineWidthMm: mm, spineWidthPx: px };
  }, [count]);

  function handleCountChange(v) {
    setCount(v);
    onCountChange?.(v);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ══ 책꽂이 ══════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(180deg, #180E06 0%, #2A1A0A 60%, #201408 100%)',
        borderRadius: '16px 16px 0 0',
        padding: '24px 20px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 벽 나무결 */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            repeating-linear-gradient(
              180deg,
              transparent, transparent 36px,
              rgba(255,255,255,0.018) 36px, rgba(255,255,255,0.018) 37px
            ),
            repeating-linear-gradient(
              90deg,
              transparent, transparent 120px,
              rgba(0,0,0,0.06) 120px, rgba(0,0,0,0.06) 122px
            )
          `,
          pointerEvents: 'none',
        }} />

        {/* 앰비언트 빛 */}
        <div style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '80%', height: 60,
          background: 'radial-gradient(ellipse at top, rgba(255,240,200,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* 서적 열 */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4 }}>
          {LEFT_BOOKS.map((b, i)  => <DecoBook key={`L${i}`} {...b} />)}

          <DuruBook
            spineWidthPx={spineWidthPx}
            coverColor={coverColor}
            year={year}
          />

          {RIGHT_BOOKS.map((b, i) => <DecoBook key={`R${i}`} {...b} />)}
        </div>

        {/* 선반 판자 */}
        <div style={{
          height: 16,
          background: 'linear-gradient(180deg, #5A320E 0%, #3C2208 55%, #261604 100%)',
          marginTop: 0,
          position: 'relative',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 1.5,
            background: 'linear-gradient(to right, transparent 5%, rgba(255,255,255,0.14) 30%, rgba(255,255,255,0.14) 70%, transparent 95%)',
          }} />
          {/* 선반 앞 모서리 그림자 */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 5,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0))',
          }} />
        </div>
      </div>

      {/* ══ 정보 패널 ════════════════════════════════════════ */}
      <div style={{
        background: 'white',
        border: '1px solid #E8E4E0', borderTop: 'none',
        borderRadius: '0 0 16px 16px',
        padding: '20px 20px 22px',
      }}>

        {/* 책등 스펙 수치 */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 18 }}>
          <span style={{
            fontSize: 32, fontWeight: 900,
            color: '#1E1C18', fontFamily: 'Georgia, serif',
            letterSpacing: '-0.02em',
            transition: 'all 0.3s ease',
          }}>
            {spineWidthMm}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#9A9490' }}>mm 책등</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#7090AC',
              background: 'rgba(90,120,152,0.1)',
              borderRadius: 8, padding: '4px 10px',
            }}>
              {count}편 수록
            </div>
          </div>
        </div>

        {/* 슬라이더 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9A9490', letterSpacing: '0.07em' }}>
              일기 수
            </span>
            <span style={{ fontSize: 10, color: '#B0A8A0' }}>10 – 100편</span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="range"
              min={10} max={100} value={count}
              onChange={e => handleCountChange(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: coverColor,
                height: 4,
                cursor: 'pointer',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {[
              ['10편', '4.5mm'],
              ['50편', '8.5mm'],
              ['100편', '13.5mm'],
            ].map(([a, b]) => (
              <div key={a} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#C0BAB4', fontWeight: 600 }}>{a}</div>
                <div style={{ fontSize: 9, color: '#D8D2CC' }}>{b}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 에디션 정보 */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9A9490', letterSpacing: '0.07em', marginBottom: 10 }}>
            {year} 컬렉션
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* 책등 컬러 스와치 */}
            <div style={{
              width: 28, height: 40, borderRadius: '2px 5px 5px 2px',
              position: 'relative', overflow: 'hidden', flexShrink: 0,
              background: `linear-gradient(160deg, ${coverColor}, ${darken(coverColor, 22)})`,
              boxShadow: '0 2px 8px rgba(0,0,0,.18)',
            }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'rgba(0,0,0,.22)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3A3430', fontFamily: 'Georgia,serif', letterSpacing: '.02em' }}>
                DURU {year}
              </div>
              <div style={{ fontSize: 9.5, color: '#9A9490', letterSpacing: '.07em', textTransform: 'uppercase', marginTop: 2 }}>
                {material.replace('_', '\u00A0')}
              </div>
            </div>
          </div>
        </div>

        {/* 제작 스펙 요약 */}
        <div style={{
          marginTop: 18,
          padding: '12px 14px',
          background: '#F9F8F6',
          borderRadius: 12,
          border: '1px solid #ECEAE6',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px 16px',
        }}>
          {[
            ['용지',   '미색 모조지 120g'],
            ['판형',   'A5 (148 × 210mm)'],
            ['제본',   '하드커버 양장'],
            ['책등',   `${spineWidthMm}mm`],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#B0A8A0', letterSpacing: '0.06em', marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#3A3430' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
