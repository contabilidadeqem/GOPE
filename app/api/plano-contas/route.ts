import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo'); // 'receita' | 'despesa' | null (ambos)

  let query = supabase.from('plano_contas').select('*').eq('ativo', true).order('codigo');
  if (tipo) query = query.eq('tipo', tipo);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contas: data });
}
