'use client';

import { useEffect, useState } from 'react';
import CurrencyInput from '@/components/CurrencyInput';

type Conta = { id: string; codigo: string; descricao: string };

type ItemFila = {
  id: string;
  arquivo_nome: string;
  conta_id: string | null;
  valor: number;
  data_pagamento: string | null;
  fornecedor: string | null;
  status: 'pendente' | 'confirmado';
  competencia: string;
};

function mesesDoAno() {
  const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return nomes.map((n, i) => ({ label: n, value: `2026-${String(i + 1).padStart(2, '0')}-01` }));
}

function rotuloCompetencia(competencia: string) {
  const mes = mesesDoAno().find((m) => m.value === competencia);
  return mes ? `${mes.label}/2026` : competencia;
}

export default function UploadDespesaPage() {
  const [competencia, setCompetencia] = useState(mesesDoAno()[new Date().getMonth()].value);
  const [contas, setContas] = useState<Conta[]>([]);
  const [fila, setFila] = useState<ItemFila[]>([]);
  const [processando, setProcessando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });

  async function carregarContas() {
    if (contas.length) return contas;
    const res = await fetch('/api/plano-contas?tipo=despesa').then((r) => r.json());
    setContas(res.contas ?? []);
    return res.contas ?? [];
  }

  async function carregarLancamentosDoMes() {
    setCarregando(true);
    await carregarContas();
    const res = await fetch(`/api/lancamentos?competencia=${competencia}`).then((r) => r.json());
    const itens: ItemFila[] = (res.lancamentos ?? []).map((l: any) => ({
      id: l.id,
      arquivo_nome: l.arquivo_nome ?? '(lançamento manual, sem recibo)',
      conta_id: l.conta_id,
      valor: Number(l.valor),
      data_pagamento: l.data_pagamento,
      fornecedor: l.fornecedor,
      status: l.status,
      competencia: l.competencia,
    }));
    setFila(itens);
    setCarregando(false);
  }

  useEffect(() => {
    carregarLancamentosDoMes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competencia]);

  function extrairPastaDoCaminho(relativePath: string): string {
    const partes = relativePath.split('/');
    if (partes.length >= 3) return partes[partes.length - 2];
    return '';
  }

  async function handleFiles(fileList: FileList) {
    await carregarContas();
    const arquivos = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    setProcessando(true);
    setProgresso({ atual: 0, total: arquivos.length });

    for (let i = 0; i < arquivos.length; i++) {
      const file = arquivos[i];
      const pastaNome = extrairPastaDoCaminho((file as any).webkitRelativePath || file.name);

      const fd = new FormData();
      fd.append('file', file);
      fd.append('pastaNome', pastaNome);
      fd.append('competencia', competencia);

      try {
        const res = await fetch('/api/extract-despesa', { method: 'POST', body: fd }).then((r) => r.json());
        if (res.lancamento) {
          setFila((prev) => [
            {
              id: res.lancamento.id,
              arquivo_nome: res.lancamento.arquivo_nome,
              conta_id: res.lancamento.conta_id,
              valor: Number(res.lancamento.valor),
              data_pagamento: res.lancamento.data_pagamento,
              fornecedor: res.lancamento.fornecedor,
              status: 'pendente',
              competencia: res.lancamento.competencia,
            },
            ...prev,
          ]);
        }
      } catch (e) {
        console.error('Falha ao processar', file.name, e);
      }
      setProgresso({ atual: i + 1, total: arquivos.length });
    }
    setProcessando(false);
  }

  async function atualizarItem(id: string, campos: Partial<ItemFila>) {
    setFila((prev) => prev.map((it) => (it.id === id ? { ...it, ...campos } : it)));
    await fetch('/api/lancamentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...campos }),
    });
  }

  async function confirmar(id: string) {
    await atualizarItem(id, { status: 'confirmado' });
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este lançamento? Essa ação não pode ser desfeita.')) return;
    setFila((prev) => prev.filter((it) => it.id !== id));
    await fetch(`/api/lancamentos?id=${id}`, { method: 'DELETE' });
  }

  async function confirmarTodosProntos() {
    const prontos = fila.filter((it) => it.status === 'pendente' && it.conta_id && it.valor > 0);
    for (const it of prontos) await confirmar(it.id);
  }

  const pendentesSemConta = fila.filter((it) => it.status === 'pendente' && !it.conta_id).length;

  const [mostrarManual, setMostrarManual] = useState(false);
  const [manual, setManual] = useState({ conta_id: '', valor: 0, data_pagamento: '', fornecedor: '' });
  const [salvandoManual, setSalvandoManual] = useState(false);

  async function salvarLancamentoManual() {
    if (!manual.conta_id || !manual.valor) return;
    setSalvandoManual(true);
    const res = await fetch('/api/lancamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conta_id: manual.conta_id,
        competencia,
        valor: manual.valor,
        data_pagamento: manual.data_pagamento || null,
        fornecedor: manual.fornecedor || null,
      }),
    }).then((r) => r.json());

    if (res.lancamento) {
      setFila((prev) => [
        {
          id: res.lancamento.id,
          arquivo_nome: '(lançamento manual, sem recibo)',
          conta_id: res.lancamento.conta_id,
          valor: Number(res.lancamento.valor),
          data_pagamento: res.lancamento.data_pagamento,
          fornecedor: res.lancamento.fornecedor,
          status: 'confirmado',
          competencia: res.lancamento.competencia,
        },
        ...prev,
      ]);
      setManual({ conta_id: '', valor: 0, data_pagamento: '', fornecedor: '' });
      setMostrarManual(false);
    }
    setSalvandoManual(false);
  }

  return (
    <div>
      <div className="page-title">Lançar Despesas</div>
      <div className="page-subtitle">Envie a pasta do mês inteira — o sistema classifica pela subpasta e lê os valores automaticamente</div>

      <div className="card toolbar">
        <div className="toolbar-group">
          <div className="field">
            <label>Competência selecionada</label>
            <select value={competencia} onChange={(e) => setCompetencia(e.target.value)}>
              {mesesDoAno().map((m) => (
                <option key={m.value} value={m.value}>{m.label}/2026</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Pasta do mês (com as subpastas de despesa)</label>
            <input
              type="file"
              // @ts-ignore - atributos não tipados do React para seleção de pasta
              webkitdirectory=""
              directory=""
              multiple
              disabled={processando}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>
        </div>
        {processando && (
          <div style={{ fontSize: 13, fontWeight: 700 }}>Processando {progresso.atual} de {progresso.total}…</div>
        )}
      </div>

      <div style={{
        background: '#faf3e6', border: '1px solid var(--dourado)', borderRadius: 8,
        padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 700,
      }}>
        Tudo que você lançar ou confirmar agora entra em <u>{rotuloCompetencia(competencia)}</u>. Confira antes de salvar.
      </div>

      <div className="card">
        <div className="toolbar">
          <h3 style={{ margin: 0 }}>Lançamento sem recibo</h3>
          <button
            className="btn-secondary"
            onClick={async () => {
              await carregarContas();
              setMostrarManual((v) => !v);
            }}
          >
            {mostrarManual ? 'Cancelar' : '+ Novo lançamento manual'}
          </button>
        </div>
        {mostrarManual && (
          <div className="toolbar-group" style={{ marginTop: 18 }}>
            <div className="field">
              <label>Conta</label>
              <select value={manual.conta_id} onChange={(e) => setManual((m) => ({ ...m, conta_id: e.target.value }))}>
                <option value="">— selecionar —</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>{c.codigo} · {c.descricao}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Valor</label>
              <CurrencyInput value={manual.valor} onChange={(v) => setManual((m) => ({ ...m, valor: v }))} />
            </div>
            <div className="field">
              <label>Data pagamento</label>
              <input type="date" value={manual.data_pagamento} onChange={(e) => setManual((m) => ({ ...m, data_pagamento: e.target.value }))} />
            </div>
            <div className="field">
              <label>Fornecedor</label>
              <input value={manual.fornecedor} onChange={(e) => setManual((m) => ({ ...m, fornecedor: e.target.value }))} />
            </div>
            <button className="btn-primary" disabled={salvandoManual || !manual.conta_id || !manual.valor} onClick={salvarLancamentoManual}>
              {salvandoManual ? 'Salvando…' : `Salvar em ${rotuloCompetencia(competencia)}`}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Lançamentos de {rotuloCompetencia(competencia)} ({fila.length})</h3>
          <button className="btn-ok" onClick={confirmarTodosProntos} disabled={!fila.some((it) => it.status === 'pendente' && it.conta_id && it.valor > 0)}>
            Confirmar todos os prontos
          </button>
        </div>
        {pendentesSemConta > 0 && (
          <div style={{ marginBottom: 12, fontSize: 13, color: '#7a1f1f', fontWeight: 700 }}>
            {pendentesSemConta} documento(s) sem conta identificada pela pasta — selecione manualmente antes de confirmar.
          </div>
        )}
        {carregando ? (
          <div>Carregando…</div>
        ) : fila.length === 0 ? (
          <div style={{ opacity: 0.6, fontSize: 13 }}>Nenhum lançamento em {rotuloCompetencia(competencia)} ainda.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Conta</th>
                  <th>Valor</th>
                  <th>Data pagamento</th>
                  <th>Fornecedor</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fila.map((item) => (
                  <tr key={item.id}>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.arquivo_nome}</td>
                    <td>
                      <select
                        value={item.conta_id ?? ''}
                        onChange={(e) => atualizarItem(item.id, { conta_id: e.target.value || null })}
                      >
                        <option value="">— selecionar —</option>
                        {contas.map((c) => (
                          <option key={c.id} value={c.id}>{c.codigo} · {c.descricao}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ width: 130 }}>
                      <CurrencyInput value={item.valor} onChange={(v) => atualizarItem(item.id, { valor: v })} />
                    </td>
                    <td style={{ width: 140 }}>
                      <input
                        type="date"
                        value={item.data_pagamento ?? ''}
                        onChange={(e) => atualizarItem(item.id, { data_pagamento: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        value={item.fornecedor ?? ''}
                        onChange={(e) => atualizarItem(item.id, { fornecedor: e.target.value })}
                      />
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'confirmado' ? 'badge-confirmado' : item.conta_id ? 'badge-pendente' : 'badge-sem-conta'}`}>
                        {item.status === 'confirmado' ? 'Confirmado' : item.conta_id ? 'Pendente' : 'Sem conta'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {item.status === 'pendente' && (
                          <button
                            className="btn-primary"
                            disabled={!item.conta_id || item.valor <= 0}
                            onClick={() => confirmar(item.id)}
                          >
                            Confirmar
                          </button>
                        )}
                        <button className="btn-secondary" onClick={() => excluir(item.id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
