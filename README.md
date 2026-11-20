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
  ![Version](https://img.shields.io/badge/Version-v1.0.3-18181b)

</div>

---

## ✨ About

**kertas.** (Indonesian for *"paper"*) is a personal note-taking web app focused on speed, clarity, and minimalism. Write notes in Markdown, tag them, attach files, and browse your activity — all in a clean monochrome UI.

> 💛 Huge shoutout to **[memos](https://github.com/usememos/memos)** — the open-source, self-hosted memo hub that inspired this project. kertas. was born from loving memos' philosophy of quick, frictionless thought capture and bringing it into a more personal, opinionated aesthetic.

---

## 🚀 Features

- 📝 **Markdown notes** — write with full GFM support (tables, checkboxes, code blocks)
- 🏷️ **Auto-tagging** — use `#hashtags` inline; tags are extracted automatically
- 📎 **File attachments** — upload and manage resources linked to your notes
- 📅 **Activity heatmap** — see your writing streak at a glance
- 🗓️ **Mini calendar** — browse notes by date
- 🔍 **Search** — full-text search across all your notes
- 📦 **Archive** — archive notes without deleting them
- 🗑️ **7-day Recycle Bin** — soft-delete notes with restore option and automatic purge after 7 days
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
cd memos-app
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

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Supabase Setup

You'll need the following in your Supabase project:

- **`profiles`** table — stores `username` and `theme` per user
- **`memos`** table — stores `content`, `tags[]`, `visibility`, `archived`, `created_at`, `deleted_at`
- **`resources`** table — stores file metadata (`filename`, `storage_path`, `mime_type`, `size_bytes`)
- **`resources`** storage bucket — for uploaded file attachments
- **RPC functions**:
  - `my_tags()` — returns tag counts for the current user
  - `memo_daily_counts()` — returns daily memo counts for the heatmap

> Row Level Security (RLS) should be enabled on all tables so users can only access their own data.

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
