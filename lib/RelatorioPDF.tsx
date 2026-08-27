import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Rect, Line } from '@react-pdf/renderer';
import { NOMES_MESES, formatBRL, type LinhaAnual } from './reportData';

const CORES = {
  bege: '#f5e9da',
  begeMedio: '#e8d2b0',
  dourado: '#c9a24b',
  douradoEscuro: '#a9822f',
  texto: '#3a2e1f',
  vermelho: '#7a1f1f',
  verde: '#3f7d4f',
  branco: '#fffdf9',
  borda: '#d8c39a',
};

const styles = StyleSheet.create({
  capaPage: { backgroundColor: CORES.bege, padding: 50, fontFamily: 'Helvetica' },
  capaFaixa: { width: 14, height: '100%', backgroundColor: CORES.dourado, position: 'absolute', left: 0, top: 0 },
  capaTitulo: { fontSize: 34, fontWeight: 700, color: CORES.texto, marginTop: 220 },
  capaSub: { fontSize: 14, color: CORES.texto, marginTop: 30 },
  capaAno: { fontSize: 12, color: CORES.texto, marginTop: 6, opacity: 0.8 },

  page: { backgroundColor: CORES.branco, padding: 24, fontFamily: 'Helvetica' },
  header: { backgroundColor: CORES.begeMedio, padding: 12, marginBottom: 14, borderRadius: 6 },
  headerTitulo: { fontSize: 14, fontWeight: 700, color: CORES.texto },
  headerSub: { fontSize: 9, color: CORES.texto, marginTop: 2, opacity: 0.75 },

  table: { display: 'flex', flexDirection: 'column', borderWidth: 1, borderColor: CORES.borda },
  trHead: { flexDirection: 'row', backgroundColor: CORES.begeMedio },
  tr: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: CORES.borda },
  thCodigo: { width: 34, padding: 3, fontSize: 6.5, fontWeight: 700 },
  thConta: { width: 96, padding: 3, fontSize: 6.5, fontWeight: 700 },
  thMes: { width: 44, padding: 3, fontSize: 6.5, fontWeight: 700, textAlign: 'right' },
  thTotal: { width: 58, padding: 3, fontSize: 6.5, fontWeight: 700, textAlign: 'right', backgroundColor: CORES.dourado },
  thPct: { width: 30, padding: 3, fontSize: 6.5, fontWeight: 700, textAlign: 'right' },
  tdCodigo: { width: 34, padding: 3, fontSize: 6.5 },
  tdConta: { width: 96, padding: 3, fontSize: 6.5 },
  tdMes: { width: 44, padding: 3, fontSize: 6.5, textAlign: 'right' },
  tdTotal: { width: 58, padding: 3, fontSize: 6.5, textAlign: 'right', fontWeight: 700, backgroundColor: '#faf3e6' },
  tdPct: { width: 30, padding: 3, fontSize: 6.5, textAlign: 'right' },

  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  kpiBox: { flex: 1, backgroundColor: CORES.branco, borderWidth: 1, borderColor: CORES.borda, borderRadius: 6, padding: 12 },
  kpiLabel: { fontSize: 8, color: CORES.texto, opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' },
  kpiValor: { fontSize: 16, fontWeight: 700, marginTop: 4 },

  footer: { position: 'absolute', bottom: 20, left: 24, right: 24, fontSize: 7, color: CORES.texto, opacity: 0.5, textAlign: 'center' },
});

function TabelaMensal({ titulo, linhas, ateMesIndex, totalOrcado }: { titulo: string; linhas: LinhaAnual[]; ateMesIndex: number; totalOrcado: number }) {
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{titulo}</Text>
      <View style={styles.table}>
        <View style={styles.trHead} fixed>
          <Text style={styles.thCodigo}>Código</Text>
          <Text style={styles.thConta}>Conta</Text>
          {NOMES_MESES.map((m) => <Text key={m} style={styles.thMes}>{m}</Text>)}
          <Text style={styles.thTotal}>Até {NOMES_MESES[ateMesIndex]}</Text>
          <Text style={styles.thPct}>%</Text>
        </View>
        {linhas.map(({ conta, porMes, realizadoAteMes }) => {
          const pct = Number(conta.valor_orcado_2026) > 0 ? (realizadoAteMes / Number(conta.valor_orcado_2026)) * 100 : 0;
          return (
            <View style={styles.tr} key={conta.id} wrap={false}>
              <Text style={styles.tdCodigo}>{conta.codigo}</Text>
              <Text style={styles.tdConta}>{conta.descricao}</Text>
              {porMes.map((v, i) => <Text key={i} style={styles.tdMes}>{v > 0 ? formatBRL(v) : '—'}</Text>)}
              <Text style={styles.tdTotal}>{formatBRL(realizadoAteMes)}</Text>
              <Text style={styles.tdPct}>{pct.toFixed(0)}%</Text>
            </View>
          );
        })}
        <View style={[styles.tr, { backgroundColor: CORES.begeMedio }]}>
          <Text style={[styles.tdCodigo, { fontWeight: 700 }]}></Text>
          <Text style={[styles.tdConta, { fontWeight: 700 }]}>TOTAL</Text>
          {Array.from({ length: 12 }).map((_, i) => (
            <Text key={i} style={styles.tdMes}>
              {formatBRL(linhas.reduce((s, l) => s + l.porMes[i], 0))}
            </Text>
          ))}
          <Text style={[styles.tdTotal, { fontWeight: 700 }]}>
            {formatBRL(linhas.reduce((s, l) => s + l.realizadoAteMes, 0))}
          </Text>
          <Text style={styles.tdPct}>
            {totalOrcado > 0 ? ((linhas.reduce((s, l) => s + l.realizadoAteMes, 0) / totalOrcado) * 100).toFixed(0) : 0}%
          </Text>
        </View>
      </View>
    </View>
  );
}

function GraficoBarras({ dados, largura, altura }: { dados: { mes: string; receita: number; despesa: number }[]; largura: number; altura: number }) {
  const max = Math.max(1, ...dados.flatMap((d) => [d.receita, d.despesa]));
  const larguraGrupo = largura / dados.length;
  const barraW = larguraGrupo / 3.2;
  const areaAltura = altura - 20;

  return (
    <Svg width={largura} height={altura}>
      <Line x1={0} y1={areaAltura} x2={largura} y2={areaAltura} stroke={CORES.borda} strokeWidth={1} />
      {dados.map((d, i) => {
        const x = i * larguraGrupo + 8;
        const hReceita = (d.receita / max) * areaAltura;
        const hDespesa = (d.despesa / max) * areaAltura;
        return (
          <React.Fragment key={d.mes}>
            <Rect x={x} y={areaAltura - hReceita} width={barraW} height={hReceita} fill={CORES.verde} />
            <Rect x={x + barraW + 2} y={areaAltura - hDespesa} width={barraW} height={hDespesa} fill={CORES.vermelho} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export function RelatorioPDF({
  ano,
  ateMesIndex,
  linhasReceita,
  linhasDespesa,
  totalOrcadoReceita,
  totalOrcadoDespesa,
}: {
  ano: number;
  ateMesIndex: number;
  linhasReceita: LinhaAnual[];
  linhasDespesa: LinhaAnual[];
  totalOrcadoReceita: number;
  totalOrcadoDespesa: number;
}) {
  const totalRealizadoReceita = linhasReceita.reduce((s, l) => s + l.realizadoAteMes, 0);
  const totalRealizadoDespesa = linhasDespesa.reduce((s, l) => s + l.realizadoAteMes, 0);
  const saldo = totalRealizadoReceita - totalRealizadoDespesa;

  const dadosGrafico = NOMES_MESES.slice(0, ateMesIndex + 1).map((mes, i) => ({
    mes,
    receita: linhasReceita.reduce((s, l) => s + l.porMes[i], 0),
    despesa: linhasDespesa.reduce((s, l) => s + l.porMes[i], 0),
  }));

  const topDespesas = [...linhasDespesa].sort((a, b) => b.realizadoAteMes - a.realizadoAteMes).slice(0, 8);

  return (
    <Document>
      {/* CAPA */}
      <Page size="A4" style={styles.capaPage}>
        <View style={styles.capaFaixa} />
        <Text style={{ fontSize: 26, fontWeight: 700, color: CORES.texto, marginLeft: 30 }}>GRANDE ORIENTE{'\n'}DE PERNAMBUCO</Text>
        <Text style={[styles.capaTitulo, { marginLeft: 30 }]}>Balancete{'\n'}Orçamentário</Text>
        <Text style={[styles.capaSub, { marginLeft: 30 }]}>Até {NOMES_MESES[ateMesIndex]} de {ano}</Text>
        <Text style={[styles.capaAno, { marginLeft: 30 }]}>LOA {ano}</Text>
      </Page>

      {/* RECEITA */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>Balancete Orçamentário — Receita</Text>
          <Text style={styles.headerSub}>Grande Oriente de Pernambuco · até {NOMES_MESES[ateMesIndex]}/{ano}</Text>
        </View>
        <TabelaMensal titulo="Receitas por conta" linhas={linhasReceita} ateMesIndex={ateMesIndex} totalOrcado={totalOrcadoReceita} />
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* DESPESA */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>Balancete Orçamentário — Despesa</Text>
          <Text style={styles.headerSub}>Grande Oriente de Pernambuco · até {NOMES_MESES[ateMesIndex]}/{ano}</Text>
        </View>
        <TabelaMensal titulo="Despesas por conta" linhas={linhasDespesa} ateMesIndex={ateMesIndex} totalOrcado={totalOrcadoDespesa} />
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* SUMÁRIO */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>Sumário da Execução Orçamentária</Text>
          <Text style={styles.headerSub}>Grande Oriente de Pernambuco · até {NOMES_MESES[ateMesIndex]}/{ano}</Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Receita realizada</Text>
            <Text style={[styles.kpiValor, { color: CORES.verde }]}>{formatBRL(totalRealizadoReceita)}</Text>
            <Text style={{ fontSize: 7, opacity: 0.6, marginTop: 2 }}>Orçado: {formatBRL(totalOrcadoReceita)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Despesa realizada</Text>
            <Text style={[styles.kpiValor, { color: CORES.vermelho }]}>{formatBRL(totalRealizadoDespesa)}</Text>
            <Text style={{ fontSize: 7, opacity: 0.6, marginTop: 2 }}>Orçado: {formatBRL(totalOrcadoDespesa)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Saldo do período</Text>
            <Text style={[styles.kpiValor, { color: saldo >= 0 ? CORES.verde : CORES.vermelho }]}>{formatBRL(saldo)}</Text>
            <Text style={{ fontSize: 7, opacity: 0.6, marginTop: 2 }}>Receita - Despesa</Text>
          </View>
        </View>

        <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Receita x Despesa por mês</Text>
        <View style={{ marginBottom: 6 }}>
          <GraficoBarras dados={dadosGrafico} largura={520} altura={160} />
        </View>
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, backgroundColor: CORES.verde }} />
            <Text style={{ fontSize: 8 }}>Receita</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, backgroundColor: CORES.vermelho }} />
            <Text style={{ fontSize: 8 }}>Despesa</Text>
          </View>
        </View>

        <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Maiores despesas do período</Text>
        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.thConta, { width: 260 }]}>Conta</Text>
            <Text style={[styles.thTotal, { width: 100 }]}>Realizado</Text>
            <Text style={styles.thPct}>%</Text>
          </View>
          {topDespesas.map((l) => (
            <View style={styles.tr} key={l.conta.id}>
              <Text style={[styles.tdConta, { width: 260 }]}>{l.conta.descricao}</Text>
              <Text style={[styles.tdTotal, { width: 100 }]}>{formatBRL(l.realizadoAteMes)}</Text>
              <Text style={styles.tdPct}>
                {totalRealizadoDespesa > 0 ? ((l.realizadoAteMes / totalRealizadoDespesa) * 100).toFixed(0) : 0}%
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
