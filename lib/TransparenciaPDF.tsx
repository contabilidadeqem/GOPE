import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Path, Rect, Line } from '@react-pdf/renderer';
import { NOMES_MESES, formatBRL, type LinhaGrupo } from './reportData';
import { CapaPaisagem, CabecalhoPagina, paginaBaseStyles, CORES, BlocoConfiabilidadeAssinaturas } from './pdfShared';

const styles = StyleSheet.create({
  paragrafo: { fontSize: 10, lineHeight: 1.6, color: CORES.texto, marginBottom: 12, textAlign: 'justify' },
  tituloSecao: { fontSize: 13, fontWeight: 700, color: CORES.texto, marginBottom: 10 },

  table: { display: 'flex', flexDirection: 'column', borderWidth: 1, borderColor: CORES.borda, marginBottom: 18 },
  trHead: { flexDirection: 'row', backgroundColor: CORES.begeMedio },
  tr: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: CORES.borda },
  thConta: { width: 190, padding: 5, fontSize: 8, fontWeight: 700 },
  thValor: { flex: 1, padding: 5, fontSize: 8, fontWeight: 700, textAlign: 'right' },
  tdConta: { width: 190, padding: 5, fontSize: 8 },
  tdValor: { flex: 1, padding: 5, fontSize: 8, textAlign: 'right' },

  tableAnual: { display: 'flex', flexDirection: 'column', borderWidth: 1, borderColor: CORES.borda },
  thContaAnual: { width: 140, padding: 4, fontSize: 7, fontWeight: 700 },
  thMes: { width: 52, padding: 4, fontSize: 7, fontWeight: 700, textAlign: 'right' },
  tdContaAnual: { width: 140, padding: 4, fontSize: 7 },
  tdMes: { width: 52, padding: 4, fontSize: 7, textAlign: 'right' },
});

const TEXTO_INTRODUCAO = `O Grande Oriente de Pernambuco consolida-se como uma instituição que alia tradição e evolução, adotando práticas cada vez mais alinhadas aos princípios contemporâneos de governança, transparência e eficiência administrativa. Em um cenário de constantes transformações regulatórias e tecnológicas, sua atuação se orienta pela necessidade de estruturar, padronizar e fortalecer suas Lojas jurisdicionadas.

Mais do que preservar valores históricos, o Grande Oriente de Pernambuco assume um papel estratégico na organização institucional, promovendo diretrizes que visam segurança jurídica, controle patrimonial e sustentabilidade operacional. Esse posicionamento permite não apenas mitigar riscos, mas também criar bases sólidas para crescimento estruturado e continuidade das atividades durante os anos.

A busca por maior nível de organização e integração entre suas unidades reflete um movimento natural de amadurecimento institucional, no qual processos bem definidos, conformidade regulatória e gestão eficiente tornam-se pilares fundamentais. Nesse contexto, iniciativas voltadas à formalização, padronização e acompanhamento contábil, fiscal e financeira passam a ser elementos essenciais para garantir previsibilidade, transparência e fortalecimento da instituição como um todo.`;

function pontoNoCirculo(cx: number, cy: number, r: number, anguloGraus: number) {
  const rad = ((anguloGraus - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function fatiaPath(cx: number, cy: number, r: number, anguloInicio: number, anguloFim: number) {
  const inicio = pontoNoCirculo(cx, cy, r, anguloFim);
  const fim = pontoNoCirculo(cx, cy, r, anguloInicio);
  const largeArc = anguloFim - anguloInicio > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${inicio.x} ${inicio.y} A ${r} ${r} 0 ${largeArc} 0 ${fim.x} ${fim.y} Z`;
}

function PizzaOrcadoRealizado({ pctRealizado, titulo }: { pctRealizado: number; titulo: string }) {
  const cx = 55, cy = 55, r = 50;
  const anguloRealizado = Math.min(360, Math.max(0, (pctRealizado / 100) * 360));
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={110} height={110}>
        <Path d={fatiaPath(cx, cy, r, 0, anguloRealizado || 0.01)} fill={CORES.verde} />
        <Path d={fatiaPath(cx, cy, r, anguloRealizado, 360)} fill={CORES.vermelho} />
      </Svg>
      <Text style={{ fontSize: 9, fontWeight: 700, marginTop: 6 }}>{titulo}</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <View style={{ width: 7, height: 7, backgroundColor: CORES.vermelho }} />
          <Text style={{ fontSize: 7 }}>Orçado</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <View style={{ width: 7, height: 7, backgroundColor: CORES.verde }} />
          <Text style={{ fontSize: 7 }}>Realizado ({pctRealizado.toFixed(0)}%)</Text>
        </View>
      </View>
    </View>
  );
}

function GraficoBarrasEmpilhadas({ linhas, ateMesIndex, cores, largura, altura }: { linhas: LinhaGrupo[]; ateMesIndex: number; cores: string[]; largura: number; altura: number }) {
  const meses = NOMES_MESES.slice(0, ateMesIndex + 1);
  const totaisPorMes = meses.map((_, i) => linhas.reduce((s, l) => s + l.porMes[i], 0));
  const max = Math.max(1, ...totaisPorMes);
  const larguraGrupo = largura / meses.length;
  const barraW = larguraGrupo * 0.5;
  const areaAltura = altura - 16;

  return (
    <Svg width={largura} height={altura}>
      <Line x1={0} y1={areaAltura} x2={largura} y2={areaAltura} stroke={CORES.borda} strokeWidth={1} />
      {meses.map((_, i) => {
        const x = i * larguraGrupo + (larguraGrupo - barraW) / 2;
        let yAcumulado = areaAltura;
        return (
          <React.Fragment key={i}>
            {linhas.map((l, li) => {
              const h = (l.porMes[i] / max) * areaAltura;
              yAcumulado -= h;
              return <Rect key={li} x={x} y={yAcumulado} width={barraW} height={h} fill={cores[li % cores.length]} />;
            })}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function TabelaConsolidada({ titulo, linhas, ano }: { titulo: string; linhas: LinhaGrupo[]; ano: number }) {
  return (
    <View style={styles.table}>
      <View style={styles.trHead}>
        <Text style={styles.thConta}>{titulo}</Text>
        <Text style={styles.thValor}>Realizada em {ano}</Text>
        <Text style={styles.thValor}>Orçada no exercício</Text>
        <Text style={styles.thValor}>% realizada</Text>
        <Text style={styles.thValor}>A realizar até dezembro</Text>
        <Text style={styles.thValor}>% a realizar</Text>
      </View>
      {linhas.map((l) => {
        const pctRealizada = l.orcado > 0 ? (l.realizadoAteMes / l.orcado) * 100 : 0;
        const aRealizar = Math.max(0, l.orcado - l.realizadoAteMes);
        const pctARealizar = l.orcado > 0 ? (aRealizar / l.orcado) * 100 : 0;
        return (
          <View style={styles.tr} key={l.grupo}>
            <Text style={styles.tdConta}>{l.grupo}</Text>
            <Text style={styles.tdValor}>{formatBRL(l.realizadoAteMes)}</Text>
            <Text style={styles.tdValor}>{formatBRL(l.orcado)}</Text>
            <Text style={styles.tdValor}>{pctRealizada.toFixed(0)}%</Text>
            <Text style={styles.tdValor}>{formatBRL(aRealizar)}</Text>
            <Text style={styles.tdValor}>{pctARealizar.toFixed(0)}%</Text>
          </View>
        );
      })}
    </View>
  );
}

function TabelaAnualGrupo({ linhas }: { linhas: LinhaGrupo[] }) {
  return (
    <View style={styles.tableAnual}>
      <View style={styles.trHead}>
        <Text style={styles.thContaAnual}>Conta</Text>
        {NOMES_MESES.map((m) => <Text key={m} style={styles.thMes}>{m}</Text>)}
      </View>
      {linhas.map((l) => (
        <View style={styles.tr} key={l.grupo}>
          <Text style={styles.tdContaAnual}>{l.grupo}</Text>
          {l.porMes.map((v, i) => <Text key={i} style={styles.tdMes}>{v > 0 ? formatBRL(v) : '—'}</Text>)}
        </View>
      ))}
    </View>
  );
}

const CORES_RECEITA = [CORES.verde, '#6fa87a', '#a9822f', '#c9a24b'];
const CORES_DESPESA = [CORES.vermelho, '#b5573a', '#8a5a12'];

export function TransparenciaPDF({
  ano,
  ateMesIndex,
  gruposReceita,
  gruposDespesa,
}: {
  ano: number;
  ateMesIndex: number;
  gruposReceita: LinhaGrupo[];
  gruposDespesa: LinhaGrupo[];
}) {
  const totalOrcadoReceita = gruposReceita.reduce((s, l) => s + l.orcado, 0);
  const totalOrcadoDespesa = gruposDespesa.reduce((s, l) => s + l.orcado, 0);
  const totalRealizadoReceita = gruposReceita.reduce((s, l) => s + l.realizadoAteMes, 0);
  const totalRealizadoDespesa = gruposDespesa.reduce((s, l) => s + l.realizadoAteMes, 0);
  const pctReceita = totalOrcadoReceita > 0 ? (totalRealizadoReceita / totalOrcadoReceita) * 100 : 0;
  const pctDespesa = totalOrcadoDespesa > 0 ? (totalRealizadoDespesa / totalOrcadoDespesa) * 100 : 0;

  return (
    <Document>
      {/* PÁGINA 1 — Capa */}
      <CapaPaisagem subtitulo1="Apresentação de resultado mensal" subtitulo2={`${NOMES_MESES[ateMesIndex].toUpperCase()} ${ano}`} />

      {/* PÁGINA 2 — Introdução institucional (fixa) */}
      <Page size="A4" orientation="landscape" style={paginaBaseStyles.page}>
        <CabecalhoPagina titulo="Estruturação, Regularização e Segurança Jurídico-Contábil" sub="Grande Oriente de Pernambuco" />
        <Text style={styles.paragrafo}>{TEXTO_INTRODUCAO}</Text>
        <Text style={paginaBaseStyles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* PÁGINA 3 — Demonstração financeira consolidada (gráficos) */}
      <Page size="A4" orientation="landscape" style={paginaBaseStyles.page}>
        <CabecalhoPagina titulo="Demonstração Financeira Consolidada" sub={`Grande Oriente de Pernambuco · até ${NOMES_MESES[ateMesIndex]}/${ano}`} />
        <View style={{ flexDirection: 'row', gap: 30, marginBottom: 20 }}>
          <PizzaOrcadoRealizado pctRealizado={pctReceita} titulo="Receita" />
          <PizzaOrcadoRealizado pctRealizado={pctDespesa} titulo="Despesa" />
        </View>

        <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>Receita por grupo — evolução mensal</Text>
        <GraficoBarrasEmpilhadas linhas={gruposReceita} ateMesIndex={ateMesIndex} cores={CORES_RECEITA} largura={720} altura={110} />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {gruposReceita.map((l, i) => (
            <View key={l.grupo} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <View style={{ width: 7, height: 7, backgroundColor: CORES_RECEITA[i % CORES_RECEITA.length] }} />
              <Text style={{ fontSize: 7 }}>{l.grupo}</Text>
            </View>
          ))}
        </View>

        <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>Despesa por grupo — evolução mensal</Text>
        <GraficoBarrasEmpilhadas linhas={gruposDespesa} ateMesIndex={ateMesIndex} cores={CORES_DESPESA} largura={720} altura={110} />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
          {gruposDespesa.map((l, i) => (
            <View key={l.grupo} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <View style={{ width: 7, height: 7, backgroundColor: CORES_DESPESA[i % CORES_DESPESA.length] }} />
              <Text style={{ fontSize: 7 }}>{l.grupo}</Text>
            </View>
          ))}
        </View>

        <Text style={paginaBaseStyles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* PÁGINA 4 — Resumo consolidado */}
      <Page size="A4" orientation="landscape" style={paginaBaseStyles.page}>
        <CabecalhoPagina titulo="Resumo da Execução Orçamentária — Consolidada" sub={`Grande Oriente de Pernambuco · até ${NOMES_MESES[ateMesIndex]}/${ano}`} />
        <TabelaConsolidada titulo="Receitas" linhas={gruposReceita} ano={ano} />
        <TabelaConsolidada titulo="Despesas" linhas={gruposDespesa} ano={ano} />
        <Text style={paginaBaseStyles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* PÁGINA 5 — Visão anual detalhada por grupo */}
      <Page size="A4" orientation="landscape" style={paginaBaseStyles.page}>
        <CabecalhoPagina titulo="Demonstração Financeira Detalhada — Realizadas" sub={`Grande Oriente de Pernambuco · ano ${ano}`} />
        <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>Receitas</Text>
        <View style={{ marginBottom: 16 }}><TabelaAnualGrupo linhas={gruposReceita} /></View>
        <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>Despesas</Text>
        <TabelaAnualGrupo linhas={gruposDespesa} />

        <BlocoConfiabilidadeAssinaturas />

        <Text style={paginaBaseStyles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
