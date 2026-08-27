import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ExtracaoDespesa = {
  valor: number | null;
  data_pagamento: string | null; // formato YYYY-MM-DD
  fornecedor: string | null;
  descricao: string | null;
  confianca: 'alta' | 'media' | 'baixa';
};

const PROMPT = `Você está lendo um comprovante de despesa (recibo, boleto pago, comprovante bancário ou nota fiscal) de uma instituição maçônica brasileira.

Extraia exatamente estes campos e responda SOMENTE em JSON, sem texto antes ou depois, sem markdown:

{
  "valor": <número, o valor total efetivamente pago, use ponto decimal, sem R$ ou separador de milhar>,
  "data_pagamento": "<data do pagamento/efetivação no formato YYYY-MM-DD, ou null se não encontrar>",
  "fornecedor": "<nome do fornecedor/prestador/empresa cobrando, ou null>",
  "descricao": "<descrição curta do que é a despesa, poucas palavras>",
  "confianca": "<alta, media ou baixa - sua confiança na extração>"
}

Se o documento tiver múltiplas páginas (ex: comprovante de pagamento + boleto), priorize o valor e a data do COMPROVANTE DE PAGAMENTO EFETIVADO, não o valor nominal do boleto se forem diferentes (ex: se pagou com desconto/juros).
Se não conseguir ler algum campo com segurança, use null nesse campo e marque confianca como "baixa".`;

export async function extrairDadosDespesa(pdfBase64: string): Promise<ExtracaoDespesa> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock && 'text' in textBlock ? textBlock.text : '{}';
  const clean = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    return {
      valor: null,
      data_pagamento: null,
      fornecedor: null,
      descricao: null,
      confianca: 'baixa',
    };
  }
}
