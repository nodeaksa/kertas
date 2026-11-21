'use client'

import type { Dispatch, RefObject, SetStateAction } from 'react'
import { ChevronDown, Code2, Globe, Image as ImageIcon, Lock, Paperclip } from 'lucide-react'
import type { AppLabels } from '@/types/kertas'

type MemoEditorProps = {
    memoEditorRef: RefObject<HTMLDivElement | null>
    memoTextareaRef: RefObject<HTMLTextAreaElement | null>
    content: string
    setContent: Dispatch<SetStateAction<string>>
    visibility: 'private' | 'public'
    setVisibility: Dispatch<SetStateAction<'private' | 'public'>>
    openUploadPicker: (purpose: 'memo' | 'library', imagesOnly?: boolean) => void
    insertSnippet: (snippet: string) => void
    handleSaveMemo: () => void
    submitting: boolean
    labels: AppLabels
    language: 'id' | 'en'
}

export default function MemoEditor({
    memoEditorRef,
    memoTextareaRef,
    content,
    setContent,
    visibility,
    setVisibility,
    openUploadPicker,
    insertSnippet,
    handleSaveMemo,
    submitting,
    labels,
    language,
}: MemoEditorProps) {
    return (
        <div ref={memoEditorRef} className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-4 dark:bg-[#18181b] dark:border-zinc-800">
            <textarea
                ref={memoTextareaRef}
                rows={3}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={language === 'id' ? 'Berpikir tentang sesuatu?...' : 'What is on your mind?'}
                className="w-full resize-none border-0 bg-transparent focus:outline-none text-sm text-zinc-900 placeholder:text-zinc-400 dark:bg-transparent dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex min-w-0 flex-wrap items-center gap-1 text-gray-500 dark:text-zinc-400">
                    <button type="button" title="Unggah gambar" onClick={() => openUploadPicker('memo', true)} className="p-1.5 hover:bg-zinc-100 rounded-lg transition dark:hover:bg-zinc-800">
                        <ImageIcon className="w-4 h-4" />
                    </button>
                    <button type="button" title="Unggah lampiran" onClick={() => openUploadPicker('memo')} className="p-1.5 hover:bg-zinc-100 rounded-lg transition dark:hover:bg-zinc-800">
                        <Paperclip className="w-4 h-4" />
                    </button>
                    <button type="button" title="Blok Kode" onClick={() => insertSnippet('```js\n\n```')} className="p-1.5 hover:bg-zinc-100 rounded-lg transition dark:hover:bg-zinc-800">
                        <Code2 className="w-4 h-4" />
                    </button>
                    <button type="button" title="Checklist Markdown" onClick={() => insertSnippet('- [ ] ')} className="px-1.5 py-1 text-xs font-semibold hover:bg-zinc-100 rounded-lg transition dark:hover:bg-zinc-800">Mk</button>
                    <div className="h-4 w-[1px] bg-zinc-200 mx-1 dark:bg-zinc-700" />
                    <button type="button" onClick={() => setVisibility(visibility === 'private' ? 'public' : 'private')} className="flex items-center gap-1 text-xs text-zinc-600 hover:bg-zinc-100 px-2 py-1 rounded-lg transition dark:text-zinc-300 dark:hover:bg-zinc-800">
                        {visibility === 'private' ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />}
                        <ChevronDown className="w-3 h-3" />
                    </button>
                </div>
                <button onClick={handleSaveMemo} disabled={submitting || !content.trim()} className="ml-auto shrink-0 px-5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl transition disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500">
                    {submitting ? labels.saving : labels.saveMemo}
                </button>
            </div>
        </div>
    )
}
