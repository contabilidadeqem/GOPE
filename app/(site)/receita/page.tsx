'use client';

import { useEffect, useState } from 'react';

type Conta = { id: string; codigo: string; descricao: string; valor_orcado_2026: number };

function mesesDoAno() {
  const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return nomes.map((n, i) => ({ label: n, value: `2026-${String(i + 1).padStart(2, '0')}-01` }));
}

export default function ReceitaPage() {
  const [competencia, setCompetencia] = useState(mesesDoAno()[new Date().getMonth()].value);
  const [contas, setContas] = useState<Conta[]>([]);
  const [valores, setValores] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const [contasRes, recRes] = await Promise.all([
        fetch('/api/plano-contas?tipo=receita').then((r) => r.json()),
        fetch(`/api/receita?competencia=${competencia}`).then((r) => r.json()),
      ]);
      setContas(contasRes.contas ?? []);
      const mapa: Record<string, number> = {};
      for (const l of recRes.lancamentos ?? []) mapa[l.conta_id] = Number(l.valor);
      setValores(mapa);
      setCarregando(false);
    }
    carregar();
  }, [competencia]);

  async function salvar(contaId: string) {
    setSalvando((s) => ({ ...s, [contaId]: true }));
    await fetch('/api/receita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conta_id: contaId, competencia, valor: valores[contaId] ?? 0 }),
    });
    setSalvando((s) => ({ ...s, [contaId]: false }));
  }

  return (
    <div>
      <div className="page-title">Lançar Receita</div>
      <div className="page-subtitle">Digite o valor total do mês por conta — os valores já vêm classificados pela sede</div>

      <div className="card field" style={{ maxWidth: 220 }}>
        <label>Competência</label>
        <select value={competencia} onChange={(e) => setCompetencia(e.target.value)}>
          {mesesDoAno().map((m) => (
            <option key={m.value} value={m.value}>{m.label}/2026</option>
          ))}
        </select>
      </div>

      <div className="card">
        {carregando ? (
          <div>Carregando…</div>
        ) : (
          <table>
            <thead>
              <tr><th>Código</th><th>Conta</th><th>Orçado 2026</th><th>Valor do mês</th><th></th></tr>
            </thead>
            <tbody>
              {contas.map((c) => (
                <tr key={c.id}>
                  <td>{c.codigo}</td>
                  <td>{c.descricao}</td>
                  <td>{Number(c.valor_orcado_2026).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td style={{ width: 140 }}>
                    <input
                      type="number"
                      step="0.01"
                      value={valores[c.id] ?? ''}
                      onChange={(e) => setValores((v) => ({ ...v, [c.id]: parseFloat(e.target.value) || 0 }))}
                    />
                  </td>
                  <td>
                    <button className="btn-primary" disabled={salvando[c.id]} onClick={() => salvar(c.id)}>
                      {salvando[c.id] ? 'Salvando…' : 'Salvar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
