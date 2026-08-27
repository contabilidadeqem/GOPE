import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

// GET /api/lancamentos?competencia=2026-02-01&status=pendente
// GET /api/lancamentos?ano=2026&status=confirmado   -> traz o ano inteiro, para visão anual/sumário/PDF
export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);
  const competencia = searchParams.get('competencia');
  const ano = searchParams.get('ano');
  const status = searchParams.get('status');

  let query = supabase
    .from('lancamentos_despesa')
    .select('*, plano_contas(id, codigo, descricao)')
    .order('criado_em', { ascending: false });

  if (competencia) query = query.eq('competencia', competencia);
  if (ano) query = query.gte('competencia', `${ano}-01-01`).lte('competencia', `${ano}-12-01`);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lancamentos: data });
}

// POST /api/lancamentos  { conta_id, competencia, valor, data_pagamento, fornecedor, descricao_documento }
// Lançamento manual de despesa, sem recibo/PDF. Entra já confirmado.
export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const body = await req.json();
  const { conta_id, competencia, valor, data_pagamento, fornecedor, descricao_documento } = body;

  if (!conta_id || !competencia || !valor) {
    return NextResponse.json({ error: 'conta_id, competencia e valor são obrigatórios' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('lancamentos_despesa')
    .insert({
      conta_id,
      competencia,
      valor,
      data_pagamento: data_pagamento || null,
      fornecedor: fornecedor || null,
      descricao_documento: descricao_documento || null,
      origem: 'manual',
      status: 'confirmado',
      confirmado_em: new Date().toISOString(),
    })
    .select('*, plano_contas(id, codigo, descricao)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lancamento: data });
}

// PATCH /api/lancamentos  { id, conta_id, valor, data_pagamento, fornecedor, status }
export async function PATCH(req: NextRequest) {
  const supabase = supabaseServer();
  const body = await req.json();
  const { id, ...campos } = body;

  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });

  if (campos.status === 'confirmado') {
    campos.confirmado_em = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('lancamentos_despesa')
    .update(campos)
    .eq('id', id)
    .select('*, plano_contas(id, codigo, descricao)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lancamento: data });
}

// DELETE /api/lancamentos?id=...
export async function DELETE(req: NextRequest) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });

  const { error } = await supabase.from('lancamentos_despesa').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
