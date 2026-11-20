ALTER TABLE public.memos
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS memos_deleted_at_idx
ON public.memos (deleted_at)
WHERE deleted_at IS NOT NULL;
