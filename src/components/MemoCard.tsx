'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Archive, MoreHorizontal, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import type { ActiveTab, AppLabels, Memo, MemoAction } from '@/types/kertas'

type MemoCardProps = {
    memo: Memo
    activeTab: ActiveTab
    labels: AppLabels
    language: 'id' | 'en'
    openMenuId: string | null
    setOpenMenuId: Dispatch<SetStateAction<string | null>>
    setEditingMemo: Dispatch<SetStateAction<boolean>>
    handleMemoAction: (memo: Memo, action: MemoAction) => void
    handleRestoreMemo: (id: string) => void
    handlePermanentDeleteMemo: (id: string) => void
    handleTagClick: (tag: string | null) => void
    handleOpenMemo: (memo: Memo) => void
    getMemoDisplayContent: (content: string) => string
}

export default function MemoCard({
    memo,
    activeTab,
    labels,
    language,
    openMenuId,
    setOpenMenuId,
    setEditingMemo,
    handleMemoAction,
    handleRestoreMemo,
    handlePermanentDeleteMemo,
    handleTagClick,
    handleOpenMemo,
    getMemoDisplayContent,
}: MemoCardProps) {
    const [now, setNow] = useState<number | null>(null)
    useEffect(() => {
        if (activeTab !== 'trash') return
        const frame = window.requestAnimationFrame(() => setNow(Date.now()))
        return () => window.cancelAnimationFrame(frame)
    }, [activeTab])
    const remainingDays = memo.deleted_at && now !== null
        ? Math.max(0, Math.ceil((new Date(memo.deleted_at).getTime() + 7 * 24 * 60 * 60 * 1000 - now) / (24 * 60 * 60 * 1000)))
        : null

    const markdownComponents = {
        // Safe image renderer to avoid empty src warnings
        img: ({ src, alt, ...props }: { src?: unknown; alt?: string } & React.ImgHTMLAttributes<HTMLImageElement>) => {
            if (!src || typeof src !== 'string' || src.trim() === '') return null;
            return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src as string}
                    alt={alt || 'Lampiran gambar'}
                    className="rounded-lg max-h-96 w-auto object-contain my-2 border border-zinc-200 dark:border-zinc-800"
                    {...props}
                />
            );
        },
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
        <article
            onClick={() => handleOpenMemo(memo)}
            className="relative break-inside-avoid cursor-pointer bg-white rounded-2xl border border-zinc-200 p-4 shadow-2xs space-y-2.5 hover:border-zinc-400 transition dark:bg-[#18181b] dark:border-zinc-800 dark:hover:border-zinc-600"
        >
            <div data-memo-menu onClick={(event) => event.stopPropagation()} className="absolute right-3 top-3">
                <button
                    type="button"
                    aria-label="Menu memo"
                    onClick={(event) => {
                        event.stopPropagation()
                        setOpenMenuId(openMenuId === memo.id ? null : memo.id)
                    }}
                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
                {openMenuId === memo.id && (
                    <div className="absolute right-0 top-8 z-10 w-44 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:bg-[#18181b] dark:border-zinc-800">
                        {activeTab === 'trash' ? (
                            <>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        setOpenMenuId(null)
                                        handleRestoreMemo(memo.id)
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    <RotateCcw className="mr-2 inline h-3.5 w-3.5" />{labels.restore}
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        setOpenMenuId(null)
                                        handlePermanentDeleteMemo(memo.id)
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                    <Trash2 className="mr-2 inline h-3.5 w-3.5" />{labels.delete}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        setOpenMenuId(null)
                                        handleOpenMemo(memo)
                                        setEditingMemo(true)
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    <Pencil className="mr-2 inline h-3.5 w-3.5" />{labels.edit}
                                </button>
                                {memo.archived ? (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            void handleMemoAction(memo, 'restore')
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    >
                                        <RotateCcw className="mr-2 inline h-3.5 w-3.5" />{labels.restore}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            void handleMemoAction(memo, 'archive')
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    >
                                        <Archive className="mr-2 inline h-3.5 w-3.5" />Arsipkan
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        void handleMemoAction(memo, 'delete')
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                    <Trash2 className="mr-2 inline h-3.5 w-3.5" />{labels.moveToTrash}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
            {memo.tags && memo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pr-8">
                    {memo.tags.map((tag) => (
                        <button
                            type="button"
                            key={tag}
                            onClick={(event) => {
                                event.stopPropagation()
                                handleTagClick(tag)
                            }}
                            className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                        >
                            #{tag}
                        </button>
                    ))}
                </div>
            )}
            {activeTab === 'trash' && remainingDays !== null && (
                <div className="w-fit rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {labels.daysRemaining} {remainingDays} {language === 'id' ? 'hari' : 'days'}
                </div>
            )}
            <div className="text-sm text-gray-800 dark:text-zinc-200 leading-relaxed break-words [&_pre]:bg-[#262b33] [&_pre]:text-gray-100 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre]:text-xs [&_ul]:space-y-1 [&_input[type=checkbox]]:accent-zinc-900 dark:[&_input[type=checkbox]]:accent-zinc-100 [&_input[type=checkbox]]:mr-1.5">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownComponents}>
                    {getMemoDisplayContent(memo.content)}
                </ReactMarkdown>
            </div>
            <div className="text-[11px] text-gray-400 dark:text-zinc-500 pt-1">
                {new Date(memo.created_at).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                })}
            </div>
        </article>
    )
}
