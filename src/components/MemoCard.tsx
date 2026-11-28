'use client'

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Archive, Copy, MoreHorizontal, Pencil, Pin, RotateCcw, Star, Trash2 } from 'lucide-react'
import MarkdownLink from '@/components/MarkdownLink'
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
    handleToggleMemoFlag: (memo: Memo, flag: 'is_favorite' | 'is_pinned') => void
    handleCopyMemo: (memo: Memo) => void
    handleRestoreMemo: (id: string) => void
    handlePermanentDeleteMemo: (id: string) => void
    handleTagClick: (tag: string | null) => void
    handleOpenMemo: (memo: Memo) => void
    getMemoDisplayContent: (content: string) => string
    handleToggleChecklist: (memoId: string, content: string, lineNumber: number, checked: boolean, updatedAt?: string | null) => void
    checklistSavingIds: Set<string>
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
    handleToggleMemoFlag,
    handleCopyMemo,
    handleRestoreMemo,
    handlePermanentDeleteMemo,
    handleTagClick,
    handleOpenMemo,
    getMemoDisplayContent,
    handleToggleChecklist,
    checklistSavingIds,
}: MemoCardProps) {
    const [menuMounted, setMenuMounted] = useState(false)
    const [menuVisible, setMenuVisible] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [hasOverflow, setHasOverflow] = useState(false)
    const memoContentRef = useRef<HTMLDivElement>(null)
    const isMenuOpen = openMenuId === memo.id
    const displayContent = getMemoDisplayContent(memo.content)
    const toggleMemoFlag = (event: React.MouseEvent<HTMLButtonElement>, flag: 'is_favorite' | 'is_pinned') => {
        event.stopPropagation()
        setOpenMenuId(null)
        handleToggleMemoFlag(memo, flag)
    }

    useEffect(() => {
        let frame: number | undefined
        let timeout: number | undefined
        if (isMenuOpen) {
            frame = window.requestAnimationFrame(() => {
                setMenuMounted(true)
                setMenuVisible(true)
            })
        } else {
            frame = window.requestAnimationFrame(() => setMenuVisible(false))
            const exitDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160
            timeout = window.setTimeout(() => setMenuMounted(false), exitDelay)
        }
        return () => {
            if (frame !== undefined) window.cancelAnimationFrame(frame)
            if (timeout !== undefined) window.clearTimeout(timeout)
        }
    }, [isMenuOpen])
    useEffect(() => {
        const element = memoContentRef.current
        if (!element) return

        const measureOverflow = () => {
            const computedStyle = window.getComputedStyle(element)
            const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight)
            const fontSize = Number.parseFloat(computedStyle.fontSize)
            const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : fontSize * 1.5
            const visibleLines = window.matchMedia('(min-width: 768px)').matches ? 20 : 15
            setHasOverflow(element.scrollHeight > lineHeight * visibleLines + 1)
        }

        measureOverflow()
        const observer = new ResizeObserver(measureOverflow)
        observer.observe(element)
        window.addEventListener('resize', measureOverflow)
        const images = Array.from(element.querySelectorAll('img'))
        images.forEach((image) => image.addEventListener('load', measureOverflow))

        return () => {
            observer.disconnect()
            window.removeEventListener('resize', measureOverflow)
            images.forEach((image) => image.removeEventListener('load', measureOverflow))
        }
    }, [displayContent])
    type MarkdownNodeWithPosition = { position?: { start?: { line?: number } } }
    const markdownComponents = {
        a: MarkdownLink,
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
        li: ({ node, ...props }: React.ComponentProps<'li'> & { node?: MarkdownNodeWithPosition }) => (
            <li {...props} data-checklist-line={node?.position?.start?.line} />
        ),
        input: (props: React.ComponentProps<'input'>) => (
            <input
                {...props}
                checked={Boolean(props.checked)}
                disabled={Boolean(memo.deleted_at) || checklistSavingIds.has(memo.id)}
                aria-label={language === 'id' ? 'Ubah status checklist' : 'Toggle checklist item'}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => {
                    event.stopPropagation()
                    const lineNumber = Number(event.currentTarget.closest('li')?.dataset.checklistLine)
                    handleToggleChecklist(memo.id, memo.content, lineNumber, event.currentTarget.checked, memo.updated_at)
                }}
            />
        ),
    }

    const copyButton = (
        <button
            type="button"
            onClick={(event) => {
                event.stopPropagation()
                setOpenMenuId(null)
                void handleCopyMemo(memo)
            }}
            className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
            <Copy className="mr-2 inline h-3.5 w-3.5" />{labels.copy}
        </button>
    )

    return (
        <article
            onClick={() => handleOpenMemo(memo)}
            className="relative break-inside-avoid cursor-pointer bg-white rounded-2xl border border-zinc-200 p-4 shadow-2xs space-y-2.5 hover:border-zinc-400 transition dark:bg-[#18181b] dark:border-zinc-800 dark:hover:border-zinc-600"
        >
            <div data-memo-menu onClick={(event) => event.stopPropagation()} className="absolute right-3 top-3 z-10">
                <button
                    type="button"
                    aria-label="Menu memo"
                    onClick={(event) => {
                        event.stopPropagation()
                        setOpenMenuId(openMenuId === memo.id ? null : memo.id)
                    }}
                    className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-zinc-500 hover:text-zinc-900 hover:bg-white dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
                {(isMenuOpen || menuMounted) && (
                    <div className={`absolute right-0 top-8 z-10 w-44 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg transition duration-150 dark:bg-[#18181b] dark:border-zinc-800 ${menuVisible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'}`}>
                        {activeTab === 'trash' ? (
                            <>
                                {copyButton}
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
                                {copyButton}
                                <button
                                    type="button"
                                    onClick={(event) => toggleMemoFlag(event, 'is_favorite')}
                                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    <Star className={`mr-2 inline h-3.5 w-3.5 ${memo.is_favorite ? 'fill-current' : ''}`} />
                                    {memo.is_favorite ? labels.removeFavorite : labels.favorite}
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => toggleMemoFlag(event, 'is_pinned')}
                                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    <Pin className={`mr-2 inline h-3.5 w-3.5 ${memo.is_pinned ? 'fill-current' : ''}`} />
                                    {memo.is_pinned ? labels.unpin : labels.pin}
                                </button>
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
            {(memo.is_favorite || memo.is_pinned) && (
                <div className="flex items-center gap-2 pr-8 text-zinc-500 dark:text-zinc-400">
                    {memo.is_pinned && <span className="inline-flex items-center gap-1 text-[11px]" aria-label={labels.pinned} title={labels.pinned}><Pin className="h-3.5 w-3.5 fill-current" />{labels.pinned}</span>}
                    {memo.is_favorite && <span className="inline-flex items-center gap-1 text-[11px]" aria-label={labels.favorites} title={labels.favorites}><Star className="h-3.5 w-3.5 fill-current" />{labels.favorites}</span>}
                </div>
            )}
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
            <div
                ref={memoContentRef}
                className={`text-sm text-gray-800 dark:text-zinc-200 leading-relaxed break-words [&_p+p]:mt-3 [&_pre]:bg-[#262b33] [&_pre]:text-gray-100 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre]:text-xs [&_ul]:space-y-1 [&_input[type=checkbox]]:accent-zinc-900 dark:[&_input[type=checkbox]]:accent-zinc-100 [&_input[type=checkbox]]:mr-1.5 ${isExpanded ? '' : 'max-h-[calc(1.625em*15)] overflow-hidden md:max-h-[calc(1.625em*20)]'}`}
            >
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownComponents}>
                    {displayContent}
                </ReactMarkdown>
            </div>
            {hasOverflow && (
                <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setIsExpanded((current) => !current)
                    }}
                    className="rounded-md text-xs font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-100"
                >
                    {isExpanded ? labels.showLess : labels.showMore}
                </button>
            )}
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
