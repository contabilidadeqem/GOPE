'use client';

import { useEffect, useState } from 'react';
import CurrencyInput from '@/components/CurrencyInput';

type Conta = { id: string; codigo: string; descricao: string; valor_orcado_2026: number };

function mesesDoAno() {
  const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return nomes.map((n, i) => ({ label: n, value: `2026-${String(i + 1).padStart(2, '0')}-01` }));
}

export default function ReceitaPage() {
  const [competencia, setCompetencia] = useState(mesesDoAno()[new Date().getMonth()].value);
  const [contas, setContas] = useState<Conta[]>([]);
  const [valores, setValores] = useState<Record<string, number>>({});
  const [idsLancamento, setIdsLancamento] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const [contasRes, recRes] = await Promise.all([
      fetch('/api/plano-contas?tipo=receita').then((r) => r.json()),
      fetch(`/api/receita?competencia=${competencia}`).then((r) => r.json()),
    ]);
    setContas(contasRes.contas ?? []);
    const mapaValores: Record<string, number> = {};
    const mapaIds: Record<string, string> = {};
    for (const l of recRes.lancamentos ?? []) {
      mapaValores[l.conta_id] = Number(l.valor);
      mapaIds[l.conta_id] = l.id;
    }
    setValores(mapaValores);
    setIdsLancamento(mapaIds);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competencia]);

  async function salvar(contaId: string) {
    setSalvando((s) => ({ ...s, [contaId]: true }));
    await fetch('/api/receita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conta_id: contaId, competencia, valor: valores[contaId] ?? 0 }),
    });
    await carregar();
    setSalvando((s) => ({ ...s, [contaId]: false }));
  }

  async function limpar(contaId: string) {
    const id = idsLancamento[contaId];
    if (!id) return;
    if (!confirm('Remover o valor lançado para esta conta neste mês?')) return;
    await fetch(`/api/receita?id=${id}`, { method: 'DELETE' });
    setValores((v) => ({ ...v, [contaId]: 0 }));
    setIdsLancamento((ids) => {
      const novo = { ...ids };
      delete novo[contaId];
      return novo;
    });
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
                  <td>{Number(c.valor_orcado_2026).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                  <td style={{ width: 140 }}>
                    <CurrencyInput value={valores[c.id] ?? 0} onChange={(v) => setValores((val) => ({ ...val, [c.id]: v }))} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" disabled={salvando[c.id]} onClick={() => salvar(c.id)}>
                        {salvando[c.id] ? 'Salvando…' : 'Salvar'}
                      </button>
                      {idsLancamento[c.id] && (
                        <button className="btn-secondary" onClick={() => limpar(c.id)}>Excluir</button>
                      )}
                    </div>
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
