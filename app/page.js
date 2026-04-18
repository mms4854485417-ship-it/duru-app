'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import OpenBookViewer from './OpenBookViewer';

const BookMockup3D    = dynamic(() => import('./BookMockup3D'),    { ssr: false });
const SpineBookshelf  = dynamic(() => import('./SpineBookshelf'),  { ssr: false });

const COVERS = [
  { id: 'ash-blue',       name: '애쉬 블루',   color: '#8FA8C0' },
  { id: 'dusty-rose',     name: '더스티 로즈', color: '#BFA0A8' },
  { id: 'muted-lavender', name: '뮤트 라벤더', color: '#A898C0' },
  { id: 'blue-gray',      name: '블루 그레이', color: '#8898A8' },
  { id: 'warm-beige',     name: '웜 베이지',   color: '#F5E8C7' },
];

function BookViewer() {
  const params = useSearchParams();
  const paramColor  = params.get('color');
  const paramTitle  = params.get('title');
  const paramLayout = params.get('layout'); // 'center' | 'bottom-left'
  const embedded = !!(paramColor || paramTitle);

  const [cover, setCover] = useState(
    COVERS.find(c => c.color === paramColor) || COVERS[0]
  );
  const [title, setTitle]           = useState(paramTitle || '나의 2026년');
  const [titleLayout, setTitleLayout] = useState(paramLayout || 'center'); // 'center' | 'bottom-left'
  const [tab, setTab] = useState('3d'); // '3d' | 'inside'

  const activeColor = cover.color;

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F4F4F2',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>

      {/* 헤더 (독립 실행 시만) */}
      {!embedded && (
        <div style={{ textAlign: 'center', padding: '36px 20px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#9A9490', marginBottom: 6 }}>DURU DIARY</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#1E1C18', marginBottom: 4 }}>나의 책 미리보기</div>
          <div style={{ fontSize: 12, color: '#9A9490' }}>드래그해서 360° 회전</div>
          <Link href="/order" style={{ display: 'inline-block', marginTop: 14, padding: '10px 24px', borderRadius: 12, background: '#1E1C18', color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            책 주문하기 →
          </Link>
        </div>
      )}

      {/* 탭 */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'rgba(0,0,0,0.07)',
        borderRadius: 14, padding: 4,
        margin: embedded ? '18px 20px 0' : '20px 20px 0',
        width: 'calc(100% - 40px)', maxWidth: 480,
      }}>
        {[
          { key: '3d',     label: '360° 표지', icon: '◈' },
          { key: 'inside', label: '내지 보기',  icon: '📄' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '9px 8px', borderRadius: 10, border: 'none',
            background: tab === t.key ? 'white' : 'transparent',
            color: tab === t.key ? '#1E1C18' : '#9A9490',
            fontWeight: tab === t.key ? 700 : 500,
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: tab === t.key ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* 뷰어 */}
      <div className="duru-mockup-container" style={{ width: '100%', maxWidth: 640, flex: 1 }}>
        {tab === '3d' ? (
          <BookMockup3D
            coverColor={activeColor}
            title={title}
            height={embedded ? 380 : 420}
            titleLayout={titleLayout}
          />
        ) : (
          <OpenBookViewer title={title} coverColor={activeColor} />
        )}
      </div>

      {/* 컨트롤 패널 */}
      <div style={{
        width: 'calc(100% - 40px)', maxWidth: 480, marginBottom: 32,
        background: 'white', borderRadius: 20,
        padding: '20px 18px',
        boxShadow: '0 2px 20px rgba(0,0,0,0.07)',
      }}>
        {/* 제목 */}
        {!embedded && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9A9490', letterSpacing: '0.07em', marginBottom: 7 }}>책 제목</div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value || '나의 2026년')}
              style={{
                width: '100%', padding: '11px 13px', borderRadius: 11,
                border: '1.5px solid #E8E4E0', fontSize: 14, fontWeight: 700,
                color: '#1E1C18', outline: 'none', marginBottom: 18,
                boxSizing: 'border-box', fontFamily: 'inherit', background: '#FAFAF8',
              }}
              onFocus={e => e.target.style.borderColor = activeColor}
              onBlur={e => e.target.style.borderColor = '#E8E4E0'}
            />
          </>
        )}

        {/* 표지 색상 */}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#9A9490', letterSpacing: '0.07em', marginBottom: 10 }}>
          표지 컬러 <span style={{ fontSize: 9, fontWeight: 500, color: '#C0BAB4', letterSpacing: 0 }}>— 마우스 오버 시 금박 효과</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COVERS.map(c => (
            <button key={c.id} onClick={() => setCover(c)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>
              {/* 린넨 텍스처 + 금박 광택 스와치 */}
              <div
                className="duru-swatch"
                style={{
                  width: 40, height: 40, borderRadius: 11, background: c.color,
                  boxShadow: cover.id === c.id
                    ? `0 0 0 3px white, 0 0 0 5px ${c.color}`
                    : '0 1px 4px rgba(0,0,0,0.1)',
                  transform: cover.id === c.id ? 'scale(1.12)' : 'scale(1)',
                  transition: 'all 0.18s',
                }}
              >
                {/* 금박 시머 레이어 — CSS hover로 자동 재생 */}
                <div className="duru-swatch-foil" />
              </div>
              <span style={{
                fontSize: 9, fontFamily: 'inherit',
                color: cover.id === c.id ? '#1E1C18' : '#B0AAA4',
                fontWeight: cover.id === c.id ? 700 : 500,
              }}>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 가상 책꽂이 책등 계산기 (독립 실행 시만) */}
      {!embedded && (
        <div style={{ width: 'calc(100% - 40px)', maxWidth: 480, marginBottom: 40 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9A9490', letterSpacing: '0.07em', marginBottom: 10 }}>
            책등 두께 시뮬레이터
          </div>
          <SpineBookshelf coverColor={activeColor} diaryCount={29} />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#F4F4F2' }} />}>
      <BookViewer />
    </Suspense>
  );
}
