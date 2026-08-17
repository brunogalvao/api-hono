
ALTER TABLE public.transactions
ADD COLUMN installment_number INTEGER;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY installment_id
      ORDER BY date ASC, created_at ASC
    ) AS rn
  FROM public.transactions
  WHERE installment_id IS NOT NULL
)
UPDATE public.transactions t
SET installment_number = r.rn
FROM ranked r
WHERE t.id = r.id;
;
