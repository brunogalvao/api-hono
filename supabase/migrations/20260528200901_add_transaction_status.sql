
CREATE TYPE public.transaction_status AS ENUM ('pago', 'pendente');

ALTER TABLE public.transactions
  ADD COLUMN status public.transaction_status NOT NULL DEFAULT 'pendente';
;
