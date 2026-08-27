'use client';

import { useEffect, useState } from 'react';
import CurrencyInput from '@/components/CurrencyInput';

type Conta = { id: string; codigo: string; descricao: string; tipo: 'receita' | 'despesa'; valor_orcado_2026: number };

export default function PlanoContasEditor() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [valores, setValores] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const res = await fetch('/api/plano-contas').then((r) => r.json());
    const lista: Conta[] = res.contas ?? [];
    setContas(lista);
    const mapa: Record<string, number> = {};
    for (const c of lista) mapa[c.id] = Number(c.valor_orcado_2026);
    setValores(mapa);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar(id: string) {
    setSalvando((s) => ({ ...s, [id]: true }));
    await fetch('/api/plano-contas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, valor_orcado_2026: valores[id] ?? 0 }),
    });
    setSalvando((s) => ({ ...s, [id]: false }));
  }

  const receitas = contas.filter((c) => c.tipo === 'receita');
  const despesas = contas.filter((c) => c.tipo === 'despesa');

  function Tabela({ titulo, lista }: { titulo: string; lista: Conta[] }) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{titulo}</h3>
        <table>
          <thead>
            <tr><th>Código</th><th>Conta</th><th>Orçado no ano</th><th></th></tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id}>
                <td>{c.codigo}</td>
                <td>{c.descricao}</td>
                <td style={{ width: 160 }}>
                  <CurrencyInput value={valores[c.id] ?? 0} onChange={(v) => setValores((val) => ({ ...val, [c.id]: v }))} />
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
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Plano de Contas</div>
      <div className="page-subtitle">Alimente aqui o valor orçado no ano de cada conta — usado em todo o sistema e nos PDFs exportados</div>

      {carregando ? <div className="card">Carregando…</div> : (
        <>
          <Tabela titulo="Receitas" lista={receitas} />
          <Tabela titulo="Despesas" lista={despesas} />
        </>
      )}
    </div>
  );
}
