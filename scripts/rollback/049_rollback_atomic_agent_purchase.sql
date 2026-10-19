-- Rollback script for 049_atomic_agent_purchase.sql
-- Drops the RPC only; no table schema was changed, so no data to unwind.
BEGIN;

DROP FUNCTION IF EXISTS public.purchase_agent_atomic(UUID, UUID, BOOLEAN);

COMMIT;
