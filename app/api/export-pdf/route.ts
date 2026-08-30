import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { supabaseServer } from '@/lib/supabase';
import { montarLinhasCombinadas } from '@/lib/reportData';
import { RelatorioPDF } from '@/lib/RelatorioPDF';

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

  const linhasDespesa = montarLinhasCombinadas(contasDespesa as any, (despesas ?? []) as any, ateMes);
  const linhasReceita = montarLinhasCombinadas(contasReceita as any, (receitas ?? []) as any, ateMes);

  const totalOrcadoDespesa = contasDespesa.reduce((s, c) => s + Number(c.valor_orcado_2026), 0);
  const totalOrcadoReceita = contasReceita.reduce((s, c) => s + Number(c.valor_orcado_2026), 0);

  const buffer = await renderToBuffer(
    React.createElement(RelatorioPDF, {
      ano: Number(ano),
      ateMesIndex: ateMes,
      linhasReceita,
      linhasDespesa,
      totalOrcadoReceita,
      totalOrcadoDespesa,
    }) as any
  );

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="balancete-orcamentario-${ano}.pdf"`,
    },
  });
}
