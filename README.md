<div align="center">
  <img src="./src/app/icon.png" alt="kertas. logo" width="80" />

  # kertas.

  **Your little space for thoughts.**

  [Live Demo](https://kertasapp.vercel.app)

  A clean, minimal note-taking app inspired by the simplicity of [memos](https://github.com/usememos/memos).

  ![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
  ![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss)
  ![Version](https://img.shields.io/badge/Version-v1.5.1-18181b)

</div>

---

## ✨ About

**kertas.** (Indonesian for *"paper"*) is a personal note-taking web app focused on speed, clarity, and minimalism. Write notes in Markdown, tag them, attach files, and browse your activity — all in a clean monochrome UI.

> 💛 Huge shoutout to **[memos](https://github.com/usememos/memos)** — the open-source, self-hosted memo hub that inspired this project. kertas. was born from loving memos' philosophy of quick, frictionless thought capture and bringing it into a more personal, opinionated aesthetic.

---

## 🚀 Features

- 📝 **Markdown notes** — write with full GFM support (tables, checkboxes, code blocks)
- 🔒 **Private notes** — notes are only available to their owner
- 🏷️ **Auto-tagging** — use `#hashtags` inline; tags are extracted automatically
- 📎 **File attachments** — upload and manage resources linked to your notes
- 📅 **Activity heatmap** — see your writing streak at a glance
- 🗓️ **Mini calendar** — browse notes by date
- 🔍 **Search** — full-text search across all your notes
- 📌 **Pin** — pin up to five notes to the top of the Notes feed
- ⭐ **Favorites** — star notes and browse them from the sidebar
- 📦 **Archive** — archive notes without deleting them
- 🗑️ **Recycle Bin (Sampah)** — soft-delete notes; restore or permanently delete them manually at any time
- 🌙 **Dark / Light / System theme** — full monochrome palette (no eye-searing greens)
- 🌐 **Bilingual** — Indonesian (`id`) and English (`en`) UI
- 🔐 **Auth via Supabase** — secure login with email & password

---

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Backend     | [Supabase](https://supabase.com) (Auth, Database, Storage) |
| Styling     | [Tailwind CSS v4](https://tailwindcss.com) |
| Language    | TypeScript                          |
| Markdown    | `react-markdown` + `remark-gfm`    |
| Icons       | [Lucide React](https://lucide.dev)  |
| Font        | [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) |

---

## 🏁 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/nodeaksa/kertas.git
cd kertas
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These two `NEXT_PUBLIC_` values are the Supabase project URL and the publishable/anon key used by the browser client. They are not service-role credentials. Do not put a service-role key in `.env.local` or any `NEXT_PUBLIC_` variable.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Supabase Setup

This repository does **not** contain the base database schema, table-creation migrations, Storage bucket setup, or RLS policies. The app expects an existing Supabase project configured with:

- Supabase Auth email/password sign-in.
- `profiles`: `id` (matching `auth.users.id`), `username`, and `theme`.
- `memos`: `id`, `user_id`, `content`, `tags` (text array), the existing `visibility` column, `archived`, `created_at`, `updated_at`, and nullable `pinned_at` and `favorited_at` (`timestamptz`) columns. The app stores and displays only private notes; it writes `private` to this legacy column for compatibility.
- `resources`: `id`, `user_id`, nullable `memo_id`, `storage_path`, `filename`, `mime_type`, `size_bytes`, and `created_at`.
- A private Storage bucket named `resources`.
- RLS enabled on all tables and policies that restrict rows to their owner. Storage policies must likewise restrict reads, uploads, and deletes to the authenticated owner (uploaded paths begin with that user's ID).

The app calculates tags from the caller's private, non-archived, non-trash memos and activity counts from private, non-trash memos, so it does not require `my_tags()` or `memo_daily_counts()` RPCs. The repository does not supply the base tables or policies, so those must be created and tested in your own Supabase project before using the app. Do not disable RLS as a workaround.

### Apply the repository migrations

The migrations in `supabase/migrations/` add the trash timestamp/index and pin/favorite columns, and remove the legacy purge RPC; they do not create the tables above. Review each migration and apply it to your project, for example with the Supabase CLI:

Migration `20261128100000_add_memo_pin_favorite.sql` adds the pin/favorite columns; run it before deploying code that uses them.

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Alternatively, run the reviewed migration SQL in the Supabase SQL Editor in timestamp order. Do not run these commands against a project until its base schema exists and you have reviewed the changes.

### Trash retention

Notes moved to Trash remain there until they are restored or permanently deleted manually. The browser app no longer purges notes when loading, and this repository no longer schedules automatic purges.

The previous `purge-expired-memos` Edge Function may still be deployed in a Supabase project; changing or removing repository files does not update a deployed function. If it was deployed, delete it from Supabase Dashboard → Edge Functions, or deploy this repository's updated handler (which returns HTTP 410) before applying the migration that removes its RPC. No live Supabase project is modified by this repository change.

---

## 🎨 Design

kertas. uses a strict **monochrome palette**:

- **Light Mode** — white surfaces, zinc-50 background, zinc-900 accents
- **Dark Mode** — `#0f0f10` background, `#141416` sidebar, `#18181b` cards
- **No green.** Destructive actions (delete) use red only.

---

## 🙏 Acknowledgements

- [**memos**](https://github.com/usememos/memos) — the open-source inspiration that showed how beautiful a simple memo tool can be. kertas. would not exist without it. 🫶
- [Next.js](https://nextjs.org) by Vercel
- [Supabase](https://supabase.com) for the incredible open-source backend
- [Lucide](https://lucide.dev) for the clean icon set

---

<div align="center">
  Made with ☕ and <a href="https://github.com/usememos/memos">memos</a> as inspiration. &nbsp;·&nbsp; <a href="./CHANGELOG.md">Changelog</a>
</div>
