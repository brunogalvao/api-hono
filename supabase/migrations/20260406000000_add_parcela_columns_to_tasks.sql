-- Adiciona colunas de parcelamento na tabela tasks
alter table tasks
  add column if not exists parcela_numero integer,
  add column if not exists parcela_total integer,
  add column if not exists parcela_group_id uuid;
