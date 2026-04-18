'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../lib/supabase';
import { getDiary, saveDiary, getDiariesByMonth } from '../../lib/diaries';

const EMOTIONS = [
  { id: 'happy',   label: '행복',  color: '#F4C430', emoji: '😊' },
  { id: 'calm',    label: '평온',  color: '#87CEEB', emoji: '😌' },
  { id: 'sad',     label: '슬픔',  color: '#9B9ECA', emoji: '😢' },
  { id: 'angry',   label: '화남',  color: '#E88080', emoji: '😤' },
  { id: 'anxious', label: '불안',  color: '#C8A87A', emoji: '😰' },
  { id: 'tired',   label: '피곤',  color: '#A8B8A8', emoji: '😴' },
];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateKo(d) {
  const days = ['일','월','화','수','목','금','토'];
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

export default function DiaryPage() {
  const [user, setUser]           = useState(null);
  const [today]                   = useState(new Date());
  const [selectedDate, setDate]   = useState(new Date());
  const [content, setContent]     = useState('');
  const [emotion, setEmotion]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [monthDiaries, setMonth]  = useState([]);
  const [loading, setLoading]     = useState(true);

  const supabase = createClient();
  const dateStr = toDateStr(selectedDate);

  // 로그인 상태 확인
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { location.href = '/login'; return; }
      setUser(user);
    });
  }, []);

  // 선택된 날짜 일기 불러오기
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getDiary(dateStr).then(data => {
      setContent(data?.content || '');
      setEmotion(data?.emotion || '');
      setLoading(false);
      setSaved(false);
    }).catch(() => setLoading(false));
  }, [user, dateStr]);

  // 이번 달 일기 불러오기 (달력 점 표시용)
  useEffect(() => {
    if (!user) return;
    getDiariesByMonth(selectedDate.getFullYear(), selectedDate.getMonth()+1)
      .then(setMonth).catch(() => {});
  }, [user, selectedDate.getFullYear(), selectedDate.getMonth()]);

  // 자동 저장 (3초 디바운스)
  useEffect(() => {
    if (!user || loading) return;
    setSaved(false);
    const t = setTimeout(async () => {
      if (!content.trim() && !emotion) return;
      setSaving(true);
      try {
        await saveDiary({ date: dateStr, content, emotion });
        setSaved(true);
      } catch(e) { console.error(e); }
      setSaving(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [content, emotion, dateStr]);

  const hasDiary = (d) => monthDiaries.some(m => m.date === toDateStr(d));

  // 이번 주 날짜들
  const weekDates = Array.from({length: 7}, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    return d;
  });

  if (!user) return <div style={S.bg} />;

  return (
    <div style={S.bg}>
      {/* 헤더 */}
      <div style={S.header}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.18em', color: '#9A9490' }}>DURU DIARY</div>
        <button style={S.logoutBtn} onClick={async () => { await supabase.auth.signOut(); location.href = '/login'; }}>
          로그아웃
        </button>
      </div>

      <div style={S.wrap}>

        {/* 주간 날짜 스트립 */}
        <div style={S.weekStrip}>
          {['일','월','화','수','목','금','토'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#C8C4C0', marginBottom: 6 }}>{d}</div>
          ))}
          {weekDates.map((d, i) => {
            const isSelected = toDateStr(d) === dateStr;
            const isToday    = toDateStr(d) === toDateStr(today);
            const has        = hasDiary(d);
            return (
              <button key={i} onClick={() => setDate(new Date(d))} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
                borderRadius: 12,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: isSelected ? '#1A1A14' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: isToday ? 800 : 500,
                  color: isSelected ? 'white' : isToday ? '#1A1A14' : '#595952',
                  border: isToday && !isSelected ? '2px solid #1A1A14' : 'none',
                }}>
                  {d.getDate()}
                </div>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: has ? '#C8A040' : 'transparent' }} />
              </button>
            );
          })}
        </div>

        {/* 날짜 + 저장 상태 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1A14' }}>{formatDateKo(selectedDate)}</div>
          <div style={{ fontSize: 11, color: saving ? '#C8A040' : saved ? '#5A9870' : '#C8C4C0', fontWeight: 600, transition: 'color .3s' }}>
            {saving ? '저장 중...' : saved ? '저장됨 ✓' : ''}
          </div>
        </div>

        {/* 감정 선택 */}
        <div style={S.card}>
          <div style={S.cardLabel}>오늘의 감정</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EMOTIONS.map(e => (
              <button key={e.id} onClick={() => setEmotion(prev => prev === e.id ? '' : e.id)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 20,
                border: emotion === e.id ? `2px solid ${e.color}` : '2px solid transparent',
                background: emotion === e.id ? `${e.color}22` : '#F5F2EE',
                cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, fontWeight: 600, color: '#1A1A14',
                transition: 'all .15s',
              }}>
                <span>{e.emoji}</span> {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* 일기 작성 */}
        <div style={{ ...S.card, flex: 1 }}>
          <div style={S.cardLabel}>일기</div>
          {loading ? (
            <div style={{ color: '#C8C4C0', fontSize: 14 }}>불러오는 중...</div>
          ) : (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`${selectedDate.getMonth()+1}월 ${selectedDate.getDate()}일, 오늘 하루는 어땠나요?`}
              style={{
                width: '100%', minHeight: 280, border: 'none', outline: 'none', resize: 'none',
                fontFamily: 'inherit', fontSize: 15, lineHeight: 1.85,
                color: '#1A1A14', background: 'transparent',
                boxSizing: 'border-box',
              }}
            />
          )}
        </div>

        {/* 책 미리보기 링크 */}
        <a href="/" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px', borderRadius: 14, border: '1.5px solid #E8E4E0',
          color: '#595952', fontSize: 13, fontWeight: 700, textDecoration: 'none',
          background: 'white', marginBottom: 40, transition: 'background .15s',
        }}>
          📖 내 일기 책 미리보기
        </a>

      </div>
    </div>
  );
}

const S = {
  bg: {
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
    background: '#FAF9F5',
    minHeight: '100dvh',
    WebkitFontSmoothing: 'antialiased',
  },
  header: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(250,249,245,.92)', backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(0,0,0,.07)',
    height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 20px',
  },
  logoutBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 12, color: '#9A9490', fontFamily: 'inherit', fontWeight: 600,
  },
  wrap: {
    maxWidth: 480, margin: '0 auto', padding: '20px 20px 0',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  weekStrip: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    background: 'white', borderRadius: 18, padding: '14px 8px 10px',
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
    marginBottom: 4,
  },
  card: {
    background: 'white', borderRadius: 18, padding: '16px 18px',
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
  },
  cardLabel: {
    fontSize: 10, fontWeight: 700, color: '#9A9490',
    letterSpacing: '.07em', marginBottom: 12,
  },
};
