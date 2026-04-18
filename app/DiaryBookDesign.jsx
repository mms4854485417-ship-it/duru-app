'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ══════════════════════════════════════════════════════════════════════════════
// 서머 쿨톤 팔레트 — 차분하고 회색빛 도는 쿨 베이스
// ══════════════════════════════════════════════════════════════════════════════
const COOL_SUMMER = {
  covers: [
    {
      id: 'ash-blue',
      name: '애쉬 블루',
      bg: '#8FA8C0', bgEnd: '#7090AC',
      spine: '#5A7898', spineEnd: '#3D6080',
      text: '#EEF3F8', textDim: 'rgba(238,243,248,0.5)',
      linen: 'rgba(120,160,200,0.08)',
    },
    {
      id: 'dusty-rose',
      name: '더스티 로즈',
      bg: '#BFA0A8', bgEnd: '#A88090',
      spine: '#8A6870', spineEnd: '#6E5058',
      text: '#FFF5F5', textDim: 'rgba(255,245,245,0.5)',
      linen: 'rgba(180,130,140,0.08)',
    },
    {
      id: 'muted-lavender',
      name: '뮤트 라벤더',
      bg: '#A898C0', bgEnd: '#907AA8',
      spine: '#705888', spineEnd: '#503868',
      text: '#F5F2FF', textDim: 'rgba(245,242,255,0.5)',
      linen: 'rgba(150,130,190,0.08)',
    },
    {
      id: 'blue-gray',
      name: '블루 그레이',
      bg: '#8898A8', bgEnd: '#6878A0',
      spine: '#485870', spineEnd: '#303848',
      text: '#F0F4F8', textDim: 'rgba(240,244,248,0.5)',
      linen: 'rgba(100,130,168,0.08)',
    },
  ],

  // 내지 타이포그래피 색상
  page:   '#F9F8F6',
  ink:    '#1E1C18',
  sub:    '#6A6460',
  faint:  '#C0B8B0',
  rule:   'rgba(0,0,0,0.07)',
  star:   '#B8A080',   // 감정 별 색상
};

// ══════════════════════════════════════════════════════════════════════════════
// 감정 데이터 정의
// ══════════════════════════════════════════════════════════════════════════════
const EMOTIONS = {
  '기쁨':   { symbol: '✦', color: '#C8A040', glow: 'rgba(200,160,64,0.4)',  y: 12 },
  '설렘':   { symbol: '✺', color: '#B87888', glow: 'rgba(184,120,136,0.38)',y: 26 },
  '평온':   { symbol: '◈', color: '#6898B8', glow: 'rgba(104,152,184,0.38)',y: 44 },
  '외로움': { symbol: '◇', color: '#7898A0', glow: 'rgba(120,152,160,0.35)',y: 62 },
  '우울':   { symbol: '▽', color: '#5878A0', glow: 'rgba(88,120,160,0.35)', y: 76 },
  '공허함': { symbol: '○', color: '#9090A8', glow: 'rgba(144,144,168,0.32)',y: 88 },
};

// 샘플 월간 데이터 (3월)
const SAMPLE_MONTH = [
  { day:1,  e:'평온'   }, { day:3,  e:'기쁨'   }, { day:5,  e:'설렘'   },
  { day:7,  e:'평온'   }, { day:9,  e:'외로움' }, { day:11, e:'우울'   },
  { day:13, e:'외로움' }, { day:15, e:'평온'   }, { day:17, e:'기쁨'   },
  { day:19, e:'설렘'   }, { day:21, e:'기쁨'   }, { day:23, e:'평온'   },
  { day:25, e:'외로움' }, { day:27, e:'우울'   }, { day:29, e:'평온'   },
  { day:31, e:'기쁨'   },
];

const DIARY_A = {
  date: '2026년 3월 14일', day: '목요일', emotion: '기쁨',
  title: '퇴근길 벚꽃',
  body: [
    '퇴근하면서 지하철역 앞 벚꽃길을 지나쳤다. 올해도 어김없이 피었구나 싶었는데, 왠지 모르게 가슴이 찡했다.',
    '작년 이맘때 같이 보던 사람이 생각나서인지, 아니면 그냥 계절이 바뀌는 게 실감 나서인지 잘 모르겠다. 꽃이 예쁠수록 더 외로운 기분이 드는 건 나만의 감정인가.',
    '그래도 오늘은 이 길을 혼자 걸어도 충분히 좋았다. 어쩌면 혼자이기에 더 오래 들여다볼 수 있었던 것 같다.',
  ],
  pageNum: 24,
};

const DIARY_B = {
  date: '2026년 5월 3일', day: '일요일', emotion: '평온',
  title: '오래된 카페에서',
  body: [
    '오랜만에 혼자 카페에 앉아 책을 읽었다. 창밖으로 비가 내리고, 잔잔한 음악이 흘렀다.',
    '이런 오후가 가끔 필요하다는 걸 새삼 느꼈다. 아무것도 하지 않는 것이 오히려 충전이 되는 날이 있다. 오늘이 그런 날이었다.',
    '돌아오는 길, 빗소리가 발걸음과 박자를 맞췄다.',
  ],
  pageNum: 58,
};

// ══════════════════════════════════════════════════════════════════════════════
// 메인 — 쇼케이스 컨테이너
// ══════════════════════════════════════════════════════════════════════════════
export default function DiaryBookDesign() {
  const [activeCover, setActiveCover] = useState(COOL_SUMMER.covers[0]);
  const [activeTab,   setActiveTab]   = useState('cover'); // 'cover' | 'interior' | 'constellation'

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F2F0EC',
        fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
      }}
    >
      {/* ── 상단 탭 ─────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(242,240,236,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 4, padding: '12px 20px',
      }}>
        {[
          { id: 'cover',         label: '하드커버' },
          { id: 'interior',      label: '내지 에세이' },
          { id: 'constellation', label: '별자리 그래프' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '7px 16px',
              borderRadius: 20,
              border: 'none',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              transition: 'all .2s',
              fontFamily: 'inherit',
              background: activeTab === t.id ? '#1E1C18' : 'transparent',
              color:      activeTab === t.id ? '#FFFFFF' : '#888',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'cover' && (
          <motion.div key="cover"
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            transition={{ duration:.3 }}
          >
            <CoverSection activeCover={activeCover} setActiveCover={setActiveCover} />
          </motion.div>
        )}
        {activeTab === 'interior' && (
          <motion.div key="interior"
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            transition={{ duration:.3 }}
          >
            <InteriorSection />
          </motion.div>
        )}
        {activeTab === 'constellation' && (
          <motion.div key="constellation"
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            transition={{ duration:.3 }}
          >
            <ConstellationSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. 하드커버 목업 섹션
// ══════════════════════════════════════════════════════════════════════════════
function CoverSection({ activeCover: cv, setActiveCover }) {
  return (
    <div style={{ padding: '40px 20px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>

      {/* 커버 목업 */}
      <div style={{ position: 'relative' }}>

        {/* 멀티레이어 드롭섀도 */}
        <div style={{ position: 'absolute', bottom: -10, left: '10%', right: '10%', height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.22)', filter: 'blur(16px)' }} />
        <div style={{ position: 'absolute', bottom: -22, left: '5%', right: '5%',  height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.12)', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', bottom: -36, left: 0,   right: 0,     height: 50, borderRadius: '50%', background: 'rgba(0,0,0,0.06)', filter: 'blur(50px)' }} />

        <motion.div
          animate={{ background: `linear-gradient(155deg, ${cv.bg} 0%, ${cv.bgEnd} 100%)` }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{
            width: 240, height: 320,
            borderRadius: '4px 16px 16px 4px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: [
              `4px 0 0 ${cv.spine}`,
              '8px 12px 32px rgba(0,0,0,0.20)',
              '16px 24px 60px rgba(0,0,0,0.12)',
            ].join(', '),
          }}
        >
          {/* ── 린넨 텍스처 레이어 ───────────────────────────────────── */}
          <LinenTexture tint={cv.linen} />

          {/* 책등 그림자 */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 20,
            background: 'linear-gradient(to right, rgba(0,0,0,0.22), transparent)',
            pointerEvents: 'none', zIndex: 10,
          }} />

          {/* 상단 하이라이트 */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(140deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, transparent 65%)',
            pointerEvents: 'none', zIndex: 10,
          }} />

          {/* 엠보싱 테두리 */}
          <div style={{
            position: 'absolute', inset: 12,
            border: `1px solid ${cv.textDim}`,
            borderRadius: 6,
            pointerEvents: 'none', zIndex: 11,
          }} />
          <div style={{
            position: 'absolute', inset: 14,
            border: `0.5px solid ${cv.textDim}`,
            borderRadius: 5,
            pointerEvents: 'none', zIndex: 11,
          }} />

          {/* 콘텐츠 */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20,
            padding: '28px 24px 24px 30px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              {/* 브랜드 */}
              <motion.div
                animate={{ color: cv.textDim }}
                style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.28em', marginBottom: 18, fontFamily: 'Georgia, serif' }}
              >
                DURU · DIARY
              </motion.div>

              {/* 메인 타이틀 */}
              <motion.div
                animate={{ color: cv.text }}
                style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.2, letterSpacing: '-.02em', marginBottom: 12, fontFamily: 'Georgia, serif', wordBreak: 'keep-all' }}
              >
                나의<br />2026년
              </motion.div>

              {/* 디코 라인 */}
              <motion.div animate={{ background: cv.textDim }} style={{ height: 1, width: 40, marginBottom: 10 }} />
              <motion.div animate={{ background: cv.textDim }} style={{ height: 1, width: 28, opacity: 0.5 }} />
            </div>

            {/* 두루 엠블럼 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <motion.div
                animate={{ color: cv.textDim }}
                style={{ fontSize: 8, letterSpacing: '.18em', fontFamily: 'Georgia, serif' }}
              >
                HARDCOVER EDITION
              </motion.div>
              <motion.div animate={{ opacity: 0.25 }}>
                <DuruEmblem color={cv.text} size={28} />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* 하드커버 측면 두께 */}
        <motion.div
          animate={{ background: `linear-gradient(to right, ${cv.spineEnd}, ${cv.spine})` }}
          transition={{ duration: 0.55 }}
          style={{
            position: 'absolute', top: 4, bottom: 4, left: -18, width: 18,
            borderRadius: '4px 0 0 4px',
            overflow: 'hidden',
            boxShadow: '-2px 4px 12px rgba(0,0,0,0.25)',
          }}
        >
          {/* 측면 텍스처 줄 */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(to bottom, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
          }} />
          {/* 측면 하이라이트 */}
          <div style={{
            position: 'absolute', top: 0, left: 3, bottom: 0, width: 1,
            background: 'rgba(255,255,255,0.2)',
          }} />
        </motion.div>
      </div>

      {/* 컬러 스와치 선택 */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.22em', color: '#BBB', textAlign: 'center', marginBottom: 16, fontFamily: 'Georgia, serif' }}>
          COVER COLOR
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          {COOL_SUMMER.covers.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCover(c)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
            >
              <motion.div
                animate={{
                  boxShadow: c.id === activeCover.id
                    ? `0 0 0 2.5px #1E1C18, 0 6px 20px ${c.bg}60`
                    : `0 3px 12px rgba(0,0,0,0.12)`,
                  scale: c.id === activeCover.id ? 1.12 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                style={{
                  width: 52, height: 52,
                  borderRadius: 10,
                  background: `linear-gradient(145deg, ${c.bg}, ${c.bgEnd})`,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* 린넨 힌트 */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px), repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.018) 3px, rgba(0,0,0,0.018) 4px)`,
                }} />
              </motion.div>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: c.id === activeCover.id ? '#1E1C18' : '#BBBBBB',
                transition: 'color .2s',
              }}>
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 린넨 텍스처 설명 라벨 */}
      <div style={{
        textAlign: 'center',
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.03)',
        borderRadius: 14,
        maxWidth: 320,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#AAAAAA', letterSpacing: '.1em', marginBottom: 4 }}>린넨 하드커버 소재</div>
        <div style={{ fontSize: 12, color: '#888', lineHeight: 1.65 }}>
          자연스러운 직물 결이 살아있는 린넨 소재에<br />
          서머 쿨톤 컬러를 입힌 하드커버입니다.
        </div>
      </div>
    </div>
  );
}

// ── 린넨 텍스처 CSS 레이어 ────────────────────────────────────────────────────
function LinenTexture({ tint = 'rgba(0,0,0,0.05)' }) {
  return (
    <>
      {/* 수평 직물 실 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent 0px, transparent 2px,
            ${tint.replace('0.08', '0.045')} 2px, ${tint.replace('0.08', '0.045')} 3px
          )
        `,
      }} />
      {/* 수직 직물 실 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
        backgroundImage: `
          repeating-linear-gradient(
            90deg,
            transparent 0px, transparent 3px,
            ${tint.replace('0.08', '0.03')} 3px, ${tint.replace('0.08', '0.03')} 4px
          )
        `,
      }} />
      {/* 대각 직물 결 — 린넨 특유의 거칠한 질감 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4,
        backgroundImage: `
          repeating-linear-gradient(
            47deg,
            transparent 0px, transparent 5px,
            ${tint.replace('0.08', '0.022')} 5px, ${tint.replace('0.08', '0.022')} 6px
          ),
          repeating-linear-gradient(
            133deg,
            transparent 0px, transparent 5px,
            ${tint.replace('0.08', '0.015')} 5px, ${tint.replace('0.08', '0.015')} 6px
          )
        `,
      }} />
      {/* 미세 노이즈 — 실의 굵기 변화 시뮬레이션 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
        background: `
          radial-gradient(ellipse 60% 40% at 25% 35%, rgba(255,255,255,0.08) 0%, transparent 65%),
          radial-gradient(ellipse 40% 30% at 80% 70%, rgba(0,0,0,0.04) 0%, transparent 55%)
        `,
      }} />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. 내지 에세이 레이아웃 섹션
// ══════════════════════════════════════════════════════════════════════════════
function InteriorSection() {
  const [page, setPage] = useState(0);
  const entries = [DIARY_A, DIARY_B];
  const entry = entries[page];

  return (
    <div style={{ padding: '32px 0 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 8 }}>
        {entries.map((e, i) => (
          <button key={i} onClick={() => setPage(i)} style={{
            padding: '6px 16px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            background: page === i ? '#1E1C18' : 'rgba(0,0,0,0.06)',
            color:      page === i ? '#FFF' : '#888',
            transition: 'all .2s',
          }}>
            {e.title}
          </button>
        ))}
      </div>

      {/* 책 내지 페이지 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={entry.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
          style={{
            width: 340, minHeight: 460,
            background: COOL_SUMMER.page,
            borderRadius: 2,
            // 책 펼침 그림자
            boxShadow: [
              '-4px 0 8px rgba(0,0,0,0.06)',
              '0 4px 24px rgba(0,0,0,0.10)',
              '0 12px 48px rgba(0,0,0,0.06)',
            ].join(', '),
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 내지 종이 질감 */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 80% 60% at 78% 15%, rgba(255,252,245,0.5) 0%, transparent 60%),
              repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.025) 28px, rgba(0,0,0,0.025) 29px)
            `,
          }} />

          {/* 좌측 제본 선 */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 24,
            background: 'linear-gradient(to right, rgba(0,0,0,0.05), transparent)',
            pointerEvents: 'none',
          }} />

          {/* 에세이 컨텐츠 */}
          <EssayLayout entry={entry} />
        </motion.div>
      </AnimatePresence>

      {/* 레이아웃 설명 */}
      <TypographySpec />
    </div>
  );
}

// ── 에세이 레이아웃 ───────────────────────────────────────────────────────────
function EssayLayout({ entry }) {
  const emo = EMOTIONS[entry.emotion];

  return (
    <div style={{
      padding: '40px 36px 36px 40px',
      height: '100%', position: 'relative', zIndex: 10,
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── 메타 헤더 ─────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        {/* 날짜 + 감정 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 6,
        }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '.22em',
            color: COOL_SUMMER.faint, fontFamily: 'Georgia, serif',
          }}>
            {entry.date.replace('2026년 ', '').replace('일', '').replace(' ', '·')} {entry.day?.slice(0,1)}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: COOL_SUMMER.faint }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: emo.color, letterSpacing: '.08em' }}>
            {entry.emotion}
          </span>
        </div>

        {/* 구분선 — 가는 룰 */}
        <div style={{ height: '0.5px', background: COOL_SUMMER.rule, marginBottom: 16 }} />

        {/* 제목 — Serif 대형 타이포 */}
        <h1 style={{
          margin: 0,
          fontSize: 26,
          fontWeight: 900,
          lineHeight: 1.18,
          letterSpacing: '-.025em',
          color: COOL_SUMMER.ink,
          fontFamily: 'Georgia, "Noto Serif KR", serif',
          wordBreak: 'keep-all',
          marginBottom: 4,
        }}>
          {entry.title}
        </h1>

        {/* 드롭 캡 장식선 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
        }}>
          <div style={{ height: '0.5px', flex: 1, background: COOL_SUMMER.rule }} />
          <span style={{ fontSize: 11, color: COOL_SUMMER.faint, letterSpacing: '.15em', fontFamily: 'Georgia, serif' }}>✦</span>
          <div style={{ height: '0.5px', width: 20, background: COOL_SUMMER.rule }} />
        </div>
      </div>

      {/* ── 본문 에세이 ────────────────────────────────── */}
      <div style={{ flex: 1 }}>
        {entry.body.map((para, i) => (
          <p key={i} style={{
            margin: 0,
            marginBottom: i < entry.body.length - 1 ? 18 : 0,
            fontSize: 13.5,
            // 황금비율 행간: 1.95 (전통 북디자인 기준 1.8-2.0)
            lineHeight: 1.95,
            // 자간: 한국어 본문 최적값 0.02-0.03em
            letterSpacing: '0.025em',
            color: COOL_SUMMER.ink,
            wordBreak: 'keep-all',
            wordSpacing: '0.05em',
            textAlign: 'justify',
            // 첫 문단에만 첫 글자 스타일 (드롭 캡)
            ...(i === 0 ? {} : {}),
          }}>
            {/* 첫 문단 첫 글자 강조 */}
            {i === 0 ? (
              <>
                <span style={{
                  float: 'left',
                  fontSize: 42,
                  lineHeight: 0.82,
                  marginRight: 4,
                  marginTop: 4,
                  fontFamily: 'Georgia, serif',
                  fontWeight: 900,
                  color: COOL_SUMMER.sub,
                }}>
                  {para[0]}
                </span>
                {para.slice(1)}
              </>
            ) : para}
          </p>
        ))}
      </div>

      {/* ── 하단 — 감정 별 + 페이지 정보 ──────────────── */}
      <div style={{
        marginTop: 28,
        paddingTop: 14,
        borderTop: `0.5px solid ${COOL_SUMMER.rule}`,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}>
        {/* 감정 별 심볼 (페이지 번호 대체) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 14, color: emo.color,
            filter: `drop-shadow(0 0 4px ${emo.glow})`,
          }}>
            {emo.symbol}
          </span>
          <span style={{
            fontSize: 8, fontWeight: 600, letterSpacing: '.14em',
            color: COOL_SUMMER.faint, fontFamily: 'Georgia, serif',
          }}>
            {entry.emotion?.toUpperCase()}
          </span>
        </div>

        {/* 페이지 번호 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 16, height: '0.5px', background: COOL_SUMMER.faint }} />
          <span style={{
            fontSize: 9, fontWeight: 600, letterSpacing: '.12em',
            color: COOL_SUMMER.faint, fontFamily: 'Georgia, serif',
          }}>
            {String(entry.pageNum).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── 타이포그래피 스펙 설명 ────────────────────────────────────────────────────
function TypographySpec() {
  const specs = [
    { label: '본문 행간', value: '× 1.95', note: '전통 북디자인 황금비율' },
    { label: '자간',     value: '0.025em', note: '한국어 가독성 최적값' },
    { label: '외부 여백', value: '40px',  note: '내부 여백보다 4px 큰 비대칭 구조' },
    { label: '제목 폰트', value: 'Georgia', note: 'Serif 혼용으로 잡지 질감' },
  ];

  return (
    <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em', color: '#BBBBBB', marginBottom: 10, textAlign: 'center' }}>
        TYPOGRAPHY SPEC
      </div>
      {specs.map(s => (
        <div key={s.label} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 14px',
          background: 'rgba(0,0,0,0.03)',
          borderRadius: 8,
        }}>
          <span style={{ fontSize: 11, color: '#888', flex: 1 }}>{s.label}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#1E1C18', fontFamily: 'Georgia, serif' }}>{s.value}</span>
          <span style={{ fontSize: 10, color: '#BBBBBB', textAlign: 'right', minWidth: 120 }}>{s.note}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. 감정 별자리 그래프 섹션
// ══════════════════════════════════════════════════════════════════════════════
function ConstellationSection() {
  const [month,   setMonth]   = useState('3월');
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ padding: '32px 20px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

      {/* 월 선택 */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['1월','2월','3월','4월','5월'].map(m => (
          <button key={m} onClick={() => setMonth(m)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            background: month === m ? '#0E0C0A' : 'rgba(0,0,0,0.06)',
            color: month === m ? '#E8D4A8' : '#888',
            transition: 'all .2s',
          }}>{m}</button>
        ))}
      </div>

      {/* 별자리 카드 */}
      <ConstellationChart data={SAMPLE_MONTH} month={month} hovered={hovered} setHovered={setHovered} />

      {/* 범례 */}
      <ConstellationLegend hovered={hovered} />
    </div>
  );
}

// ── 별자리 SVG 차트 ───────────────────────────────────────────────────────────
function ConstellationChart({ data, month, hovered, setHovered }) {
  const W = 340, H = 240;
  const PAD = { top: 20, bottom: 32, left: 24, right: 24 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // 각 데이터 포인트를 (x, y) 좌표로 변환
  const points = useMemo(() => data.map(d => {
    const emo = EMOTIONS[d.e] || EMOTIONS['평온'];
    const x = PAD.left + ((d.day - 1) / 30) * chartW;
    const y = PAD.top  + (emo.y / 100) * chartH;
    return { ...d, x, y, emo };
  }), [data, chartW, chartH]);

  // 부드러운 베지어 곡선 경로 생성
  const pathD = useMemo(() => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i], p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      // 감정 전환의 흐름 — 수직 방향 제어점은 약간 아래로 당김 (무게감)
      d += ` C ${cpX} ${p0.y + (p1.y - p0.y) * 0.15}, ${cpX} ${p1.y - (p1.y - p0.y) * 0.15}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  // 영역 채움용 닫힌 경로
  const areaD = pathD + ` L ${points[points.length-1].x} ${H} L ${points[0].x} ${H} Z`;

  return (
    <div style={{
      width: W, borderRadius: 20, overflow: 'hidden',
      background: 'linear-gradient(160deg, #0C0B09 0%, #14120E 60%, #0A0908 100%)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
      position: 'relative',
    }}>
      {/* 배경 성운 — 은하 분위기 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 60% 40% at 30% 30%, rgba(104,152,184,0.07) 0%, transparent 70%),
          radial-gradient(ellipse 40% 30% at 75% 70%, rgba(184,120,136,0.06) 0%, transparent 65%),
          radial-gradient(ellipse 30% 25% at 55% 20%, rgba(200,160,64,0.05) 0%, transparent 60%)
        `,
      }} />

      {/* 헤더 */}
      <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.22em', color: 'rgba(200,160,64,0.6)', fontFamily: 'Georgia, serif', marginBottom: 3 }}>
            EMOTIONAL CONSTELLATION
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'white', letterSpacing: '-.01em' }}>
            {month} 감정 별자리
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'Georgia, serif' }}>
          {data.length}일 기록
        </div>
      </div>

      {/* SVG 차트 */}
      <svg
        width={W} height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          {/* 영역 페이드 그라데이션 */}
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(104,152,184,0.12)" />
            <stop offset="100%" stopColor="rgba(104,152,184,0)"    />
          </linearGradient>

          {/* 각 감정별 글로우 */}
          {Object.entries(EMOTIONS).map(([name, emo]) => (
            <radialGradient key={name} id={`glow-${name}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={emo.color} stopOpacity="0.7" />
              <stop offset="100%" stopColor={emo.color} stopOpacity="0"   />
            </radialGradient>
          ))}

          {/* 라인 글로우 필터 */}
          <filter id="line-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* 수평 그리드 선 (감정 레벨별) */}
        {Object.entries(EMOTIONS).map(([name, emo]) => {
          const gy = PAD.top + (emo.y / 100) * chartH;
          return (
            <g key={name}>
              <line
                x1={PAD.left} y1={gy} x2={W - PAD.right} y2={gy}
                stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="3 6"
              />
              <text
                x={PAD.left - 4} y={gy + 3}
                textAnchor="end" fontSize="7" fontWeight="600"
                fill="rgba(255,255,255,0.2)"
              >
                {name}
              </text>
            </g>
          );
        })}

        {/* 감정 경로 — 영역 채움 */}
        <path d={areaD} fill="url(#area-grad)" />

        {/* 감정 경로 — 메인 곡선 (글로우 포함) */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(104,152,184,0.18)"
          strokeWidth="3"
          filter="url(#line-glow)"
        />
        <path
          d={pathD}
          fill="none"
          stroke="rgba(104,152,184,0.55)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 별 데이터 포인트 */}
        {points.map((p, i) => {
          const isHovered = hovered === i;
          const starR = 3.5 + (p.emo.y < 30 || p.emo.y > 70 ? 1.5 : 0); // 극단 감정 별은 약간 크게
          return (
            <g
              key={i}
              onMouseEnter={() => setHovered(i)}
              style={{ cursor: 'pointer' }}
            >
              {/* 글로우 후광 */}
              <circle
                cx={p.x} cy={p.y}
                r={isHovered ? starR * 5 : starR * 3.5}
                fill={`url(#glow-${p.e})`}
                style={{ transition: 'r .2s' }}
              />
              {/* 별 본체 */}
              <motion.circle
                cx={p.x} cy={p.y}
                r={isHovered ? starR * 1.6 : starR}
                fill={p.emo.color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.04, duration: 0.35, ease: 'backOut' }}
                style={{ transition: 'r .2s' }}
              />
              {/* 중심 하이라이트 */}
              <circle
                cx={p.x - starR * 0.3}
                cy={p.y - starR * 0.3}
                r={starR * 0.35}
                fill="rgba(255,255,255,0.75)"
              />
              {/* 호버 시 날짜 + 감정 툴팁 */}
              {isHovered && (
                <g>
                  <rect
                    x={p.x - 26} y={p.y - 30}
                    width={52} height={20}
                    rx={4}
                    fill="rgba(30,28,24,0.9)"
                    stroke={p.emo.color}
                    strokeWidth="0.5"
                  />
                  <text
                    x={p.x} y={p.y - 17}
                    textAnchor="middle"
                    fontSize="8" fontWeight="700"
                    fill="white"
                  >
                    {p.day}일 · {p.e}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* X축 날짜 레이블 */}
        {[1, 7, 14, 21, 28, 31].map(d => {
          const px = PAD.left + ((d - 1) / 30) * chartW;
          return (
            <text key={d} x={px} y={H - 8}
              textAnchor="middle" fontSize="7" fontWeight="600"
              fill="rgba(255,255,255,0.2)"
            >
              {d}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ── 별자리 범례 ───────────────────────────────────────────────────────────────
function ConstellationLegend({ hovered }) {
  return (
    <div style={{ width: 340 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em', color: '#BBBBBB', textAlign: 'center', marginBottom: 12, fontFamily: 'Georgia, serif' }}>
        EMOTION INDEX
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', justifyContent: 'center' }}>
        {Object.entries(EMOTIONS).map(([name, emo]) => (
          <div key={name} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            background: 'rgba(0,0,0,0.05)',
            borderRadius: 20,
            transition: 'all .2s',
          }}>
            <span style={{ fontSize: 13, color: emo.color, filter: `drop-shadow(0 0 3px ${emo.glow})` }}>
              {emo.symbol}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 공용 — 두루 엠블럼 SVG
// ══════════════════════════════════════════════════════════════════════════════
function DuruEmblem({ color = '#5A3E1B', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <ellipse cx="13" cy="5.5" rx="2.6" ry="4"   fill={color} />
      <ellipse cx="7"  cy="9"   rx="2.6" ry="4"   fill={color} transform="rotate(35 7 9)" />
      <ellipse cx="19" cy="9"   rx="2.6" ry="4"   fill={color} transform="rotate(-35 19 9)" />
      <ellipse cx="13" cy="16.5" rx="5"  ry="4.2" fill={color} />
      <ellipse cx="13" cy="21.5" rx="1.8" ry="2.8" fill={color} />
    </svg>
  );
}
