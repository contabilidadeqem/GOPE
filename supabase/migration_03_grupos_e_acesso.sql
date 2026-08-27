-- ============================================================
-- Migração 03 — rodar no SQL Editor do Supabase
-- Adiciona o agrupamento consolidado (RECEITAS ORDINÁRIAS, DESPESAS DE CUSTEIO etc.)
-- usado no Relatório de Transparência
-- ============================================================

alter table plano_contas add column if not exists grupo text;
alter table plano_contas add column if not exists grupo_codigo text;

-- Receita
update plano_contas set grupo = 'RECEITAS ORDINÁRIAS', grupo_codigo = '1.1.1' where codigo in ('1.1.1.1','1.1.1.2','1.1.1.3','1.1.1.4');
update plano_contas set grupo = 'RECEITAS DIVERSAS',   grupo_codigo = '1.1.2' where codigo in ('1.1.2.1','1.1.2.2','1.1.2.3','1.1.2.5');
update plano_contas set grupo = 'RECEITAS FINANCEIRAS', grupo_codigo = '1.1.3' where codigo in ('1.1.3.1');
update plano_contas set grupo = 'RECEITA DE CAPITAL',   grupo_codigo = '1.2'   where codigo in ('1.2.1.1');

-- Despesa
update plano_contas set grupo = 'DESPESAS DE CUSTEIO', grupo_codigo = '3.1.1' where codigo in
  ('3.1.2.1','3.1.2.2','3.1.2.3','3.1.2.4','3.1.2.5','3.1.2.6','3.1.2.7','3.1.2.8','3.1.2.9','3.1.2.10','3.1.2.11','3.1.2.12','3.1.2.13','3.1.2.14');
update plano_contas set grupo = 'TRANSFERÊNCIAS CORRENTES', grupo_codigo = '3.2' where codigo in
  ('3.2.1.1.1','3.2.1.1.2','3.2.2.2.1','3.2.2.2.2');
update plano_contas set grupo = 'DESPESAS DE CAPITAL', grupo_codigo = '3.3' where codigo in
  ('3.3.1.1','3.3.1.2','3.3.1.3','3.3.1.4');
