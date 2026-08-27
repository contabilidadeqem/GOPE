import { NextRequest, NextResponse } from 'next/server';
import { checarCredenciais, signSession, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { usuario, senha } = await req.json();
  const role = checarCredenciais(usuario, senha);

  if (!role) {
    return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 });
  }

  const token = await signSession(role);
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}
