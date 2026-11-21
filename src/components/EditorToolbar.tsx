'use client'

import type { MouseEvent } from 'react'
import { Code2, Image as ImageIcon, Paperclip } from 'lucide-react'
import type { Language, UploadPurpose } from '@/types/kertas'

type EditorToolbarProps = {
    uploadPurpose: Exclude<UploadPurpose, 'library'>
    openUploadPicker: (purpose: UploadPurpose, imagesOnly?: boolean) => void
    insertSnippet: (snippet: string) => void
    onEditorFocus: () => void
    language: Language
}

export default function EditorToolbar({
    uploadPurpose,
    openUploadPicker,
    insertSnippet,
    onEditorFocus,
    language,
}: EditorToolbarProps) {
    const labels = language === 'id'
        ? {
            image: 'Unggah gambar',
            attachment: 'Unggah lampiran',
            javascript: 'Blok JavaScript',
            checklist: 'Checklist Markdown',
        }
        : {
            image: 'Upload image',
            attachment: 'Upload attachment',
            javascript: 'JavaScript code block',
            checklist: 'Markdown checklist',
        }

    const insert = (snippet: string) => (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        onEditorFocus()
        insertSnippet(snippet)
    }
    const upload = (imagesOnly = false) => {
        onEditorFocus()
        openUploadPicker(uploadPurpose, imagesOnly)
    }
    const buttonClass = 'rounded-lg p-1.5 transition hover:bg-zinc-100 dark:hover:bg-zinc-800'

    return (
        <div className="flex min-w-0 flex-wrap items-center gap-1 text-gray-500 dark:text-zinc-400">
            <button type="button" title={labels.image} aria-label={labels.image} onMouseDown={(event) => event.preventDefault()} onClick={() => upload(true)} className={buttonClass}>
                <ImageIcon className="h-4 w-4" />
            </button>
            <button type="button" title={labels.attachment} aria-label={labels.attachment} onMouseDown={(event) => event.preventDefault()} onClick={() => upload()} className={buttonClass}>
                <Paperclip className="h-4 w-4" />
            </button>
            <button type="button" title={labels.javascript} aria-label={labels.javascript} onMouseDown={(event) => event.preventDefault()} onClick={insert('```js\n\n```')} className={buttonClass}>
                <Code2 className="h-4 w-4" />
            </button>
            <button type="button" title={labels.checklist} aria-label={labels.checklist} onMouseDown={(event) => event.preventDefault()} onClick={insert('- [ ] ')} className="rounded-lg px-1.5 py-1 text-xs font-semibold transition hover:bg-zinc-100 dark:hover:bg-zinc-800">Mk</button>
        </div>
    )
}
