-- Rollback script for 047_allow_marketplace_credit_types.sql
BEGIN;

ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_type_check
  CHECK (type IN ('earned', 'spent', 'bonus', 'referral', 'reset', 'purchase'));

COMMIT;
