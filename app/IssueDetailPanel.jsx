'use client';

/**
 * IssueDetailPanel — 인쇄 검수 이슈 배지 + 편집 패널
 *
 * 기능:
 *  - 스프레드별 이슈 데이터 (해상도, 텍스트 넘침, 드롭캡 등)
 *  - 이슈 배지 클릭 → 바텀 시트로 이슈 목록 표시
 *  - '수정하기' 버튼 → 이슈 유형별 인라인 편집 패널
 *    - TEXT_OVERFLOW: 글자 수 슬라이더
 *    - DROP_CAP: 3단계 프리셋 선택
 *    - RESOLUTION: 고해상도 교체 안내
 *  - 해결된 이슈는 체크 표시로 전환
 */

import { useState } from 'react';

// ── 스프레드별 이슈 정의 ─────────────────────────────────────────
export const SPREAD_ISSUES = {
  0: [], // 표제지 — 이슈 없음
  1: [
    {
      id: 'I1-1',
      type:     'TEXT_OVERFLOW',
      severity: 'warn',
      page:     3,
      title:    '텍스트 영역 초과',
      desc:     '감정 바 레이블이 하단 여백(12mm)을 4px 침범합니다.',
      fixable:  true,
      fixType:  'truncate',
    },
  ],
  2: [
    {
      id:       'I2-1',
      type:     'RESOLUTION',
      severity: 'error',
      page:     5,
      title:    '이미지 해상도 부족',
      desc:     '첨부 이미지가 72dpi입니다. 인쇄 권장 해상도는 300dpi 이상입니다.',
      fixable:  false,
      fixType:  'info',
    },
    {
      id:       'I2-2',
      type:     'DROP_CAP',
      severity: 'warn',
      page:     5,
      title:    '드롭캡 위치 충돌',
      desc:     '드롭캡(대형)이 내부 제본 여백(15mm)과 4px 겹칩니다.',
      fixable:  true,
      fixType:  'dropcap',
    },
  ],
  3: [], // 일기 2 — 이슈 없음
};

// ── 시각 설정 ────────────────────────────────────────────────────
const SEVERITY = {
  error: { color: '#DC5050', bg: 'rgba(220,80,80,0.07)',  label: '인쇄 오류' },
  warn:  { color: '#D08040', bg: 'rgba(208,128,64,0.07)', label: '경고'     },
};

const TYPE_ICON = {
  TEXT_OVERFLOW: '↕',
  RESOLUTION:    '⬡',
  DROP_CAP:      'T',
};

const DROPCAP_PRESETS = [
  { key: 'small',  label: '소형', px: 24 },
  { key: 'medium', label: '중형', px: 36 },
  { key: 'large',  label: '대형', px: 52 },
];

// ── 이슈 카드 ────────────────────────────────────────────────────
function IssueCard({ issue, onFix }) {
  const cfg = SEVERITY[issue.severity];
  return (
    <div style={{
      background: cfg.bg,
      border: `1.5px solid ${cfg.color}28`,
      borderRadius: 14,
      padding: '13px 14px',
      display: 'flex',
      gap: 11,
    }}>
      {/* 유형 아이콘 */}
      <div style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        background: cfg.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: 12, fontWeight: 900,
      }}>
        {TYPE_ICON[issue.type] || '!'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{issue.title}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: 'white',
            background: cfg.color,
            borderRadius: 5, padding: '1px 6px',
          }}>p.{issue.page}</span>
        </div>
        <div style={{ fontSize: 10, color: '#6A6460', lineHeight: 1.55, marginBottom: 10 }}>
          {issue.desc}
        </div>
        {issue.fixable ? (
          <button
            onClick={() => onFix(issue)}
            style={{
              background: cfg.color, color: 'white',
              border: 'none', borderRadius: 9,
              padding: '6px 13px',
              fontSize: 10, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            수정하기 →
          </button>
        ) : (
          <div style={{
            fontSize: 10, color: '#9A9490',
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(0,0,0,0.04)', borderRadius: 8,
            padding: '6px 10px', width: 'fit-content',
          }}>
            <span style={{ fontSize: 13 }}>ℹ</span>
            원본 파일 교체 필요 · 300dpi 이상
          </div>
        )}
      </div>
    </div>
  );
}

// ── 인라인 수정 패널 ──────────────────────────────────────────────
function FixPanel({ issue, onBack, onApply }) {
  const [truncLen,       setTruncLen]       = useState(140);
  const [dropCapPreset,  setDropCapPreset]  = useState('medium');

  const presetPx = DROPCAP_PRESETS.find(p => p.key === dropCapPreset)?.px ?? 36;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'white',
      borderRadius: 'inherit',
      padding: '16px',
      display: 'flex', flexDirection: 'column',
      zIndex: 20,
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: '#7A7470', fontFamily: 'inherit',
            padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >← 뒤로</button>
        <span style={{
          flex: 1, textAlign: 'center',
          fontSize: 12, fontWeight: 800, color: '#1E1C18',
        }}>
          {issue.title} 수정
        </span>
        <div style={{ width: 48 }} />
      </div>

      {/* ── TEXT_OVERFLOW 수정 ── */}
      {issue.fixType === 'truncate' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9A9490', letterSpacing: '0.07em' }}>
            텍스트 최대 길이 조정
          </div>
          {/* 미리보기 */}
          <div style={{
            background: '#F9F8F6', borderRadius: 12, padding: 14,
            border: '1.5px solid #E8E4E0',
            fontSize: 10, lineHeight: 1.75, color: '#4A4540',
            position: 'relative', overflow: 'hidden',
          }}>
            <span>퇴근하면서 지하철역 앞 벚꽃길을 지나쳤다. 올해도 어김없이 피었구나 싶었는데, 왠지 모르게 가슴이 찡했다. 작년 이맘때 같이 보던 사람이 생각나서인지…</span>
            <span style={{ color: '#D08040', fontWeight: 700 }}>
              {' '}[+{Math.max(0, 220 - truncLen)}자 초과]
            </span>
            {truncLen < 180 && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 20,
                background: 'linear-gradient(to top, rgba(208,128,64,0.12), transparent)',
                borderTop: '1px dashed rgba(208,128,64,0.45)',
                display: 'flex', alignItems: 'center', padding: '0 10px',
                fontSize: 9, color: '#D08040', fontWeight: 700,
              }}>
                ↕ {truncLen}자에서 줄 바꿈
              </div>
            )}
          </div>
          {/* 슬라이더 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#9A9490', letterSpacing: '0.07em' }}>
                최대 글자 수
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#1E1C18' }}>{truncLen}자</span>
            </div>
            <input
              type="range" min={80} max={220} value={truncLen}
              onChange={e => setTruncLen(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#D08040' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 9, color: '#C0BAB4' }}>80자 (압축)</span>
              <span style={{ fontSize: 9, color: '#C0BAB4' }}>220자 (풀 텍스트)</span>
            </div>
          </div>
        </div>
      )}

      {/* ── DROP_CAP 수정 ── */}
      {issue.fixType === 'dropcap' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9A9490', letterSpacing: '0.07em' }}>
            드롭캡 크기 프리셋 선택
          </div>
          {/* 3단계 프리셋 */}
          <div style={{ display: 'flex', gap: 8 }}>
            {DROPCAP_PRESETS.map(p => {
              const active = dropCapPreset === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setDropCapPreset(p.key)}
                  style={{
                    flex: 1, padding: '12px 6px',
                    borderRadius: 12,
                    border: `2px solid ${active ? '#5A7898' : '#E8E4E0'}`,
                    background: active ? 'rgba(90,120,152,0.08)' : 'white',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transition: 'all 0.18s',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{
                    fontFamily: 'Georgia, serif',
                    fontWeight: 700, color: '#B87888',
                    fontSize: p.px * 0.4, lineHeight: 1,
                  }}>퇴</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: active ? '#5A7898' : '#9A9490',
                  }}>{p.label}</span>
                  <span style={{ fontSize: 8, color: '#B0A8A0' }}>{p.px}px</span>
                </button>
              );
            })}
          </div>
          {/* 실시간 미리보기 */}
          <div style={{
            background: '#F9F8F6', borderRadius: 12, padding: 14,
            border: '1.5px solid #E8E4E0',
          }}>
            <div style={{ fontSize: 10, lineHeight: 1.75, color: '#4A4540', overflow: 'hidden' }}>
              <span style={{
                float: 'left',
                fontFamily: 'Georgia, serif',
                fontWeight: 700,
                color: '#B87888',
                fontSize: presetPx * 0.65,
                lineHeight: 0.85,
                margin: '2px 5px 0 0',
                transition: 'font-size 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>퇴</span>
              근하면서 지하철역 앞 벚꽃길을 지나쳤다. 올해도 어김없이 피었구나 싶었는데, 왠지 모르게 가슴이 찡했다.
            </div>
            <div style={{ clear: 'both', marginTop: 10, display: 'flex', alignItems: 'center', gap: 5, fontSize: 9 }}>
              {dropCapPreset === 'small' ? (
                <><span style={{ color: '#5A9878', fontSize: 12 }}>✓</span><span style={{ color: '#5A9878', fontWeight: 700 }}>제본 여백 충돌 해소</span></>
              ) : (
                <><span style={{ color: '#D08040' }}>▲</span><span style={{ color: '#D08040' }}>여백까지 {dropCapPreset === 'medium' ? '4px' : '12px'} 초과</span></>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 적용 버튼 */}
      <button
        onClick={() => onApply(
          issue.id,
          issue.fixType === 'dropcap' ? { preset: dropCapPreset } : { maxLen: truncLen },
        )}
        style={{
          marginTop: 16,
          background: 'linear-gradient(135deg, #5A7898 0%, #486888 100%)',
          color: 'white', border: 'none', borderRadius: 13,
          padding: '13px', fontSize: 12, fontWeight: 800,
          cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em',
          boxShadow: '0 4px 14px rgba(90,120,152,0.35)',
        }}
      >
        수정 적용 ✓
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인 이슈 패널 (바텀 시트)
// ══════════════════════════════════════════════════════════════
export default function IssueDetailPanel({ spreadIndex, onClose }) {
  const allIssues = SPREAD_ISSUES[spreadIndex] ?? [];
  const [fixedIds,     setFixedIds]     = useState(new Set());
  const [activeIssue,  setActiveIssue]  = useState(null);

  const pending  = allIssues.filter(i => !fixedIds.has(i.id));
  const allFixed = allIssues.length > 0 && pending.length === 0;

  function handleApply(id) {
    setFixedIds(prev => new Set([...prev, id]));
    setActiveIssue(null);
  }

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(20,14,8,0.55)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'flex-end',
        zIndex: 60,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%',
        background: 'white',
        borderRadius: '22px 22px 0 0',
        maxHeight: '80%',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
      }}>
        {/* 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '11px 0 0' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: '#E0DAD4' }} />
        </div>

        {/* 헤더 */}
        <div style={{
          padding: '12px 18px 14px',
          borderBottom: '1px solid #F0EBE6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#1E1C18' }}>
              {allFixed ? '✅ 모든 이슈 해결됨' : `이슈 ${pending.length}건`}
            </span>
            {!allFixed && allIssues.some(i => i.severity === 'error' && !fixedIds.has(i.id)) && (
              <span style={{
                fontSize: 9, fontWeight: 700,
                background: '#DC5050', color: 'white',
                borderRadius: 6, padding: '2px 7px',
              }}>인쇄 불가</span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 10,
              background: 'rgba(0,0,0,0.06)',
              border: 'none', cursor: 'pointer',
              fontSize: 14, color: '#7A7470',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* 이슈 목록 */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '14px 16px 24px',
          display: 'flex', flexDirection: 'column', gap: 10,
          position: 'relative',
        }}>
          {allFixed ? (
            <div style={{ textAlign: 'center', padding: '28px 0 12px' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1E1C18', marginBottom: 6 }}>
                인쇄 검수 통과!
              </div>
              <div style={{ fontSize: 11, color: '#9A9490', lineHeight: 1.6 }}>
                모든 이슈가 해결됐어요.<br />이제 예약 신청이 가능합니다.
              </div>
            </div>
          ) : (
            <>
              {pending.map(issue => (
                <IssueCard key={issue.id} issue={issue} onFix={setActiveIssue} />
              ))}
              {fixedIds.size > 0 && (
                <div style={{
                  textAlign: 'center', fontSize: 10,
                  color: '#9A9490', paddingTop: 4,
                }}>
                  + {fixedIds.size}건 해결됨
                </div>
              )}
            </>
          )}

          {/* 인라인 수정 패널 */}
          {activeIssue && (
            <FixPanel
              issue={activeIssue}
              onBack={() => setActiveIssue(null)}
              onApply={handleApply}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── 이슈 배지 (ZoomView에서 import하여 사용) ──────────────────────
export function IssueBadge({ spreadIndex, onClick }) {
  const issues  = SPREAD_ISSUES[spreadIndex] ?? [];
  const errors  = issues.filter(i => i.severity === 'error');
  const warns   = issues.filter(i => i.severity === 'warn');
  const hasErr  = errors.length > 0;
  const total   = issues.length;

  if (total === 0) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: 'rgba(90,152,100,0.1)',
      borderRadius: 9, padding: '4px 10px',
    }}>
      <span style={{ fontSize: 11, color: '#5A9870' }}>✓</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#5A9870' }}>이슈 없음</span>
    </div>
  );

  return (
    <button
      onClick={onClick}
      className={hasErr ? 'issue-badge-pulse' : ''}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: hasErr ? 'rgba(220,80,80,0.1)' : 'rgba(208,128,64,0.1)',
        border: `1.5px solid ${hasErr ? 'rgba(220,80,80,0.3)' : 'rgba(208,128,64,0.3)'}`,
        borderRadius: 9, padding: '4px 10px',
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: 10, color: hasErr ? '#DC5050' : '#D08040' }}>
        {hasErr ? '●' : '▲'}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: hasErr ? '#DC5050' : '#D08040',
      }}>
        이슈 {total}건
      </span>
    </button>
  );
}
