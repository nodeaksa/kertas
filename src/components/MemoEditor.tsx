'use client'

import type { Dispatch, RefObject, SetStateAction } from 'react'
import { useLayoutEffect } from 'react'
import { ChevronDown, Globe, Lock } from 'lucide-react'
import type { AppLabels, UploadPurpose } from '@/types/kertas'
import EditorToolbar from '@/components/EditorToolbar'

type MemoEditorProps = {
    memoEditorRef: RefObject<HTMLDivElement | null>
    memoTextareaRef: RefObject<HTMLTextAreaElement | null>
    content: string
    setContent: Dispatch<SetStateAction<string>>
    visibility: 'private' | 'public'
    setVisibility: Dispatch<SetStateAction<'private' | 'public'>>
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
    visibility,
    setVisibility,
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
            textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
        }

        resize()
        window.addEventListener('resize', resize)
        return () => window.removeEventListener('resize', resize)
    }, [content, memoTextareaRef])

    return (
        <div ref={memoEditorRef} className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-4 dark:bg-[#18181b] dark:border-zinc-800">
            <textarea
                ref={memoTextareaRef}
                rows={1}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                onFocus={onEditorFocus}
                placeholder={language === 'id' ? 'Berpikir tentang sesuatu?...' : 'What is on your mind?'}
                className="block min-h-6 w-full resize-none overflow-y-hidden border-0 bg-transparent p-0 text-sm leading-6 text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:bg-transparent dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <EditorToolbar
                        uploadPurpose="memo"
                        openUploadPicker={openUploadPicker}
                        insertSnippet={insertSnippet}
                        onEditorFocus={onEditorFocus}
                        language={language}
                    />
                    <div className="h-4 w-[1px] bg-zinc-200 mx-1 dark:bg-zinc-700" />
                    <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setVisibility(visibility === 'private' ? 'public' : 'private')} className="flex items-center gap-1 text-xs text-zinc-600 hover:bg-zinc-100 px-2 py-1 rounded-lg transition dark:text-zinc-300 dark:hover:bg-zinc-800">
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
