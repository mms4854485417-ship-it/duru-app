import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // 브라우저 클라이언트가 세션을 읽을 수 있도록 토큰을 hash로 전달
    if (data?.session) {
      const { access_token, refresh_token } = data.session;
      return NextResponse.redirect(
        `${origin}/app.html#access_token=${access_token}&refresh_token=${refresh_token}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
