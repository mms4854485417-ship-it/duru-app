'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState({ age: false, terms: false, privacy: false, marketing: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const supabase = createClient();

  const allRequired = agreed.age && agreed.terms && agreed.privacy;
  const allChecked = allRequired && agreed.marketing;

  function toggleAll() {
    const next = !allRequired;
    setAgreed({ age: next, terms: next, privacy: next, marketing: next });
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!allRequired) { setError('필수 항목에 모두 동의해주세요.'); return; }
      if (pw !== pw2) { setError('비밀번호가 일치하지 않습니다.'); return; }
      if (pw.length < 8 || !/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) {
        setError('비밀번호는 8자 이상, 영문+숫자를 포함해야 합니다.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) throw error;
        setDone(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        location.href = '/app.html';
      }
    } catch (err) {
      const msgs = {
        'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
        'User already registered': '이미 가입된 이메일입니다.',
        'Email not confirmed': '이메일 인증이 필요합니다. 메일함을 확인해주세요.',
      };
      setError(msgs[err.message] || err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div style={S.bg}>
      <div style={S.card}>
        <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: '#F0F8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M8 16L13 21L24 11" stroke="#2D8A4E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#1A1A14', marginBottom: 8 }}>가입 완료!</div>
          <div style={{ fontSize: 14, color: '#9A9490', lineHeight: 1.7, marginBottom: 28 }}>
            <b style={{ color: '#1A1A14' }}>{email}</b>으로 인증 메일을 보냈습니다.<br />
            메일함에서 링크를 클릭하면 로그인됩니다.
          </div>
          <button style={S.btnMain} onClick={() => { setDone(false); setMode('login'); }}>
            로그인하러 가기
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.bg}>
      <div style={S.card}>

        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, background: '#1A1A14', borderRadius: 14, marginBottom: 10 }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect x="4" y="5" width="14" height="17" rx="2.5" stroke="white" strokeWidth="1.8"/>
              <line x1="7.5" y1="10" x2="14.5" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="7.5" y1="13.5" x2="14.5" y2="13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="7.5" y1="17" x2="11.5" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="19" cy="19" r="4.5" fill="white"/>
              <path d="M17 19L18.5 20.5L21 17.5" stroke="#1A1A14" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.18em', color: '#9A9490' }}>DURU DIARY</div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 900, color: '#1A1A14', textAlign: 'center', marginBottom: 4 }}>
          {mode === 'login' ? '다시 만나요' : '시작해볼까요'}
        </div>
        <div style={{ fontSize: 13, color: '#9A9490', textAlign: 'center', marginBottom: 28 }}>
          {mode === 'login' ? '계속 기록해요' : '나만의 일기를 기록하는 공간'}
        </div>

        {/* 소셜 */}
        <button style={{ ...S.btnSocial, background: 'white', color: '#1A1A14', border: '1.5px solid #E8E4E0', marginBottom: 0 }} onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Google로 {mode === 'login' ? '로그인' : '시작하기'}
        </button>

        <div style={S.divider}><span style={S.dividerText}>또는 이메일로 {mode === 'login' ? '로그인' : '가입'}</span></div>

        {/* 폼 */}
        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>이메일</label>
            <input style={S.input} type="email" placeholder="hello@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div style={S.field}>
            <label style={S.label}>비밀번호</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...S.input, paddingRight: 44 }} type={showPw ? 'text' : 'password'}
                placeholder={mode === 'signup' ? '8자 이상, 영문+숫자 조합' : '비밀번호 입력'}
                value={pw} onChange={e => setPw(e.target.value)} required />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9A9490', display: 'flex', alignItems: 'center' }}>
                {showPw
                  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div style={S.field}>
              <label style={S.label}>비밀번호 확인</label>
              <input style={S.input} type="password" placeholder="비밀번호를 한 번 더 입력해주세요"
                value={pw2} onChange={e => setPw2(e.target.value)} required />
            </div>
          )}

          {/* 약관 (회원가입 시만) */}
          {mode === 'signup' && (
            <div style={{ border: '1.5px solid #E8E4E0', borderRadius: 14, overflow: 'hidden', margin: '18px 0 20px' }}>
              <div style={{ padding: '13px 15px', background: '#F5F2EE', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={toggleAll}>
                <Chk checked={allChecked} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1A1A14' }}>전체 동의</span>
              </div>
              <div style={{ borderTop: '1.5px solid #E8E4E0' }}>
                {[
                  { key: 'age',       label: '만 14세 이상입니다',           req: true,  href: null },
                  { key: 'terms',     label: '이용약관 동의',                req: true,  href: '/terms' },
                  { key: 'privacy',   label: '개인정보 처리방침 동의',       req: true,  href: '/privacy' },
                  { key: 'marketing', label: '마케팅 정보 수신 동의 (선택)', req: false, href: null },
                ].map(item => (
                  <div key={item.key} style={{ padding: '11px 15px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,.05)' }}
                    onClick={() => setAgreed(p => ({ ...p, [item.key]: !p[item.key] }))}>
                    <Chk checked={agreed[item.key]} />
                    <span style={{ flex: 1, fontSize: 12, color: '#595952' }}>{item.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: item.req ? '#C0392B' : '#9A9490', background: item.req ? 'rgba(192,57,43,.08)' : 'rgba(0,0,0,.06)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
                      {item.req ? '필수' : '선택'}
                    </span>
                    {item.href && <a href={item.href} target="_blank" onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: '#5A7898', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>보기</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12, color: '#C0392B', background: 'rgba(192,57,43,.07)', borderRadius: 10, padding: '10px 13px', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" style={{ ...S.btnMain, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : 'DURU 시작하기'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#9A9490', marginTop: 18 }}>
          {mode === 'login' ? (
            <>계정이 없으신가요? <button style={S.link} onClick={() => { setMode('signup'); setError(''); }}>회원가입</button></>
          ) : (
            <>이미 계정이 있으신가요? <button style={S.link} onClick={() => { setMode('login'); setError(''); }}>로그인</button></>
          )}
        </div>

      </div>
    </div>
  );
}

function Chk({ checked }) {
  return (
    <div style={{ width: 20, height: 20, borderRadius: 6, border: checked ? 'none' : '1.5px solid #E8E4E0', background: checked ? '#1A1A14' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
      {checked && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </div>
  );
}

const S = {
  bg: {
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
    background: '#FAF9F5',
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    WebkitFontSmoothing: 'antialiased',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: 'white',
    borderRadius: 24,
    padding: '36px 32px 32px',
    boxShadow: '0 4px 40px rgba(0,0,0,.09)',
  },
  btnSocial: {
    width: '100%', height: 48, borderRadius: 13, border: 'none',
    fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
    marginBottom: 10, transition: 'filter .15s',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0',
  },
  dividerText: {
    fontSize: 11, fontWeight: 600, color: '#9A9490', letterSpacing: '.05em',
    whiteSpace: 'nowrap', padding: '0 4px',
    background: 'white',
  },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#595952', letterSpacing: '.05em', marginBottom: 6 },
  input: {
    width: '100%', height: 48, padding: '0 14px',
    border: '1.5px solid #E8E4E0', borderRadius: 13,
    fontFamily: 'inherit', fontSize: 14, color: '#1A1A14',
    background: '#FAFAF8', outline: 'none', boxSizing: 'border-box',
  },
  btnMain: {
    width: '100%', height: 52, borderRadius: 14, border: 'none',
    background: '#1A1A14', color: 'white',
    fontFamily: 'inherit', fontSize: 15, fontWeight: 800, cursor: 'pointer',
    letterSpacing: '.02em',
  },
  link: {
    background: 'none', border: 'none', color: '#5A7898',
    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
  },
};
