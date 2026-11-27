'use client'

import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { Download, File as FileIcon, Trash2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isTextEntryTarget, renamePastedFile } from '@/lib/pasteFiles'
import type { AppLabels, Language } from '@/types/kertas'

const BUCKET = 'loker-file'
const MAX_SIZE = 50 * 1024 * 1024
const PREFIX_PATTERN = /^\d+_\d+_[0-9a-f]{8}_/

type StoredFile = {
    name: string
    created_at: string | null
    metadata: Record<string, unknown> | null
}

const TEXT = {
    id: {
        uploading: (done: number, total: number) => `Mengunggah... (${done}/${total})`,
        allDone: (count: number) => (count === 1 ? 'File berhasil diunggah.' : `${count} file berhasil diunggah.`),
        partial: (ok: number, failed: number) => `Selesai: ${ok} berhasil, ${failed} gagal (maks. 50 MB per file).`,
        allFailed: 'Semua file gagal diunggah (maks. 50 MB per file).',
        loadError: 'Gagal memuat daftar file.',
        downloadError: 'Gagal membuat tautan unduhan.',
        deleteError: 'Gagal menghapus file.',
    },
    en: {
        uploading: (done: number, total: number) => `Uploading... (${done}/${total})`,
        allDone: (count: number) => (count === 1 ? 'File uploaded.' : `${count} files uploaded.`),
        partial: (ok: number, failed: number) => `Done: ${ok} uploaded, ${failed} failed (max 50 MB each).`,
        allFailed: 'All uploads failed (max 50 MB each).',
        loadError: 'Failed to load files.',
        downloadError: 'Failed to create download link.',
        deleteError: 'Failed to delete file.',
    },
}

function displayName(storedName: string) {
    return storedName.replace(PREFIX_PATTERN, '')
}

function formatSize(bytes: number | null) {
    if (bytes === null) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatAge(iso: string | null, language: Language) {
    if (!iso) return ''
    const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
    const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
    ]
    for (const [unit, seconds] of units) {
        if (Math.abs(diffSeconds) >= seconds) return rtf.format(Math.round(diffSeconds / seconds), unit)
    }
    return rtf.format(0, 'second')
}

type FileBridgeViewProps = {
    userId: string | null
    labels: AppLabels
    language: Language
}

export default function FileBridgeView({ userId, labels, language }: FileBridgeViewProps) {
    const [supabase] = useState(createClient)
    const inputRef = useRef<HTMLInputElement>(null)
    const [files, setFiles] = useState<StoredFile[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [status, setStatus] = useState('')
    const [confirmName, setConfirmName] = useState<string | null>(null)
    const text = TEXT[language]

    const fetchFiles = useCallback(async () => {
        if (!userId) return
        const { data, error } = await supabase.storage.from(BUCKET).list(userId, {
            limit: 200,
            sortBy: { column: 'created_at', order: 'desc' },
        })
        if (error) {
            setStatus(text.loadError)
        } else {
            setFiles((data ?? []).filter((file) => file.name !== '.emptyFolderPlaceholder'))
        }
        setLoading(false)
    }, [supabase, text, userId])

    useEffect(() => {
        // Storage updates state after the asynchronous list request resolves.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchFiles()
    }, [fetchFiles])

    const uploadFiles = async (selected: File[]) => {
        if (!userId || selected.length === 0 || uploading) return

        setUploading(true)
        let done = 0
        let failed = 0
        setStatus(text.uploading(0, selected.length))

        await Promise.all(selected.map(async (file, index) => {
            let ok = false
            if (file.size <= MAX_SIZE) {
                const safeName = file.name.replace(/[^\w.-]+/g, '_')
                const path = `${userId}/${Date.now()}_${index}_${crypto.randomUUID().slice(0, 8)}_${safeName}`
                const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
                    upsert: false,
                    contentType: file.type || undefined,
                })
                ok = !error
            }
            if (!ok) failed += 1
            done += 1
            setStatus(text.uploading(done, selected.length))
        }))

        const succeeded = selected.length - failed
        setStatus(failed === 0 ? text.allDone(succeeded) : succeeded === 0 ? text.allFailed : text.partial(succeeded, failed))
        await fetchFiles()
        setUploading(false)
        window.setTimeout(() => setStatus(''), 5000)
    }

    const uploadRef = useRef(uploadFiles)

    useEffect(() => {
        uploadRef.current = uploadFiles
    })

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            if (event.defaultPrevented || isTextEntryTarget(event.target)) return
            const pasted = Array.from(event.clipboardData?.files ?? [])
            if (pasted.length === 0) return
            event.preventDefault()
            void uploadRef.current(pasted.map((file, index) => renamePastedFile(file, index)))
        }
        document.addEventListener('paste', handlePaste)
        return () => document.removeEventListener('paste', handlePaste)
    }, [])

    const downloadFile = async (file: StoredFile) => {
        if (!userId) return
        const { data, error } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(`${userId}/${file.name}`, 60, { download: displayName(file.name) })
        if (error || !data) {
            setStatus(text.downloadError)
            return
        }
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.rel = 'noreferrer'
        link.click()
    }

    const deleteFile = async (file: StoredFile) => {
        if (!userId) return
        const { error } = await supabase.storage.from(BUCKET).remove([`${userId}/${file.name}`])
        setConfirmName(null)
        if (error) {
            setStatus(text.deleteError)
            return
        }
        setFiles((current) => current.filter((item) => item.name !== file.name))
    }

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setDragging(false)
        void uploadFiles(Array.from(event.dataTransfer.files))
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-zinc-100">{labels.filebridge}</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{labels.filebridgeDescription}</p>
                </div>
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading || !userId}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                >
                    <Upload className="h-4 w-4" />{labels.upload}
                </button>
            </div>

            <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                    const selected = Array.from(event.target.files ?? [])
                    event.target.value = ''
                    void uploadFiles(selected)
                }}
            />

            <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        inputRef.current?.click()
                    }
                }}
                onDragOver={(event) => {
                    event.preventDefault()
                    setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center text-sm transition ${dragging
                    ? 'border-zinc-500 bg-zinc-100 text-zinc-800 dark:border-zinc-400 dark:bg-zinc-800/60 dark:text-zinc-100'
                    : 'border-zinc-300 bg-white text-gray-500 hover:border-zinc-400 dark:border-zinc-700 dark:bg-[#18181b] dark:text-zinc-400 dark:hover:border-zinc-600'
                    }`}
            >
                <Upload className="h-5 w-5" />
                {labels.dropFiles}
            </div>

            {status && (
                <p role="status" aria-live="polite" className="text-sm text-gray-600 dark:text-zinc-300">{status}</p>
            )}

            {loading ? (
                <p className="text-sm text-gray-500 dark:text-zinc-400">{labels.loadingFiles}</p>
            ) : files.length === 0 ? (
                <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-gray-500 dark:border-zinc-800 dark:bg-[#18181b] dark:text-zinc-400">{labels.noFiles}</p>
            ) : (
                <ul className="space-y-2">
                    {files.map((file) => {
                        const size = typeof file.metadata?.size === 'number' ? file.metadata.size : null
                        const confirming = confirmName === file.name
                        return (
                            <li
                                key={file.name}
                                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-[#18181b] dark:hover:border-zinc-600"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                    <FileIcon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-800 dark:text-zinc-200">{displayName(file.name)}</p>
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                                        {[formatSize(size), formatAge(file.created_at, language)].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                                {confirming ? (
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => void deleteFile(file)}
                                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                        >
                                            {labels.delete}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmName(null)}
                                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                        >
                                            {labels.cancel}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex shrink-0 items-center gap-1">
                                        <button
                                            type="button"
                                            title={labels.download}
                                            aria-label={labels.download}
                                            onClick={() => void downloadFile(file)}
                                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            title={labels.delete}
                                            aria-label={labels.delete}
                                            onClick={() => setConfirmName(file.name)}
                                            className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}
