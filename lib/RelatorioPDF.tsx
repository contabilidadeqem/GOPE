import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Rect, Line, Text as SvgText } from '@react-pdf/renderer';
import { NOMES_MESES, formatBRL, type LinhaAnual } from './reportData';
import { CapaPaisagem, CabecalhoPagina, paginaBaseStyles, CORES, BlocoConfiabilidadeAssinaturas } from './pdfShared';

const styles = StyleSheet.create({
  table: { display: 'flex', flexDirection: 'column', borderWidth: 1, borderColor: CORES.borda },
  trHead: { flexDirection: 'row', backgroundColor: CORES.begeMedio },
  tr: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: CORES.borda },
  thCodigo: { width: 34, padding: 3, fontSize: 6.5, fontWeight: 700 },
  thConta: { width: 110, padding: 3, fontSize: 6.5, fontWeight: 700 },
  thOrcado: { width: 58, padding: 3, fontSize: 6.5, fontWeight: 700, textAlign: 'right', borderRightWidth: 1.5, borderRightColor: CORES.dourado },
  thMes: { width: 46, padding: 3, fontSize: 6.5, fontWeight: 700, textAlign: 'right' },
  thTotal: { width: 62, padding: 3, fontSize: 6.5, fontWeight: 700, textAlign: 'right', backgroundColor: CORES.dourado },
  thPct: { width: 32, padding: 3, fontSize: 6.5, fontWeight: 700, textAlign: 'right' },
  tdCodigo: { width: 34, padding: 3, fontSize: 6.5 },
  tdConta: { width: 110, padding: 3, fontSize: 6.5 },
  tdOrcado: { width: 58, padding: 3, fontSize: 6.5, textAlign: 'right', fontWeight: 700, borderRightWidth: 1.5, borderRightColor: CORES.dourado },
  tdMes: { width: 46, padding: 3, fontSize: 6.5, textAlign: 'right' },
  tdTotal: { width: 62, padding: 3, fontSize: 6.5, textAlign: 'right', fontWeight: 700, backgroundColor: '#faf3e6' },
  tdPct: { width: 32, padding: 3, fontSize: 6.5, textAlign: 'right' },

  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  kpiBox: { flex: 1, backgroundColor: CORES.branco, borderWidth: 1, borderColor: CORES.borda, borderRadius: 6, padding: 12 },
  kpiLabel: { fontSize: 8, color: CORES.texto, opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' },
  kpiValor: { fontSize: 16, fontWeight: 700, marginTop: 4 },
});

function TabelaMensal({ titulo, linhas, ateMesIndex, totalOrcado }: { titulo: string; linhas: LinhaAnual[]; ateMesIndex: number; totalOrcado: number }) {
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{titulo}</Text>
      <View style={styles.table}>
        <View style={styles.trHead} fixed>
          <Text style={styles.thCodigo}>Código</Text>
          <Text style={styles.thConta}>Conta</Text>
          <Text style={styles.thOrcado}>Orçado {'\n'}no ano</Text>
          {NOMES_MESES.map((m, i) => (
            <Text key={m} style={[styles.thMes, { backgroundColor: i % 2 === 0 ? CORES.mesA : CORES.mesB }]}>{m}</Text>
          ))}
          <Text style={styles.thTotal}>Até {NOMES_MESES[ateMesIndex]}</Text>
          <Text style={styles.thPct}>%</Text>
        </View>
        {linhas.map(({ conta, porMes, realizadoAteMes }) => {
          const pct = Number(conta.valor_orcado_2026) > 0 ? (realizadoAteMes / Number(conta.valor_orcado_2026)) * 100 : 0;
          return (
            <View style={styles.tr} key={conta.id} wrap={false}>
              <Text style={styles.tdCodigo}>{conta.codigo}</Text>
              <Text style={styles.tdConta}>{conta.descricao}</Text>
              <Text style={styles.tdOrcado}>{formatBRL(Number(conta.valor_orcado_2026))}</Text>
              {porMes.map((v, i) => (
                <Text key={i} style={[styles.tdMes, { backgroundColor: i % 2 === 0 ? CORES.mesA : CORES.mesB }]}>
                  {i > ateMesIndex ? '—' : (v > 0 ? formatBRL(v) : '—')}
                </Text>
              ))}
              <Text style={styles.tdTotal}>{formatBRL(realizadoAteMes)}</Text>
              <Text style={styles.tdPct}>{pct.toFixed(0)}%</Text>
            </View>
          );
        })}
        <View style={[styles.tr, { backgroundColor: CORES.begeMedio }]}>
          <Text style={[styles.tdCodigo, { fontWeight: 700 }]}></Text>
          <Text style={[styles.tdConta, { fontWeight: 700 }]}>TOTAL</Text>
          <Text style={styles.tdOrcado}>{formatBRL(totalOrcado)}</Text>
          {Array.from({ length: 12 }).map((_, i) => (
            <Text key={i} style={styles.tdMes}>{i > ateMesIndex ? '—' : formatBRL(linhas.reduce((s, l) => s + l.porMes[i], 0))}</Text>
          ))}
          <Text style={[styles.tdTotal, { fontWeight: 700 }]}>{formatBRL(linhas.reduce((s, l) => s + l.realizadoAteMes, 0))}</Text>
          <Text style={styles.tdPct}>
            {totalOrcado > 0 ? ((linhas.reduce((s, l) => s + l.realizadoAteMes, 0) / totalOrcado) * 100).toFixed(0) : 0}%
          </Text>
        </View>
      </View>
    </View>
  );
}

function valorCompacto(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  if (v === 0) return '';
  return v.toFixed(0);
}

function GraficoBarras({ dados, largura, altura }: { dados: { mes: string; receita: number; despesa: number }[]; largura: number; altura: number }) {
  const max = Math.max(1, ...dados.flatMap((d) => [d.receita, d.despesa]));
  const larguraGrupo = largura / dados.length;
  const barraW = larguraGrupo / 3.4;
  const areaAltura = altura - 16;
  const alturaUtil = areaAltura - 12; // reserva espaço no topo para o rótulo do valor

  return (
    <Svg width={largura} height={altura + 12}>
      <Line x1={0} y1={areaAltura} x2={largura} y2={areaAltura} stroke={CORES.borda} strokeWidth={1} />
      {dados.map((d, i) => {
        const x = i * larguraGrupo + 6;
        const hReceita = (d.receita / max) * alturaUtil;
        const hDespesa = (d.despesa / max) * alturaUtil;
        return (
          <React.Fragment key={d.mes}>
            <Rect x={x} y={areaAltura - hReceita} width={barraW} height={hReceita} fill={CORES.verde} />
            {d.receita > 0 && (
              <SvgText x={x + barraW / 2} y={areaAltura - hReceita - 3} style={{ fontSize: 5.5 }} textAnchor="middle" fill={CORES.texto}>
                {valorCompacto(d.receita)}
              </SvgText>
            )}
            <Rect x={x + barraW + 2} y={areaAltura - hDespesa} width={barraW} height={hDespesa} fill={CORES.vermelho} />
            {d.despesa > 0 && (
              <SvgText x={x + barraW + 2 + barraW / 2} y={areaAltura - hDespesa - 3} style={{ fontSize: 5.5 }} textAnchor="middle" fill={CORES.texto}>
                {valorCompacto(d.despesa)}
              </SvgText>
            )}
            <SvgText x={x + barraW + 1} y={areaAltura + 10} style={{ fontSize: 6 }} textAnchor="middle" fill={CORES.texto}>
              {d.mes}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function GraficoOrcadoExecutado({
  itens, largura, altura,
}: { itens: { rotulo: string; orcado: number; executado: number; cor: string }[]; largura: number; altura: number }) {
  const max = Math.max(1, ...itens.flatMap((it) => [it.orcado, it.executado]));
  const larguraGrupo = largura / itens.length;
  const barraW = larguraGrupo / 3.2;
  const areaAltura = altura - 16;
  const alturaUtil = areaAltura - 14;

  return (
    <Svg width={largura} height={altura + 12}>
      <Line x1={0} y1={areaAltura} x2={largura} y2={areaAltura} stroke={CORES.borda} strokeWidth={1} />
      {itens.map((it, i) => {
        const x = i * larguraGrupo + (larguraGrupo - (barraW * 2 + 4)) / 2;
        const hOrcado = (it.orcado / max) * alturaUtil;
        const hExecutado = (it.executado / max) * alturaUtil;
        return (
          <React.Fragment key={it.rotulo}>
            <Rect x={x} y={areaAltura - hOrcado} width={barraW} height={hOrcado} fill={CORES.begeMedio} stroke={it.cor} strokeWidth={1} />
            {it.orcado > 0 && (
              <SvgText x={x + barraW / 2} y={areaAltura - hOrcado - 4} style={{ fontSize: 6.5 }} textAnchor="middle" fill={CORES.texto}>
                {formatBRL(it.orcado)}
              </SvgText>
            )}
            <Rect x={x + barraW + 4} y={areaAltura - hExecutado} width={barraW} height={hExecutado} fill={it.cor} />
            {it.executado > 0 && (
              <SvgText x={x + barraW + 4 + barraW / 2} y={areaAltura - hExecutado - 4} style={{ fontSize: 6.5 }} textAnchor="middle" fill={CORES.texto}>
                {formatBRL(it.executado)}
              </SvgText>
            )}
            <SvgText x={x + barraW + 2} y={areaAltura + 10} style={{ fontSize: 7 }} textAnchor="middle" fill={CORES.texto}>
              {it.rotulo}
            </SvgText>
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

  return (
    <Document>
      <CapaPaisagem subtitulo1="Balancete Orçamentário" subtitulo2={`Até ${NOMES_MESES[ateMesIndex]} de ${ano}`} />

      <Page size="A4" orientation="landscape" style={paginaBaseStyles.page}>
        <CabecalhoPagina titulo="Balancete Orçamentário — Receita" sub={`Grande Oriente de Pernambuco · até ${NOMES_MESES[ateMesIndex]}/${ano}`} />
        <TabelaMensal titulo="Receitas por conta" linhas={linhasReceita} ateMesIndex={ateMesIndex} totalOrcado={totalOrcadoReceita} />
        <Text style={paginaBaseStyles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      <Page size="A4" orientation="landscape" style={paginaBaseStyles.page}>
        <CabecalhoPagina titulo="Balancete Orçamentário — Despesa" sub={`Grande Oriente de Pernambuco · até ${NOMES_MESES[ateMesIndex]}/${ano}`} />
        <TabelaMensal titulo="Despesas por conta" linhas={linhasDespesa} ateMesIndex={ateMesIndex} totalOrcado={totalOrcadoDespesa} />
        <Text style={paginaBaseStyles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      <Page size="A4" orientation="landscape" style={paginaBaseStyles.page}>
        <CabecalhoPagina titulo="Sumário da Execução Orçamentária" sub={`Grande Oriente de Pernambuco · até ${NOMES_MESES[ateMesIndex]}/${ano}`} />

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

        <View style={{ flexDirection: 'row', gap: 40 }}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Receita x Despesa por mês</Text>
            <GraficoBarras dados={dadosGrafico} largura={420} altura={110} />
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, backgroundColor: CORES.verde }} />
                <Text style={{ fontSize: 8 }}>Receita</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, backgroundColor: CORES.vermelho }} />
                <Text style={{ fontSize: 8 }}>Despesa</Text>
              </View>
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Orçado x Executado no período</Text>
            <GraficoOrcadoExecutado
              largura={280}
              altura={110}
              itens={[
                { rotulo: 'Receita', orcado: totalOrcadoReceita, executado: totalRealizadoReceita, cor: CORES.verde },
                { rotulo: 'Despesa', orcado: totalOrcadoDespesa, executado: totalRealizadoDespesa, cor: CORES.vermelho },
              ]}
            />
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, backgroundColor: CORES.begeMedio, borderWidth: 1, borderColor: CORES.texto }} />
                <Text style={{ fontSize: 8 }}>Orçado no ano</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, backgroundColor: CORES.vermelho }} />
                <Text style={{ fontSize: 8 }}>Executado até {NOMES_MESES[ateMesIndex]}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <BlocoConfiabilidadeAssinaturas />
        </View>

        <Text style={paginaBaseStyles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
