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
  ![Version](https://img.shields.io/badge/Version-v1.2.0-18181b)

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
- 📦 **Archive** — archive notes without deleting them
- 🗑️ **7-day Recycle Bin** — soft-delete notes and restore them during the 7-day retention window; scheduled purge requires the deployment steps below
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
- `memos`: `id`, `user_id`, `content`, `tags` (text array), the existing `visibility` column, `archived`, `created_at`, and `updated_at`. The app stores and displays only private notes; it writes `private` to this legacy column for compatibility.
- `resources`: `id`, `user_id`, nullable `memo_id`, `storage_path`, `filename`, `mime_type`, `size_bytes`, and `created_at`.
- A private Storage bucket named `resources`.
- RLS enabled on all tables and policies that restrict rows to their owner. Storage policies must likewise restrict reads, uploads, and deletes to the authenticated owner (uploaded paths begin with that user's ID).

The app calculates tags from the caller's private, non-archived, non-trash memos and activity counts from private, non-trash memos, so it does not require `my_tags()` or `memo_daily_counts()` RPCs. The repository does not supply the base tables or policies, so those must be created and tested in your own Supabase project before using the app. Do not disable RLS as a workaround.

### Apply the repository migrations

The migrations in `supabase/migrations/` currently add the trash timestamp/index and a narrowly granted purge RPC; they do not create the tables above. Review each migration and apply it to your project, for example with the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Alternatively, run the reviewed migration SQL in the Supabase SQL Editor in timestamp order. Do not run these commands against a project until its base schema exists and you have reviewed the changes. The scheduled purge RPC assumes `memos.user_id`, `resources.user_id`, `resources.memo_id`, and `resources.storage_path` exist.

### Configure the 7-day purge schedule

The UI's 7-day restore window is enforced by the purge query. The current browser app also tries an owner-scoped purge when it fetches notes, but deleting old notes is **not scheduled until you deploy and configure the server-side schedule**. The repository includes an Edge Function and a GitHub Actions schedule:

1. Apply the repository migrations, then deploy the function with the Supabase CLI:
   ```bash
   npx supabase functions deploy purge-expired-memos
   ```
   The function uses Supabase's server-side `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment values. Gateway JWT verification is enabled; the scheduled request uses the anon key plus a separate cron secret.
2. Set a high-entropy `PURGE_CRON_SECRET` in the Edge Function secret store (`npx supabase secrets set PURGE_CRON_SECRET=YOUR_RANDOM_VALUE`) and add the same value as a GitHub Actions secret. Also add GitHub Actions secrets named `SUPABASE_URL` and `SUPABASE_ANON_KEY`. The existing keep-alive workflow separately expects `SUPABASE_ANON_KEY`.
3. Enable GitHub Actions for the repository. `Purge expired trash` is scheduled daily at 03:15 UTC (10:15 WIB) and can also be started manually from the Actions tab. Scheduled runs can be delayed by GitHub; the function reads and processes expired memos in pages of 100 until the eligible queue is exhausted or the function runtime ends.

The function's gateway requires a valid Supabase JWT and the function checks the separate cron secret. It uses Supabase's server-side `SUPABASE_SERVICE_ROLE_KEY` only within the Edge Function to call the migration's service-role-only RPC; never copy that key to GitHub, `.env.local`, browser code, or a `NEXT_PUBLIC_` variable. The function removes owner-scoped Storage objects first, then deletes resource metadata and the expired memo atomically. If Storage removal or the database operation fails, the memo remains eligible for a later retry; repeating removal is safe. These steps configure the schedule in your own deployment; no live Supabase project is modified by this repository change.

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
