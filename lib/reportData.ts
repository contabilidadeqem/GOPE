export type Conta = {
  id: string;
  codigo: string;
  descricao: string;
  tipo: 'receita' | 'despesa';
  valor_orcado_2026: number;
  grupo?: string | null;
  grupo_codigo?: string | null;
};

export type Lancamento = {
  conta_id: string;
  competencia: string; // "2026-02-01"
  valor: number;
};

export type LinhaAnual = {
  conta: Conta;
  porMes: number[]; // índice 0 = Jan ... 11 = Dez
  realizadoAteMes: number; // soma de porMes[0..ateMesIndex]
  totalAno: number; // soma de porMes[0..11], igual realizadoAteMes quando ateMesIndex=11
};

export const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Monta a matriz anual: uma linha por conta, com o valor realizado em cada um dos 12 meses,
 * mais o acumulado até o mês de corte (ateMesIndex, 0-based).
 */
export function montarMatrizAnual(
  contas: Conta[],
  lancamentos: Lancamento[],
  ateMesIndex: number
): LinhaAnual[] {
  return contas.map((conta) => {
    const porMes = new Array(12).fill(0);
    for (const l of lancamentos) {
      if (l.conta_id !== conta.id) continue;
      const mesIndex = Number(l.competencia.slice(5, 7)) - 1;
      if (mesIndex >= 0 && mesIndex < 12) porMes[mesIndex] += Number(l.valor);
    }
    const totalAno = porMes.reduce((s, v) => s + v, 0);
    const realizadoAteMes = porMes.slice(0, ateMesIndex + 1).reduce((s, v) => s + v, 0);
    return { conta, porMes, realizadoAteMes, totalAno };
  });
}

export function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export type LinhaGrupo = {
  grupo: string;
  grupoCodigo: string;
  porMes: number[];
  realizadoAteMes: number;
  totalAno: number;
  orcado: number;
};

/**
 * Igual a montarMatrizAnual, mas soma as contas dentro do mesmo "grupo" consolidado
 * (ex: RECEITAS ORDINÁRIAS = soma de Cota de Obreiros + Taxa de Iniciação + ...).
 * É a visão usada no Relatório de Transparência.
 */
export function montarMatrizPorGrupo(
  contas: Conta[],
  lancamentos: Lancamento[],
  ateMesIndex: number
): LinhaGrupo[] {
  const grupos = new Map<string, { grupoCodigo: string; contaIds: string[]; orcado: number }>();

  for (const conta of contas) {
    const nomeGrupo = conta.grupo || conta.descricao;
    const codigoGrupo = conta.grupo_codigo || conta.codigo;
    if (!grupos.has(nomeGrupo)) {
      grupos.set(nomeGrupo, { grupoCodigo: codigoGrupo, contaIds: [], orcado: 0 });
    }
    const g = grupos.get(nomeGrupo)!;
    g.contaIds.push(conta.id);
    g.orcado += Number(conta.valor_orcado_2026);
  }

  const resultado: LinhaGrupo[] = [];
  for (const [nomeGrupo, info] of grupos) {
    const porMes = new Array(12).fill(0);
    for (const l of lancamentos) {
      if (!info.contaIds.includes(l.conta_id)) continue;
      const mesIndex = Number(l.competencia.slice(5, 7)) - 1;
      if (mesIndex >= 0 && mesIndex < 12) porMes[mesIndex] += Number(l.valor);
    }
    const totalAno = porMes.reduce((s, v) => s + v, 0);
    const realizadoAteMes = porMes.slice(0, ateMesIndex + 1).reduce((s, v) => s + v, 0);
    resultado.push({ grupo: nomeGrupo, grupoCodigo: info.grupoCodigo, porMes, realizadoAteMes, totalAno, orcado: info.orcado });
  }
  return resultado.sort((a, b) => a.grupoCodigo.localeCompare(b.grupoCodigo));
}

export type LinhaCombinada =
  | { tipo: 'sintetica'; grupo: string; grupoCodigo: string; porMes: number[]; realizadoAteMes: number; orcado: number }
  | { tipo: 'analitica'; conta: Conta; porMes: number[]; realizadoAteMes: number };

/**
 * Junta sintéticas e analíticas numa única lista, na ordem: linha do grupo (em negrito),
 * seguida das contas que pertencem a ele — igual ao balancete em PDF tradicional.
 */
export function montarLinhasCombinadas(
  contas: Conta[],
  lancamentos: Lancamento[],
  ateMesIndex: number
): LinhaCombinada[] {
  const grupos = montarMatrizPorGrupo(contas, lancamentos, ateMesIndex);
  const analiticas = montarMatrizAnual(contas, lancamentos, ateMesIndex);

  const linhas: LinhaCombinada[] = [];
  for (const g of grupos) {
    linhas.push({ tipo: 'sintetica', grupo: g.grupo, grupoCodigo: g.grupoCodigo, porMes: g.porMes, realizadoAteMes: g.realizadoAteMes, orcado: g.orcado });
    const membros = analiticas
      .filter((a) => (a.conta.grupo || a.conta.descricao) === g.grupo)
      .sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo));
    for (const m of membros) {
      linhas.push({ tipo: 'analitica', conta: m.conta, porMes: m.porMes, realizadoAteMes: m.realizadoAteMes });
    }
  }
  return linhas;
}
