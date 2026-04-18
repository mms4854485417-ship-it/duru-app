'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const BookMockup3D   = dynamic(() => import('../BookMockup3D'),   { ssr: false });
const OpenBookViewer = dynamic(() => import('../OpenBookViewer'), { ssr: false });
const SpineBookshelf = dynamic(() => import('../SpineBookshelf'), { ssr: false });

/* ── 설정 ── */
const CONFIG = {
  emailjs: {
    publicKey:  'YOUR_EMAILJS_PUBLIC_KEY',
    serviceId:  'YOUR_SERVICE_ID',
    templateId: 'YOUR_TEMPLATE_ID',
  },
  kakao: { jsKey: 'YOUR_KAKAO_JS_APP_KEY' },
  naver: { clientId: 'YOUR_NAVER_CLIENT_ID' },
  baseReservationCount: 143,
};

/* ══════════════════════════════════════════
   연도별 단일 에디션 디자인 시스템
   — 불변 요소: 판형(A5), 서체(Noto Serif KR), 로고 위치, 공압 가공
   — 가변 요소: Fabric_Texture(noise), Muted_Color(cover)
══════════════════════════════════════════ */
const YEARLY_THEMES = {
  2026: {
    year:       2026,
    material:   'Rough_Linen',   // 거친 린넨 — 높은 주파수 노이즈
    label:      'Muted Lavender',
    color:      '#A7AECB',       // 무채도 라벤더 (요구사항 명세)
    gradLight:  '#BCC2DA',
    gradDark:   '#9298B8',
    thread:     'rgba(167,174,203,.35)', // 사철 실 — 표지 색조 기반
    noise:      { freq: '0.82 0.75', octaves: 4, opacity: 0.18 },
    available:  true,
  },
  2027: {
    year:       2027,
    material:   'Fine_Cotton',   // 세밀한 면직 — 낮은 주파수 노이즈
    label:      'Dusty Rose',
    color:      '#C4A8A0',
    gradLight:  '#D4B8B0',
    gradDark:   '#B09088',
    thread:     'rgba(196,168,160,.32)',
    noise:      { freq: '0.62 0.55', octaves: 3, opacity: 0.12 },
    available:  false,
  },
  2028: {
    year:       2028,
    material:   'Aged_Kraft',    // 에이징 크라프트 — 복잡한 다중 옥타브
    label:      'Sage Slate',
    color:      '#8FA098',
    gradLight:  '#9FB0A8',
    gradDark:   '#7A8A82',
    thread:     'rgba(143,160,152,.32)',
    noise:      { freq: '0.74 0.68', octaves: 5, opacity: 0.22 },
    available:  false,
  },
};

/* 연도별 소재 노이즈 URL 생성기 */
const makeNoiseUrl = ({ freq, octaves, opacity }) => {
  const f = freq.replace(/ /g, '%20');
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Cfilter id='ln'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${f}' numOctaves='${octaves}' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23ln)' opacity='${opacity}'/%3E%3C/svg%3E")`;
};

const SECTIONS = ['s-design', 's-preview', 's-spec', 's-order'];

/* ── 수채화 SVG (사진 참고 디자인) ── */
function WatercolorBlobs({ w = 300, h = 380, seed = 0 }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <filter id={`wc-blur-${seed}`} x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.008" numOctaves="4" seed={seed} result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="28" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
          <feGaussianBlur in="displaced" stdDeviation="18"/>
        </filter>
        <filter id={`wc-blur2-${seed}`} x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.014" numOctaves="3" seed={seed + 5} result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="G" yChannelSelector="R" result="displaced"/>
          <feGaussianBlur in="displaced" stdDeviation="22"/>
        </filter>
      </defs>

      {/* 수채화 블롭 — 은은한 라벤더 (투명도 최소화) */}
      <ellipse cx={w*0.42} cy={h*0.28} rx={w*0.28} ry={h*0.18} fill="rgba(155,148,195,0.11)" filter={`url(#wc-blur-${seed})`}/>
      <ellipse cx={w*0.62} cy={h*0.18} rx={w*0.22} ry={h*0.14} fill="rgba(140,134,188,0.09)" filter={`url(#wc-blur-${seed})`}/>
      <ellipse cx={w*0.30} cy={h*0.45} rx={w*0.24} ry={h*0.20} fill="rgba(162,155,205,0.08)" filter={`url(#wc-blur2-${seed})`}/>
      <ellipse cx={w*0.68} cy={h*0.40} rx={w*0.20} ry={h*0.18} fill="rgba(148,142,192,0.09)" filter={`url(#wc-blur2-${seed})`}/>
      <ellipse cx={w*0.50} cy={h*0.60} rx={w*0.26} ry={h*0.16} fill="rgba(132,126,182,0.06)" filter={`url(#wc-blur-${seed})`}/>
    </svg>
  );
}

/* ── 다이어리 페이지 공통 스타일 ── */
const PAGE_BG   = '#FAF7F2'; // 따뜻한 크림 종이색
const PAGE_LINE = 'rgba(180,165,148,0.25)';
const INK       = '#2A2420';
const INK_LIGHT = '#7A6E68';
const INK_FAINT = '#B8AEA8';
const ACCENT_LAVENDER = '#8F88B2'; // 채도 -20% (was #8878B8)
const ACCENT_ROSE     = '#B08888'; // 채도 -20% (was #C07080)
const ACCENT_SAGE     = '#7A8878'; // 채도 -20% (was #6A8870)

/* ── 횡선 배경 (노트 선) ── */
function PageLines({ count = 18 }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ position: 'absolute', left: 20, right: 20, top: 40 + i * 20, height: 1, background: PAGE_LINE }} />
      ))}
    </div>
  );
}

/* ── 스프레드 콘텐츠 ── */
const SPREADS = ['표제지', '일기 — 봄', '일기 — 겨울', '감정 여정', '마지막 페이지'];

function SpreadContent({ index, title, period }) {
  /* 표제지 */
  if (index === 0) return (
    <>
      {/* 왼쪽: 수채화 + 별자리 full */}
      <div className="op-spread-page" style={{ background: PAGE_BG, padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div className="op-spread-gutter-l" />
        <WatercolorBlobs seed={3} />
        <div style={{ position: 'absolute', bottom: 14, left: 20, fontSize: 8, color: INK_FAINT, fontFamily: 'Georgia,serif', letterSpacing: '.1em', zIndex: 11 }}>1</div>
      </div>
      {/* 오른쪽: 표제 텍스트 */}
      <div className="op-spread-page page-right" style={{ background: PAGE_BG }}>
        <PageLines />
        <div className="op-spread-gutter-r" />
        <div style={{ position: 'relative', zIndex: 1, paddingTop: 8 }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '.18em', color: INK_FAINT, marginBottom: 20, textTransform: 'uppercase' }}>Duru Diary</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: INK, fontFamily: "'Noto Serif KR',Georgia,serif", lineHeight: 1.25, marginBottom: 6 }}>{title}</div>
          <div style={{ width: 28, height: 1.5, background: ACCENT_LAVENDER, borderRadius: 1, marginBottom: 14, opacity: .7 }} />
          <div style={{ fontSize: 9.5, color: INK_LIGHT, lineHeight: 2, letterSpacing: '.03em' }}>
            수록 기간 · {period}<br />
            두루와 함께한<br />소중한 기록
          </div>
          <div style={{ position: 'absolute', bottom: -8, right: 0 }}>
            <svg width="32" height="32" viewBox="0 0 26 26" fill="none" opacity=".12">
              <ellipse cx="13" cy="5.5" rx="2.6" ry="4" fill={INK}/>
              <ellipse cx="7" cy="9" rx="2.6" ry="4" fill={INK} transform="rotate(35 7 9)"/>
              <ellipse cx="19" cy="9" rx="2.6" ry="4" fill={INK} transform="rotate(-35 19 9)"/>
              <ellipse cx="13" cy="16.5" rx="5" ry="4.2" fill={INK}/>
              <ellipse cx="13" cy="21.5" rx="1.8" ry="2.8" fill={INK}/>
            </svg>
          </div>
        </div>
        <span style={{ position: 'absolute', bottom: 14, right: 16, fontSize: 8, color: INK_FAINT, fontFamily: 'Georgia,serif' }}>2</span>
      </div>
    </>
  );

  /* 일기 — 봄 (사진과 가장 유사한 레이아웃) */
  if (index === 1) return (
    <>
      {/* 왼쪽: 날짜 + 일기 텍스트 */}
      <div className="op-spread-page" style={{ background: PAGE_BG }}>
        <PageLines />
        <div className="op-spread-gutter-l" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* 날짜 — 사진처럼 상단 좌측 */}
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: INK_LIGHT, marginBottom: 4, fontFamily: 'Georgia,serif' }}>2026.03.12</div>
          {/* 감정 태그 */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(176,136,136,0.08)', borderRadius: 4, padding: '2px 7px', marginBottom: 12 }}>
            <span style={{ fontSize: 7, color: ACCENT_ROSE }}>✺</span>
            <span style={{ fontSize: 8, fontWeight: 600, color: ACCENT_ROSE, letterSpacing: '.06em' }}>설렘</span>
          </div>
          {/* 제목 */}
          <div style={{ fontSize: 14, fontWeight: 900, color: INK, fontFamily: "'Noto Serif KR',Georgia,serif", lineHeight: 1.35, marginBottom: 10 }}>퇴근길에 벚꽃이<br />피어있었다</div>
          <div style={{ width: '100%', height: 1, background: PAGE_LINE, marginBottom: 10 }} />
          {/* 본문 */}
          <div style={{ fontSize: 9.5, color: INK_LIGHT, lineHeight: 2.1, textAlign: 'justify' }}>
            <span style={{ float: 'left', fontSize: 28, lineHeight: .9, fontFamily: 'Georgia,serif', fontWeight: 700, margin: '2px 4px 0 0', color: ACCENT_ROSE }}>퇴</span>
            근하면서 지하철역 앞 벚꽃길을 지나쳤다. 올해도 어김없이 피었구나 싶었는데, 왠지 모르게 가슴이 찡했다.
          </div>
        </div>
        <span style={{ position: 'absolute', bottom: 14, left: 16, fontSize: 8, color: INK_FAINT, fontFamily: 'Georgia,serif' }}>5</span>
      </div>
      {/* 오른쪽: 수채화 + 별자리 (사진의 오른쪽 페이지) */}
      <div className="op-spread-page page-right" style={{ background: PAGE_BG, padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div className="op-spread-gutter-r" />
        <WatercolorBlobs seed={7} />
        {/* 본문 계속 — 수채화 위에 반투명으로 */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 9, color: 'rgba(42,36,32,0.55)', lineHeight: 2, textAlign: 'justify', backdropFilter: 'blur(0px)' }}>
            꽃이 예쁠수록 더 외로운 기분이 드는 건<br />나만의 감정인가.<br /><br />
            이상하게 아름다운 날들이<br />더 쓸쓸하게 느껴질 때가 있다.
          </div>
        </div>
        <span style={{ position: 'absolute', bottom: 14, right: 16, fontSize: 8, color: INK_FAINT, fontFamily: 'Georgia,serif', zIndex: 6 }}>6</span>
      </div>
    </>
  );

  /* 일기 — 겨울 */
  if (index === 2) return (
    <>
      <div className="op-spread-page" style={{ background: PAGE_BG }}>
        <PageLines />
        <div className="op-spread-gutter-l" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: INK_LIGHT, marginBottom: 4, fontFamily: 'Georgia,serif' }}>2026.01.03</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(128,144,160,0.08)', borderRadius: 4, padding: '2px 7px', marginBottom: 12 }}>
            <span style={{ fontSize: 7, color: '#8090A0' }}>◈</span>
            <span style={{ fontSize: 8, fontWeight: 600, color: '#8090A0', letterSpacing: '.06em' }}>평온</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: INK, fontFamily: "'Noto Serif KR',Georgia,serif", lineHeight: 1.35, marginBottom: 10 }}>새해 첫 아침,<br />창밖에 눈이 내렸다</div>
          <div style={{ width: '100%', height: 1, background: PAGE_LINE, marginBottom: 10 }} />
          <div style={{ fontSize: 9.5, color: INK_LIGHT, lineHeight: 2.1, textAlign: 'justify' }}>
            <span style={{ float: 'left', fontSize: 28, lineHeight: .9, fontFamily: 'Georgia,serif', fontWeight: 700, margin: '2px 4px 0 0', color: '#8090A0' }}>눈</span>
            을 떴을 때 방 안이 유독 밝았다. 창문을 보니 밤새 눈이 내려 세상이 하얗게 덮여 있었다. 오늘은 아무 계획도 없는 날이다.
          </div>
        </div>
        <span style={{ position: 'absolute', bottom: 14, left: 16, fontSize: 8, color: INK_FAINT, fontFamily: 'Georgia,serif' }}>9</span>
      </div>
      <div className="op-spread-page page-right" style={{ background: PAGE_BG, padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div className="op-spread-gutter-r" />
        <WatercolorBlobs seed={12} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 9, color: 'rgba(42,36,32,0.55)', lineHeight: 2, textAlign: 'justify' }}>
            새해에는 조금 더 나에게 솔직한<br />하루를 살고 싶다는 생각을 했다.<br /><br />
            오늘처럼 조용히 시작하는 하루들이<br />모여 한 해가 되면 좋겠다.
          </div>
        </div>
        <span style={{ position: 'absolute', bottom: 14, right: 16, fontSize: 8, color: INK_FAINT, fontFamily: 'Georgia,serif', zIndex: 6 }}>10</span>
      </div>
    </>
  );

  /* 감정 여정 */
  if (index === 3) return (
    <>
      <div className="op-spread-page" style={{ background: PAGE_BG }}>
        <PageLines />
        <div className="op-spread-gutter-l" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '.18em', color: INK_FAINT, marginBottom: 12, textTransform: 'uppercase' }}>Year in Review</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: INK, fontFamily: "'Noto Serif KR',Georgia,serif", lineHeight: 1.35, marginBottom: 14 }}>2026년,<br />나의 감정들</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[
              ['29편', '총 일기 수', ACCENT_LAVENDER],
              ['5가지', '기록된 감정', ACCENT_SAGE],
              ['우울', '가장 많은 감정', ACCENT_ROSE],
              ['3월', '가장 많이 쓴 달', '#8898A8'],
              ['꽃', '최다 등장 단어', ACCENT_LAVENDER],
            ].map(([v, l, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 7, borderBottom: `1px solid ${PAGE_LINE}` }}>
                <span style={{ fontSize: 8.5, color: INK_LIGHT }}>{l}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: c, fontFamily: 'Georgia,serif' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <span style={{ position: 'absolute', bottom: 14, left: 16, fontSize: 8, color: INK_FAINT, fontFamily: 'Georgia,serif' }}>3</span>
      </div>
      {/* 오른쪽: 감정 수채화 시각화 */}
      <div className="op-spread-page page-right" style={{ background: PAGE_BG, padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div className="op-spread-gutter-r" />
        <WatercolorBlobs seed={17} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, padding: '22px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
          {[
            { label: '우울',   color: ACCENT_LAVENDER, size: 54 },
            { label: '외로움', color: '#8090A0',        size: 44 },
            { label: '평온',   color: ACCENT_SAGE,      size: 38 },
            { label: '기쁨',   color: '#B0A070',        size: 30 },
            { label: '설렘',   color: ACCENT_ROSE,      size: 24 },
          ].map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flexShrink: 0, width: e.size, height: e.size, borderRadius: '50%', background: e.color, opacity: 0.18 }} />
              <span style={{ fontSize: 9, color: INK_LIGHT, fontWeight: 600, letterSpacing: '.04em' }}>{e.label}</span>
            </div>
          ))}
        </div>
        <span style={{ position: 'absolute', bottom: 14, right: 16, fontSize: 8, color: INK_FAINT, fontFamily: 'Georgia,serif' }}>4</span>
      </div>
    </>
  );

  /* 마지막 페이지 */
  return (
    <>
      <div className="op-spread-page" style={{ background: PAGE_BG, padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div className="op-spread-gutter-l" />
        <WatercolorBlobs seed={21} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10, padding: 20 }}>
          <svg width="28" height="28" viewBox="0 0 26 26" fill="none" opacity=".3">
            <ellipse cx="13" cy="5.5" rx="2.6" ry="4" fill={INK}/>
            <ellipse cx="7" cy="9" rx="2.6" ry="4" fill={INK} transform="rotate(35 7 9)"/>
            <ellipse cx="19" cy="9" rx="2.6" ry="4" fill={INK} transform="rotate(-35 19 9)"/>
            <ellipse cx="13" cy="16.5" rx="5" ry="4.2" fill={INK}/>
            <ellipse cx="13" cy="21.5" rx="1.8" ry="2.8" fill={INK}/>
          </svg>
          <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '.16em', color: INK_FAINT, textTransform: 'uppercase' }}>Duru Diary</div>
          <div style={{ fontSize: 10, color: INK_LIGHT, lineHeight: 1.8 }}>이 책은 두루와 함께한<br />하루하루의 기록입니다.</div>
          <div style={{ width: 20, height: 1, background: ACCENT_LAVENDER, opacity: .4 }} />
          <div style={{ fontSize: 8.5, color: INK_FAINT, fontFamily: 'Georgia,serif' }}>{title}</div>
        </div>
        <span style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: INK_FAINT, fontFamily: 'Georgia,serif', zIndex: 6 }}>· fin ·</span>
      </div>
      <div className="op-spread-page page-right" style={{ background: PAGE_BG }}>
        <PageLines />
        <div className="op-spread-gutter-r" />
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 8 }}>
          <div style={{ fontSize: 8, color: INK_FAINT, lineHeight: 2, letterSpacing: '.05em' }}>
            발행 · DURU<br />제본 · 하드커버 양장<br />용지 · 미색 모조지 120g<br />판형 · A5 (148×210mm)<br />
            <br />© 2026 {title}
          </div>
        </div>
        <span style={{ position: 'absolute', bottom: 14, right: 16, fontSize: 8, color: INK_FAINT, fontFamily: 'Georgia,serif' }}>끝</span>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   메인 페이지 컴포넌트
══════════════════════════════════════════ */
export default function OrderPage() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [title, setTitle]       = useState('나의 2026년');
  const [period, setPeriod]     = useState('올해 전체');
  const [layout, setLayout]     = useState('center');
  const [diaryCount, setDiaryCount] = useState(29);
  const [curSpread, setCurSpread] = useState(0);
  const [spreadFlipping, setSpreadFlipping] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [showFloating, setShowFloating]   = useState(false);
  const [showSuccess, setShowSuccess]     = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [reservationCount, setReservationCount] = useState(null);
  const [counterUpdating, setCounterUpdating]   = useState(false);
  const [socialUser, setSocialUser]       = useState(null);
  const [checks, setChecks]     = useState([false, false, false]);
  const [deliveryChip, setDeliveryChip] = useState('택배 수령');

  const nameRef  = useRef(null);
  const phoneRef = useRef(null);
  const addr1Ref = useRef(null);
  const addr2Ref = useRef(null);
  const noteRef  = useRef(null);

  const heroRef = useRef(null);
  const orderRef = useRef(null);

  /* ── 예약자 카운터 ── */
  useEffect(() => {
    const key = 'duru_reservation_count';
    const stored = localStorage.getItem(key);
    const count = stored ? parseInt(stored) : CONFIG.baseReservationCount;
    setReservationCount(count);

    let current = count;
    const schedule = () => {
      const delay = (30 + Math.random() * 60) * 1000;
      return setTimeout(() => {
        current += Math.floor(Math.random() * 3) + 1;
        localStorage.setItem(key, current);
        setCounterUpdating(true);
        setTimeout(() => { setReservationCount(current); setCounterUpdating(false); }, 200);
        schedule();
      }, delay);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  /* ── Floating CTA / 헤더 활성 섹션 ── */
  useEffect(() => {
    const onScroll = () => {
      const hero = heroRef.current;
      const order = orderRef.current;
      if (hero && order) {
        const heroBottom = hero.getBoundingClientRect().bottom;
        const orderBottom = order.getBoundingClientRect().bottom;
        setShowFloating(heroBottom < 0 && orderBottom > 80);
      }
      let current = 0;
      SECTIONS.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 100) current = i;
      });
      setActiveSection(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── EmailJS / Kakao SDK 로드 ── */
  useEffect(() => {
    const ejs = document.createElement('script');
    ejs.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    document.head.appendChild(ejs);
    const kakao = document.createElement('script');
    kakao.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    kakao.crossOrigin = 'anonymous';
    document.head.appendChild(kakao);
    return () => { document.head.removeChild(ejs); document.head.removeChild(kakao); };
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const spineCalc = useCallback((count) => {
    const mm = (count * 0.1 + 3.5).toFixed(1);
    const barW = Math.max(4, Math.min(60, count * 0.55));
    const pct = ((count - 10) / 90 * 100).toFixed(1) + '%';
    return { mm, barW, pct };
  }, []);

  const { mm: spineMm, barW: spineBarW, pct: spinePct } = spineCalc(diaryCount);

  /* ── 스프레드 이동 ── */
  const goSpread = (delta) => {
    const next = curSpread + delta;
    if (next < 0 || next >= SPREADS.length) return;
    setSpreadFlipping(true);
    setTimeout(() => { setCurSpread(next); setSpreadFlipping(false); }, 200);
  };

  /* ── 소셜 로그인 ── */
  const applySocialUser = useCallback(({ name, phone, provider, avatarUrl }) => {
    setSocialUser({ name, phone, provider, avatarUrl });
    if (nameRef.current)  { nameRef.current.value  = name;  nameRef.current.style.borderColor  = '#5A7898'; setTimeout(() => { if (nameRef.current)  nameRef.current.style.borderColor  = ''; }, 2000); }
    if (phoneRef.current) { phoneRef.current.value = phone; phoneRef.current.style.borderColor = '#5A7898'; setTimeout(() => { if (phoneRef.current) phoneRef.current.style.borderColor = ''; }, 2000); }
  }, []);

  const loginWithKakao = () => {
    if (CONFIG.kakao.jsKey === 'YOUR_KAKAO_JS_APP_KEY') {
      applySocialUser({ name: '김두루', phone: '010-1234-5678', provider: '카카오', avatarUrl: '' });
      return;
    }
    const Kakao = window.Kakao;
    if (!Kakao?.isInitialized()) Kakao?.init(CONFIG.kakao.jsKey);
    Kakao?.Auth?.login({
      scope: 'profile_nickname,phone_number',
      success() {
        Kakao.API.request({
          url: '/v2/user/me',
          success(res) {
            const p = res.kakao_account;
            applySocialUser({ name: p?.profile?.nickname || '', phone: (p?.phone_number || '').replace('+82 ', '0'), provider: '카카오', avatarUrl: p?.profile?.thumbnail_image_url || '' });
          },
        });
      },
    });
  };

  const loginWithNaver = () => {
    if (CONFIG.naver.clientId === 'YOUR_NAVER_CLIENT_ID') {
      applySocialUser({ name: '이두루', phone: '010-9876-5432', provider: '네이버', avatarUrl: '' });
      return;
    }
    const stateVal = Math.random().toString(36).slice(2);
    sessionStorage.setItem('naver_state', stateVal);
    window.open(`https://nid.naver.com/oauth2.0/authorize?response_type=token&client_id=${CONFIG.naver.clientId}&redirect_uri=${encodeURIComponent(window.location.href)}&state=${stateVal}`, 'naver_login', 'width=480,height=640');
  };

  const socialLogout = () => {
    setSocialUser(null);
    if (window.Kakao?.Auth?.getAccessToken()) window.Kakao.Auth.logout();
  };

  /* ── 폼 제출 ── */
  const submitOrder = () => {
    const name  = nameRef.current?.value.trim();
    const phone = phoneRef.current?.value.trim();
    const addr1 = addr1Ref.current?.value.trim();
    const addr2 = addr2Ref.current?.value.trim();
    const note  = noteRef.current?.value.trim();

    if (!name || !phone || !addr1) {
      const target = !name ? nameRef : !phone ? phoneRef : addr1Ref;
      target.current?.focus();
      if (target.current) { target.current.style.borderColor = '#C05050'; setTimeout(() => { if (target.current) target.current.style.borderColor = ''; }, 2000); }
      return;
    }

    const templateParams = { book_title: title, cover_color: `${activeTheme.year}년 ${activeTheme.label}`, period, spine_mm: spineMm, name, phone, address: addr1 + (addr2 ? ' ' + addr2 : ''), note: note || '없음', order_date: new Date().toLocaleDateString('ko-KR'), price: '39,900원 (얼리버드)', delivery: deliveryChip };

    setSubmitting(true);
    const doSuccess = () => {
      setShowSuccess(true);
      setSubmitting(false);
      const key = 'duru_reservation_count';
      const next = parseInt(localStorage.getItem(key) || CONFIG.baseReservationCount) + 1;
      localStorage.setItem(key, next);
      setCounterUpdating(true);
      setTimeout(() => { setReservationCount(next); setCounterUpdating(false); }, 200);
    };

    const isConfigured = CONFIG.emailjs.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY';
    if (isConfigured && window.emailjs) {
      window.emailjs.init(CONFIG.emailjs.publicKey);
      window.emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, templateParams)
        .then(doSuccess).catch(() => doSuccess());
    } else {
      console.log('[DURU] 예약 데이터 (개발 모드):', templateParams);
      setTimeout(doSuccess, 600);
    }
  };

  const toggleCheck = (i) => setChecks(prev => prev.map((v, idx) => idx === i ? !v : v));

  /* 선택된 연도의 테마에서 파생되는 값들 (불변 구조 보장) */
  const activeTheme   = YEARLY_THEMES[selectedYear];
  const coverGradient = `linear-gradient(145deg,${activeTheme.gradLight},${activeTheme.gradDark})`;
  const noiseUrl      = makeNoiseUrl(activeTheme.noise);

  return (
    <div className="order-page">

      {/* 헤더 */}
      <header className="op-header">
        <div className="op-header-inner">
          <button className="op-logo" onClick={() => window.history.back()}>
            <svg width="28" height="28" viewBox="0 0 26 26" fill="none">
              <ellipse cx="13" cy="5.5" rx="2.6" ry="4" fill="#1A1A14"/>
              <ellipse cx="7" cy="9" rx="2.6" ry="4" fill="#1A1A14" transform="rotate(35 7 9)"/>
              <ellipse cx="19" cy="9" rx="2.6" ry="4" fill="#1A1A14" transform="rotate(-35 19 9)"/>
              <ellipse cx="13" cy="16.5" rx="5" ry="4.2" fill="#1A1A14"/>
              <ellipse cx="13" cy="21.5" rx="1.8" ry="2.8" fill="#1A1A14"/>
            </svg>
            <span className="op-logo-text">DURU</span>
          </button>
          <nav className="op-header-steps">
            {['디자인','미리보기','사양','예약'].map((label, i) => (
              <button key={i} className={`op-hs${activeSection === i ? ' active' : ''}`} onClick={() => scrollTo(SECTIONS[i])}>{label}</button>
            ))}
          </nav>
        </div>
      </header>

      {/* 히어로 */}
      <section className="op-hero" ref={heroRef}>
        <div className="op-hero-inner">
          <div className="op-hero-badge">{activeTheme.year} DURU · 얼리버드 신청 가능</div>

          {/* 예약자 카운터 */}
          <div className="op-live-badge">
            <span className="op-live-dot" />
            <span>지금까지 <span className={`op-counter-num${counterUpdating ? ' updating' : ''}`}>{reservationCount?.toLocaleString('ko-KR') ?? '—'}</span>명이 예약했어요</span>
          </div>

          {/* CSS 책 모형 */}
          <div className="op-book-stage" style={{ '--thread-color': activeTheme.thread }}>
            <div className="op-book">
              <div className="op-book-face" style={{ backgroundImage: `${coverGradient}, ${noiseUrl}` }}>
                <div className="op-book-foil" />
                <div className="op-book-emblem">
                  <svg width="28" height="28" viewBox="0 0 26 26" fill="none" style={{ filter: 'drop-shadow(0 1px 0 rgba(255,255,255,.18)) drop-shadow(0 -1px 1px rgba(0,0,0,.22))' }}>
                    <ellipse cx="13" cy="5.5" rx="2.6" ry="4" fill="rgba(0,0,0,.10)"/>
                    <ellipse cx="7" cy="9" rx="2.6" ry="4" fill="rgba(0,0,0,.10)" transform="rotate(35 7 9)"/>
                    <ellipse cx="19" cy="9" rx="2.6" ry="4" fill="rgba(0,0,0,.10)" transform="rotate(-35 19 9)"/>
                    <ellipse cx="13" cy="16.5" rx="5" ry="4.2" fill="rgba(0,0,0,.10)"/>
                    <ellipse cx="13" cy="21.5" rx="1.8" ry="2.8" fill="rgba(0,0,0,.10)"/>
                  </svg>
                </div>
                <div className="op-book-title-text">{title}</div>
              </div>
              <div className="op-book-spine">
                <span className="op-book-spine-text">DURU DIARY 2026</span>
              </div>
            </div>
          </div>

          <h1 className="op-hero-title">세상에 하나뿐인<br />나의 하드커버 일기</h1>
          <p className="op-hero-sub">두루에 기록한 한 해의 이야기가<br />손에 쥘 수 있는 진짜 책이 됩니다.</p>
          <div className="op-hero-stats">
            {['A5 하드커버 양장','미색 모조지 120g 내지','금박 두루 엠블럼','선물 박스 포장'].map(s => (
              <div key={s} className="op-hero-stat"><span className="op-hero-stat-dot" />{s}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('s-order')} style={{ padding: '14px 32px', border: 'none', borderRadius: 14, background: '#1A1A14', color: 'white', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 6px 24px rgba(26,26,20,.28)' }}>지금 신청하기</button>
            <button onClick={() => scrollTo('s-design')} style={{ padding: '14px 24px', border: '1.5px solid rgba(26,26,20,.2)', borderRadius: 14, background: 'rgba(255,255,255,.7)', color: '#1A1A14', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>책 디자인하기</button>
          </div>
        </div>
      </section>

      {/* §1 책 디자인 */}
      <section className="op-section" id="s-design">
        <div className="op-container">
          <h2 className="op-section-title">나만의 책</h2>

          {/* 3D 뷰어 — 전체 너비 메인 */}
          <div style={{ marginTop: 32, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.09)' }}>
            <BookMockup3D coverColor={activeTheme.color} title={title} titleLayout={layout} height={520} />
          </div>
          <p style={{ textAlign: 'center', fontSize: 10, color: INK_FAINT, marginTop: 10, letterSpacing: '.06em', fontFamily: 'Georgia,serif', opacity: .7 }}>
            drag to rotate · scroll to zoom
          </p>

          {/* 옵션 패널 — 페이퍼 느낌, 카드 없음 */}
          <div style={{ marginTop: 36, padding: '0 4px' }}>

            {/* 표지 색상 + 제목 — 2열 */}
            <div className="op-design-opts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 28 }}>
              <div>
                <div className="op-opt-label" style={{ fontFamily: "'Noto Serif KR',Georgia,serif", color: INK_LIGHT }}>에디션</div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  {Object.values(YEARLY_THEMES).map(t => (
                    <button key={t.year}
                      onClick={() => t.available && setSelectedYear(t.year)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: t.available ? 'pointer' : 'default', padding: 0, opacity: t.available ? 1 : 0.36 }}
                    >
                      {/* 소재 프리뷰 — 책 형태 */}
                      <div style={{
                        width: 44, height: 60, borderRadius: '2px 5px 5px 2px', position: 'relative', overflow: 'hidden',
                        background: `linear-gradient(145deg,${t.gradLight},${t.gradDark})`,
                        boxShadow: selectedYear === t.year
                          ? `0 0 0 2.5px white, 0 0 0 4px ${t.color}`
                          : '0 1px 5px rgba(0,0,0,.14)',
                        transition: 'box-shadow .18s',
                      }}>
                        {/* 책등 */}
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 7, background: 'rgba(0,0,0,.22)' }} />
                        {/* 공압 엠블럼 흔적 */}
                        <div style={{ position: 'absolute', top: '50%', left: '55%', transform: 'translate(-50%,-50%)', width: 11, height: 11, borderRadius: '50%', border: '0.8px solid rgba(0,0,0,.09)', filter: 'blur(0.3px)' }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'Georgia,serif', fontWeight: 700, color: selectedYear === t.year ? INK : INK_FAINT, transition: 'color .15s' }}>{t.year}</span>
                      <span style={{ fontSize: 7.5, color: INK_FAINT, letterSpacing: '.07em', textTransform: 'uppercase' }}>{t.material.replace('_', '\u00A0')}</span>
                      {!t.available && <span style={{ fontSize: 7, color: INK_FAINT, letterSpacing: '.05em' }}>출시 예정</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="op-opt-label" style={{ fontFamily: "'Noto Serif KR',Georgia,serif", color: INK_LIGHT }}>책 제목</div>
                <input className="op-title-input" type="text" value={title}
                  onChange={e => setTitle(e.target.value || '나의 2026년')}
                  placeholder="제목을 입력하세요" />
              </div>
            </div>

            {/* 수록 기간 + 레이아웃 — 2열 */}
            <div className="op-design-opts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, paddingTop: 24, borderTop: `1px solid ${PAGE_LINE}` }}>
              <div>
                <div className="op-opt-label" style={{ fontFamily: "'Noto Serif KR',Georgia,serif", color: INK_LIGHT }}>수록 기간</div>
                <div className="op-chip-row">
                  {['올해 전체', '상반기', '하반기'].map(p => (
                    <button key={p} className={`op-chip${period === p ? ' sel' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="op-opt-label" style={{ fontFamily: "'Noto Serif KR',Georgia,serif", color: INK_LIGHT }}>제목 레이아웃</div>
                <div className="op-layout-grid">
                  {[{ key: 'center', label: '중앙 정렬' }, { key: 'bottom-left', label: '좌측 하단' }].map(l => (
                    <button key={l.key} className={`op-layout-opt${layout === l.key ? ' sel' : ''}`} onClick={() => setLayout(l.key)}>
                      <div className="op-layout-preview">
                        {l.key === 'center'
                          ? <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 30, textAlign: 'center' }}><div style={{ height: 2.5, background: 'rgba(0,0,0,.2)', borderRadius: 1, margin: '2px auto', width: 26 }}/><div style={{ height: 2.5, background: 'rgba(0,0,0,.12)', borderRadius: 1, margin: '2px auto', width: 18 }}/></div>
                          : <div style={{ position: 'absolute', bottom: 8, left: 6 }}><div style={{ height: 2.5, background: 'rgba(0,0,0,.2)', borderRadius: 1, margin: '2px 0', width: 26 }}/><div style={{ height: 2.5, background: 'rgba(0,0,0,.12)', borderRadius: 1, margin: '2px 0', width: 18 }}/></div>
                        }
                      </div>
                      <span className="op-layout-label">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* §2 내지 미리보기 */}
      <section className="op-section" id="s-preview" style={{ background: '#F0EDE4' }}>
        <div className="op-container">
          <div className="op-step-label">Step 02</div>
          <h2 className="op-section-title">내지를 직접 확인하세요</h2>
          <p className="op-section-sub">실제 인쇄 레이아웃과 동일하게 미리봐요.</p>

          <div className="op-spread-wrapper">
            <div className={`op-spread-book${spreadFlipping ? ' flipping' : ''}`}>
              <SpreadContent index={curSpread} title={title} period={period} />
            </div>
            <div className="op-spread-shadow" />
          </div>

          <div className="op-spread-nav">
            <button className="op-spread-nav-btn" onClick={() => goSpread(-1)} disabled={curSpread === 0}>← 이전</button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {SPREADS.map((_, i) => (
                  <button key={i} className={`op-spread-dot${i === curSpread ? ' active' : ''}`} onClick={() => { setSpreadFlipping(true); setTimeout(() => { setCurSpread(i); setSpreadFlipping(false); }, 200); }} />
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#767676' }}>{SPREADS[curSpread]}</span>
            </div>
            <button className="op-spread-nav-btn" onClick={() => goSpread(1)} disabled={curSpread === SPREADS.length - 1}>다음 →</button>
          </div>
        </div>
      </section>

      {/* §3 제작 사양 */}
      <section className="op-section" id="s-spec">
        <div className="op-container">
          <div className="op-step-label">Step 03</div>
          <h2 className="op-section-title">제작 사양을 확인하세요</h2>
          <p className="op-section-sub">모든 책은 전문 인쇄소에서 하나하나 수작업으로 완성됩니다.</p>

          <div className="op-spec-grid">
            {[
              { name: '판형', val: 'A5\n148×210mm', svg: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="3" width="15" height="21" rx="1.5"/><line x1="9" y1="9" x2="18" y2="9" strokeWidth=".85" opacity=".5"/><line x1="9" y1="13" x2="18" y2="13" strokeWidth=".85" opacity=".5"/><line x1="9" y1="17" x2="14" y2="17" strokeWidth=".85" opacity=".5"/><path d="M23 7l2 0M23 7l0-2" strokeWidth="1" opacity=".6"/><path d="M23 21l2 0M23 21l0 2" strokeWidth="1" opacity=".6"/></svg> },
              { name: '제본', val: '하드커버\n양장 제본', svg: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="3" width="14" height="26" rx="1.5"/><line x1="10" y1="3" x2="10" y2="29"/><path d="M6 9 Q10 9 10 11" strokeWidth="1.1"/><path d="M6 15 Q10 15 10 17" strokeWidth="1.1"/><path d="M6 21 Q10 21 10 23" strokeWidth="1.1"/></svg> },
              { name: '내지', val: '미색 모조지\n120g', svg: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="7" width="18" height="22" rx="1.5" opacity=".35"/><rect x="7" y="4" width="18" height="22" rx="1.5"/><line x1="11" y1="11" x2="21" y2="11" strokeWidth=".85" opacity=".55"/><line x1="11" y1="15" x2="21" y2="15" strokeWidth=".85" opacity=".55"/><line x1="11" y1="19" x2="17" y2="19" strokeWidth=".85" opacity=".55"/></svg> },
              { name: '표지', val: '린넨 패턴\n하드커버', svg: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="20" height="28" rx="2"/><line x1="9" y1="2" x2="9" y2="30"/><line x1="13" y1="7" x2="20" y2="14" strokeWidth=".75" opacity=".45"/><line x1="13" y1="12" x2="20" y2="19" strokeWidth=".75" opacity=".45"/><line x1="13" y1="17" x2="20" y2="24" strokeWidth=".75" opacity=".45"/></svg> },
              { name: '후가공', val: '금박 엠블럼\n각인', svg: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="16" r="12" opacity=".3"/><circle cx="16" cy="16" r="9.5"/><ellipse cx="16" cy="9.5" rx="2" ry="3.5"/><ellipse cx="10.8" cy="12" rx="2" ry="3.5" transform="rotate(35 10.8 12)"/><ellipse cx="21.2" cy="12" rx="2" ry="3.5" transform="rotate(-35 21.2 12)"/><ellipse cx="16" cy="19" rx="3.8" ry="2.8"/></svg> },
            ].map(s => (
              <div key={s.name} className="op-spec-card">
                <div className="op-spec-icon">{s.svg}</div>
                <div className="op-spec-name">{s.name}</div>
                <div className="op-spec-val">{s.val.split('\n').map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</div>
              </div>
            ))}
          </div>

          {/* 책등 계산기 */}
          <div className="op-spine-calc">
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1A14', marginBottom: 6 }}>실시간 책등 두께 계산기</div>
              <div style={{ fontSize: 12, color: '#767676', marginBottom: 20 }}>일기 편 수에 따라 책의 두께가 달라집니다.</div>
              <input type="range" className="op-spine-range" min="10" max="100" value={diaryCount} onChange={e => setDiaryCount(parseInt(e.target.value))}
                style={{ background: `linear-gradient(to right, #5A7898 ${spinePct}, rgba(0,0,0,.1) ${spinePct})` }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#767676' }}><span>10편</span><span>55편</span><span>100편</span></div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', height: 48, alignItems: 'stretch', borderRadius: 4, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.13)' }}>
                  <div style={{ width: 6, background: '#5A7898' }} />
                  <div style={{ width: spineBarW, background: '#3D6080', transition: 'width .4s cubic-bezier(.34,1.2,.64,1)' }} />
                  <div style={{ width: 40, background: '#F0EBE0' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#5A7898' }}>{spineMm}mm</span>
                <span style={{ fontSize: 11, color: '#767676' }}>= 실제 책등 폭</span>
              </div>
            </div>
            <div className="op-spine-result">
              <div style={{ fontSize: 13, color: '#5A7898', fontWeight: 700, marginBottom: 4 }}>{diaryCount}편 기준</div>
              <div><span style={{ fontSize: 32, fontWeight: 900, color: '#3D6080', lineHeight: 1 }}>{spineMm}</span><span style={{ fontSize: 14, fontWeight: 600, color: '#5A7898', marginLeft: 3 }}>mm</span></div>
              <div style={{ fontSize: 10, color: '#7090AC', marginTop: 4 }}>예상 책등 두께</div>
              <div style={{ marginTop: 10, fontSize: 10, color: '#7090AC', lineHeight: 1.5 }}>미색 모조지 120g<br />1편 = 0.1mm 기준</div>
            </div>
          </div>

          {/* 배송 정보 */}
          <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['📦 제작 기간','예약 확정 후 21일','제본 + 검수 + 포장 포함'],['🚚 배송','전국 무료 배송','선물 박스 패키징 포함'],['🔄 교환·반품','인쇄 오류 시 무상 재제작','개인 커스터마이즈 특성상 단순 변심 제외']].map(([t,v,s]) => (
              <div key={t} style={{ flex: 1, minWidth: 200, background: 'white', border: '1px solid rgba(0,0,0,.07)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#767676', marginBottom: 6 }}>{t}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1A14' }}>{v}</div>
                <div style={{ fontSize: 11, color: '#767676', marginTop: 2 }}>{s}</div>
              </div>
            ))}
          </div>

          {/* 책꽂이 */}
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9A9490', letterSpacing: '.07em', marginBottom: 10 }}>책등 두께 시뮬레이터</div>
            <SpineBookshelf
              coverColor={activeTheme.color}
              diaryCount={diaryCount}
              year={activeTheme.year}
              material={activeTheme.material}
            />
          </div>
        </div>
      </section>

      {/* §4 예약 신청 */}
      <section className="op-section" id="s-order" ref={orderRef}>
        <div className="op-container">
          <div className="op-step-label">Step 04</div>
          <h2 className="op-section-title">예약 정보를 입력하세요</h2>
          <p className="op-section-sub">모든 정보는 안전하게 암호화되어 처리됩니다.</p>

          <div className="op-order-grid">
            <form onSubmit={e => { e.preventDefault(); submitOrder(); }}>
              {/* 소셜 로그인 */}
              <div style={{ marginBottom: 20 }}>
                {socialUser ? (
                  <div className="op-social-user-info">
                    <div className="op-social-avatar">
                      {socialUser.avatarUrl ? <img src={socialUser.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (socialUser.name || '?')[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A14' }}>{socialUser.name}</div>
                      <div style={{ fontSize: 11, color: '#5A7898' }}>{socialUser.provider} 계정으로 연결됨</div>
                    </div>
                    <button type="button" onClick={socialLogout} style={{ marginLeft: 'auto', fontSize: 10, color: '#767676', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: 6 }}>로그아웃</button>
                  </div>
                ) : (
                  <>
                    <div className="op-social-divider">간편 로그인으로 정보 자동 입력</div>
                    <button type="button" className="op-btn-kakao" onClick={loginWithKakao}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5C4.86 1.5 1.5 4.19 1.5 7.5c0 2.1 1.24 3.95 3.12 5.04l-.8 2.97c-.07.26.22.47.45.32L7.8 13.7c.39.06.79.09 1.2.09 4.14 0 7.5-2.69 7.5-6S13.14 1.5 9 1.5z" fill="#191919"/></svg>
                      카카오로 간편 신청
                    </button>
                    <button type="button" className="op-btn-naver" onClick={loginWithNaver}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.17 8.27L6.6 4H4v8h2.83V7.73L9.4 12H12V4H9.17v4.27z" fill="white"/></svg>
                      네이버로 간편 신청
                    </button>
                    <p style={{ fontSize: 11, color: '#767676', textAlign: 'center', marginTop: 10 }}>로그인 시 이름·연락처가 자동으로 입력돼요</p>
                  </>
                )}
                <div className="op-social-divider" style={{ marginTop: 16 }}>또는 직접 입력</div>
              </div>

              <div className="op-form-row">
                <div className="op-form-group">
                  <label className="op-form-label">받는 분 성함 <span>*</span></label>
                  <input ref={nameRef} className="op-form-input" type="text" placeholder="홍길동" />
                </div>
                <div className="op-form-group">
                  <label className="op-form-label">연락처 <span>*</span></label>
                  <input ref={phoneRef} className="op-form-input" type="tel" placeholder="010-0000-0000" />
                </div>
              </div>
              <div className="op-form-group">
                <label className="op-form-label">배송 주소 <span>*</span></label>
                <input ref={addr1Ref} className="op-form-input" type="text" placeholder="도로명 주소" style={{ marginBottom: 8 }} />
                <input ref={addr2Ref} className="op-form-input" type="text" placeholder="상세 주소 (동·호수 등)" />
              </div>
              <div className="op-form-group">
                <label className="op-form-label">요청 사항</label>
                <textarea ref={noteRef} className="op-form-input op-form-textarea" placeholder="배송 시 주의사항이나 포장 관련 요청을 적어주세요." />
              </div>
              <div className="op-form-group">
                <label className="op-form-label">수령 방법</label>
                <div className="op-chip-row">
                  {['택배 수령','선물 포장 추가 (+2,000원)'].map(d => (
                    <button key={d} type="button" className={`op-chip${deliveryChip === d ? ' sel' : ''}`} onClick={() => setDeliveryChip(d)}>{d}</button>
                  ))}
                </div>
              </div>

              {/* 체크리스트 */}
              <div style={{ background: '#FFF8EC', border: '1px solid rgba(200,160,64,.2)', borderRadius: 14, padding: '16px 18px', marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#8B6200', marginBottom: 12 }}>📋 예약 전 최종 확인</div>
                {['표지 색상과 제목을 최종 확인했어요','내지 미리보기에서 모든 페이지를 확인했어요','배송 주소가 정확함을 확인했어요'].map((text, i) => (
                  <div key={i} className={`op-check-item${checks[i] ? ' checked' : ''}`} onClick={() => toggleCheck(i)}>
                    <div className="op-check-box">
                      <svg className="op-check-icon" width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className="op-check-text">{text}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10, fontSize: 10, color: '#A07820', lineHeight: 1.5 }}>개인 맞춤 제작 특성상 확정 후 내용 수정이 어렵습니다.</div>
              </div>
            </form>

            {/* 주문 요약 카드 */}
            <div className="op-order-summary">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 18, borderBottom: '1px solid rgba(0,0,0,.07)' }}>
                <div className="op-mini-cover" style={{ background: coverGradient }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1A14', lineHeight: 1.35, wordBreak: 'keep-all' }}>{title}</div>
                  <div style={{ fontSize: 11, color: '#767676', marginTop: 3 }}>{activeTheme.year}년 에디션 · {period}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {[['판형','A5 하드커버'],['내지','미색 모조지 120g'],['예상 두께',`${spineMm}mm`],['배송',<span key="s" style={{ color: '#5A8850' }}>무료</span>]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: '#595952' }}>{l}</span>
                    <span style={{ fontWeight: 700, color: '#1A1A14' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ paddingTop: 14, borderTop: '1px solid rgba(0,0,0,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>결제 금액</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#767676', textDecoration: 'line-through' }}>49,900원</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#111109' }}>39,900원</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: '#767676' }}>얼리버드 할인</span>
                <span style={{ fontSize: 10, fontWeight: 800, background: '#5A7898', color: 'white', padding: '2px 6px', borderRadius: 5 }}>20% OFF</span>
              </div>
              <button className="op-btn-order" onClick={submitOrder} disabled={submitting}>
                {submitting ? <span style={{ opacity: .6 }}>전송 중...</span> : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/></svg>
                    예약 신청하기
                  </>
                )}
              </button>
              <p style={{ fontSize: 10, color: '#767676', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>결제는 예약 확정 후 별도 안내드립니다.<br />2026.12.31까지 얼리버드 혜택이 적용돼요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,.07)', padding: '36px 0', textAlign: 'center', fontSize: 12, color: '#767676' }}>
        <div style={{ fontFamily: "'Noto Serif KR',Georgia,serif", fontSize: 15, fontWeight: 900, color: '#767676', marginBottom: 6 }}>DURU</div>
        <div>세상에 하나뿐인 나의 이야기 · 두루</div>
        <div style={{ marginTop: 8, fontSize: 11, opacity: .6 }}>© 2026 DURU. 문의: hello@duru.kr</div>
      </footer>

      {/* Floating CTA */}
      <div className={`op-floating-cta${showFloating ? ' show' : ''}`}>
        <button className="op-floating-cta-btn" onClick={() => scrollTo('s-order')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/></svg>
          예약 신청하기 · 39,900원
        </button>
      </div>

      {/* 성공 모달 */}
      {showSuccess && (
        <div className="op-success-overlay" onClick={e => { if (e.target === e.currentTarget) setShowSuccess(false); }}>
          <div className="op-success-card">
            <svg width="52" height="52" viewBox="0 0 26 26" fill="none" style={{ margin: '0 auto 20px', opacity: .85 }}>
              <ellipse cx="13" cy="5.5" rx="2.6" ry="4" fill="#5A7898" opacity=".8"/>
              <ellipse cx="7" cy="9" rx="2.6" ry="4" fill="#5A7898" opacity=".7" transform="rotate(35 7 9)"/>
              <ellipse cx="19" cy="9" rx="2.6" ry="4" fill="#5A7898" opacity=".7" transform="rotate(-35 19 9)"/>
              <ellipse cx="13" cy="16.5" rx="5" ry="4.2" fill="#5A7898"/>
              <ellipse cx="13" cy="21.5" rx="1.8" ry="2.8" fill="#5A7898"/>
            </svg>
            <h2 style={{ fontFamily: "'Noto Serif KR',Georgia,serif", fontSize: 24, fontWeight: 900, color: '#111109', marginBottom: 8 }}>예약이 완료됐어요! 🎉</h2>
            <p style={{ fontSize: 14, color: '#595952', lineHeight: 1.7, marginBottom: 28 }}>입력하신 정보로 예약이 접수됐어요.<br />3영업일 내에 확정 안내 연락을 드릴게요.</p>
            <div style={{ background: '#FAF9F5', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {[['책 제목', title],['에디션', `${activeTheme.year}년 ${activeTheme.material.replace('_',' ')}`],['예상 배송', '예약 확정 후 21일'],['금액', '39,900원 (확정 후 결제)']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#767676' }}>{l}</span>
                  <span style={{ fontWeight: 700, color: '#1A1A14' }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSuccess(false)} style={{ width: '100%', padding: 14, border: 'none', borderRadius: 14, background: '#5A7898', color: 'white', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}
