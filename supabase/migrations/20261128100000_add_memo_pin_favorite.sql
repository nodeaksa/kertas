-- Pin & Favorit untuk catatan.
--
-- Aman dijalankan ulang (idempotent) dan kompatibel dengan kode yang sedang live:
-- kode lama tidak menyentuh kolom baru. JALANKAN SQL INI DI SUPABASE SEBELUM
-- MERGE KODE FITURNYA.
--
-- Pakai timestamp (bukan boolean) supaya pin bisa diurutkan dari yang terbaru.
-- NULL = tidak di-pin / tidak difavoritkan.

ALTER TABLE public.memos
    ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS favorited_at TIMESTAMPTZ;

-- Index parsial: kecil dan cepat untuk daftar Pin & Favorit.
-- Nama sengaja beda dari percobaan sebelumnya (memos_user_pinned_idx /
-- memos_user_favorite_idx) supaya tidak bentrok kalau index lama sempat dibuat.
CREATE INDEX IF NOT EXISTS memos_user_pinned_at_idx
    ON public.memos (user_id, pinned_at DESC)
    WHERE pinned_at IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS memos_user_favorited_at_idx
    ON public.memos (user_id, favorited_at DESC)
    WHERE favorited_at IS NOT NULL AND deleted_at IS NULL;

-- Bawa data dari percobaan sebelumnya (kolom boolean is_pinned / is_favorite),
-- hanya kalau kolomnya memang ada di database ini. Kolom lama TIDAK dihapus.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'memos' AND column_name = 'is_pinned'
    ) THEN
        EXECUTE 'UPDATE public.memos SET pinned_at = COALESCE(pinned_at, created_at) WHERE is_pinned IS TRUE';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'memos' AND column_name = 'is_favorite'
    ) THEN
        EXECUTE 'UPDATE public.memos SET favorited_at = COALESCE(favorited_at, created_at) WHERE is_favorite IS TRUE';
    END IF;
END
$$;

-- Toggle pin/favorit tidak boleh mengubah "Diperbarui" pada catatan.
-- Trigger ini jalan paling akhir (awalan "zz_" -> urutan alfabet) dan hanya
-- mengembalikan updated_at kalau YANG BERUBAH CUMA pin/favorit. Aman walaupun
-- tabelmu sudah punya trigger updated_at sendiri.
CREATE OR REPLACE FUNCTION public.memos_keep_updated_at_on_flag_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF (NEW.pinned_at IS DISTINCT FROM OLD.pinned_at
        OR NEW.favorited_at IS DISTINCT FROM OLD.favorited_at)
       AND NEW.content IS NOT DISTINCT FROM OLD.content
       AND NEW.tags IS NOT DISTINCT FROM OLD.tags
       AND NEW.archived IS NOT DISTINCT FROM OLD.archived
       AND NEW.deleted_at IS NOT DISTINCT FROM OLD.deleted_at
    THEN
        NEW.updated_at := OLD.updated_at;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_memos_keep_updated_at_on_flag_change ON public.memos;
CREATE TRIGGER zz_memos_keep_updated_at_on_flag_change
    BEFORE UPDATE ON public.memos
    FOR EACH ROW
    EXECUTE FUNCTION public.memos_keep_updated_at_on_flag_change();

-- ---------------------------------------------------------------------------
-- ROLLBACK (jalankan manual kalau perlu membatalkan; tidak menyentuh isi catatan)
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS zz_memos_keep_updated_at_on_flag_change ON public.memos;
-- DROP FUNCTION IF EXISTS public.memos_keep_updated_at_on_flag_change();
-- DROP INDEX IF EXISTS public.memos_user_pinned_at_idx;
-- DROP INDEX IF EXISTS public.memos_user_favorited_at_idx;
-- ALTER TABLE public.memos DROP COLUMN IF EXISTS pinned_at, DROP COLUMN IF EXISTS favorited_at;
