-- ============================================================
-- Migração 02 — rodar no SQL Editor do Supabase (projeto já em produção)
-- Adiciona suporte a lançamento manual de despesa (sem recibo)
-- ============================================================

alter table lancamentos_despesa alter column arquivo_path drop not null;
alter table lancamentos_despesa alter column arquivo_nome drop not null;

alter table lancamentos_despesa
  add column if not exists origem text not null default 'upload'
  check (origem in ('upload', 'manual'));
