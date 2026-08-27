'use client';

import { useEffect, useMemo, useState } from 'react';

type Conta = {
  id: string;
  codigo: string;
  descricao: string;
  tipo: 'receita' | 'despesa';
  valor_orcado_2026: number;
};

type LancamentoDespesa = {
  id: string;
  conta_id: string;
  valor: number;
  status: string;
};

type LancamentoReceita = {
  id: string;
  conta_id: string;
  valor: number;
};

function mesesDoAno() {
  const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return nomes.map((n, i) => ({ label: n, value: `2026-${String(i + 1).padStart(2, '0')}-01` }));
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function DashboardPage() {
  const [competencia, setCompetencia] = useState(mesesDoAno()[new Date().getMonth()].value);
  const [contas, setContas] = useState<Conta[]>([]);
  const [despesas, setDespesas] = useState<LancamentoDespesa[]>([]);
  const [receitas, setReceitas] = useState<LancamentoReceita[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const [contasRes, despRes, recRes] = await Promise.all([
        fetch('/api/plano-contas').then((r) => r.json()),
        fetch(`/api/lancamentos?competencia=${competencia}&status=confirmado`).then((r) => r.json()),
        fetch(`/api/receita?competencia=${competencia}`).then((r) => r.json()),
      ]);
      setContas(contasRes.contas ?? []);
      setDespesas(despRes.lancamentos ?? []);
      setReceitas(recRes.lancamentos ?? []);
      setCarregando(false);
    }
    carregar();
  }, [competencia]);

  const contasDespesa = useMemo(() => contas.filter((c) => c.tipo === 'despesa'), [contas]);
  const contasReceita = useMemo(() => contas.filter((c) => c.tipo === 'receita'), [contas]);

  const totalOrcadoDespesa = contasDespesa.reduce((s, c) => s + Number(c.valor_orcado_2026), 0);
  const totalOrcadoReceita = contasReceita.reduce((s, c) => s + Number(c.valor_orcado_2026), 0);
  const totalRealizadoDespesa = despesas.reduce((s, d) => s + Number(d.valor), 0);
  const totalRealizadoReceita = receitas.reduce((s, r) => s + Number(r.valor), 0);

  function realizadoPorConta(contaId: string, lista: { conta_id: string; valor: number }[]) {
    return lista.filter((l) => l.conta_id === contaId).reduce((s, l) => s + Number(l.valor), 0);
  }

  return (
    <div>
      <div className="page-title">Resumo da Execução Orçamentária</div>
      <div className="page-subtitle">Grande Oriente de Pernambuco — LOA 2026</div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>Competência</label>
          <select value={competencia} onChange={(e) => setCompetencia(e.target.value)} style={{ marginTop: 4, width: 180 }}>
            {mesesDoAno().map((m) => (
              <option key={m.value} value={m.value}>{m.label}/2026</option>
            ))}
          </select>
        </div>
        <button className="btn-secondary" onClick={() => window.print()}>Exportar PDF</button>
      </div>

      {carregando ? (
        <div className="card">Carregando…</div>
      ) : (
        <>
          <div className="grid-2">
            <div className="card">
              <div className="kpi-label">Receita realizada no mês</div>
              <div className="kpi-value receita">{formatBRL(totalRealizadoReceita)}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                Orçado ano: {formatBRL(totalOrcadoReceita)}
              </div>
            </div>
            <div className="card">
              <div className="kpi-label">Despesa realizada no mês</div>
              <div className="kpi-value despesa">{formatBRL(totalRealizadoDespesa)}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                Orçado ano: {formatBRL(totalOrcadoDespesa)}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Receitas por conta</h3>
            <table>
              <thead>
                <tr><th>Código</th><th>Conta</th><th>Orçado 2026</th><th>Realizado no mês</th><th>% do orçado</th></tr>
              </thead>
              <tbody>
                {contasReceita.map((c) => {
                  const realizado = realizadoPorConta(c.id, receitas);
                  const pct = Number(c.valor_orcado_2026) > 0 ? (realizado / Number(c.valor_orcado_2026)) * 100 : 0;
                  return (
                    <tr key={c.id}>
                      <td>{c.codigo}</td>
                      <td>{c.descricao}</td>
                      <td>{formatBRL(Number(c.valor_orcado_2026))}</td>
                      <td>{formatBRL(realizado)}</td>
                      <td style={{ width: 140 }}>
                        <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Despesas por conta</h3>
            <table>
              <thead>
                <tr><th>Código</th><th>Conta</th><th>Orçado 2026</th><th>Realizado no mês</th><th>% do orçado</th></tr>
              </thead>
              <tbody>
                {contasDespesa.map((c) => {
                  const realizado = realizadoPorConta(c.id, despesas);
                  const pct = Number(c.valor_orcado_2026) > 0 ? (realizado / Number(c.valor_orcado_2026)) * 100 : 0;
                  return (
                    <tr key={c.id}>
                      <td>{c.codigo}</td>
                      <td>{c.descricao}</td>
                      <td>{formatBRL(Number(c.valor_orcado_2026))}</td>
                      <td>{formatBRL(realizado)}</td>
                      <td style={{ width: 140 }}>
                        <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
