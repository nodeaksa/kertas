'use client'

import type { Dispatch, RefObject, SetStateAction } from 'react'
import { useLayoutEffect } from 'react'
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
}: MemoEditorProps) {
    useLayoutEffect(() => {
        const textarea = memoTextareaRef.current
        if (!textarea) return

        const resize = () => {
            const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 24
            const maxHeight = lineHeight * 6
            textarea.style.height = 'auto'
            textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
        }

        resize()
        window.addEventListener('resize', resize)
        return () => window.removeEventListener('resize', resize)
    }, [content, memoTextareaRef])

    return (
        <div ref={memoEditorRef} className="flex max-h-dvh min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-[#18181b]">
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
                placeholder={language === 'id' ? 'Berpikir tentang sesuatu?...' : 'What is on your mind?'}
                className="block min-h-0 w-full flex-1 resize-none overflow-y-auto border-0 bg-transparent p-0 text-sm leading-6 text-zinc-900 placeholder:text-zinc-400 focus:outline-none sm:flex-none dark:bg-transparent dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <div className="min-w-0 flex-1 overflow-x-auto">
                    <EditorToolbar
                        uploadPurpose="memo"
                        openUploadPicker={openUploadPicker}
                        insertSnippet={insertSnippet}
                        onEditorFocus={onEditorFocus}
                        language={language}
                    />
                </div>
                <button onClick={handleSaveMemo} disabled={submitting || !content.trim()} className="ml-auto hidden shrink-0 rounded-xl bg-zinc-900 px-5 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 sm:inline-flex dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500">
                    {submitting ? labels.saving : labels.saveMemo}
                </button>
            </div>
        </div>
    )
}
