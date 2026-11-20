'use client'

import type { Dispatch, FormEvent, SetStateAction } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { AlertTriangle, Pencil, X } from 'lucide-react'
import type { AppLabels, DeleteTarget, Language, Memo } from '@/types/kertas'

type ModalsProps = {
    selectedMemo: Memo | null
    setSelectedMemo: Dispatch<SetStateAction<Memo | null>>
    editingMemo: boolean
    setEditingMemo: Dispatch<SetStateAction<boolean>>
    editContent: string
    setEditContent: Dispatch<SetStateAction<string>>
    editVisibility: 'private' | 'public'
    setEditVisibility: Dispatch<SetStateAction<'private' | 'public'>>
    handleSaveMemoEdit: (event: FormEvent) => void
    labels: AppLabels
    language: Language
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
    editVisibility,
    setEditVisibility,
    handleSaveMemoEdit,
    labels,
    language,
    getMemoDisplayContent,
    deleteTarget,
    setDeleteTarget,
    confirmLoading,
    handleConfirmDelete,
    deleteResourceName,
}: ModalsProps) {
    const isMoveToTrash = deleteTarget?.type === 'moveToTrash'
    const confirmTitle = !deleteTarget
        ? ''
        : isMoveToTrash
            ? (language === 'id' ? 'Pindahkan ke Sampah?' : 'Move to Trash?')
            : deleteTarget.type === 'memo'
                ? (language === 'id' ? 'Hapus Catatan?' : 'Delete Note?')
                : deleteTarget.type === 'resource'
                    ? (language === 'id' ? 'Hapus Lampiran?' : 'Delete Attachment?')
                    : (language === 'id' ? 'Kosongkan Sampah?' : 'Empty Trash?')
    const confirmDescription = !deleteTarget
        ? ''
        : isMoveToTrash
            ? (language === 'id'
                ? 'Catatan akan dipindahkan ke Sampah dan otomatis terhapus permanen setelah 7 hari.'
                : 'This note will be moved to Trash and permanently deleted after 7 days.')
            : deleteTarget.type === 'memo'
                ? (language === 'id'
                    ? 'Catatan ini akan dihapus secara permanen dan tidak bisa dikembalikan.'
                    : 'This note will be permanently deleted and cannot be recovered.')
                : deleteTarget.type === 'resource'
                    ? (language === 'id'
                        ? `Lampiran "${deleteResourceName ?? ''}" akan dihapus secara permanen dan tidak dapat dipulihkan.`
                        : `Attachment "${deleteResourceName ?? ''}" will be permanently deleted and cannot be recovered.`)
                    : (language === 'id'
                        ? 'Semua catatan di Sampah dan lampirannya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.'
                        : 'All notes in Trash and their attachments will be permanently deleted. This cannot be undone.')
    const confirmActionLabel = !deleteTarget
        ? ''
        : confirmLoading
            ? (isMoveToTrash
                ? (language === 'id' ? 'Memindahkan...' : 'Moving...')
                : (language === 'id' ? 'Menghapus...' : 'Deleting...'))
            : isMoveToTrash
                ? (language === 'id' ? 'Pindahkan' : 'Move')
                : deleteTarget.type === 'emptyTrash'
                    ? labels.emptyTrash
                    : labels.delete

    const markdownComponents = {
        input: (props: React.ComponentProps<'input'>) => (
            <input
                {...props}
                onClick={(event) => {
                    event.stopPropagation()
                    props.onClick?.(event)
                }}
            />
        ),
    }

    return (
        <>
            {selectedMemo && (
                <div
                    role="presentation"
                    onClick={() => setSelectedMemo(null)}
                    className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-2 sm:items-center sm:p-4"
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="memo-detail-title"
                        onClick={(event) => event.stopPropagation()}
                        className="my-auto w-full max-w-2xl max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl sm:max-h-[90vh] sm:p-6 dark:bg-[#18181b] dark:border-zinc-800"
                    >
                        <div className="mb-4 flex items-start justify-between gap-4">
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

                        {editingMemo ? (
                            <form onSubmit={handleSaveMemoEdit} className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                                    {labels.memos}
                                    <textarea
                                        rows={12}
                                        value={editContent}
                                        onChange={(event) => setEditContent(event.target.value)}
                                        className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-600"
                                        required
                                    />
                                </label>
                                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                                    {labels.visibility}
                                    <select
                                        value={editVisibility}
                                        onChange={(event) => setEditVisibility(event.target.value as 'private' | 'public')}
                                        className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                    >
                                        <option value="private">{labels.private}</option>
                                        <option value="public">{labels.public}</option>
                                    </select>
                                </label>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditContent(selectedMemo.content)
                                            setEditVisibility(selectedMemo.visibility)
                                            setEditingMemo(false)
                                        }}
                                        className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    >
                                        {labels.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!editContent.trim()}
                                        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                                    >
                                        {labels.save}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-5">
                                {selectedMemo.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedMemo.tags.map((tag) => (
                                            <span key={tag} className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                                        {selectedMemo.visibility === 'public' ? labels.public : labels.private}
                                    </span>
                                    {selectedMemo.archived && (
                                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">{labels.archived}</span>
                                    )}
                                </div>
                                <div className="prose prose-sm max-w-none break-words text-zinc-800 dark:text-zinc-200 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[#262b33] [&_pre]:p-3 [&_pre]:text-zinc-100">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownComponents}>
                                        {getMemoDisplayContent(selectedMemo.content)}
                                    </ReactMarkdown>
                                </div>
                                <div className="space-y-1 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-xs text-zinc-500 dark:text-zinc-400">
                                    <p>
                                        {labels.createdAt}:{' '}
                                        {new Date(selectedMemo.created_at).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}
                                    </p>
                                    <p>
                                        {labels.updatedAt}:{' '}
                                        {selectedMemo.updated_at
                                            ? new Date(selectedMemo.updated_at).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')
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

            {deleteTarget && (
                <div
                    role="presentation"
                    onClick={() => {
                        if (!confirmLoading) setDeleteTarget(null)
                    }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-confirm-title"
                        onClick={(event) => event.stopPropagation()}
                        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-[#18181b]"
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
