-- Archived duplicate migration. Adiciona a coluna 'price' na tabela tasks, se não existir
alter table tasks
add column if not exists price numeric;
