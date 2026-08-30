'use client';

import { useEffect, useMemo, useState } from 'react';
import { montarLinhasCombinadas, NOMES_MESES, formatBRL, type Conta, type Lancamento, type LinhaCombinada } from '@/lib/reportData';

const ANO = 2026;

// Larguras fixas e idênticas nas duas tabelas (Receita e Despesa), pra ficarem sempre alinhadas
const COL = {
  codigo: 50,
  conta: 260,
  orcado: 90,
  mes: 88,
  realizado: 95,
  pct: 38,
};

export default function DashboardPage() {
  const [ateMesIndex, setAteMesIndex] = useState(new Date().getMonth());
  const [contas, setContas] = useState<Conta[]>([]);
  const [despesas, setDespesas] = useState<Lancamento[]>([]);
  const [receitas, setReceitas] = useState<Lancamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const [contasRes, despRes, recRes] = await Promise.all([
        fetch('/api/plano-contas').then((r) => r.json()),
        fetch(`/api/lancamentos?ano=${ANO}&status=confirmado`).then((r) => r.json()),
        fetch(`/api/receita?ano=${ANO}`).then((r) => r.json()),
      ]);
      setContas(contasRes.contas ?? []);
      setDespesas(despRes.lancamentos ?? []);
      setReceitas(recRes.lancamentos ?? []);
      setCarregando(false);
    }
    carregar();
  }, []);

  const contasDespesa = useMemo(() => contas.filter((c) => c.tipo === 'despesa'), [contas]);
  const contasReceita = useMemo(() => contas.filter((c) => c.tipo === 'receita'), [contas]);

  // Sintéticas e analíticas juntas, na mesma tabela — igual ao balancete tradicional em PDF
  const linhasReceita = useMemo(() => montarLinhasCombinadas(contasReceita, receitas, ateMesIndex), [contasReceita, receitas, ateMesIndex]);
  const linhasDespesa = useMemo(() => montarLinhasCombinadas(contasDespesa, despesas, ateMesIndex), [contasDespesa, despesas, ateMesIndex]);

  const totalRealizadoReceita = linhasReceita.filter((l) => l.tipo === 'sintetica').reduce((s, l) => s + l.realizadoAteMes, 0);
  const totalRealizadoDespesa = linhasDespesa.filter((l) => l.tipo === 'sintetica').reduce((s, l) => s + l.realizadoAteMes, 0);
  const totalOrcadoReceita = contasReceita.reduce((s, c) => s + Number(c.valor_orcado_2026), 0);
  const totalOrcadoDespesa = contasDespesa.reduce((s, c) => s + Number(c.valor_orcado_2026), 0);

  async function exportarPDF() {
    setExportando(true);
    try {
      const res = await fetch(`/api/export-pdf?ano=${ANO}&ateMes=${ateMesIndex}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `balancete-orcamentario-${NOMES_MESES[ateMesIndex]}-${ANO}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportando(false);
    }
  }

  function TabelaCombinada({ linhas, titulo }: { linhas: LinhaCombinada[]; titulo: string }) {
    const larguraTotal = COL.codigo + COL.conta + COL.orcado + COL.mes * 12 + COL.realizado + COL.pct;
    return (
      <div className="card" style={{ overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>{titulo} — visão anual {ANO}</h3>
        <table className="tabela-compacta" style={{ width: larguraTotal, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: COL.codigo }} />
            <col style={{ width: COL.conta }} />
            <col style={{ width: COL.orcado }} />
            {Array.from({ length: 12 }).map((_, i) => <col key={i} style={{ width: COL.mes }} />)}
            <col style={{ width: COL.realizado }} />
            <col style={{ width: COL.pct }} />
          </colgroup>
          <thead>
            <tr>
              <th>Código</th>
              <th>Conta</th>
              <th style={{ borderRight: '2px solid var(--dourado)' }}>Orçado {ANO}</th>
              {NOMES_MESES.map((m, i) => (
                <th key={m} style={{ opacity: i > ateMesIndex ? 0.35 : 1, background: i % 2 === 0 ? '#fbf6ec' : '#f1e2c6' }}>{m}</th>
              ))}
              <th style={{ borderLeft: '2px solid var(--dourado)' }}>Até {NOMES_MESES[ateMesIndex]}</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              if (l.tipo === 'sintetica') {
                const pct = l.orcado > 0 ? (l.realizadoAteMes / l.orcado) * 100 : 0;
                return (
                  <tr key={`g-${l.grupo}`} style={{ background: 'var(--bege-medio)', fontWeight: 700 }}>
                    <td>{l.grupoCodigo}</td>
                    <td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{l.grupo}</td>
                    <td style={{ borderRight: '2px solid var(--dourado)' }}>{formatBRL(l.orcado)}</td>
                    {l.porMes.map((v, i) => (
                      <td key={i} style={{ opacity: i > ateMesIndex ? 0.35 : 1 }}>
                        {i > ateMesIndex ? '—' : formatBRL(v)}
                      </td>
                    ))}
                    <td style={{ borderLeft: '2px solid var(--dourado)' }}>{formatBRL(l.realizadoAteMes)}</td>
                    <td>{pct.toFixed(0)}%</td>
                  </tr>
                );
              }
              const pct = Number(l.conta.valor_orcado_2026) > 0 ? (l.realizadoAteMes / Number(l.conta.valor_orcado_2026)) * 100 : 0;
              return (
                <tr key={l.conta.id}>
                  <td style={{ opacity: 0.75 }}>{l.conta.codigo}</td>
                  <td style={{
                    paddingLeft: 26, opacity: 0.85, whiteSpace: 'normal', wordBreak: 'break-word',
                  }}>
                    {l.conta.descricao}
                  </td>
                  <td style={{ borderRight: '2px solid var(--dourado)' }}>{formatBRL(Number(l.conta.valor_orcado_2026))}</td>
                  {l.porMes.map((v, i) => (
                    <td key={i} style={{
                      opacity: i > ateMesIndex ? 0.35 : 1,
                      color: v > 0 ? 'inherit' : '#999',
                      background: i % 2 === 0 ? '#fbf6ec' : '#f1e2c6',
                    }}>
                      {i > ateMesIndex ? '—' : (v > 0 ? formatBRL(v) : '—')}
                    </td>
                  ))}
                  <td style={{ borderLeft: '2px solid var(--dourado)' }}>{formatBRL(l.realizadoAteMes)}</td>
                  <td>{pct.toFixed(0)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Resumo da Execução Orçamentária — {ANO}</div>
      <div className="page-subtitle">Grande Oriente de Pernambuco — LOA {ANO}</div>

      <div className="card toolbar">
        <div className="field">
          <label>Realizado até o mês de</label>
          <select value={ateMesIndex} onChange={(e) => setAteMesIndex(Number(e.target.value))}>
            {NOMES_MESES.map((m, i) => (
              <option key={m} value={i}>{m}/{ANO}</option>
            ))}
          </select>
        </div>
        <div className="btn-group">
          <a className="btn-secondary" href="/sumario">Ver Sumário</a>
          <a className="btn-secondary" href="/transparencia">Relatório de Transparência</a>
          <button className="btn-primary" disabled={exportando} onClick={exportarPDF}>
            {exportando ? 'Gerando PDF…' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {carregando ? (
        <div className="card">Carregando…</div>
      ) : (
        <>
          <div className="grid-2">
            <div className="card">
              <div className="kpi-label">Receita realizada até {NOMES_MESES[ateMesIndex]}</div>
              <div className="kpi-value receita">{formatBRL(totalRealizadoReceita)}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Orçado ano: {formatBRL(totalOrcadoReceita)}</div>
            </div>
            <div className="card">
              <div className="kpi-label">Despesa realizada até {NOMES_MESES[ateMesIndex]}</div>
              <div className="kpi-value despesa">{formatBRL(totalRealizadoDespesa)}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Orçado ano: {formatBRL(totalOrcadoDespesa)}</div>
            </div>
          </div>

          <TabelaCombinada linhas={linhasReceita} titulo="Receitas" />
          <TabelaCombinada linhas={linhasDespesa} titulo="Despesas" />
        </>
      )}
    </div>
  );
}
