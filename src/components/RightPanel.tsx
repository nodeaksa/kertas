'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Search } from 'lucide-react'
import type { AppLabels, TagCount } from '@/types/kertas'

type RightPanelProps = {
    searchQuery: string
    setSearchQuery: Dispatch<SetStateAction<string>>
    selectedTag: string | null
    heatmapCells: { dateStr: string; count: number }[]
    handleDateClick: (dateStr: string) => void
    getHeatColor: (count: number) => string
    tagsList: TagCount[]
    handleTagClick: (tag: string | null) => void
    labels: AppLabels
}

export default function RightPanel({
    searchQuery,
    setSearchQuery,
    selectedTag,
    heatmapCells,
    handleDateClick,
    getHeatColor,
    tagsList,
    handleTagClick,
    labels,
}: RightPanelProps) {
    return (
        <aside className="hidden xl:block w-72 p-6 border-l border-zinc-200 bg-white space-y-6 dark:bg-[#141416] dark:border-zinc-800">
            <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => {
                        setSearchQuery(event.target.value)
                    }}
                    placeholder={labels.search}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-600"
                />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-100 mb-3">Aktivitas</h3>
                <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-fit">
                    {heatmapCells.map((cell) => (
                        <button
                            key={cell.dateStr}
                            type="button"
                            onClick={() => handleDateClick(cell.dateStr)}
                            title={`${cell.dateStr}: ${cell.count} memo`}
                            className={`w-3.5 h-3.5 rounded-[3px] transition hover:ring-2 hover:ring-zinc-400/60 dark:hover:ring-zinc-500/60 ${getHeatColor(cell.count)}`}
                        />
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-100 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                    {tagsList.length === 0 ? (
                        <span className="text-xs text-zinc-400">Belum ada tag</span>
                    ) : (
                        tagsList.map((item) => (
                            <button
                                key={item.tag}
                                onClick={() => handleTagClick(item.tag)}
                                className={`px-3 py-1 rounded-full border text-xs transition ${selectedTag === item.tag
                                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100'
                                    : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                #{item.tag}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </aside>
    )
}
