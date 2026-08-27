export type Conta = {
  id: string;
  codigo: string;
  descricao: string;
  tipo: 'receita' | 'despesa';
  valor_orcado_2026: number;
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
