CREATE OR REPLACE FUNCTION public.purge_expired_memo(
    p_memo_id UUID,
    p_user_id UUID,
    p_storage_paths TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
    IF COALESCE(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
    END IF;

    PERFORM 1
    FROM public.memos
    WHERE id = p_memo_id
      AND user_id = p_user_id
      AND deleted_at < now() - INTERVAL '7 days'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    UPDATE public.resources AS resource
    SET memo_id = NULL
    WHERE resource.user_id = p_user_id
      AND resource.memo_id = p_memo_id
      AND NOT (
          resource.storage_path = ANY(COALESCE(p_storage_paths, ARRAY[]::TEXT[]))
      );

    DELETE FROM public.resources AS resource
    WHERE resource.user_id = p_user_id
      AND resource.storage_path LIKE p_user_id::TEXT || '/%'
      AND resource.storage_path = ANY(COALESCE(p_storage_paths, ARRAY[]::TEXT[]));

    DELETE FROM public.memos
    WHERE id = p_memo_id
      AND user_id = p_user_id
      AND deleted_at < now() - INTERVAL '7 days';

    RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_memo(UUID, UUID, TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_memo(UUID, UUID, TEXT[]) TO service_role;
