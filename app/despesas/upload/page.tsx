'use client';

import { useState } from 'react';

type Conta = { id: string; codigo: string; descricao: string };

type ItemFila = {
  id: string; // id do lançamento no banco
  arquivo_nome: string;
  conta_id: string | null;
  valor: number;
  data_pagamento: string | null;
  fornecedor: string | null;
  status: 'pendente' | 'confirmado';
  contaEncontradaPelaPasta: boolean;
};

function mesesDoAno() {
  const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return nomes.map((n, i) => ({ label: n, value: `2026-${String(i + 1).padStart(2, '0')}-01` }));
}

export default function UploadDespesaPage() {
  const [competencia, setCompetencia] = useState(mesesDoAno()[new Date().getMonth()].value);
  const [contas, setContas] = useState<Conta[]>([]);
  const [fila, setFila] = useState<ItemFila[]>([]);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });

  async function carregarContas() {
    if (contas.length) return contas;
    const res = await fetch('/api/plano-contas?tipo=despesa').then((r) => r.json());
    setContas(res.contas ?? []);
    return res.contas ?? [];
  }

  function extrairPastaDoCaminho(relativePath: string): string {
    // ex: "DESPESA/DESPESAS ADMINISTRATIVAS/arquivo.pdf" -> "DESPESAS ADMINISTRATIVAS"
    // ex: "DESPESA/arquivo.pdf" -> "" (sem subpasta, precisa classificação manual)
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
            ...prev,
            {
              id: res.lancamento.id,
              arquivo_nome: res.lancamento.arquivo_nome,
              conta_id: res.lancamento.conta_id,
              valor: Number(res.lancamento.valor),
              data_pagamento: res.lancamento.data_pagamento,
              fornecedor: res.lancamento.fornecedor,
              status: 'pendente',
              contaEncontradaPelaPasta: res.contaEncontradaPelaPasta,
            },
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

  async function confirmarTodosProntos() {
    const prontos = fila.filter((it) => it.status === 'pendente' && it.conta_id && it.valor > 0);
    for (const it of prontos) await confirmar(it.id);
  }

  const pendentesSemConta = fila.filter((it) => it.status === 'pendente' && !it.conta_id).length;

  return (
    <div>
      <div className="page-title">Lançar Despesas</div>
      <div className="page-subtitle">Envie a pasta do mês inteira — o sistema classifica pela subpasta e lê os valores automaticamente</div>

      <div className="card">
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>Competência</label>
            <select value={competencia} onChange={(e) => setCompetencia(e.target.value)} style={{ marginTop: 4, width: 160 }}>
              {mesesDoAno().map((m) => (
                <option key={m.value} value={m.value}>{m.label}/2026</option>
              ))}
            </select>
          </div>
          <div>
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
          {processando && (
            <div style={{ fontSize: 13 }}>Processando {progresso.atual} de {progresso.total}…</div>
          )}
        </div>
      </div>

      {fila.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Fila de conferência ({fila.length})</h3>
            <button className="btn-ok" onClick={confirmarTodosProntos}>Confirmar todos os prontos</button>
          </div>
          {pendentesSemConta > 0 && (
            <div style={{ marginBottom: 12, fontSize: 13, color: '#7a1f1f', fontWeight: 700 }}>
              {pendentesSemConta} documento(s) sem conta identificada pela pasta — selecione manualmente antes de confirmar.
            </div>
          )}
          <table>
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
                      disabled={item.status === 'confirmado'}
                      onChange={(e) => atualizarItem(item.id, { conta_id: e.target.value || null })}
                    >
                      <option value="">— selecionar —</option>
                      {contas.map((c) => (
                        <option key={c.id} value={c.id}>{c.codigo} · {c.descricao}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ width: 110 }}>
                    <input
                      type="number"
                      step="0.01"
                      value={item.valor}
                      disabled={item.status === 'confirmado'}
                      onChange={(e) => atualizarItem(item.id, { valor: parseFloat(e.target.value) || 0 })}
                    />
                  </td>
                  <td style={{ width: 130 }}>
                    <input
                      type="date"
                      value={item.data_pagamento ?? ''}
                      disabled={item.status === 'confirmado'}
                      onChange={(e) => atualizarItem(item.id, { data_pagamento: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      value={item.fornecedor ?? ''}
                      disabled={item.status === 'confirmado'}
                      onChange={(e) => atualizarItem(item.id, { fornecedor: e.target.value })}
                    />
                  </td>
                  <td>
                    <span className={`badge ${item.status === 'confirmado' ? 'badge-confirmado' : item.conta_id ? 'badge-pendente' : 'badge-sem-conta'}`}>
                      {item.status === 'confirmado' ? 'Confirmado' : item.conta_id ? 'Pendente' : 'Sem conta'}
                    </span>
                  </td>
                  <td>
                    {item.status === 'pendente' && (
                      <button
                        className="btn-primary"
                        disabled={!item.conta_id || item.valor <= 0}
                        onClick={() => confirmar(item.id)}
                      >
                        Confirmar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
