import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifySession } from '@/lib/auth';

const ROTAS_SOMENTE_CONTADOR_ESCRITA = ['/api/lancamentos', '/api/receita', '/api/extract-despesa', '/api/plano-contas'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const role = await verifySession(token);

  if (!role) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  if (role === 'cliente' && req.method !== 'GET') {
    const bloqueado = ROTAS_SOMENTE_CONTADOR_ESCRITA.some((r) => pathname.startsWith(r));
    if (bloqueado) {
      return NextResponse.json({ error: 'Sem permissão para esta ação' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/lancamentos', '/api/lancamentos/:path*',
    '/api/receita', '/api/receita/:path*',
    '/api/extract-despesa', '/api/extract-despesa/:path*',
    '/api/plano-contas', '/api/plano-contas/:path*',
    '/api/export-pdf', '/api/export-pdf/:path*',
    '/api/export-pdf-transparencia', '/api/export-pdf-transparencia/:path*',
  ],
};
