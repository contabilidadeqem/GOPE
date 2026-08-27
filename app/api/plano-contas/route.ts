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

// PATCH /api/plano-contas  { id, valor_orcado_2026 }
// Só o contador pode chamar isso (garantido pelo middleware + pela tela que só ele acessa)
export async function PATCH(req: NextRequest) {
  const supabase = supabaseServer();
  const body = await req.json();
  const { id, valor_orcado_2026 } = body;

  if (!id || valor_orcado_2026 === undefined) {
    return NextResponse.json({ error: 'id e valor_orcado_2026 são obrigatórios' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('plano_contas')
    .update({ valor_orcado_2026 })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conta: data });
}
