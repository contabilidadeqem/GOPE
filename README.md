# GOPE — Sistema de Balancete Orçamentário

MVP: substitui o preenchimento manual da planilha por upload de PDF + leitura via IA (despesa) e lançamento manual rápido (receita), com dashboard orçado x realizado.

## O que já funciona nesse MVP
- Plano de contas 2026 (despesa e receita) já carregado no banco
- Upload da pasta do mês inteira de despesa → classificação automática pela subpasta → IA lê valor/data/fornecedor de cada PDF (mesmo escaneado)
- Fila de conferência: você corrige o que a IA errou e confirma
- Lançamento manual de receita por conta/mês
- Dashboard com orçado x realizado por conta, filtro por mês
- Exportar PDF via botão (usa a impressão do navegador nesta primeira versão — no layout oficial idêntico ao atual entra na Fase 2)

## Passo a passo para colocar no ar (uns 20 minutos)

### 1. Supabase (banco de dados + armazenamento dos PDFs)
1. Crie um projeto em https://supabase.com (gratuito)
2. Vá em **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e rode. Isso cria as tabelas e já carrega o plano de contas 2026.
3. Vá em **Storage** → **New bucket** → nome `documentos-despesa` → deixe como privado (não público)
4. Vá em **Project Settings → API** e copie:
   - `Project URL` → vai virar `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → vai virar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → vai virar `SUPABASE_SERVICE_ROLE_KEY` (nunca expor no frontend, só usada nas API routes do servidor)

### 2. Anthropic (leitura dos PDFs)
1. Em https://console.anthropic.com, crie uma API key
2. Isso vai virar `ANTHROPIC_API_KEY`

### 3. Subir o código pro GitHub
No terminal, dentro da pasta do projeto:
```
git init
git add .
git commit -m "MVP sistema GOPE"
git branch -M main
git remote add origin https://github.com/contabilidadeqem/GOPE.git
git push -u origin main
```

### 4. Deploy na Vercel
1. Na Vercel, **Add New → Project**, conecte o repositório `GOPE`
2. Em **Environment Variables**, adicione as 4 variáveis do passo 1 e 2
3. Deploy

Pronto — o sistema fica no ar em `algumnome.vercel.app` (ou domínio próprio, se quiser conectar depois).

## Como usar no fechamento do mês
1. **Lançar Despesas**: escolha o mês, selecione a pasta DESPESA daquele mês (a mesma estrutura de subpastas que a sede já te manda). O sistema sobe tudo, lê cada PDF e monta a fila de conferência. Corrija o que precisar e confirme.
2. **Lançar Receita**: escolha o mês, digite o valor total de cada conta (que a sede já te passa classificado) e salve.
3. **Dashboard**: acompanhe orçado x realizado em tempo real, exporte quando fechar o mês.

## Próximos passos (Fase 2, depois de validar o MVP)
- PDF de exportação no layout idêntico ao balancete atual (detalhado + resumo), gerado pelo sistema em vez do print do navegador
- Alerta de contas sem nenhum lançamento no fechamento do mês
- Reconciliação com os extratos bancários
- Acesso do cliente (Grande Mestre / responsável administrativo) só de leitura ao dashboard
