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

type FormConta = {
  codigo: string;
  descricao: string;
  valor: number;
  pasta_nome: string;
  grupo: string;
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
  const [carregando, setCarregando] = useState(true);

  const [mostrarNova, setMostrarNova] = useState(false);
  const [novaConta, setNovaConta] = useState(NOVA_CONTA_VAZIA);
  const [salvandoNova, setSalvandoNova] = useState(false);
  const [erroNova, setErroNova] = useState('');

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formEdicao, setFormEdicao] = useState<FormConta | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [avisoExclusao, setAvisoExclusao] = useState('');

  async function carregar() {
    setCarregando(true);
    const res = await fetch('/api/plano-contas').then((r) => r.json());
    setContas(res.contas ?? []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function gruposPorTipo(tipo: 'receita' | 'despesa') {
    return Array.from(new Set(contas.filter((c) => c.tipo === tipo && c.grupo).map((c) => c.grupo as string)));
  }

  // --- criação de conta nova ---
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

  // --- edição de conta existente ---
  function iniciarEdicao(c: Conta) {
    setEditandoId(c.id);
    setFormEdicao({
      codigo: c.codigo,
      descricao: c.descricao,
      valor: Number(c.valor_orcado_2026),
      pasta_nome: c.pasta_nome ?? '',
      grupo: c.grupo ?? '',
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setFormEdicao(null);
  }

  async function salvarEdicao(c: Conta) {
    if (!formEdicao) return;
    setSalvandoEdicao(true);
    await fetch('/api/plano-contas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: c.id,
        codigo: formEdicao.codigo.trim(),
        descricao: formEdicao.descricao.trim(),
        valor_orcado_2026: formEdicao.valor,
        pasta_nome: c.tipo === 'despesa' ? (formEdicao.pasta_nome.trim() || null) : null,
        grupo: formEdicao.grupo.trim() || null,
      }),
    });
    await carregar();
    setSalvandoEdicao(false);
    cancelarEdicao();
  }

  async function excluirConta(c: Conta) {
    if (!confirm(`Excluir a conta "${c.codigo} — ${c.descricao}"?`)) return;
    setExcluindoId(c.id);
    setAvisoExclusao('');
    const res = await fetch(`/api/plano-contas?id=${c.id}`, { method: 'DELETE' }).then((r) => r.json());
    if (res.error) {
      setAvisoExclusao(`Não foi possível excluir: ${res.error}`);
    } else if (res.arquivada) {
      setAvisoExclusao(`"${c.descricao}" já tem lançamentos, então foi arquivada em vez de apagada — some das listas, mas o histórico continua íntegro.`);
    }
    await carregar();
    setExcluindoId(null);
  }

  const receitas = contas.filter((c) => c.tipo === 'receita');
  const despesas = contas.filter((c) => c.tipo === 'despesa');

  function Tabela({ titulo, lista, tipo }: { titulo: string; lista: Conta[]; tipo: 'receita' | 'despesa' }) {
    const grupos = gruposPorTipo(tipo);
    const datalistId = `grupos-${tipo}`;

    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{titulo}</h3>
        <datalist id={datalistId}>
          {grupos.map((g) => <option key={g} value={g} />)}
        </datalist>
        <table>
          <thead>
            <tr><th>Código</th><th>Conta</th><th>Orçado no ano</th><th>Grupo consolidado</th><th></th></tr>
          </thead>
          <tbody>
            {lista.map((c) => {
              const emEdicao = editandoId === c.id;
              if (!emEdicao) {
                return (
                  <tr key={c.id}>
                    <td>{c.codigo}</td>
                    <td>{c.descricao}</td>
                    <td>{Number(c.valor_orcado_2026).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    <td style={{ opacity: 0.7 }}>{c.grupo || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary" onClick={() => iniciarEdicao(c)}>Editar</button>
                        <button className="btn-secondary" disabled={excluindoId === c.id} onClick={() => excluirConta(c)}>
                          {excluindoId === c.id ? 'Excluindo…' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={c.id} style={{ background: '#faf3e6' }}>
                  <td style={{ width: 110 }}>
                    <input value={formEdicao?.codigo ?? ''} onChange={(e) => setFormEdicao((f) => f && { ...f, codigo: e.target.value })} />
                  </td>
                  <td>
                    <input value={formEdicao?.descricao ?? ''} onChange={(e) => setFormEdicao((f) => f && { ...f, descricao: e.target.value })} style={{ width: '100%' }} />
                  </td>
                  <td style={{ width: 150 }}>
                    <CurrencyInput value={formEdicao?.valor ?? 0} onChange={(v) => setFormEdicao((f) => f && { ...f, valor: v })} />
                  </td>
                  <td style={{ width: 200 }}>
                    <input
                      value={formEdicao?.grupo ?? ''}
                      onChange={(e) => setFormEdicao((f) => f && { ...f, grupo: e.target.value })}
                      list={datalistId}
                      placeholder="ex: DESPESAS DE CUSTEIO"
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" disabled={salvandoEdicao} onClick={() => salvarEdicao(c)}>
                        {salvandoEdicao ? 'Salvando…' : 'Salvar'}
                      </button>
                      <button className="btn-secondary" onClick={cancelarEdicao}>Cancelar</button>
                    </div>
                  </td>
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
      <div className="page-title">Plano de Contas</div>
      <div className="page-subtitle">Alimente aqui o valor orçado no ano de cada conta — usado em todo o sistema e nos PDFs exportados</div>

      {avisoExclusao && (
        <div style={{
          background: '#faf3e6', border: '1px solid var(--dourado)', borderRadius: 8,
          padding: '10px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {avisoExclusao}
        </div>
      )}

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
                <select value={novaConta.tipo} onChange={(e) => setNovaConta((n) => ({ ...n, tipo: e.target.value as 'receita' | 'despesa', grupo: '' }))}>
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
                  placeholder={novaConta.tipo === 'despesa' ? 'ex: DESPESAS DE CUSTEIO' : 'ex: RECEITAS ORDINÁRIAS'}
                  list={`grupos-novo-${novaConta.tipo}`}
                  style={{ width: '100%' }}
                />
                <datalist id={`grupos-novo-${novaConta.tipo}`}>
                  {gruposPorTipo(novaConta.tipo).map((g) => <option key={g} value={g} />)}
                </datalist>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                  Só mostra sugestões de grupos de {novaConta.tipo === 'despesa' ? 'despesa' : 'receita'} — não misture os dois.
                </div>
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
          <Tabela titulo="Receitas" lista={receitas} tipo="receita" />
          <Tabela titulo="Despesas" lista={despesas} tipo="despesa" />
        </>
      )}
    </div>
  );
}
