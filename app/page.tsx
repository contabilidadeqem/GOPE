'use client';

import { useEffect, useMemo, useState } from 'react';
import { montarMatrizAnual, NOMES_MESES, formatBRL, type Conta, type Lancamento } from '@/lib/reportData';

const ANO = 2026;

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

  const matrizDespesa = useMemo(() => montarMatrizAnual(contasDespesa, despesas, ateMesIndex), [contasDespesa, despesas, ateMesIndex]);
  const matrizReceita = useMemo(() => montarMatrizAnual(contasReceita, receitas, ateMesIndex), [contasReceita, receitas, ateMesIndex]);

  const totalRealizadoReceita = matrizReceita.reduce((s, l) => s + l.realizadoAteMes, 0);
  const totalRealizadoDespesa = matrizDespesa.reduce((s, l) => s + l.realizadoAteMes, 0);
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

  function TabelaMatriz({ linhas, tipo }: { linhas: ReturnType<typeof montarMatrizAnual>; tipo: 'receita' | 'despesa' }) {
    return (
      <div className="card" style={{ overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>{tipo === 'receita' ? 'Receitas' : 'Despesas'} — visão anual {ANO}</h3>
        <table style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Conta</th>
              {NOMES_MESES.map((m, i) => (
                <th key={m} style={{ opacity: i > ateMesIndex ? 0.35 : 1 }}>{m}</th>
              ))}
              <th style={{ borderLeft: '2px solid var(--dourado)' }}>Realizado até {NOMES_MESES[ateMesIndex]}</th>
              <th>Orçado {ANO}</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ conta, porMes, realizadoAteMes }) => {
              const pct = Number(conta.valor_orcado_2026) > 0 ? (realizadoAteMes / Number(conta.valor_orcado_2026)) * 100 : 0;
              return (
                <tr key={conta.id}>
                  <td>{conta.codigo}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{conta.descricao}</td>
                  {porMes.map((v, i) => (
                    <td key={i} style={{ opacity: i > ateMesIndex ? 0.35 : 1, color: v > 0 ? 'inherit' : '#999' }}>
                      {v > 0 ? formatBRL(v) : '—'}
                    </td>
                  ))}
                  <td style={{ borderLeft: '2px solid var(--dourado)', fontWeight: 700 }}>{formatBRL(realizadoAteMes)}</td>
                  <td>{formatBRL(Number(conta.valor_orcado_2026))}</td>
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

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>Realizado até o mês de</label>
          <select value={ateMesIndex} onChange={(e) => setAteMesIndex(Number(e.target.value))} style={{ marginTop: 4, width: 160 }}>
            {NOMES_MESES.map((m, i) => (
              <option key={m} value={i}>{m}/{ANO}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a className="btn-secondary" href="/sumario" style={{ textDecoration: 'none', display: 'inline-block' }}>Ver Sumário</a>
          <button className="btn-secondary" disabled={exportando} onClick={exportarPDF}>
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

          <TabelaMatriz linhas={matrizReceita} tipo="receita" />
          <TabelaMatriz linhas={matrizDespesa} tipo="despesa" />
        </>
      )}
    </div>
  );
}
