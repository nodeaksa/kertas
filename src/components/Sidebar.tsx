'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useTheme } from 'next-themes'
import {
    Archive,
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FileText,
    LogOut,
    Menu,
    Moon,
    Paperclip,
    Settings,
    Sun,
    Tag,
    Trash2,
    X,
} from 'lucide-react'
import type { ActiveTab, AppLabels, CalendarDay, Language, TagCount } from '@/types/kertas'

type SidebarProps = {
    mobileMenuOpen: boolean
    setMobileMenuOpen: Dispatch<SetStateAction<boolean>>
    username: string
    toggleTheme: () => void
    labels: AppLabels
    profileMenuOpen: boolean
    setProfileMenuOpen: Dispatch<SetStateAction<boolean>>
    handleLogout: () => Promise<void>
    activeTab: ActiveTab
    navigateTo: (tab: ActiveTab) => void
    tagsList: TagCount[]
    trashCount: number
    selectedTag: string | null
    handleTagClick: (tag: string | null) => void
    calDate: Date | null
    setCalDate: Dispatch<SetStateAction<Date | null>>
    language: Language
    calendarDays: CalendarDay[]
    dailyCounts: Record<string, number>
    selectedDate: string | null
    handleDateClick: (dateStr: string) => void
}

export default function Sidebar({
    mobileMenuOpen,
    setMobileMenuOpen,
    username,
    toggleTheme,
    labels,
    profileMenuOpen,
    setProfileMenuOpen,
    handleLogout,
    activeTab,
    navigateTo,
    tagsList,
    trashCount,
    selectedTag,
    handleTagClick,
    calDate,
    setCalDate,
    language,
    calendarDays,
    dailyCounts,
    selectedDate,
    handleDateClick,
}: SidebarProps) {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // A mount guard keeps the server and first client render identical.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mobileMenuOpen) return

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMobileMenuOpen(false)
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [mobileMenuOpen, setMobileMenuOpen])

    return (
        <>
            <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 sticky top-0 z-20 dark:bg-[#141416] dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        aria-label={mobileMenuOpen ? (language === 'id' ? 'Tutup menu' : 'Close menu') : (language === 'id' ? 'Buka menu' : 'Open menu')}
                        aria-expanded={mobileMenuOpen}
                        onClick={() => setMobileMenuOpen((open) => !open)}
                        className="p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 p-0.5 flex items-center justify-center shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo-kertas.png" alt="kertas." className="w-full h-full rounded-md object-cover" />
                        </div>
                        kertas.
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label={labels.toggleTheme}
                        title={labels.toggleTheme}
                        onClick={toggleTheme}
                        className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        {mounted && (resolvedTheme === 'dark'
                            ? <Sun className="h-4 w-4" />
                            : <Moon className="h-4 w-4" />)}
                    </button>
                    <div className="w-8 h-8 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center text-sm font-semibold uppercase">
                        {username.slice(0, 1)}
                    </div>
                </div>
            </header>

            <div
                aria-hidden="true"
                onClick={() => setMobileMenuOpen(false)}
                className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 lg:hidden ${mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            />

            <aside
                className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-zinc-200 p-4 flex flex-col justify-between transition-transform duration-200 overflow-y-auto dark:bg-[#141416] dark:border-zinc-800 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <div className="space-y-5">
                    <div className="flex items-center justify-between relative">
                        <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-100">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 p-0.5 flex items-center justify-center shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/logo-kertas.png" alt="kertas." className="w-full h-full rounded-md object-cover" />
                            </div>
                            kertas.
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                className="flex items-center gap-1 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                title={username}
                            >
                                <div className="w-8 h-8 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-semibold uppercase text-sm">
                                    {username.slice(0, 1)}
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                            </button>
                            <button
                                type="button"
                                aria-label={language === 'id' ? 'Tutup menu' : 'Close menu'}
                                onClick={() => setMobileMenuOpen(false)}
                                className="lg:hidden p-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {profileMenuOpen && (
                            <div className="absolute right-0 top-11 w-44 bg-white rounded-xl shadow-md border border-zinc-200 py-1.5 z-50 text-xs dark:bg-[#18181b] dark:border-zinc-800">
                                <div className="px-3 py-1.5 border-b border-zinc-100 font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                                    @{username}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                    <LogOut className="w-3.5 h-3.5" /> {labels.logout}
                                </button>
                            </div>
                        )}
                    </div>

                    <nav className="space-y-1 text-sm">
                        {([
                            ['memos', FileText, labels.memos],
                            ['tags', Tag, labels.tags],
                            ['resources', Paperclip, labels.resources],
                            ['daily', CalendarIcon, labels.daily],
                            ['archived', Archive, labels.archived],
                            ['trash', Trash2, labels.trash],
                        ] as const).map(([tab, Icon, label]) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => navigateTo(tab)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition ${activeTab === tab
                                    ? 'border bg-zinc-200/80 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
                                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
                                    }`}
                            >
                                <Icon className="w-4 h-4" /> {label}
                                {tab === 'trash' && (
                                    <span className="ml-auto min-w-5 rounded-full bg-zinc-200 px-1.5 py-0.5 text-center text-[10px] font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                                        {trashCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>

                    <div>
                        <p className="px-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1.5 px-1">
                            {tagsList.length === 0 ? (
                                <span className="text-xs text-zinc-400 dark:text-zinc-500 px-1">{labels.noTagsSidebar}</span>
                            ) : (
                                tagsList.map((item) => (
                                    <button
                                        key={item.tag}
                                        onClick={() => handleTagClick(item.tag)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${selectedTag === item.tag
                                            ? 'bg-zinc-900 text-white border border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100'
                                            : 'bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700'
                                            }`}
                                    >
                                        #{item.tag}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {calDate && (
                        <div className="pt-2 px-1">
                            <div className="flex items-center justify-between mb-2.5 px-1">
                                <button
                                    onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
                                    className="p-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 capitalize">
                                    {calDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </span>
                                <button
                                    onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
                                    className="p-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mb-1">
                                <span>Sn</span><span>Sl</span><span>Rb</span><span>Km</span><span>Jm</span><span>Sb</span><span>Mg</span>
                            </div>
                            <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
                                {calendarDays.map((day) => {
                                    const count = dailyCounts[day.dateStr] || 0
                                    const isSelected = selectedDate === day.dateStr
                                    return (
                                        <button
                                            key={day.dateStr}
                                            onClick={() => handleDateClick(day.dateStr)}
                                            className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center transition ${!day.currentMonth
                                                ? 'text-zinc-300 dark:text-zinc-600'
                                                : isSelected
                                                    ? 'bg-zinc-900 text-white font-bold dark:bg-zinc-100 dark:text-zinc-950'
                                                    : count > 0
                                                        ? 'bg-zinc-200 text-zinc-900 font-semibold dark:bg-zinc-700 dark:text-zinc-100'
                                                        : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                                }`}
                                        >
                                            {day.dayNum}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <button
                                title="Pengaturan"
                                type="button"
                                onClick={() => navigateTo('settings')}
                                className="p-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 transition dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-700"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                aria-label={labels.toggleTheme}
                                title={labels.toggleTheme}
                                onClick={toggleTheme}
                                className="rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                                {mounted && (resolvedTheme === 'dark'
                                    ? <Sun className="h-4 w-4" />
                                    : <Moon className="h-4 w-4" />)}
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                            <span className="w-2 h-2 rounded-full bg-zinc-500 dark:bg-zinc-400" />
                            {labels.active}
                        </div>
                    </div>
                    <p className="mt-2 text-center text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                        kertas. v1.2.2
                    </p>
                </div>
            </aside>
        </>
    )
}
