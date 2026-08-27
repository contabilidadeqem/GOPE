import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

// GET /api/lancamentos?competencia=2026-02-01&status=pendente
export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);
  const competencia = searchParams.get('competencia');
  const status = searchParams.get('status');

  let query = supabase
    .from('lancamentos_despesa')
    .select('*, plano_contas(id, codigo, descricao)')
    .order('criado_em', { ascending: false });

  if (competencia) query = query.eq('competencia', competencia);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lancamentos: data });
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
