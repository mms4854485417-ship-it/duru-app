'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';

// ── 데이터 ────────────────────────────────────────────────────────────────────

const COVERS = [
  { id: 'warm',   name: '웜베이지', bg: '#F5E8C7', bgEnd: '#E2CFA0', spine: '#C4A060', spineEnd: '#A8843C', text: '#5A3E1B', dark: false },
  { id: 'forest', name: '포레스트', bg: '#3D5643', bgEnd: '#28402E', spine: '#1C2F20', spineEnd: '#131F16', text: '#C8DFC8', dark: true  },
  { id: 'slate',  name: '슬레이트', bg: '#4A5568', bgEnd: '#323D4E', spine: '#212836', spineEnd: '#161D28', text: '#C0CDE0', dark: true  },
  { id: 'blush',  name: '블러시',   bg: '#E8C0C0', bgEnd: '#D4A0A0', spine: '#B07878', spineEnd: '#905858', text: '#4A2020', dark: false },
];

const EMOTIONS = [
  { name: '기쁨',   value: 38, color: '#E8B84B', glow: 'rgba(232,184,75,0.45)',  cx: 50, cy: 15 },
  { name: '평온',   value: 27, color: '#6BAED6', glow: 'rgba(107,174,214,0.40)', cx: 85, cy: 48 },
  { name: '외로움', value: 18, color: '#8FA8A8', glow: 'rgba(143,168,168,0.38)', cx: 68, cy: 82 },
  { name: '우울',   value: 11, color: '#5D8AA8', glow: 'rgba(93,138,168,0.35)',  cx: 28, cy: 75 },
  { name: '설렘',   value: 6,  color: '#E8908A', glow: 'rgba(232,144,138,0.35)', cx: 14, cy: 42 },
];

const DIARY_ENTRIES = [
  {
    date: '3월 14일', emotion: '기쁨', emotionColor: '#E8B84B',
    title: '퇴근길 벚꽃',
    body: '퇴근하면서 지하철역 앞 벚꽃길을 지나쳤다. 올해도 어김없이 피었구나 싶었는데, 왠지 모르게 가슴이 찡했다. 작년 이맘때 같이 보던 사람이 생각나서인지.',
  },
  {
    date: '5월 3일', emotion: '평온', emotionColor: '#6BAED6',
    title: '오래된 카페에서',
    body: '오랜만에 혼자 카페에 앉아 책을 읽었다. 창밖으로 비가 내리고, 잔잔한 음악이 흘렀다. 이런 오후가 가끔 필요하다는 걸 새삼 느꼈다.',
  },
];

function getPreviewPages() {
  return [
    { type: 'title',       label: '표제지' },
    { type: 'constellation', label: '감정 여정' },
    { type: 'diary',       label: '일기 본문', entry: DIARY_ENTRIES[0] },
    { type: 'diary',       label: '일기 본문', entry: DIARY_ENTRIES[1] },
  ];
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function shiftHex(hex, amt) {
  try {
    const n = hex.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(n.slice(0, 2), 16) + amt));
    const g = Math.max(0, Math.min(255, parseInt(n.slice(2, 4), 16) + amt));
    const b = Math.max(0, Math.min(255, parseInt(n.slice(4, 6), 16) + amt));
    return `rgb(${r},${g},${b})`;
  } catch { return hex; }
}

// ── 메인 ──────────────────────────────────────────────────────────────────────

export default function BookCustomizePage({ onBack }) {
  const [cover,       setCover]       = useState(COVERS[0]);
  const [period,      setPeriod]      = useState('올해 전체');
  const [title,       setTitle]       = useState('나의 2026년');
  const [showPreview, setShowPreview] = useState(false);
  const [previewIdx,  setPreviewIdx]  = useState(0);
  const [ordered,     setOrdered]     = useState(false);
  const touchStartX = useRef(null);
  const pages = getPreviewPages();

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40)
      setPreviewIdx(p => dx < 0 ? Math.min(p + 1, pages.length - 1) : Math.max(p - 1, 0));
    touchStartX.current = null;
  }

  function handleOrder() {
    setOrdered(true);
    setTimeout(() => setOrdered(false), 2600);
  }

  return (
    <div className="min-h-screen flex justify-center" style={{ background: '#F7F4EE' }}>
      <div className="w-full max-w-[390px] flex flex-col relative overflow-hidden">

        {/* ── 헤더 ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-12 pb-1 flex-shrink-0 relative z-20">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(26,26,20,0.07)' }}
          >
            <ChevronLeft size={20} strokeWidth={2.5} className="text-[#1A1A14]" />
          </motion.button>

          {/* 타이포그래피 믹스 헤더 */}
          <div className="text-center">
            <div className="flex items-baseline gap-1 justify-center">
              <span
                className="text-[11px] font-black tracking-[.18em] uppercase"
                style={{ color: '#BBAB90', fontFamily: 'Georgia, serif', letterSpacing: '.22em' }}
              >
                My
              </span>
              <span className="text-[15px] font-black text-[#1A1A14]">Book</span>
              <span
                className="text-[11px] font-black tracking-[.18em] uppercase"
                style={{ color: '#BBAB90', fontFamily: 'Georgia, serif' }}
              >
                Studio
              </span>
            </div>
            <div
              className="text-[10px] font-medium tracking-[.3em] uppercase mt-0.5"
              style={{ color: '#C8B898', fontFamily: 'Georgia, serif' }}
            >
              Hardcover Edition
            </div>
          </div>

          <div className="w-9" />
        </div>

        {/* ── 스텝 인디케이터 ───────────────────────────────── */}
        <div className="flex items-center gap-1.5 justify-center py-3 flex-shrink-0">
          {[1, 2, 3].map(s => (
            <motion.div
              key={s}
              animate={{ width: s === 1 ? 22 : 6 }}
              transition={{ duration: 0.3 }}
              className="rounded-full"
              style={{ height: 4, background: s === 1 ? '#1A1A14' : 'rgba(0,0,0,0.12)' }}
            />
          ))}
        </div>

        {/* ── 스크롤 영역 ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto pb-36">

          {/* Hero: 책 목업 + 원형 그라데이션 배경 */}
          <HeroSection cover={cover} title={title} />

          <div className="px-5">

            {/* 표지 디자인 */}
            <SectionLabel serif="Design" sans="표지 컬러" />
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {COVERS.map(c => (
                <CoverSwatch
                  key={c.id}
                  cover={c}
                  selected={cover.id === c.id}
                  onClick={() => setCover(c)}
                />
              ))}
            </div>

            {/* 수록 기간 */}
            <SectionLabel serif="Period" sans="수록 기간" />
            <div className="flex gap-2 mb-8 p-1 rounded-2xl" style={{ background: 'rgba(0,0,0,0.05)' }}>
              {['올해 전체', '상반기', '하반기'].map(p => (
                <motion.button
                  key={p}
                  onClick={() => setPeriod(p)}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-3 rounded-xl text-[13px] font-bold relative overflow-hidden"
                  style={{ color: period === p ? '#FFFFFF' : '#999999' }}
                >
                  {period === p && (
                    <motion.div
                      layoutId="period-pill"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: '#1A1A14' }}
                      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{p}</span>
                </motion.button>
              ))}
            </div>

            {/* 책 제목 */}
            <SectionLabel serif="Title" sans="책 제목" />
            <div className="relative mb-8">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="나의 2026년"
                maxLength={20}
                className="w-full px-4 py-4 rounded-2xl text-[16px] font-black outline-none transition-all duration-200"
                style={{
                  background: 'rgba(0,0,0,0.05)',
                  color: '#1A1A14',
                  border: '1.5px solid transparent',
                  fontFamily: 'Georgia, serif',
                  letterSpacing: '.02em',
                }}
                onFocus={e => { e.target.style.borderColor = '#1A1A14'; e.target.style.background = '#FFF'; }}
                onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = 'rgba(0,0,0,0.05)'; }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium" style={{ color: '#CCC' }}>
                {title.length}/20
              </span>
            </div>

            {/* 별자리 미리보기 티저 */}
            <ConstellationTeaser />

            {/* 특징 카드 */}
            <div className="flex flex-col gap-2.5 mb-7">
              {[
                { icon: '✦', label: 'Visual', title: '감정 별자리 수록',     sub: '당신의 한 해가 우주처럼 펼쳐집니다',     accent: '#E8B84B' },
                { icon: '◎', label: 'Story',  title: '일기 원문 그대로',      sub: '쓴 그대로, 감정 태그까지 인쇄됩니다',   accent: '#6BAED6' },
                { icon: '◈', label: 'Gift',   title: '리넨 선물 박스 패키지', sub: '열어보는 순간이 특별해지도록',           accent: '#C8A870' },
              ].map(item => (
                <FeatureCard key={item.title} {...item} />
              ))}
            </div>

            {/* 가격 카드 */}
            <PriceCard />

          </div>
        </div>

        {/* ── 하단 CTA ─────────────────────────────────────── */}
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-5 pb-10 pt-6"
          style={{ background: 'linear-gradient(to top, #F7F4EE 72%, transparent)' }}
        >
          <div className="flex gap-2.5">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => { setShowPreview(true); setPreviewIdx(0); }}
              className="flex-1 py-4 rounded-2xl text-[13px] font-bold"
              style={{
                border: '1.5px solid #1A1A14',
                color: '#1A1A14',
                background: 'transparent',
                fontFamily: 'inherit',
              }}
            >
              미리보기
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleOrder}
              className="flex-[2] py-4 rounded-2xl text-[15px] font-extrabold text-white"
              animate={{ background: ordered ? '#3D6B50' : '#1A1A14' }}
              transition={{ duration: 0.4 }}
              style={{ fontFamily: 'inherit' }}
            >
              {ordered ? '✓ 신청 완료!' : '예약 신청하기'}
            </motion.button>
          </div>
        </div>

        {/* ── 미리보기 모달 ─────────────────────────────────── */}
        <AnimatePresence>
          {showPreview && (
            <PreviewModal
              pages={pages}
              currentPage={previewIdx}
              setCurrentPage={setPreviewIdx}
              onClose={() => setShowPreview(false)}
              cover={cover}
              title={title}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection({ cover, title }) {
  return (
    <div className="relative flex justify-center py-10 overflow-hidden">

      {/* 원형 그라데이션 배경 */}
      <motion.div
        animate={{ background: `radial-gradient(ellipse 75% 65% at 50% 50%, ${cover.bg}60 0%, transparent 72%)` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* 은은한 노이즈 텍스처 느낌 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 70%, ${cover.bg}30 0%, transparent 50%),
                            radial-gradient(circle at 70% 20%, ${cover.bg}20 0%, transparent 50%)`,
        }}
      />

      {/* 멀티레이어 그림자 */}
      <div className="absolute bottom-6 left-1/2 pointer-events-none" style={{ transform: 'translateX(-48%)' }}>
        <div style={{ width: 160, height: 8, borderRadius: '50%', background: 'rgba(0,0,0,0.10)', filter: 'blur(6px)' }} />
        <div style={{ width: 130, height: 5, borderRadius: '50%', background: 'rgba(0,0,0,0.07)', filter: 'blur(10px)', marginTop: 3, marginLeft: 15 }} />
        <div style={{ width: 100, height: 3, borderRadius: '50%', background: 'rgba(0,0,0,0.04)', filter: 'blur(16px)', marginTop: 4, marginLeft: 30 }} />
      </div>

      {/* 3D 책 */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transform: 'perspective(700px) rotateY(-20deg)', transformStyle: 'preserve-3d', position: 'relative', display: 'inline-block' }}
      >
        {/* 앞표지 */}
        <motion.div
          animate={{
            background: `linear-gradient(145deg, ${cover.bg} 0%, ${cover.bgEnd} 100%)`,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative overflow-hidden"
          style={{
            width: 148, height: 200,
            borderRadius: '3px 14px 14px 3px',
            boxShadow: [
              '4px 0 0 rgba(0,0,0,0.20)',
              '6px 8px 20px rgba(0,0,0,0.18)',
              '10px 16px 40px rgba(0,0,0,0.12)',
              '14px 24px 60px rgba(0,0,0,0.07)',
            ].join(', '),
          }}
        >
          {/* 책등 그림자 */}
          <div className="absolute left-0 top-0 bottom-0 w-4 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.20), transparent)' }} />

          {/* 상단 하이라이트 */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(130deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 45%, transparent 65%)' }} />

          {/* 하단 빛 반사 */}
          <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.08), transparent)' }} />

          {/* 콘텐츠 */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 pl-6 z-20">
            <div>
              <motion.div
                animate={{ color: cover.dark ? 'rgba(255,255,255,0.45)' : 'rgba(90,62,27,0.40)' }}
                className="text-[8px] font-bold tracking-[.22em] mb-3 uppercase"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                DURU · DIARY
              </motion.div>
              <motion.div
                animate={{ color: cover.text }}
                className="text-[18px] font-black leading-tight break-keep"
                style={{ fontFamily: 'Georgia, serif', maxWidth: 90 }}
                key={title}
                initial={{ opacity: 0.6, y: 2 }}
                animate_={{ opacity: 1, y: 0 }}
              >
                {title || '나의\n2026년'}
              </motion.div>
              <motion.div
                animate={{ background: `${cover.text}25` }}
                className="h-px mt-3 w-12 rounded-full"
              />
            </div>

            {/* 두루 워터마크 */}
            <motion.div
              animate={{ opacity: 0.18 }}
              className="self-end"
            >
              <svg width="32" height="32" viewBox="0 0 26 26" fill="none">
                <ellipse cx="13" cy="5.5" rx="2.6" ry="4" fill={cover.text} />
                <ellipse cx="7" cy="9" rx="2.6" ry="4" fill={cover.text} transform="rotate(35 7 9)" />
                <ellipse cx="19" cy="9" rx="2.6" ry="4" fill={cover.text} transform="rotate(-35 19 9)" />
                <ellipse cx="13" cy="16.5" rx="5" ry="4.2" fill={cover.text} />
                <ellipse cx="13" cy="21.5" rx="1.8" ry="2.8" fill={cover.text} />
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* 측면 두께 */}
        <motion.div
          animate={{ background: `linear-gradient(to right, ${cover.spine}, ${cover.spineEnd})` }}
          transition={{ duration: 0.6 }}
          className="absolute top-1 bottom-1 rounded-r-sm overflow-hidden"
          style={{ right: -15, width: 15, boxShadow: '3px 4px 14px rgba(0,0,0,0.18)' }}
        >
          <div className="absolute inset-0"
            style={{ background: 'repeating-linear-gradient(to bottom, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)' }} />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Cover Swatch ──────────────────────────────────────────────────────────────

function CoverSwatch({ cover, selected, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className="flex flex-col items-center gap-2 flex-shrink-0 relative"
    >
      {/* 펄스 링 */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="pulse-outer"
              className="absolute rounded-[14px] pointer-events-none"
              style={{ inset: -5, border: `2px solid ${cover.bg}` }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: [0, 0.7, 0], scale: [0.85, 1.18, 1.28] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            <motion.div
              key="ring"
              className="absolute rounded-[14px] pointer-events-none"
              style={{ inset: -3, border: '2.5px solid #1A1A14' }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: 'backOut' }}
            />
          </>
        )}
      </AnimatePresence>

      {/* 스와치 */}
      <motion.div
        animate={{ scale: selected ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="relative overflow-hidden"
        style={{
          width: 72, height: 96,
          borderRadius: 12,
          background: `linear-gradient(145deg, ${cover.bg}, ${cover.bgEnd})`,
          boxShadow: selected
            ? `0 8px 24px ${cover.bg}80, 0 2px 8px rgba(0,0,0,0.12)`
            : '0 2px 10px rgba(0,0,0,0.09)',
        }}
      >
        {/* 책등 */}
        <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-xl"
          style={{ background: cover.spine }} />
        {/* 하이라이트 */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 60%)' }} />
        {/* 미니 타이틀 */}
        <div className="absolute inset-0 flex flex-col justify-end p-2 pl-3.5">
          <div className="text-[7px] font-black leading-tight" style={{ color: cover.text, opacity: 0.7, fontFamily: 'Georgia, serif' }}>
            나의<br />2026
          </div>
        </div>
      </motion.div>

      <span
        className="text-[11px] font-semibold transition-colors duration-200"
        style={{ color: selected ? '#1A1A14' : '#BBBBBB' }}
      >
        {cover.name}
      </span>
    </motion.button>
  );
}

// ── Constellation Teaser ──────────────────────────────────────────────────────

function ConstellationTeaser() {
  const controls = useAnimation();
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDrawn(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // 별을 연결하는 선 (인접 별 연결)
  const connections = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 2], [1, 3]];
  const W = 300, H = 160;

  const stars = EMOTIONS.map(e => ({
    ...e,
    x: (e.cx / 100) * W,
    y: (e.cy / 100) * H,
    r: 3 + (e.value / 38) * 7,   // 값 크기에 비례한 별 반지름
  }));

  return (
    <div
      className="relative mb-8 overflow-hidden rounded-3xl"
      style={{
        background: 'linear-gradient(160deg, #0E0D0B 0%, #1A1714 60%, #12110E 100%)',
        padding: '20px 20px 16px',
      }}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-2 relative z-10">
        <div>
          <div
            className="text-[11px] font-bold tracking-[.22em] uppercase mb-1"
            style={{ color: 'rgba(232,184,75,0.7)', fontFamily: 'Georgia, serif' }}
          >
            Emotional Constellation
          </div>
          <div className="text-[15px] font-black text-white">나의 감정 별자리</div>
          <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>2026년 127편의 일기</div>
        </div>
        <div
          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(232,184,75,0.15)', color: '#E8B84B', border: '1px solid rgba(232,184,75,0.25)' }}
        >
          Preview
        </div>
      </div>

      {/* SVG 성좌 */}
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          {stars.map(s => (
            <radialGradient key={`glow-${s.name}`} id={`glow-${s.name}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={s.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0"   />
            </radialGradient>
          ))}
        </defs>

        {/* 연결선 */}
        {connections.map(([a, b], i) => (
          <motion.line
            key={`line-${i}`}
            x1={stars[a].x} y1={stars[a].y}
            x2={stars[b].x} y2={stars[b].y}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.8"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={drawn ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: 'easeInOut' }}
          />
        ))}

        {/* 글로우 후광 */}
        {stars.map((s, i) => (
          <motion.circle
            key={`glow-circle-${s.name}`}
            cx={s.x} cy={s.y}
            r={s.r * 3.5}
            fill={`url(#glow-${s.name})`}
            initial={{ opacity: 0, scale: 0 }}
            animate={drawn ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.8 + i * 0.12, ease: 'easeOut' }}
          />
        ))}

        {/* 별 본체 */}
        {stars.map((s, i) => (
          <motion.g key={`star-${s.name}`}>
            {/* 깜빡임 */}
            <motion.circle
              cx={s.x} cy={s.y} r={s.r}
              fill={s.color}
              initial={{ opacity: 0, scale: 0 }}
              animate={drawn
                ? { opacity: [0, 1, 0.75, 1], scale: 1 }
                : {}}
              transition={{ duration: 0.45, delay: 0.6 + i * 0.12, ease: 'backOut' }}
            />
            {/* 중심 하이라이트 */}
            <motion.circle
              cx={s.x - s.r * 0.25} cy={s.y - s.r * 0.25}
              r={s.r * 0.35}
              fill="rgba(255,255,255,0.7)"
              initial={{ opacity: 0 }}
              animate={drawn ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: 1.0 + i * 0.12 }}
            />
            {/* 라벨 */}
            <motion.text
              x={s.x + (s.cx < 50 ? -(s.r + 5) : (s.r + 5))}
              y={s.y + 1}
              textAnchor={s.cx < 50 ? 'end' : 'start'}
              fontSize="8"
              fontWeight="600"
              fill="rgba(255,255,255,0.55)"
              initial={{ opacity: 0 }}
              animate={drawn ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: 1.1 + i * 0.1 }}
            >
              {s.name}
            </motion.text>
          </motion.g>
        ))}
      </svg>

      {/* 하단 범례 */}
      <motion.div
        className="flex gap-3 mt-3 flex-wrap"
        initial={{ opacity: 0, y: 6 }}
        animate={drawn ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 1.5 }}
      >
        {EMOTIONS.map(e => (
          <div key={e.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
            <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {e.name} {e.value}%
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── 미리보기 모달 ─────────────────────────────────────────────────────────────

function PreviewModal({ pages, currentPage, setCurrentPage, onClose, cover, title, onTouchStart, onTouchEnd }) {
  const page = pages[currentPage];

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: '#F7F4EE' }}
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3 flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(0,0,0,0.07)' }}
        >
          <X size={16} className="text-[#666]" />
        </motion.button>
        <div className="text-center">
          <div className="text-[14px] font-black text-[#1A1A14]">미리보기</div>
        </div>
        <span className="text-[12px] font-semibold" style={{ color: '#CCCCCC' }}>
          {currentPage + 1} / {pages.length}
        </span>
      </div>

      {/* 현재 페이지 라벨 */}
      <div className="px-5 mb-3 flex-shrink-0">
        <span
          className="text-[10px] font-bold tracking-[.25em] uppercase"
          style={{ color: '#C0B09A', fontFamily: 'Georgia, serif' }}
        >
          {page?.label}
        </span>
      </div>

      {/* 펼침 뷰어 */}
      <div
        className="mx-5 flex-shrink-0"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex relative overflow-hidden"
            style={{ height: 290, borderRadius: 14, boxShadow: '0 6px 32px rgba(0,0,0,0.13)' }}
          >
            {/* 왼쪽 페이지 */}
            <div className="w-1/2 h-full relative overflow-hidden" style={{ background: '#FEFCF8' }}>
              <div className="absolute right-0 top-0 bottom-0 w-6 pointer-events-none z-10"
                style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.08), transparent)' }} />
              {currentPage > 0
                ? <PageContent page={pages[currentPage - 1]} cover={cover} title={title} />
                : <EmptyPageDecor />
              }
            </div>

            {/* 제본 선 */}
            <div className="w-px flex-shrink-0 z-20"
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.03), rgba(0,0,0,0.11) 35%, rgba(0,0,0,0.11) 65%, rgba(0,0,0,0.03))' }} />

            {/* 오른쪽 페이지 */}
            <div className="flex-1 h-full relative overflow-hidden" style={{ background: '#FEFCF8' }}>
              <div className="absolute left-0 top-0 bottom-0 w-6 pointer-events-none z-10"
                style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }} />
              <PageContent page={page} cover={cover} title={title} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 이전/다음 */}
        <div className="flex justify-between mt-2.5 px-1">
          {['← 이전 페이지', '다음 페이지 →'].map((label, idx) => {
            const disabled = idx === 0 ? currentPage === 0 : currentPage === pages.length - 1;
            return (
              <motion.button
                key={label}
                whileTap={{ scale: 0.92 }}
                disabled={disabled}
                onClick={() => setCurrentPage(p => idx === 0 ? Math.max(p - 1, 0) : Math.min(p + 1, pages.length - 1))}
                className="text-[10px] font-semibold px-2 py-1"
                style={{ color: disabled ? '#E0E0E0' : '#AAAAAA' }}
              >
                {label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 점 인디케이터 */}
      <div className="flex justify-center gap-2 mt-5 flex-shrink-0">
        {pages.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setCurrentPage(i)}
            animate={{ width: i === currentPage ? 22 : 6, background: i === currentPage ? '#1A1A14' : '#DDDDDD' }}
            transition={{ duration: 0.25 }}
            className="rounded-full h-1.5"
          />
        ))}
      </div>

      {/* 닫기 버튼 */}
      <div className="px-5 mt-6 flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onClose}
          className="w-full py-4 rounded-2xl text-[15px] font-extrabold text-white"
          style={{ background: '#1A1A14', fontFamily: 'inherit' }}
        >
          커스터마이징으로 돌아가기
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Page Content ──────────────────────────────────────────────────────────────

function PageContent({ page, cover, title }) {
  if (!page) return null;

  if (page.type === 'title') return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-5">
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{
          width: 44, height: 58,
          borderRadius: '2px 8px 8px 2px',
          background: `linear-gradient(145deg, ${cover.bg}, ${cover.bgEnd})`,
          boxShadow: '3px 4px 14px rgba(0,0,0,0.15)',
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: cover.spine }} />
        <div className="absolute inset-0 flex items-end p-1.5 pl-2.5">
          <div className="text-[6px] font-black leading-tight" style={{ color: cover.text, opacity: 0.8, fontFamily: 'Georgia, serif' }}>두루</div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[17px] font-black leading-tight text-[#1A1A14] mb-1" style={{ fontFamily: 'Georgia, serif' }}>{title}</div>
        <div className="text-[9px] tracking-widest font-medium" style={{ color: '#CCCCCC', fontFamily: 'Georgia, serif' }}>DURU DIARY 2026</div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-10 h-px" style={{ background: '#E8E0D4' }} />
        <div className="text-[8px] tracking-widest font-medium" style={{ color: '#CCCCCC', fontFamily: 'Georgia, serif' }}>HANDMADE HARDCOVER</div>
      </div>
    </div>
  );

  if (page.type === 'constellation') return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#0E0D0B' }}>
      <div className="p-3 pb-1 flex-shrink-0">
        <div className="text-[10px] font-black text-white mb-0.5" style={{ fontFamily: 'Georgia, serif' }}>감정 별자리</div>
        <div className="text-[7px] tracking-wider" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Georgia, serif' }}>EMOTIONAL CONSTELLATION</div>
      </div>
      <MiniConstellation />
      <div className="px-3 pb-2 flex flex-wrap gap-x-3 gap-y-1 flex-shrink-0">
        {EMOTIONS.map(e => (
          <div key={e.name} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: e.color }} />
            <span className="text-[7px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{e.name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (page.type === 'diary') {
    const e = page.entry;
    return (
      <div className="h-full flex flex-col p-4 overflow-hidden">
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: e.emotionColor }} />
          <span className="text-[9px] font-bold" style={{ color: e.emotionColor }}>{e.emotion}</span>
          <span className="text-[9px] font-medium ml-auto" style={{ color: '#DDDDDD' }}>{e.date}</span>
        </div>
        <div className="h-px mb-2.5" style={{ background: '#F0EDE6' }} />
        <div className="text-[13px] font-black text-[#1A1A14] leading-snug mb-2.5" style={{ fontFamily: 'Georgia, serif' }}>{e.title}</div>
        <div className="text-[9px] leading-relaxed overflow-hidden" style={{ color: '#999', display: '-webkit-box', WebkitLineClamp: 9, WebkitBoxOrient: 'vertical' }}>
          {e.body}
        </div>
        <div className="mt-auto pt-2 text-[8px] font-medium text-right" style={{ color: '#DDDDDD', fontFamily: 'Georgia, serif' }}>
          p.{e === DIARY_ENTRIES[0] ? '24' : '58'}
        </div>
      </div>
    );
  }

  return null;
}

function MiniConstellation() {
  const W = 200, H = 150;
  const stars = EMOTIONS.map(e => ({
    ...e,
    x: (e.cx / 100) * W,
    y: (e.cy / 100) * H,
    r: 2.5 + (e.value / 38) * 5,
  }));
  const connections = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 2]];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ flex: 1, overflow: 'visible' }}>
      <defs>
        {stars.map(s => (
          <radialGradient key={s.name} id={`mg-${s.name}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      {connections.map(([a, b], i) => (
        <line key={i} x1={stars[a].x} y1={stars[a].y} x2={stars[b].x} y2={stars[b].y}
          stroke="rgba(255,255,255,0.1)" strokeWidth="0.7" />
      ))}
      {stars.map(s => (
        <g key={s.name}>
          <circle cx={s.x} cy={s.y} r={s.r * 3} fill={`url(#mg-${s.name})`} />
          <circle cx={s.x} cy={s.y} r={s.r} fill={s.color} />
          <circle cx={s.x - s.r * 0.25} cy={s.y - s.r * 0.25} r={s.r * 0.35} fill="rgba(255,255,255,0.65)" />
        </g>
      ))}
    </svg>
  );
}

function EmptyPageDecor() {
  return (
    <div className="h-full flex items-center justify-center opacity-20">
      <div className="text-center">
        <div className="text-[28px] font-black text-[#D0C8BC]" style={{ fontFamily: 'Georgia, serif' }}>두루</div>
        <div className="w-8 h-px bg-[#D0C8BC] mx-auto mt-1.5" />
      </div>
    </div>
  );
}

// ── 공용 컴포넌트 ─────────────────────────────────────────────────────────────

function SectionLabel({ serif, sans }) {
  return (
    <div className="flex items-baseline gap-2 mb-3.5">
      <span className="text-[11px] font-bold tracking-[.2em] uppercase" style={{ color: '#C0B09A', fontFamily: 'Georgia, serif' }}>
        {serif}
      </span>
      <span className="text-[13px] font-black text-[#1A1A14]">{sans}</span>
    </div>
  );
}

function FeatureCard({ icon, label, title, sub, accent }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-4 px-4 py-4 rounded-2xl bg-white"
      style={{ border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
        style={{ background: `${accent}18`, color: accent, fontFamily: 'Georgia, serif', fontSize: 18 }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#C0B09A', fontFamily: 'Georgia, serif' }}>{label}</span>
        </div>
        <div className="text-[13px] font-bold text-[#1A1A14]">{title}</div>
        <div className="text-[11px] mt-0.5" style={{ color: '#AAAAAA' }}>{sub}</div>
      </div>
    </motion.div>
  );
}

function PriceCard() {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-3xl p-5 mb-2"
      style={{
        background: 'linear-gradient(135deg, #FFF8EC 0%, #FFF0D4 100%)',
        border: '1px solid rgba(212,160,60,.18)',
        boxShadow: '0 4px 24px rgba(212,160,60,0.10)',
      }}
    >
      <div
        className="text-[10px] font-bold tracking-[.2em] uppercase mb-2"
        style={{ color: '#C4903C', fontFamily: 'Georgia, serif' }}
      >
        Early Bird Offer
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[28px] font-black text-[#8B6200]">39,900원</span>
        <span className="text-[13px] text-[#C4A060] line-through">49,900원</span>
        <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-md" style={{ background: '#D4A03C' }}>
          20% OFF
        </span>
      </div>
      <div className="text-[11px]" style={{ color: '#B08030' }}>얼리버드 특가 · 2026.12.31 마감</div>
    </motion.div>
  );
}
