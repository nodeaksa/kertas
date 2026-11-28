ALTER TABLE public.memos
    ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS memos_user_favorite_idx
    ON public.memos (user_id, created_at DESC)
    WHERE is_favorite = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS memos_user_pinned_idx
    ON public.memos (user_id, created_at DESC)
    WHERE is_pinned = TRUE AND deleted_at IS NULL;
