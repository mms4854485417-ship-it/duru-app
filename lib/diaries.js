import { createClient } from './supabase';

const supabase = createClient();

// 날짜 기준 일기 1개 불러오기
export async function getDiary(date) {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// 이번 달 일기 전체 불러오기
export async function getDiariesByMonth(year, month) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const to   = `${year}-${String(month).padStart(2, '0')}-31`;
  const { data, error } = await supabase
    .from('diaries')
    .select('id, date, emotion, content')
    .gte('date', from)
    .lte('date', to)
    .order('date');
  if (error) throw error;
  return data || [];
}

// 일기 저장 (없으면 생성, 있으면 수정)
export async function saveDiary({ date, content, emotion }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('diaries')
    .upsert({ user_id: user.id, date, content, emotion, updated_at: new Date().toISOString() },
             { onConflict: 'user_id,date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 일기 삭제
export async function deleteDiary(date) {
  const { error } = await supabase
    .from('diaries')
    .delete()
    .eq('date', date);
  if (error) throw error;
}
