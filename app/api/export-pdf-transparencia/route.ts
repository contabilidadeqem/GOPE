import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { supabaseServer } from '@/lib/supabase';
import { montarMatrizPorGrupo } from '@/lib/reportData';
import { TransparenciaPDF } from '@/lib/TransparenciaPDF';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ano = searchParams.get('ano') ?? '2026';
  const ateMes = Number(searchParams.get('ateMes') ?? '11');

  const supabase = supabaseServer();

  const [{ data: contas }, { data: despesas }, { data: receitas }] = await Promise.all([
    supabase.from('plano_contas').select('*').eq('ativo', true).order('codigo'),
    supabase
      .from('lancamentos_despesa')
      .select('conta_id, competencia, valor')
      .eq('status', 'confirmado')
      .gte('competencia', `${ano}-01-01`)
      .lte('competencia', `${ano}-12-01`),
    supabase
      .from('lancamentos_receita')
      .select('conta_id, competencia, valor')
      .gte('competencia', `${ano}-01-01`)
      .lte('competencia', `${ano}-12-01`),
  ]);

  const contasDespesa = (contas ?? []).filter((c) => c.tipo === 'despesa');
  const contasReceita = (contas ?? []).filter((c) => c.tipo === 'receita');

  const gruposDespesa = montarMatrizPorGrupo(contasDespesa as any, (despesas ?? []) as any, ateMes);
  const gruposReceita = montarMatrizPorGrupo(contasReceita as any, (receitas ?? []) as any, ateMes);

  const buffer = await renderToBuffer(
    React.createElement(TransparenciaPDF, {
      ano: Number(ano),
      ateMesIndex: ateMes,
      gruposReceita,
      gruposDespesa,
    }) as any
  );

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-transparencia-${ano}.pdf"`,
    },
  });
}
