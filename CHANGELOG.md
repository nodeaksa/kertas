# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-11-23

### Improved

- Lampiran gambar di kartu memo kini tampil sebagai thumbnail berbingkai dengan ukuran terbatas; gambar penuh tetap bisa dilihat di detail memo.
- Blok kode Markdown mendapatkan border yang lebih jelas.
- Menu titik tiga memakai ruang header tersendiri agar tidak menimpa teks, kode, atau gambar memo.

## [1.2.3] - 2026-11-22

### Added

- Memo panjang kini diringkas secara responsif (15 baris di mobile, 20 baris di desktop) dengan kontrol Show more/Show less tanpa mengubah konten asli.
- Timeline, Daily, Archive, dan Trash kini memuat memo per halaman (20 item) dengan tombol Load more; pencarian didebounce 300 ms.

### Changed

- Memo di Sampah tidak lagi dihapus otomatis setelah 7 hari; memo dan lampiran tetap ada sampai dipulihkan atau dihapus permanen secara manual.

## [1.2.2] - 2026-11-22

### Fixed

- Composer catatan baru kini tumbuh otomatis hingga enam baris (dibatasi sekitar 40dvh) sebelum memakai scroll internal, tanpa mengubah tata letak modal Edit.

## [1.2.1] - 2026-11-22

### Fixed

- Tombol Simpan Perubahan pada modal Edit dipindahkan ke footer di samping Batal; susunan satu baris dan label tombol disesuaikan untuk layar mobile.

## [1.2.0] - 2026-11-22

### Changed

- Hitungan tag di halaman utama hanya mencakup catatan privat yang tidak diarsip dan tidak berada di Sampah.
- Editor catatan dan modal Edit menggunakan tata letak yang lebih responsif pada perangkat mobile; hanya area teks yang menggulir saat keyboard terbuka.

### Removed

- Menghapus pengaturan dan label visibilitas publik/privat; catatan baru dan impor selalu disimpan sebagai privat, dan aplikasi hanya menampilkan catatan milik pengguna sendiri.

### Fixed

- Menambahkan konfigurasi viewport `interactiveWidget: resizes-content` agar konten menyesuaikan ruang saat keyboard mobile muncul.

## [1.1.2] - 2026-11-21

### Fixed

- Tema Light, Dark, dan System kini dikelola oleh `next-themes` agar pilihan System mengikuti perubahan preferensi OS tanpa bentrok dengan hydration.
- Ikon tema dan pilihan tema aktif ditampilkan setelah komponen ter-mount untuk mencegah hydration mismatch.

## [1.1.1] - 2026-11-21

### Fixed

- Tema System mengikuti preferensi warna OS, sementara pilihan Light dan Dark tidak lagi ditimpa preferensi OS.

## [1.1.0] - 2026-11-21

### Added

- Toolbar Markdown untuk editor catatan baru dan Edit, termasuk checklist, blok JavaScript, serta upload gambar dan lampiran.
- Infrastruktur purge Sampah terjadwal melalui Supabase Edge Function dan GitHub Actions. Jadwal memerlukan deployment serta konfigurasi secret; tidak aktif hanya dengan mengubah kode.

### Changed

- Editor catatan baru tumbuh hingga enam baris sebelum menggunakan scroll internal.
- Jumlah tag dan aktivitas hanya menghitung memo non-Sampah; hitungan tag tidak lagi bergantung pada RPC `my_tags()`.
- Animasi modal, menu memo, dan sidebar mobile menghormati preferensi reduced motion.

### Fixed

- Checklist Markdown dapat disisipkan pada kursor dan status preview disimpan ke Supabase tanpa optimistic update.
- Semua referensi lampiran dalam memo diproses; kegagalan metadata upload mencoba membersihkan file di Storage.
- Instruksi setup menjelaskan migration dan prasyarat Supabase yang memang belum disediakan repo.

## [1.0.3] - 2026-11-20

### Added

- Menambahkan dialog konfirmasi sebelum catatan dipindahkan ke Sampah, dengan penjelasan bahwa catatan akan dihapus permanen setelah 7 hari.

## [1.0.2] - 2026-11-20

### Fixed

- Memperbaiki tampilan baris baru pada konten catatan agar satu kali Enter tetap menjadi jeda baris di feed dan modal detail, tanpa mengganggu checklist Markdown.

## [1.0.1] - 2026-11-20

### Changed

- Menonaktifkan sementara fitur dan tampilan pendaftaran pengguna baru (*Daftar sekarang*) pada halaman login untuk membatasi akses ke mode privat.

### Added

- Menambahkan workflow otomatis GitHub Actions (`Supabase Keep-Alive`) untuk mencegah database Supabase terkena *auto-pause*.

## [1.0.0] - 2026-11-20

### Added

- **Rebranding to kertas.** — Full rebrand from "Memos" to **kertas.** (Indonesian for *"paper"*), with a new cat mascot logo (`icon.png`), Plus Jakarta Sans font, and updated metadata title/description.
- **Full Monochrome Theme** — Replaced all green accents (`emerald`/`#72a984`) with a strict monochrome palette: zinc-50 / white surfaces on Light Mode and `#0f0f10` / `#141416` / `#18181b` on Dark Mode. Destructive actions retain red only.
- **Dark / Light / System Theme Toggle** — Persistent theme preference stored in `localStorage` and Supabase `profiles` table.
- **Markdown GFM Support** — Full GitHub Flavored Markdown rendering via `react-markdown` + `remark-gfm`: tables, task lists, code blocks, blockquotes, and inline images.
- **Auto-tagging via `#hashtags`** — Tags are automatically extracted from note content on save and stored in a `tags[]` column; filterable from sidebar.
- **File Attachments (Supabase Storage)** — Upload and manage file resources linked to notes. Signed URLs generated per session. Files deletable from the Resources tab with a custom confirmation modal.
- **Daily Activity Heatmap** — 12-month contribution-style heatmap using `memo_daily_counts()` RPC, rendered with pure grayscale gradient cells.
- **Mini Calendar** — Browse notes by date via an inline calendar widget in the right panel. Initialized client-side to avoid Next.js SSR blocking-value warnings.
- **Bilingual UI (ID / EN)** — Full Indonesian and English interface labels, persisted in user preferences.
- **Custom Confirmation Modal** — Replaced all `window.confirm()` calls with an accessible modal component: dark overlay, monochrome card, warning icon, Cancel and Delete buttons with loading state, Escape-to-close support.
- **7-day Recycle Bin (Sampah)** — Soft-delete notes by setting `deleted_at` timestamp; notes are restorable within 7 days and auto-purged after expiry.
- **Archive** — Archive notes without deleting them; restorable from the Archived tab.
- **Search** — Full-text search across note content via Supabase `ilike` query.
- **Floating Action Button** — Mobile-friendly FAB to quickly compose a new note.
- **Safe Markdown Image Renderer** — Custom `img` renderer in `react-markdown` skips rendering when `src` is empty or invalid, eliminating console warnings.
- **`.env.example`** — Template environment file for easy project setup.

### Changed

- **Modular Component Architecture** — Refactored the monolithic `page.tsx` into focused, reusable components:
  - `Sidebar` — Navigation, tag list, user profile menu
  - `MemoEditor` — New note composer with file upload and visibility toggle
  - `MemoCard` — Individual note card with Markdown rendering and action menu
  - `RightPanel` — Calendar, heatmap, and resources panel
  - `SettingsView` — Profile, theme, language, and font-size settings
  - `Modals` — Shared modal layer (note detail / edit view)
- **Type Definitions Extracted** — All shared TypeScript types (`Memo`, `Resource`, `AppLabels`, `Theme`, `Language`, `FontSize`, `ActiveTab`, etc.) moved to `src/types/kertas.ts` for clean separation of concerns.
- **`calDate` Initialization Deferred** — Calendar date state initialized inside `useEffect` (not at render time) to avoid Next.js 16 "unstable value" blocking-route errors.
- **Package Name** — `package.json` `name` field updated from `memos-app` to `kertas`.

---

[1.3.0]: https://github.com/nodeaksa/kertas/releases/tag/v1.3.0
[1.2.3]: https://github.com/nodeaksa/kertas/releases/tag/v1.2.3
[1.2.2]: https://github.com/nodeaksa/kertas/releases/tag/v1.2.2
[1.2.1]: https://github.com/nodeaksa/kertas/releases/tag/v1.2.1
[1.2.0]: https://github.com/nodeaksa/kertas/releases/tag/v1.2.0
[1.1.2]: https://github.com/nodeaksa/kertas/releases/tag/v1.1.2
[1.1.1]: https://github.com/nodeaksa/kertas/releases/tag/v1.1.1
[1.1.0]: https://github.com/nodeaksa/kertas/releases/tag/v1.1.0
[1.0.3]: https://github.com/nodeaksa/kertas/releases/tag/v1.0.3
[1.0.2]: https://github.com/nodeaksa/kertas/releases/tag/v1.0.2
[1.0.1]: https://github.com/nodeaksa/kertas/releases/tag/v1.0.1
[1.0.0]: https://github.com/nodeaksa/kertas/releases/tag/v1.0.0
