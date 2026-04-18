'use client';

import { useState, useCallback } from 'react';
import IssueDetailPanel, { IssueBadge } from './IssueDetailPanel';

// ── 샘플 데이터 ──────────────────────────────────────────────────
const EMOTIONS = [
  { name: '우울',   color: '#5878A0', dot: '#7898C0', count: 8 },
  { name: '외로움', color: '#7898A0', dot: '#9AB0B8', count: 7 },
  { name: '평온',   color: '#6898B8', dot: '#88B0D0', count: 6 },
  { name: '기쁨',   color: '#C8A040', dot: '#E0BC60', count: 5 },
  { name: '설렘',   color: '#B87888', dot: '#D09090', count: 3 },
];

const ENTRIES = [
  {
    date: '2026년 3월 12일',
    emotion: '설렘',
    emotionColor: '#B87888',
    emotionSymbol: '✺',
    title: '퇴근길에 벚꽃이 피어있었다',
    body: `퇴근하면서 지하철역 앞 벚꽃길을 지나쳤다. 올해도 어김없이 피었구나 싶었는데, 왠지 모르게 가슴이 찡했다.\n\n작년 이맘때 같이 보던 사람이 생각나서인지, 아니면 그냥 계절이 바뀌는 게 실감 나서인지 잘 모르겠다. 꽃이 예쁠수록 더 외로운 기분이 드는 건 나만의 감정인가.\n\n역 출구를 나서며 잠깐 발걸음을 멈춰 하늘을 올려다봤다. 분홍빛이 가득한 가지 사이로 파란 하늘이 보였다.`,
    pg: [5, 6],
  },
  {
    date: '2026년 1월 3일',
    emotion: '평온',
    emotionColor: '#6898B8',
    emotionSymbol: '◈',
    title: '새해 첫 아침, 창밖에 눈이 내렸다',
    body: `눈을 떴을 때 방 안이 유독 밝았다. 창문을 보니 밤새 눈이 내려 세상이 하얗게 덮여 있었다.\n\n오늘은 아무 계획도 없는 날이다. 커피를 내리고 창가에 앉아 눈을 바라봤다. 이상하게 마음이 차분해지는 아침이었다.\n\n새해에는 조금 더 나에게 솔직한 하루를 살고 싶다는 생각을 했다. 거창한 다짐보다는, 오늘처럼 조용히 시작하는 하루들이 모여 한 해가 되면 좋겠다.`,
    pg: [9, 10],
  },
];

// ──────────────────────────────────────────────────────────────
// 에디토리얼 상수
// ──────────────────────────────────────────────────────────────
const EDITORIAL = {
  lineHeight: 1.75,        // 175% — 미색 모조지 120g 본문 행간
  paragraphSpacingPx: 16,  // 12pt = 16px @ 96dpi
};

// ──────────────────────────────────────────────────────────────
// 드롭캡 프리셋 (3단계)
// ──────────────────────────────────────────────────────────────
const DROP_CAP_PRESETS = {
  small: {
    label:      '소형',
    fontSize:   24,
    lineHeight: 0.9,
    margin:     '1px 4px 0 0',
    desc:       '여백 안정',
  },
  medium: {
    label:      '중형',
    fontSize:   36,
    lineHeight: 0.84,
    margin:     '3px 5px 0 0',
    desc:       '기본',
  },
  large: {
    label:      '대형',
    fontSize:   52,
    lineHeight: 0.82,
    margin:     '4px 6px 0 0',
    desc:       '강조',
  },
};

// ── 드롭캡 본문 컴포넌트 ─────────────────────────────────────
function BodyText({ text, dropCapColor, dropCapPreset = 'medium' }) {
  const preset = DROP_CAP_PRESETS[dropCapPreset] ?? DROP_CAP_PRESETS.medium;
  const paras = text.split('\n\n');
  const firstPara = paras[0];
  const restParas = paras.slice(1);

  return (
    <div style={{
      fontSize: 11,
      lineHeight: EDITORIAL.lineHeight,
      color: '#4A4540',
      letterSpacing: '0.022em',
      textAlign: 'justify',
    }}>
      {/* 첫 문단 — Drop Cap */}
      <span>
        <span style={{
          float: 'left',
          fontSize: preset.fontSize,
          lineHeight: preset.lineHeight,
          fontFamily: 'Georgia, serif',
          fontWeight: 700,
          color: dropCapColor || '#8FA8C0',
          margin: preset.margin,
          transition: 'font-size 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          {firstPara[0]}
        </span>
        {firstPara.slice(1)}
      </span>
      {/* 이후 문단 — 12pt 간격 */}
      {restParas.map((para, i) => (
        <p key={i} style={{ margin: `${EDITORIAL.paragraphSpacingPx}px 0 0 0`, textAlign: 'justify' }}>
          {para}
        </p>
      ))}
    </div>
  );
}

// ── 페이지 번호 ────────────────────────────────────────────────
function PageNum({ n, align = 'left' }) {
  return (
    <div style={{
      position: 'absolute', bottom: 14,
      [align]: 14, fontSize: 9, color: '#C0B8B0',
      fontFamily: 'Georgia, serif',
    }}>{n}</div>
  );
}

// ── 제본 선 ────────────────────────────────────────────────────
function Gutter() {
  return (
    <div style={{
      width: 1,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.12) 30%, rgba(0,0,0,0.12) 70%, rgba(0,0,0,0.02))',
      flexShrink: 0, zIndex: 10,
    }} />
  );
}

// ── 스프레드 렌더러 ────────────────────────────────────────────
function Spread({ index, title, coverColor, dropCapPreset = 'medium' }) {
  const PAGE  = { background: '#F9F8F6', position: 'relative', flex: 1, overflow: 'hidden' };
  const LABEL = { fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: '#C0B8B0', marginBottom: 10 };
  const PAD   = { padding: '18px 16px 28px' };

  // ── 스프레드 0: 표제지 ──
  if (index === 0) return (
    <>
      <div style={PAGE}>
        <div style={{ ...PAD, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 8, color: '#C0B8B0', letterSpacing: '0.08em' }}>두루 출판</div>
        </div>
        <PageNum n={1} align="left" />
      </div>
      <Gutter />
      <div style={PAGE}>
        <div style={PAD}>
          <div style={LABEL}>DURU DIARY</div>
          <div style={{
            fontSize: 20, fontWeight: 900, color: '#1E1C18',
            lineHeight: 1.3, marginBottom: 12, fontFamily: 'Georgia, serif',
          }}>
            {title.split(' ').slice(0, Math.ceil(title.split(' ').length / 2)).join(' ')}
            {title.split(' ').length > 1 && (
              <><br />{title.split(' ').slice(Math.ceil(title.split(' ').length / 2)).join(' ')}</>
            )}
          </div>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', width: '55%', marginBottom: 12 }} />
          <div style={{ fontSize: 10, color: '#7A7470', lineHeight: EDITORIAL.lineHeight }}>
            수록 기간 · 2026년 전체<br />
            총 29편의 기록<br /><br />
            두루와 함께한<br />하루하루의 흔적
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 18, right: 16, opacity: 0.12 }}>
          <svg width="32" height="32" viewBox="0 0 26 26" fill="none">
            <ellipse cx="13" cy="5.5"  rx="2.6" ry="4"   fill="#1E1C18" />
            <ellipse cx="7"  cy="9"    rx="2.6" ry="4"   fill="#1E1C18" transform="rotate(35 7 9)" />
            <ellipse cx="19" cy="9"    rx="2.6" ry="4"   fill="#1E1C18" transform="rotate(-35 19 9)" />
            <ellipse cx="13" cy="16.5" rx="5"   ry="4.2" fill="#1E1C18" />
            <ellipse cx="13" cy="21.5" rx="1.8" ry="2.8" fill="#1E1C18" />
          </svg>
        </div>
        <PageNum n={2} align="right" />
      </div>
    </>
  );

  // ── 스프레드 1: 감정 여정 ──
  if (index === 1) {
    const max = EMOTIONS[0].count;
    return (
      <>
        <div style={PAGE}>
          <div style={PAD}>
            <div style={LABEL}>감정 여정</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1E1C18', lineHeight: 1.3, marginBottom: 18, fontFamily: 'Georgia, serif' }}>
              2026년,<br />나의 감정들
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {EMOTIONS.map(em => (
                <div key={em.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: em.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#1E1C18', width: 40, flexShrink: 0 }}>{em.name}</span>
                  <div style={{ flex: 1, height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(em.count / max) * 100}%`, background: em.dot, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#C0B8B0', width: 14, textAlign: 'right', flexShrink: 0 }}>{em.count}</span>
                </div>
              ))}
            </div>
          </div>
          <PageNum n={3} align="left" />
        </div>
        <Gutter />
        <div style={PAGE}>
          <div style={PAD}>
            <div style={LABEL}>통계</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[['29', '편', '총 일기 수'], ['5', '가지', '기록된 감정'], ['우울', '', '가장 많은 감정']].map(([v, unit, label]) => (
                <div key={label}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#1E1C18', lineHeight: 1 }}>
                    {v}<span style={{ fontSize: 13, fontWeight: 600, color: '#9A9490', marginLeft: 4 }}>{unit}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#9A9490', marginTop: 3 }}>{label}</div>
                  <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', marginTop: 14 }} />
                </div>
              ))}
            </div>
          </div>
          <PageNum n={4} align="right" />
        </div>
      </>
    );
  }

  // ── 스프레드 2,3: 일기 ──
  const entry = ENTRIES[index - 2];
  if (!entry) return null;

  const bodyMid   = Math.floor(entry.body.length * 0.48);
  const bodyLeft  = entry.body.slice(0, bodyMid);
  const bodyRight = entry.body.slice(bodyMid);
  const rightParas = bodyRight.split('\n\n');

  return (
    <>
      <div style={PAGE}>
        <div style={PAD}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#C0B8B0', marginBottom: 8 }}>{entry.date}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            <span style={{ color: entry.emotionColor, fontSize: 11 }}>{entry.emotionSymbol}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: entry.emotionColor }}>{entry.emotion}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#1E1C18', lineHeight: 1.35, marginBottom: 10, fontFamily: 'Georgia, serif', wordBreak: 'keep-all' }}>
            {entry.title}
          </div>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', marginBottom: 12 }} />
          <BodyText
            text={bodyLeft}
            dropCapColor={entry.emotionColor}
            dropCapPreset={dropCapPreset}
          />
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 14, fontSize: 12, color: entry.emotionColor }}>{entry.emotionSymbol}</div>
        <PageNum n={entry.pg[0]} align="left" />
      </div>
      <Gutter />
      <div style={PAGE}>
        <div style={PAD}>
          <div style={{
            fontSize: 11, lineHeight: EDITORIAL.lineHeight,
            color: '#4A4540', letterSpacing: '0.022em', textAlign: 'justify',
          }}>
            {rightParas.map((para, i) => (
              <p key={i} style={{ margin: i === 0 ? '0' : `${EDITORIAL.paragraphSpacingPx}px 0 0 0` }}>
                {para}
              </p>
            ))}
          </div>
        </div>
        <PageNum n={entry.pg[1]} align="right" />
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// 썸네일 (Flat 모드)
// ══════════════════════════════════════════════════════════════
const SPREAD_LABELS = ['표제지', '감정 여정', '일기 1', '일기 2'];
const TOTAL = SPREAD_LABELS.length;

function SpreadThumbnail({ index, title, coverColor, reviewed, dropCapPreset, onPress, onToggleReview }) {
  const SCALE  = 0.33;
  const FULL_W = 600;
  const FULL_H = 400;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        onClick={onPress}
        style={{
          width: FULL_W * SCALE, height: FULL_H * SCALE,
          position: 'relative', overflow: 'hidden',
          borderRadius: 8, cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
          border: reviewed ? '2px solid #5A7898' : '2px solid transparent',
          transition: 'border-color 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: FULL_W, height: FULL_H,
          display: 'flex',
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}>
          <Spread index={index} title={title} coverColor={coverColor} dropCapPreset={dropCapPreset} />
        </div>
        {reviewed && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(90,120,152,0.15)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
            padding: 6, pointerEvents: 'none',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              background: '#5A7898',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#7A7470' }}>{SPREAD_LABELS[index]}</span>
        <button
          onClick={e => { e.stopPropagation(); onToggleReview(); }}
          style={{
            background: reviewed ? '#5A7898' : 'rgba(0,0,0,0.07)',
            border: 'none', borderRadius: 6, padding: '3px 7px',
            fontSize: 9, fontWeight: 700,
            color: reviewed ? 'white' : '#9A9490',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
          }}
        >
          {reviewed ? '✓ 확인됨' : '확인'}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 줌 뷰 (클릭 확대) — 이슈 배지 + 패널 통합
// ══════════════════════════════════════════════════════════════
function ZoomView({ index, title, coverColor, reviewed, dropCapPreset, onClose, onToggleReview }) {
  const [showIssues, setShowIssues] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* 상단 바 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: '#7A7470', display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'inherit', padding: '4px 0',
          }}
        >← 목록으로</button>

        <span style={{ fontSize: 11, fontWeight: 700, color: '#9A9490' }}>
          {SPREAD_LABELS[index]}
        </span>

        {/* 이슈 배지 */}
        <IssueBadge spreadIndex={index} onClick={() => setShowIssues(true)} />
      </div>

      {/* 검수 버튼 (하단 고정) */}
      <div style={{ position: 'absolute', bottom: 20, right: 16, zIndex: 20 }}>
        <button
          onClick={onToggleReview}
          style={{
            background: reviewed
              ? 'linear-gradient(135deg, #5A7898, #486888)'
              : 'rgba(255,255,255,0.92)',
            border: reviewed ? 'none' : '1.5px solid #D0CAC4',
            borderRadius: 12, padding: '8px 16px',
            fontSize: 11, fontWeight: 700,
            color: reviewed ? 'white' : '#7A7470',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
            transition: 'all 0.2s',
          }}
        >
          {reviewed ? '✓ 검수 완료' : '검수 확인'}
        </button>
      </div>

      {/* 스프레드 전체 뷰 */}
      <div style={{ flex: 1, padding: '0 12px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'flex', flex: 1,
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 6px 32px rgba(0,0,0,0.16)',
          transform: 'rotateX(2deg)',
          transformStyle: 'preserve-3d',
          perspective: 800,
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', right: '50%', top: 0, bottom: 0, width: 24, background: 'linear-gradient(to left, rgba(0,0,0,0.08), transparent)', zIndex: 5, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '50%',  top: 0, bottom: 0, width: 24, background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)', zIndex: 5, pointerEvents: 'none' }} />
          <Spread index={index} title={title} coverColor={coverColor} dropCapPreset={dropCapPreset} />
        </div>
      </div>

      {/* 이슈 패널 (바텀 시트) */}
      {showIssues && (
        <IssueDetailPanel
          spreadIndex={index}
          onClose={() => setShowIssues(false)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 드롭캡 프리셋 선택 UI
// ══════════════════════════════════════════════════════════════
function DropCapSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9A9490', letterSpacing: '0.07em' }}>
        드롭캡 크기
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {Object.entries(DROP_CAP_PRESETS).map(([key, p]) => {
          const active = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`dropcap-preset-btn${active ? ' active' : ''}`}
              style={{
                flex: 1, padding: '9px 4px',
                borderRadius: 11,
                border: `2px solid ${active ? '#5A7898' : '#E8E4E0'}`,
                background: active ? 'rgba(90,120,152,0.08)' : 'white',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                fontFamily: 'inherit',
              }}
            >
              {/* 미리보기 글자 */}
              <span style={{
                fontFamily: 'Georgia, serif',
                fontWeight: 700,
                color: active ? '#5A7898' : '#B87888',
                fontSize: p.fontSize * 0.38,
                lineHeight: 1,
                transition: 'font-size 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>퇴</span>
              <span style={{
                fontSize: 9, fontWeight: 700,
                color: active ? '#5A7898' : '#9A9490',
              }}>{p.label}</span>
              <span style={{ fontSize: 8, color: '#C0BAB4' }}>{p.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function OpenBookViewer({ title = '나의 2026년', coverColor = '#8FA8C0' }) {
  // 스프레드 내비
  const [spread,    setSpread]    = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dir,       setDir]       = useState(null);

  // 뷰 모드
  const [viewMode,     setViewMode]     = useState('spread'); // 'spread' | 'flat'
  const [zoomedSpread, setZoomedSpread] = useState(null);

  // 검수 상태
  const [reviewed, setReviewed] = useState(new Set());

  // 드롭캡 프리셋
  const [dropCapPreset, setDropCapPreset] = useState('medium');

  function go(delta) {
    if (animating) return;
    const next = spread + delta;
    if (next < 0 || next >= TOTAL) return;
    setDir(delta > 0 ? 'fwd' : 'bwd');
    setAnimating(true);
    setTimeout(() => {
      setSpread(next);
      setAnimating(false);
      setDir(null);
    }, 320);
  }

  const toggleReview = useCallback((idx) => {
    setReviewed(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }, []);

  const reviewCount = reviewed.size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#F4F4F2', minHeight: '100%' }}>

      {/* ── 상단: 뷰 모드 토글 + 검수 카운터 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px 0',
      }}>
        <div style={{
          display: 'flex', gap: 2,
          background: 'rgba(0,0,0,0.07)', borderRadius: 10, padding: 3,
        }}>
          {[
            { key: 'spread', label: '📖 보기' },
            { key: 'flat',   label: '⊞ 전체' },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => { setViewMode(m.key); setZoomedSpread(null); }}
              style={{
                padding: '5px 10px', borderRadius: 7, border: 'none',
                background: viewMode === m.key ? 'white' : 'transparent',
                color: viewMode === m.key ? '#1E1C18' : '#9A9490',
                fontWeight: viewMode === m.key ? 700 : 500,
                fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: viewMode === m.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.18s',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: reviewCount === TOTAL ? 'rgba(90,120,152,0.12)' : 'rgba(0,0,0,0.05)',
          borderRadius: 10, padding: '5px 10px',
          transition: 'background 0.3s',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: reviewCount === TOTAL ? '#5A7898' : '#C0C0B8',
            transition: 'background 0.3s',
          }} />
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: reviewCount === TOTAL ? '#5A7898' : '#9A9490',
          }}>
            {reviewCount} / {TOTAL} 검수
          </span>
        </div>
      </div>

      {/* ══════════ SPREAD 모드 ══════════════════════════════ */}
      {viewMode === 'spread' && (
        <div style={{ padding: '10px 16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* 스프레드 레이블 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 640, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9A9490', letterSpacing: '0.07em' }}>
              {SPREAD_LABELS[spread]}
            </span>
            <span style={{ fontSize: 11, color: '#9A9490' }}>{spread + 1} / {TOTAL}</span>
          </div>

          {/* 책 스프레드 */}
          <div style={{ width: '100%', maxWidth: 640, perspective: 1200, perspectiveOrigin: '50% 38%', position: 'relative' }}>
            <div style={{
              display: 'flex', height: 390,
              borderRadius: 10, overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)',
              transform: 'rotateX(4deg)',
              transformStyle: 'preserve-3d',
              opacity: animating ? 0.6 : 1,
              transition: 'opacity 0.3s ease',
            }}>
              <div style={{ position: 'absolute', right: '50%', top: 0, bottom: 0, width: 28, background: 'linear-gradient(to left, rgba(0,0,0,0.09), transparent)', zIndex: 5, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: '50%',  top: 0, bottom: 0, width: 28, background: 'linear-gradient(to right, rgba(0,0,0,0.09), transparent)', zIndex: 5, pointerEvents: 'none' }} />
              <Spread
                index={spread}
                title={title}
                coverColor={coverColor}
                dropCapPreset={dropCapPreset}
              />
            </div>
            <div style={{
              position: 'absolute', bottom: -12, left: '10%', right: '10%',
              height: 20, borderRadius: '50%',
              background: 'rgba(0,0,0,0.12)', filter: 'blur(10px)', zIndex: -1,
            }} />
          </div>

          {/* 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 640, marginTop: 14, padding: '0 4px' }}>
            <button
              onClick={() => go(-1)} disabled={spread === 0}
              style={{
                background: 'none', border: 'none',
                cursor: spread === 0 ? 'default' : 'pointer',
                opacity: spread === 0 ? 0.25 : 1,
                fontSize: 11, color: '#7A7470',
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: 'inherit', padding: '6px 2px',
              }}
            >← 이전 페이지</button>

            <div style={{ display: 'flex', gap: 5 }}>
              {Array.from({ length: TOTAL }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { if (!animating) { setDir(i > spread ? 'fwd' : 'bwd'); setSpread(i); } }}
                  style={{
                    width: i === spread ? 16 : 6, height: 4, borderRadius: 2,
                    background: reviewed.has(i) ? '#5A7898' : (i === spread ? '#8AA8C0' : '#D0CBC6'),
                    border: 'none', padding: 0, cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => go(1)} disabled={spread === TOTAL - 1}
              style={{
                background: 'none', border: 'none',
                cursor: spread === TOTAL - 1 ? 'default' : 'pointer',
                opacity: spread === TOTAL - 1 ? 0.25 : 1,
                fontSize: 11, color: '#7A7470',
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: 'inherit', padding: '6px 2px',
              }}
            >다음 페이지 →</button>
          </div>

          {/* 드롭캡 프리셋 선택기 */}
          <div style={{
            width: '100%', maxWidth: 640, marginTop: 18,
            background: 'white', borderRadius: 14,
            padding: '14px 16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          }}>
            <DropCapSelector value={dropCapPreset} onChange={setDropCapPreset} />
          </div>
        </div>
      )}

      {/* ══════════ FLAT 모드 — 줌 뷰 ════════════════════════ */}
      {viewMode === 'flat' && zoomedSpread !== null && (
        <div style={{ flex: 1 }}>
          <ZoomView
            index={zoomedSpread}
            title={title}
            coverColor={coverColor}
            reviewed={reviewed.has(zoomedSpread)}
            dropCapPreset={dropCapPreset}
            onClose={() => setZoomedSpread(null)}
            onToggleReview={() => toggleReview(zoomedSpread)}
          />
        </div>
      )}

      {/* ══════════ FLAT 모드 — 썸네일 그리드 ═══════════════ */}
      {viewMode === 'flat' && zoomedSpread === null && (
        <div style={{ padding: '16px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9A9490', letterSpacing: '0.07em', marginBottom: 14 }}>
            전체 스프레드 — 클릭해서 확대 · 이슈 배지로 오류 확인
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 12px' }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <SpreadThumbnail
                key={i}
                index={i}
                title={title}
                coverColor={coverColor}
                reviewed={reviewed.has(i)}
                dropCapPreset={dropCapPreset}
                onPress={() => setZoomedSpread(i)}
                onToggleReview={() => toggleReview(i)}
              />
            ))}
          </div>

          {/* 검수 완료 배너 */}
          {reviewCount === TOTAL && (
            <div style={{
              marginTop: 20, padding: '13px 16px',
              background: 'rgba(90,120,152,0.1)',
              border: '1.5px solid rgba(90,120,152,0.25)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#3D6080' }}>전체 페이지 검수 완료!</div>
                <div style={{ fontSize: 10, color: '#7090AC', marginTop: 2 }}>이제 예약 신청이 가능해요.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
