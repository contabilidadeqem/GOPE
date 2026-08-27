import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

// GET /api/receita?competencia=2026-02-01
export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);
  const competencia = searchParams.get('competencia');

  let query = supabase
    .from('lancamentos_receita')
    .select('*, plano_contas(id, codigo, descricao)')
    .order('criado_em', { ascending: false });

  if (competencia) query = query.eq('competencia', competencia);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lancamentos: data });
}

// POST /api/receita  { conta_id, competencia, valor, observacao }
// Faz upsert: se já existe lançamento pra essa conta+mês, atualiza o valor.
export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const body = await req.json();
  const { conta_id, competencia, valor, observacao } = body;

  if (!conta_id || !competencia || valor === undefined) {
    return NextResponse.json({ error: 'conta_id, competencia e valor são obrigatórios' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('lancamentos_receita')
    .upsert(
      { conta_id, competencia, valor, observacao },
      { onConflict: 'conta_id,competencia' }
    )
    .select('*, plano_contas(id, codigo, descricao)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lancamento: data });
}
