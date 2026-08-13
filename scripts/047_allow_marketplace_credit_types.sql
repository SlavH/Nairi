-- Allow marketplace credit transaction types
-- The marketplace purchase/install routes insert credit_transactions with types
-- 'marketplace_purchase', 'marketplace_sale' and 'product_purchase', which were
-- not included in the original CHECK constraint from 012_create_credits_system.sql.
-- This migration expands the allowed set so those inserts no longer fail at runtime.

BEGIN;

-- Rebuild the CHECK constraint with the expanded type list
ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_type_check
  CHECK (type IN ('earned', 'spent', 'bonus', 'referral', 'reset', 'purchase', 'marketplace_purchase', 'marketplace_sale', 'product_purchase'));

COMMIT;
