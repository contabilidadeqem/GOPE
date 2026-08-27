'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LabelList,
} from 'recharts';
import { montarMatrizPorGrupo, NOMES_MESES, formatBRL, type Conta, type Lancamento } from '@/lib/reportData';

const ANO = 2026;
const CORES_RECEITA = ['#3f7d4f', '#6fa87a', '#a9822f', '#c9a24b'];
const CORES_DESPESA = ['#7a1f1f', '#b5573a', '#8a5a12'];

const RADIAN = Math.PI / 180;
function rotuloInternoPizza({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.03) return null; // fatia mínima demais para caber o texto
  const raio = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + raio * Math.cos(-midAngle * RADIAN);
  const y = cy + raio * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
      {`${percent.toFixed(0) === '0' ? percent.toFixed(1) : Math.round(percent)}%`}
    </text>
  );
}

function valorCompacto(v: number): string {
  if (!v) return '';
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return v.toFixed(0);
}

export default function TransparenciaPage() {
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

  const gruposReceita = useMemo(() => montarMatrizPorGrupo(contasReceita, receitas, ateMesIndex), [contasReceita, receitas, ateMesIndex]);
  const gruposDespesa = useMemo(() => montarMatrizPorGrupo(contasDespesa, despesas, ateMesIndex), [contasDespesa, despesas, ateMesIndex]);

  const totalOrcadoReceita = gruposReceita.reduce((s, l) => s + l.orcado, 0);
  const totalOrcadoDespesa = gruposDespesa.reduce((s, l) => s + l.orcado, 0);
  const totalRealizadoReceita = gruposReceita.reduce((s, l) => s + l.realizadoAteMes, 0);
  const totalRealizadoDespesa = gruposDespesa.reduce((s, l) => s + l.realizadoAteMes, 0);
  const pctReceita = totalOrcadoReceita > 0 ? (totalRealizadoReceita / totalOrcadoReceita) * 100 : 0;
  const pctDespesa = totalOrcadoDespesa > 0 ? (totalRealizadoDespesa / totalOrcadoDespesa) * 100 : 0;

  const pizzaReceita = [
    { name: 'Realizado', value: pctReceita },
    { name: 'Orçado', value: Math.max(0, 100 - pctReceita) },
  ];
  const pizzaDespesa = [
    { name: 'Realizado', value: pctDespesa },
    { name: 'Orçado', value: Math.max(0, 100 - pctDespesa) },
  ];

  const dadosMensaisReceita = NOMES_MESES.slice(0, ateMesIndex + 1).map((mes, i) => {
    const linha: any = { mes };
    gruposReceita.forEach((g) => (linha[g.grupo] = g.porMes[i]));
    return linha;
  });
  const dadosMensaisDespesa = NOMES_MESES.slice(0, ateMesIndex + 1).map((mes, i) => {
    const linha: any = { mes };
    gruposDespesa.forEach((g) => (linha[g.grupo] = g.porMes[i]));
    return linha;
  });

  async function exportarPDF() {
    setExportando(true);
    try {
      const res = await fetch(`/api/export-pdf-transparencia?ano=${ANO}&ateMes=${ateMesIndex}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-transparencia-${NOMES_MESES[ateMesIndex]}-${ANO}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportando(false);
    }
  }

  function TabelaConsolidada({ titulo, linhas }: { titulo: string; linhas: ReturnType<typeof montarMatrizPorGrupo> }) {
    return (
      <div className="card" style={{ overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>{titulo}</h3>
        <table>
          <thead>
            <tr>
              <th>Conta</th>
              <th>Realizada em {ANO}</th>
              <th>Orçada no exercício</th>
              <th>% realizada</th>
              <th>A realizar até dezembro</th>
              <th>% a realizar</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const pctRealizada = l.orcado > 0 ? (l.realizadoAteMes / l.orcado) * 100 : 0;
              const aRealizar = Math.max(0, l.orcado - l.realizadoAteMes);
              const pctARealizar = l.orcado > 0 ? (aRealizar / l.orcado) * 100 : 0;
              return (
                <tr key={l.grupo}>
                  <td>{l.grupo}</td>
                  <td>{formatBRL(l.realizadoAteMes)}</td>
                  <td>{formatBRL(l.orcado)}</td>
                  <td>{pctRealizada.toFixed(0)}%</td>
                  <td>{formatBRL(aRealizar)}</td>
                  <td>{pctARealizar.toFixed(0)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function TabelaAnual({ titulo, linhas }: { titulo: string; linhas: ReturnType<typeof montarMatrizPorGrupo> }) {
    return (
      <div className="card" style={{ overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>{titulo} — visão anual {ANO}</h3>
        <table style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>Conta</th>
              {NOMES_MESES.map((m) => <th key={m}>{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.grupo}>
                <td style={{ whiteSpace: 'nowrap' }}>{l.grupo}</td>
                {l.porMes.map((v, i) => <td key={i}>{v > 0 ? formatBRL(v) : '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (carregando) return <div className="card">Carregando…</div>;

  return (
    <div>
      <div className="page-title">Relatório de Transparência</div>
      <div className="page-subtitle">Grande Oriente de Pernambuco — Apresentação de resultado mensal</div>

      <div className="card toolbar">
        <div className="field">
          <label>Até o mês de</label>
          <select value={ateMesIndex} onChange={(e) => setAteMesIndex(Number(e.target.value))}>
            {NOMES_MESES.map((m, i) => (
              <option key={m} value={i}>{m}/{ANO}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary" disabled={exportando} onClick={exportarPDF}>
          {exportando ? 'Gerando PDF…' : 'Exportar PDF'}
        </button>
      </div>

      <div className="grid-2">
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>Receita</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pizzaReceita} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={rotuloInternoPizza} labelLine={false}>
                <Cell fill="#3f7d4f" />
                <Cell fill="#7a1f1f" />
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>Despesa</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pizzaDespesa} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={rotuloInternoPizza} labelLine={false}>
                <Cell fill="#3f7d4f" />
                <Cell fill="#7a1f1f" />
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Receita por grupo — evolução mensal</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dadosMensaisReceita}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2d6c3" />
            <XAxis dataKey="mes" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatBRL(v)} />
            <Legend />
            {gruposReceita.map((g, i) => (
              <Bar key={g.grupo} dataKey={g.grupo} stackId="r" fill={CORES_RECEITA[i % CORES_RECEITA.length]}>
                <LabelList dataKey={g.grupo} position="inside" formatter={valorCompacto} fill="#fff" fontSize={9} fontWeight={700} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Despesa por grupo — evolução mensal</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dadosMensaisDespesa}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2d6c3" />
            <XAxis dataKey="mes" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatBRL(v)} />
            <Legend />
            {gruposDespesa.map((g, i) => (
              <Bar key={g.grupo} dataKey={g.grupo} stackId="d" fill={CORES_DESPESA[i % CORES_DESPESA.length]}>
                <LabelList dataKey={g.grupo} position="inside" formatter={valorCompacto} fill="#fff" fontSize={9} fontWeight={700} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <TabelaConsolidada titulo="Resumo da execução orçamentária — Receitas" linhas={gruposReceita} />
      <TabelaConsolidada titulo="Resumo da execução orçamentária — Despesas" linhas={gruposDespesa} />

      <TabelaAnual titulo="Receitas" linhas={gruposReceita} />
      <TabelaAnual titulo="Despesas" linhas={gruposDespesa} />
    </div>
  );
}
