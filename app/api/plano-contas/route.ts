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

// PATCH /api/plano-contas  { id, valor_orcado_2026?, codigo?, descricao?, pasta_nome?, grupo?, grupo_codigo? }
// Só o contador pode chamar isso (garantido pelo middleware + pela tela que só ele acessa)
export async function PATCH(req: NextRequest) {
  const supabase = supabaseServer();
  const body = await req.json();
  const { id, ...campos } = body;

  if (!id) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
  }

  const camposPermitidos = ['valor_orcado_2026', 'codigo', 'descricao', 'pasta_nome', 'grupo', 'grupo_codigo'];
  const atualizacao: Record<string, any> = {};
  for (const campo of camposPermitidos) {
    if (campo in campos) atualizacao[campo] = campos[campo];
  }

  const { data, error } = await supabase
    .from('plano_contas')
    .update(atualizacao)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conta: data });
}

// POST /api/plano-contas  { codigo, descricao, tipo, valor_orcado_2026, pasta_nome?, grupo?, grupo_codigo? }
export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const body = await req.json();
  const { codigo, descricao, tipo, valor_orcado_2026, pasta_nome, grupo, grupo_codigo } = body;

  if (!codigo || !descricao || !tipo) {
    return NextResponse.json({ error: 'codigo, descricao e tipo são obrigatórios' }, { status: 400 });
  }
  if (tipo !== 'receita' && tipo !== 'despesa') {
    return NextResponse.json({ error: 'tipo deve ser receita ou despesa' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('plano_contas')
    .insert({
      codigo,
      descricao,
      tipo,
      valor_orcado_2026: valor_orcado_2026 ?? 0,
      pasta_nome: pasta_nome || null,
      grupo: grupo || null,
      grupo_codigo: grupo_codigo || null,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conta: data });
}
