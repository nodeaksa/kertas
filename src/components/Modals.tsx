'use client'

import { useEffect, useRef, useState, type Dispatch, type FormEvent, type RefObject, type SetStateAction } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { AlertTriangle, Pencil, X } from 'lucide-react'
import EditorToolbar from '@/components/EditorToolbar'
import type { AppLabels, DeleteTarget, Language, Memo, UploadPurpose } from '@/types/kertas'

function useDelayedPresence<T>(value: T | null, duration = 220) {
    const [item, setItem] = useState(value)
    const [visible, setVisible] = useState(value !== null)
    const hasItem = useRef(value !== null)

    useEffect(() => {
        let timeoutId: number | undefined
        let frameId: number | undefined
        let showFrameId: number | undefined

        if (value !== null) {
            frameId = window.requestAnimationFrame(() => {
                const wasPresent = hasItem.current
                hasItem.current = true
                setItem(value)
                if (wasPresent) return
                setVisible(false)
                showFrameId = window.requestAnimationFrame(() => setVisible(true))
            })
        } else {
            if (hasItem.current) {
                frameId = window.requestAnimationFrame(() => setVisible(false))
                const exitDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration
                timeoutId = window.setTimeout(() => {
                    hasItem.current = false
                    setItem(null)
                }, exitDelay)
            }
        }

        return () => {
            if (timeoutId !== undefined) window.clearTimeout(timeoutId)
            if (frameId !== undefined) window.cancelAnimationFrame(frameId)
            if (showFrameId !== undefined) window.cancelAnimationFrame(showFrameId)
        }
    }, [duration, value])

    return { item, visible }
}

type ModalsProps = {
    selectedMemo: Memo | null
    setSelectedMemo: Dispatch<SetStateAction<Memo | null>>
    editingMemo: boolean
    setEditingMemo: Dispatch<SetStateAction<boolean>>
    editContent: string
    setEditContent: Dispatch<SetStateAction<string>>
    editTextareaRef: RefObject<HTMLTextAreaElement | null>
    onEditorFocus: () => void
    openUploadPicker: (purpose: UploadPurpose, imagesOnly?: boolean) => void
    insertSnippet: (snippet: string) => void
    handleSaveMemoEdit: (event: FormEvent) => void
    handleToggleChecklist: (memoId: string, content: string, lineNumber: number, checked: boolean, updatedAt?: string | null) => void
    checklistSavingIds: Set<string>
    labels: AppLabels
    language: Language
    error: string | null
    getMemoDisplayContent: (content: string) => string
    deleteTarget: DeleteTarget | null
    setDeleteTarget: Dispatch<SetStateAction<DeleteTarget | null>>
    confirmLoading: boolean
    handleConfirmDelete: () => Promise<void>
    deleteResourceName: string | null
}

export default function Modals({
    selectedMemo,
    setSelectedMemo,
    editingMemo,
    setEditingMemo,
    editContent,
    setEditContent,
    editTextareaRef,
    onEditorFocus,
    openUploadPicker,
    insertSnippet,
    handleSaveMemoEdit,
    handleToggleChecklist,
    checklistSavingIds,
    labels,
    language,
    error,
    getMemoDisplayContent,
    deleteTarget,
    setDeleteTarget,
    confirmLoading,
    handleConfirmDelete,
    deleteResourceName,
}: ModalsProps) {
    const { item: displayedMemo, visible: memoVisible } = useDelayedPresence(selectedMemo)
    const { item: displayedDeleteTarget, visible: confirmVisible } = useDelayedPresence(deleteTarget)
    const modalMemo = displayedMemo
    const modalDeleteTarget = displayedDeleteTarget
    const memoBackdropTargetRef = useRef<EventTarget | null>(null)
    const confirmBackdropTargetRef = useRef<EventTarget | null>(null)
    type MarkdownNodeWithPosition = { position?: { start?: { line?: number } } }

    useEffect(() => {
        if (!selectedMemo) return

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSelectedMemo(null)
        }

        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [selectedMemo, setSelectedMemo])

    const isMoveToTrash = modalDeleteTarget?.type === 'moveToTrash'
    const confirmTitle = !modalDeleteTarget
        ? ''
        : isMoveToTrash
            ? (language === 'id' ? 'Pindahkan ke Sampah?' : 'Move to Trash?')
            : modalDeleteTarget.type === 'memo'
                ? (language === 'id' ? 'Hapus Catatan?' : 'Delete Note?')
                : modalDeleteTarget.type === 'resource'
                    ? (language === 'id' ? 'Hapus Lampiran?' : 'Delete Attachment?')
                    : (language === 'id' ? 'Kosongkan Sampah?' : 'Empty Trash?')
    const confirmDescription = !modalDeleteTarget
        ? ''
        : isMoveToTrash
            ? (language === 'id'
                ? 'Catatan di Sampah tidak akan dihapus otomatis. Kamu dapat memulihkannya atau menghapusnya permanen secara manual kapan saja.'
                : 'Notes in Trash are not deleted automatically. You can restore or permanently delete them manually at any time.')
            : modalDeleteTarget.type === 'memo'
                ? (language === 'id'
                    ? 'Catatan ini akan dihapus secara permanen dan tidak bisa dikembalikan.'
                    : 'This note will be permanently deleted and cannot be recovered.')
                : modalDeleteTarget.type === 'resource'
                    ? (language === 'id'
                        ? `Lampiran "${deleteResourceName ?? ''}" akan dihapus secara permanen dan tidak dapat dipulihkan.`
                        : `Attachment "${deleteResourceName ?? ''}" will be permanently deleted and cannot be recovered.`)
                    : (language === 'id'
                        ? 'Semua catatan di Sampah dan lampirannya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.'
                        : 'All notes in Trash and their attachments will be permanently deleted. This cannot be undone.')
    const confirmActionLabel = !modalDeleteTarget
        ? ''
        : confirmLoading
            ? (isMoveToTrash
                ? (language === 'id' ? 'Memindahkan...' : 'Moving...')
                : (language === 'id' ? 'Menghapus...' : 'Deleting...'))
            : isMoveToTrash
                ? (language === 'id' ? 'Pindahkan' : 'Move')
                : modalDeleteTarget.type === 'emptyTrash'
                    ? labels.emptyTrash
                    : labels.delete

    return (
        <>
            {modalMemo && (
                <div
                    role="presentation"
                    onMouseDown={(event) => {
                        memoBackdropTargetRef.current = event.target
                    }}
                    onClick={(event) => {
                        if (
                            memoBackdropTargetRef.current === event.currentTarget &&
                            event.target === event.currentTarget
                        ) {
                            setSelectedMemo(null)
                        }
                    }}
                    className={`fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 transition-opacity duration-200 sm:items-center sm:p-4 ${memoVisible ? 'opacity-100' : 'opacity-0'}`}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="memo-detail-title"
                        onClick={(event) => event.stopPropagation()}
                        className={`my-auto w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl transition duration-200 sm:p-6 dark:bg-[#18181b] dark:border-zinc-800 ${editingMemo ? 'flex max-h-dvh min-h-0 flex-col overflow-hidden sm:max-h-[90vh]' : 'max-h-dvh overflow-y-auto overscroll-contain sm:max-h-[90vh]'} ${memoVisible ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[.98]'}`}
                    >
                        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
                            <h2 id="memo-detail-title" className="text-lg font-semibold text-gray-800 dark:text-zinc-100">
                                {editingMemo ? labels.edit : labels.memos}
                            </h2>
                            <button
                                type="button"
                                aria-label={labels.close}
                                onClick={() => setSelectedMemo(null)}
                                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {error && (
                            <p role="alert" className="mb-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                                {error}
                            </p>
                        )}

                        {editingMemo ? (
                            <form onSubmit={handleSaveMemoEdit} className="flex min-h-0 flex-1 flex-col">
                                <label className="flex min-h-0 flex-1 flex-col text-sm font-medium text-gray-700 dark:text-zinc-300">
                                    {labels.memos}
                                    <textarea
                                        ref={editTextareaRef}
                                        rows={12}
                                        value={editContent}
                                        onChange={(event) => setEditContent(event.target.value)}
                                        onFocus={onEditorFocus}
                                        className="mt-1.5 min-h-0 w-full flex-1 resize-none overflow-y-auto rounded-xl border border-zinc-200 p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-600"
                                        required
                                    />
                                </label>
                                <div className="mt-2 flex shrink-0 flex-nowrap items-center gap-1.5 border-t border-zinc-100 pt-2 sm:mt-3 sm:gap-3 sm:pt-3 dark:border-zinc-800">
                                    <div className="min-w-0 flex-1 overflow-x-auto">
                                        <EditorToolbar
                                            uploadPurpose="edit"
                                            openUploadPicker={openUploadPicker}
                                            insertSnippet={insertSnippet}
                                            onEditorFocus={onEditorFocus}
                                            language={language}
                                        />
                                    </div>
                                    <div className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditContent(modalMemo.content)
                                                setEditingMemo(false)
                                            }}
                                            className="shrink-0 whitespace-nowrap rounded-xl border border-zinc-200 px-2 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 sm:px-4 sm:py-2 sm:text-sm dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                        >
                                            {labels.cancel}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!editContent.trim()}
                                            className="shrink-0 whitespace-nowrap rounded-xl bg-zinc-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 sm:px-4 sm:py-2 sm:text-sm dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                                        >
                                            <span className="sm:hidden">{language === 'id' ? 'Simpan' : 'Save'}</span>
                                            <span className="hidden sm:inline">{labels.save}</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-5">
                                {modalMemo.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {modalMemo.tags.map((tag) => (
                                            <span key={tag} className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    {modalMemo.archived && (
                                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">{labels.archived}</span>
                                    )}
                                </div>
                                <div className="prose prose-sm max-w-none break-words text-zinc-800 dark:text-zinc-200 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[#262b33] [&_pre]:p-3 [&_pre]:text-zinc-100">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm, remarkBreaks]}
                                        components={{
                                            li: ({ node, ...props }: React.ComponentProps<'li'> & { node?: MarkdownNodeWithPosition }) => (
                                                <li {...props} data-checklist-line={node?.position?.start?.line} />
                                            ),
                                            input: (props: React.ComponentProps<'input'>) => {
                                                return (
                                                    <input
                                                        {...props}
                                                        checked={Boolean(props.checked)}
                                                        disabled={Boolean(modalMemo.deleted_at) || checklistSavingIds.has(modalMemo.id)}
                                                        aria-label={language === 'id' ? 'Ubah status checklist' : 'Toggle checklist item'}
                                                        onClick={(event) => event.stopPropagation()}
                                                        onChange={(event) => {
                                                            event.stopPropagation()
                                                            const lineNumber = Number(event.currentTarget.closest('li')?.dataset.checklistLine)
                                                            handleToggleChecklist(modalMemo.id, modalMemo.content, lineNumber, event.currentTarget.checked, modalMemo.updated_at)
                                                        }}
                                                    />
                                                )
                                            },
                                        }}
                                    >
                                        {getMemoDisplayContent(modalMemo.content)}
                                    </ReactMarkdown>
                                </div>
                                <div className="space-y-1 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-xs text-zinc-500 dark:text-zinc-400">
                                    <p>
                                        {labels.createdAt}:{' '}
                                        {new Date(modalMemo.created_at).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}
                                    </p>
                                    <p>
                                        {labels.updatedAt}:{' '}
                                        {modalMemo.updated_at
                                            ? new Date(modalMemo.updated_at).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')
                                            : labels.notUpdated}
                                    </p>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setEditingMemo(true)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                                    >
                                        <Pencil className="h-4 w-4" />{labels.edit}
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            )}

            {modalDeleteTarget && (
                <div
                    role="presentation"
                    onMouseDown={(event) => {
                        confirmBackdropTargetRef.current = event.target
                    }}
                    onClick={(event) => {
                        if (
                            !confirmLoading &&
                            confirmBackdropTargetRef.current === event.currentTarget &&
                            event.target === event.currentTarget
                        ) {
                            setDeleteTarget(null)
                        }
                    }}
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-200 ${confirmVisible ? 'opacity-100' : 'opacity-0'}`}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-confirm-title"
                        onClick={(event) => event.stopPropagation()}
                        className={`w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl transition duration-200 dark:border-zinc-800 dark:bg-[#18181b] ${confirmVisible ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[.98]'}`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="rounded-full bg-red-50 p-2 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                                <AlertTriangle className="h-5 w-5" />
                            </span>
                            <div>
                                <h2 id="delete-confirm-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                    {confirmTitle}
                                </h2>
                                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                    {confirmDescription}
                                </p>
                            </div>
                            {error && (
                                <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                                    {error}
                                </p>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={confirmLoading}
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                                {language === 'id' ? 'Batal' : 'Cancel'}
                            </button>
                            <button
                                type="button"
                                disabled={confirmLoading}
                                onClick={handleConfirmDelete}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {confirmActionLabel}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    )
}
