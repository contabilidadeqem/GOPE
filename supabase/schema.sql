-- ============================================================
-- GOPE - Sistema de Balancete Orçamentário
-- Schema do banco (Supabase / Postgres)
-- Rodar isso uma vez no SQL Editor do Supabase, na ordem.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- PLANO DE CONTAS (carregado a partir da LOA 2026)
-- ------------------------------------------------------------
create table plano_contas (
  id uuid primary key default uuid_generate_v4(),
  codigo text not null unique,          -- ex: 3.1.2.4
  descricao text not null,               -- ex: Despesas Administrativas
  tipo text not null check (tipo in ('receita', 'despesa')),
  pasta_nome text,                       -- nome exato da pasta usada pelo GOPE, para auto-match no upload
  valor_orcado_2026 numeric(14,2) not null default 0,
  ativo boolean not null default true
);

-- ------------------------------------------------------------
-- LANÇAMENTOS DE DESPESA (alimentado pelo fluxo de upload + IA)
-- ------------------------------------------------------------
create table lancamentos_despesa (
  id uuid primary key default uuid_generate_v4(),
  conta_id uuid not null references plano_contas(id),
  competencia date not null,             -- primeiro dia do mês de competência, ex: 2026-02-01
  valor numeric(14,2) not null,
  data_pagamento date,
  fornecedor text,
  descricao_documento text,
  arquivo_path text not null,            -- caminho no Supabase Storage
  arquivo_nome text not null,
  status text not null default 'pendente' check (status in ('pendente', 'confirmado')),
  extraido_por_ia jsonb,                 -- resposta bruta da IA, para auditoria
  criado_em timestamptz not null default now(),
  confirmado_em timestamptz
);

-- ------------------------------------------------------------
-- LANÇAMENTOS DE RECEITA (entrada manual por conta/mês, valor já vem pronto da sede)
-- ------------------------------------------------------------
create table lancamentos_receita (
  id uuid primary key default uuid_generate_v4(),
  conta_id uuid not null references plano_contas(id),
  competencia date not null,
  valor numeric(14,2) not null,
  observacao text,
  criado_em timestamptz not null default now(),
  unique (conta_id, competencia)
);

create index idx_despesa_competencia on lancamentos_despesa(competencia);
create index idx_despesa_conta on lancamentos_despesa(conta_id);
create index idx_receita_competencia on lancamentos_receita(competencia);

-- ------------------------------------------------------------
-- SEED: Plano de contas DESPESA (LOA 2026, valores orçados anuais)
-- pasta_nome = nome exato da subpasta usada na estrutura de arquivos do GOPE
-- ------------------------------------------------------------
insert into plano_contas (codigo, descricao, tipo, pasta_nome, valor_orcado_2026) values
('3.1.2.1',  'Pessoal e Encargos Sociais',              'despesa', 'PESSOAL E ENCARGOS SOCIAIS',              290000.00),
('3.1.2.2',  'Obrigações Judiciais e Extrajudiciais',    'despesa', 'OBRIGAÇÕES JUDICIAIS E EXTRAJUDICIAIS',   50000.00),
('3.1.2.3',  'Serviços Públicos',                        'despesa', 'SERVIÇOS PÚBLICOS',                       45000.00),
('3.1.2.4',  'Despesas Administrativas',                 'despesa', 'DESPESAS ADMINISTRATIVAS',                139800.58),
('3.1.2.5',  'Manutenção e Conservação Predial',         'despesa', 'MANUTENÇÃO E CONSERVAÇÃO PREDIAL',        30000.00),
('3.1.2.6',  'Manutenção e Conservação de Bens Móveis',  'despesa', 'MANUT. E CONSERVAÇÃO BENS MÓVEIS',        10000.00),
('3.1.2.7',  'Tributos e Taxas',                          'despesa', 'TRIBUTOS E TAXAS',                        15000.00),
('3.1.2.8',  'Despesas Financeiras',                      'despesa', 'DESPESAS FINANCEIRAS',                    13056.74),
('3.1.2.9',  'Restaurante/Cantina',                       'despesa', 'RESTAURANTE-CANTINA',                     2500.00),
('3.1.2.10', 'Paramentos e Condecorações',                'despesa', 'PARAMENTOS E CONDECORAÇÕES',              3000.00),
('3.1.2.11', 'Previdência e Assistência',                 'despesa', 'PREVIDÊNCIA E ASSISTÊNCIA',               30000.00),
('3.1.2.12', 'Atividades Paramaçônicas',                  'despesa', 'ATIVIDADES PARAMAÇÔNICAS',                20000.00),
('3.1.2.13', 'Ação Social e Filantrópicas',                'despesa', 'AÇÃO SOCIAL E FILANTRÓPICA',              10000.00),
('3.1.2.14', 'Projetos Maçônicos',                        'despesa', 'PROJETOS MAÇÔNICOS',                      90000.00),
('3.2.1.1.1','Poderosa Assembléia Estadual Legislativa Maçônica - PAEL', 'despesa', 'PODEROSA ASSEMBLEIA ESTADUAL LEGISLATIVA', 28832.39),
('3.2.1.1.2','Tribunal de Contas',                        'despesa', 'TRIBUNAL DE CONTAS',                      6653.63),
('3.2.2.2.1','Pod. Tribunal de Justiça Maçônico',         'despesa', 'TRIBUNAL DE JUSTIÇA MAÇÔNICO',            6653.63),
('3.2.2.2.2','Pod. Tribunal Eleitoral Maçônico',          'despesa', 'TRIBUNAL ELEITORAL MAÇÔNICO',             6653.63),
('3.3.1.1',  'Mobiliário',                                'despesa', 'MOBILIÁRIO',                              20000.00),
('3.3.1.2',  'Tecnologia da Informação',                  'despesa', 'TECNOLOGIA DA INFORMAÇÃO',                20000.00),
('3.3.1.3',  'Ampliação Infraestrutura',                  'despesa', 'AMPLIAÇÃO INFRAESTRUTURA',                25000.00),
('3.3.1.4',  'Construção, Ampliação e Reforma',           'despesa', 'CONSTRUÇÃO, AMPLIAÇÃO E REFORMA',         25000.00);

-- ------------------------------------------------------------
-- SEED: Plano de contas RECEITA (LOA 2026, valores orçados anuais)
-- Entrada manual por enquanto (a sede já entrega o total classificado)
-- ------------------------------------------------------------
insert into plano_contas (codigo, descricao, tipo, pasta_nome, valor_orcado_2026) values
('1.1.1.1', 'Cota Anual de Obreiros',        'receita', null, 529560.00),
('1.1.1.2', 'Taxa de Iniciação',              'receita', null, 63000.00),
('1.1.1.3', 'Taxa de Regularização',          'receita', null, 18000.00),
('1.1.1.4', 'Cota Anual das Lojas',           'receita', null, 14600.00),
('1.1.2.1', 'Livros, Impressos e Documentos', 'receita', null, 35626.80),
('1.1.2.2', 'Locação de Templo',              'receita', null, 53107.20),
('1.1.2.3', 'Créditos a Receber das Lojas',   'receita', null, 25256.60),
('1.1.2.5', 'Doações',                        'receita', null, 40000.00),
('1.1.3.1', 'Rendimento de Aplicação Financeira', 'receita', null, 98000.00),
('1.2.1.1', 'Alienação de Bens Móveis',       'receita', null, 10000.00);

-- ------------------------------------------------------------
-- STORAGE: criar o bucket pelos passos do painel do Supabase (Storage > New bucket)
-- Nome sugerido: "documentos-despesa", privado (não público)
-- ------------------------------------------------------------
