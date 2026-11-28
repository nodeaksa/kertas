'use client'

import type { Dispatch, RefObject, SetStateAction } from 'react'
import { useLayoutEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import type { AppLabels, UploadPurpose } from '@/types/kertas'
import EditorToolbar from '@/components/EditorToolbar'

type MemoEditorProps = {
    memoEditorRef: RefObject<HTMLDivElement | null>
    memoTextareaRef: RefObject<HTMLTextAreaElement | null>
    content: string
    setContent: Dispatch<SetStateAction<string>>
    openUploadPicker: (purpose: UploadPurpose, imagesOnly?: boolean) => void
    insertSnippet: (snippet: string) => void
    handleSaveMemo: () => void
    submitting: boolean
    labels: AppLabels
    language: 'id' | 'en'
    onEditorFocus: () => void
    onPasteFiles: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void
}

export default function MemoEditor({
    memoEditorRef,
    memoTextareaRef,
    content,
    setContent,
    openUploadPicker,
    insertSnippet,
    handleSaveMemo,
    submitting,
    labels,
    language,
    onEditorFocus,
    onPasteFiles,
}: MemoEditorProps) {
    const [live, setLive] = useState(false)

    useLayoutEffect(() => {
        const textarea = memoTextareaRef.current
        if (!textarea) return

        const resize = () => {
            const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 24
            const viewportHeight = window.visualViewport?.height ?? window.innerHeight
            const maxHeight = Math.min(lineHeight * 6, Math.max(lineHeight, viewportHeight * 0.4))
            textarea.style.height = 'auto'
            const contentHeight = textarea.scrollHeight
            textarea.style.height = `${Math.min(contentHeight, maxHeight)}px`
            textarea.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden'
        }

        resize()
        window.addEventListener('resize', resize)
        window.visualViewport?.addEventListener('resize', resize)
        return () => {
            window.removeEventListener('resize', resize)
            window.visualViewport?.removeEventListener('resize', resize)
        }
    }, [content, memoTextareaRef])

    return (
        <div ref={memoEditorRef} className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-[#18181b]">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3 sm:hidden">
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{labels.newMemo}</h2>
                <button onClick={handleSaveMemo} disabled={submitting || !content.trim()} className="shrink-0 rounded-xl bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500">
                    {submitting ? labels.saving : labels.saveMemo}
                </button>
            </div>
            <textarea
                ref={memoTextareaRef}
                rows={1}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                onFocus={onEditorFocus}
                onPaste={onPasteFiles}
                placeholder={language === 'id' ? 'Berpikir tentang sesuatu?...' : 'What is on your mind?'}
                className="block max-h-[min(9rem,40dvh)] w-full resize-none overflow-y-hidden border-0 bg-transparent p-0 text-sm leading-6 text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:bg-transparent dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            {live && content.trim() && (
                <div className="mt-3 break-words border-t border-zinc-100 pt-3 text-sm leading-relaxed text-gray-800 dark:border-zinc-800 dark:text-zinc-200 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p+p]:mt-3 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[#262b33] [&_pre]:p-3 [&_pre]:text-xs [&_pre]:text-gray-100 [&_input[type=checkbox]]:mr-1.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{content}</ReactMarkdown>
                </div>
            )}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <div className="min-w-0 flex-1 overflow-x-auto">
                    <EditorToolbar
                        uploadPurpose="memo"
                        openUploadPicker={openUploadPicker}
                        insertSnippet={insertSnippet}
                        onEditorFocus={onEditorFocus}
                        language={language}
                    />
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setLive((v) => !v)}
                        className="rounded-lg px-1.5 py-1 text-xs font-semibold transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        {live ? 'Tutup preview' : 'Preview'}
                    </button>
                </div>
                <button onClick={handleSaveMemo} disabled={submitting || !content.trim()} className="ml-auto hidden shrink-0 rounded-xl bg-zinc-900 px-5 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 sm:inline-flex dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500">
                    {submitting ? labels.saving : labels.saveMemo}
                </button>
            </div>
        </div>
    )
}
