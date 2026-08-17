-- Migration 014: pg_cron jobs
SELECT cron.schedule(
  'generate-recurring-transactions',
  '0 1 * * *',
  $$SELECT public.generate_recurring_transactions();$$
);

SELECT cron.schedule(
  'generate-installment-transactions',
  '0 2 * * *',
  $$SELECT public.generate_installment_transactions();$$
);

SELECT cron.schedule(
  'expire-workspace-invites',
  '0 * * * *',
  $$
    UPDATE public.workspace_invites
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at < now();
  $$
);;
