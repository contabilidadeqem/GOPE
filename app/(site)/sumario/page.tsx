'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LabelList,
} from 'recharts';
import { montarMatrizAnual, NOMES_MESES, formatBRL, type Conta, type Lancamento } from '@/lib/reportData';

const ANO = 2026;
const CORES_DESPESA = ['#7a1f1f', '#a9822f', '#c9a24b', '#8a5a12', '#b5573a', '#6b4226', '#9c6b30', '#734c1f'];

function valorCompacto(v: number): string {
  if (!v) return '';
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return v.toFixed(0);
}

export default function SumarioPage() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [despesas, setDespesas] = useState<Lancamento[]>([]);
  const [receitas, setReceitas] = useState<Lancamento[]>([]);
  const [carregando, setCarregando] = useState(true);

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

  const matrizDespesa = useMemo(() => montarMatrizAnual(contasDespesa, despesas, 11), [contasDespesa, despesas]);
  const matrizReceita = useMemo(() => montarMatrizAnual(contasReceita, receitas, 11), [contasReceita, receitas]);

  const totalOrcadoReceita = contasReceita.reduce((s, c) => s + Number(c.valor_orcado_2026), 0);
  const totalOrcadoDespesa = contasDespesa.reduce((s, c) => s + Number(c.valor_orcado_2026), 0);
  const totalRealizadoReceita = matrizReceita.reduce((s, l) => s + l.totalAno, 0);
  const totalRealizadoDespesa = matrizDespesa.reduce((s, l) => s + l.totalAno, 0);
  const saldo = totalRealizadoReceita - totalRealizadoDespesa;

  const dadosMensais = NOMES_MESES.map((mes, i) => ({
    mes,
    Receita: matrizReceita.reduce((s, l) => s + l.porMes[i], 0),
    Despesa: matrizDespesa.reduce((s, l) => s + l.porMes[i], 0),
  }));

  const dadosPizzaDespesa = matrizDespesa
    .filter((l) => l.totalAno > 0)
    .sort((a, b) => b.totalAno - a.totalAno)
    .map((l) => ({ name: l.conta.descricao, value: l.totalAno }));

  const pctReceita = totalOrcadoReceita > 0 ? (totalRealizadoReceita / totalOrcadoReceita) * 100 : 0;
  const pctDespesa = totalOrcadoDespesa > 0 ? (totalRealizadoDespesa / totalOrcadoDespesa) * 100 : 0;

  if (carregando) return <div className="card">Carregando…</div>;

  return (
    <div>
      <div className="page-title">Sumário — Executado {ANO}</div>
      <div className="page-subtitle">Visão consolidada de receita e despesa do ano</div>

      <div className="grid-3">
        <div className="card">
          <div className="kpi-label">Receita realizada no ano</div>
          <div className="kpi-value receita">{formatBRL(totalRealizadoReceita)}</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{pctReceita.toFixed(0)}% do orçado</div>
        </div>
        <div className="card">
          <div className="kpi-label">Despesa realizada no ano</div>
          <div className="kpi-value despesa">{formatBRL(totalRealizadoDespesa)}</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{pctDespesa.toFixed(0)}% do orçado</div>
        </div>
        <div className="card">
          <div className="kpi-label">Saldo do ano</div>
          <div className="kpi-value" style={{ color: saldo >= 0 ? 'var(--verde-ok)' : 'var(--vermelho-institucional)' }}>
            {formatBRL(saldo)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Receita - Despesa</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Receita x Despesa por mês</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={dadosMensais}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2d6c3" />
            <XAxis dataKey="mes" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatBRL(v)} />
            <Legend />
            <Bar dataKey="Receita" fill="#3f7d4f" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="Receita" position="top" formatter={valorCompacto} fontSize={10} fill="#3f7d4f" />
            </Bar>
            <Bar dataKey="Despesa" fill="#7a1f1f" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="Despesa" position="top" formatter={valorCompacto} fontSize={10} fill="#7a1f1f" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Despesa por conta — participação no ano</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={dadosPizzaDespesa} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={(e) => `${e.name.slice(0, 18)}`}>
                {dadosPizzaDespesa.map((_, i) => (
                  <Cell key={i} fill={CORES_DESPESA[i % CORES_DESPESA.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatBRL(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Top 5 despesas do ano</h3>
          <table>
            <thead><tr><th>Conta</th><th>Realizado</th><th>% do total</th></tr></thead>
            <tbody>
              {dadosPizzaDespesa.slice(0, 5).map((d) => (
                <tr key={d.name}>
                  <td>{d.name}</td>
                  <td>{formatBRL(d.value)}</td>
                  <td>{totalRealizadoDespesa > 0 ? ((d.value / totalRealizadoDespesa) * 100).toFixed(0) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
