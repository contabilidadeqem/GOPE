import React from 'react';
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import path from 'path';

export const CORES = {
  bege: '#f5e9da',
  begeMedio: '#e8d2b0',
  capaFundo: '#f6e6e0',
  dourado: '#c9a24b',
  douradoClaro: '#dcbb85',
  douradoEscuro: '#a9822f',
  texto: '#3a2e1f',
  vermelho: '#7a1f1f',
  verde: '#3f7d4f',
  branco: '#fffdf9',
  borda: '#d8c39a',
};

export const CAMINHO_BRASAO = path.join(process.cwd(), 'public', 'brasao-gope.png');

const styles = StyleSheet.create({
  capaPage: { backgroundColor: CORES.capaFundo, fontFamily: 'Helvetica', position: 'relative' },
  faixaClara: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 34, backgroundColor: CORES.douradoClaro },
  faixaEscura: { position: 'absolute', left: 34, top: 0, bottom: 0, width: 14, backgroundColor: CORES.dourado },
  conteudo: { marginLeft: 90, marginTop: 46, marginRight: 46 },
  tituloInstituicao: { fontSize: 26, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.15 },
  brasao: { width: 150, height: 150, position: 'absolute', top: 40, right: 60 },
  subtitulo1: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginTop: 240 },
  subtitulo2: { fontSize: 13, color: '#1a1a1a', marginTop: 4 },
});

export function CapaPaisagem({ subtitulo1, subtitulo2 }: { subtitulo1: string; subtitulo2: string }) {
  return (
    <Page size="A4" orientation="landscape" style={styles.capaPage}>
      <View style={styles.faixaClara} />
      <View style={styles.faixaEscura} />
      <View style={styles.conteudo}>
        <Text style={styles.tituloInstituicao}>GRANDE ORIENTE{'\n'}DE PERNAMBUCO</Text>
        <Text style={styles.subtitulo1}>{subtitulo1}</Text>
        <Text style={styles.subtitulo2}>{subtitulo2}</Text>
      </View>
      <Image src={CAMINHO_BRASAO} style={styles.brasao} />
    </Page>
  );
}

export const paginaBaseStyles = StyleSheet.create({
  page: { backgroundColor: CORES.branco, padding: 26, fontFamily: 'Helvetica' },
  header: { backgroundColor: CORES.begeMedio, padding: 14, marginBottom: 16, borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitulo: { fontSize: 15, fontWeight: 700, color: CORES.texto },
  headerSub: { fontSize: 9, color: CORES.texto, marginTop: 2, opacity: 0.75 },
  footer: { position: 'absolute', bottom: 18, left: 26, right: 26, fontSize: 7, color: CORES.texto, opacity: 0.5, textAlign: 'center' },
});

export function CabecalhoPagina({ titulo, sub }: { titulo: string; sub: string }) {
  return (
    <View style={paginaBaseStyles.header}>
      <View>
        <Text style={paginaBaseStyles.headerTitulo}>{titulo}</Text>
        <Text style={paginaBaseStyles.headerSub}>{sub}</Text>
      </View>
      <Image src={CAMINHO_BRASAO} style={{ width: 36, height: 36 }} />
    </View>
  );
}

const assinaturaStyles = StyleSheet.create({
  container: { marginTop: 24 },
  paragrafo: { fontSize: 8.5, lineHeight: 1.6, color: CORES.texto, textAlign: 'justify', marginBottom: 50 },
  linhaAssinaturas: { flexDirection: 'row', justifyContent: 'space-between', gap: 40 },
  bloco: { flex: 1, alignItems: 'center' },
  linha: { borderTopWidth: 1, borderTopColor: CORES.texto, width: '100%', marginBottom: 6 },
  nome: { fontSize: 9, fontWeight: 700 },
  cargo: { fontSize: 8, opacity: 0.7, marginTop: 2 },
});

export function BlocoConfiabilidadeAssinaturas() {
  return (
    <View style={assinaturaStyles.container} wrap={false}>
      <Text style={assinaturaStyles.paragrafo}>
        As informações apresentadas neste demonstrativo foram elaboradas com base nos registros contábeis, documentos fiscais e extratos bancários disponibilizados ao Grande Oriente de Pernambuco, refletendo fielmente a execução orçamentária até a competência informada. A veracidade e a integridade dos dados aqui apresentados são de responsabilidade conjunta da administração e do profissional de contabilidade abaixo identificados.
      </Text>
      <View style={assinaturaStyles.linhaAssinaturas}>
        <View style={assinaturaStyles.bloco}>
          <View style={assinaturaStyles.linha} />
          <Text style={assinaturaStyles.nome}>GERALDO LUCIANO DE LIRA COSTA</Text>
          <Text style={assinaturaStyles.cargo}>Grão Mestre</Text>
        </View>
        <View style={assinaturaStyles.bloco}>
          <View style={assinaturaStyles.linha} />
          <Text style={assinaturaStyles.nome}>JARDEL QUEIROZ DA SILVA</Text>
          <Text style={assinaturaStyles.cargo}>Contador Responsável</Text>
        </View>
      </View>
    </View>
  );
}
