-- Trash is now retained until a user restores or permanently deletes each memo.
-- Dropping this RPC removes the former service-role-only automatic purge path;
-- it does not delete any memo or Storage data.
DROP FUNCTION IF EXISTS public.purge_expired_memo(UUID, UUID, TEXT[]);
