import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { extrairDadosDespesa } from '@/lib/extract';

function normaliza(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toUpperCase()
    .trim();
}

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const formData = await req.formData();

  const file = formData.get('file') as File | null;
  const pastaNome = (formData.get('pastaNome') as string) || '';
  const competencia = formData.get('competencia') as string; // "2026-02-01"

  if (!file || !competencia) {
    return NextResponse.json({ error: 'file e competencia são obrigatórios' }, { status: 400 });
  }

  // 1. Tenta casar a conta pela pasta. Se não achar, entra como "sem conta" para escolha manual.
  const { data: contas } = await supabase
    .from('plano_contas')
    .select('id, codigo, descricao, pasta_nome')
    .eq('tipo', 'despesa')
    .eq('ativo', true);

  const contaMatch = contas?.find(
    (c) => c.pasta_nome && normaliza(c.pasta_nome) === normaliza(pastaNome)
  );

  // 2. Lê o arquivo e chama a IA
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  let extraido;
  try {
    extraido = await extrairDadosDespesa(base64);
  } catch (e) {
    extraido = { valor: null, data_pagamento: null, fornecedor: null, descricao: null, confianca: 'baixa' as const };
  }

  // 3. Sobe o arquivo original para o Storage
  const path = `${competencia.slice(0, 7)}/${pastaNome || 'SEM_CATEGORIA'}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('documentos-despesa')
    .upload(path, arrayBuffer, { contentType: 'application/pdf' });

  if (uploadError) {
    return NextResponse.json({ error: `Falha no upload: ${uploadError.message}` }, { status: 500 });
  }

  // 4. Insere o lançamento como pendente de conferência
  const { data: lancamento, error: insertError } = await supabase
    .from('lancamentos_despesa')
    .insert({
      conta_id: contaMatch?.id ?? null,
      competencia,
      valor: extraido.valor ?? 0,
      data_pagamento: extraido.data_pagamento,
      fornecedor: extraido.fornecedor,
      descricao_documento: extraido.descricao,
      arquivo_path: path,
      arquivo_nome: file.name,
      status: 'pendente',
      extraido_por_ia: extraido,
    })
    .select('*, plano_contas(codigo, descricao)')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    lancamento,
    contaEncontradaPelaPasta: !!contaMatch,
    contasDisponiveis: contas,
  });
}
