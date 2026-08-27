'use client';

import { useEffect, useMemo, useState } from 'react';
import CurrencyInput from '@/components/CurrencyInput';

type Conta = {
  id: string;
  codigo: string;
  descricao: string;
  tipo: 'receita' | 'despesa';
  valor_orcado_2026: number;
  pasta_nome?: string | null;
  grupo?: string | null;
};

const NOVA_CONTA_VAZIA = {
  tipo: 'despesa' as 'receita' | 'despesa',
  codigo: '',
  descricao: '',
  valor: 0,
  pasta_nome: '',
  grupo: '',
};

export default function PlanoContasEditor() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [valores, setValores] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(true);

  const [mostrarNova, setMostrarNova] = useState(false);
  const [novaConta, setNovaConta] = useState(NOVA_CONTA_VAZIA);
  const [salvandoNova, setSalvandoNova] = useState(false);
  const [erroNova, setErroNova] = useState('');

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

  const gruposExistentes = useMemo(
    () => Array.from(new Set(contas.map((c) => c.grupo).filter(Boolean))) as string[],
    [contas]
  );

  async function criarConta() {
    setErroNova('');
    if (!novaConta.codigo.trim() || !novaConta.descricao.trim()) {
      setErroNova('Código e descrição são obrigatórios.');
      return;
    }
    setSalvandoNova(true);
    const res = await fetch('/api/plano-contas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: novaConta.codigo.trim(),
        descricao: novaConta.descricao.trim(),
        tipo: novaConta.tipo,
        valor_orcado_2026: novaConta.valor,
        pasta_nome: novaConta.tipo === 'despesa' ? (novaConta.pasta_nome.trim() || null) : null,
        grupo: novaConta.grupo.trim() || null,
      }),
    }).then((r) => r.json());

    if (res.error) {
      setErroNova(res.error.includes('duplicate') || res.error.includes('unique') ? 'Já existe uma conta com esse código.' : res.error);
    } else {
      await carregar();
      setNovaConta(NOVA_CONTA_VAZIA);
      setMostrarNova(false);
    }
    setSalvandoNova(false);
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

      <div className="card">
        <div className="toolbar">
          <h3 style={{ margin: 0 }}>Nova conta</h3>
          <button className="btn-secondary" onClick={() => setMostrarNova((v) => !v)}>
            {mostrarNova ? 'Cancelar' : '+ Nova conta de receita ou despesa'}
          </button>
        </div>

        {mostrarNova && (
          <div style={{ marginTop: 18 }}>
            <div className="toolbar-group">
              <div className="field">
                <label>Tipo</label>
                <select value={novaConta.tipo} onChange={(e) => setNovaConta((n) => ({ ...n, tipo: e.target.value as 'receita' | 'despesa' }))}>
                  <option value="despesa">Despesa</option>
                  <option value="receita">Receita</option>
                </select>
              </div>
              <div className="field">
                <label>Código (ex: 3.1.2.15)</label>
                <input value={novaConta.codigo} onChange={(e) => setNovaConta((n) => ({ ...n, codigo: e.target.value }))} style={{ width: 140 }} />
              </div>
              <div className="field" style={{ flex: 1, minWidth: 220 }}>
                <label>Descrição da conta</label>
                <input value={novaConta.descricao} onChange={(e) => setNovaConta((n) => ({ ...n, descricao: e.target.value }))} style={{ width: '100%' }} />
              </div>
              <div className="field">
                <label>Orçado no ano</label>
                <CurrencyInput value={novaConta.valor} onChange={(v) => setNovaConta((n) => ({ ...n, valor: v }))} />
              </div>
            </div>

            <div className="toolbar-group" style={{ marginTop: 14 }}>
              {novaConta.tipo === 'despesa' && (
                <div className="field" style={{ flex: 1, minWidth: 260 }}>
                  <label>Nome exato da subpasta de despesa (para classificação automática no upload)</label>
                  <input
                    value={novaConta.pasta_nome}
                    onChange={(e) => setNovaConta((n) => ({ ...n, pasta_nome: e.target.value }))}
                    placeholder="ex: DESPESAS ADMINISTRATIVAS"
                    style={{ width: '100%' }}
                  />
                </div>
              )}
              <div className="field" style={{ flex: 1, minWidth: 260 }}>
                <label>Grupo consolidado (Relatório de Transparência) — opcional</label>
                <input
                  value={novaConta.grupo}
                  onChange={(e) => setNovaConta((n) => ({ ...n, grupo: e.target.value }))}
                  placeholder="ex: DESPESAS DE CUSTEIO"
                  list="grupos-existentes"
                  style={{ width: '100%' }}
                />
                <datalist id="grupos-existentes">
                  {gruposExistentes.map((g) => <option key={g} value={g} />)}
                </datalist>
              </div>
            </div>

            {erroNova && <div style={{ color: 'var(--vermelho-institucional)', fontSize: 13, marginTop: 10 }}>{erroNova}</div>}

            <div style={{ marginTop: 14 }}>
              <button className="btn-primary" disabled={salvandoNova} onClick={criarConta}>
                {salvandoNova ? 'Criando…' : 'Criar conta'}
              </button>
            </div>
          </div>
        )}
      </div>

      {carregando ? <div className="card">Carregando…</div> : (
        <>
          <Tabela titulo="Receitas" lista={receitas} />
          <Tabela titulo="Despesas" lista={despesas} />
        </>
      )}
    </div>
  );
}
