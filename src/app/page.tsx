'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Paperclip, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import MemoCard from '@/components/MemoCard'
import MemoEditor from '@/components/MemoEditor'
import Modals from '@/components/Modals'
import RightPanel from '@/components/RightPanel'
import FileBridgeView from '@/components/FileBridgeView'
import SettingsView from '@/components/SettingsView'
import Sidebar from '@/components/Sidebar'
import type {
    ActiveTab,
    AppLabels,
    CalendarDay,
    DeleteTarget,
    FontSize,
    Language,
    Memo,
    MemoAction,
    Resource,
    TagCount,
    Theme,
    UploadPurpose,
} from '@/types/kertas'
import { replaceChecklistItem, replaceResourceReferences } from '@/lib/markdown'
import { isTextEntryTarget, renamePastedFile } from '@/lib/pasteFiles'
import { getLabels } from '@/lib/i18n'
import useBackLayer from '@/lib/useBackLayer'

const PAGE_SIZE = 20

type MemoQueryFilters = {
    tagFilter: string | null
    query: string
    dateFilter: string | null
    archived: boolean
    includeDeleted: boolean
    favoriteOnly: boolean
    pinnedOnly: boolean
    activeTab: ActiveTab
}

export default function HomePage() {
    const [supabase] = useState(createClient)
    const router = useRouter()
    const { theme: providerTheme, setTheme, resolvedTheme } = useTheme()

    const [username, setUsername] = useState('username')
    const [userId, setUserId] = useState<string | null>(null)
    const userIdRef = useRef<string | null>(null)
    const [memos, setMemos] = useState<Memo[]>([])
    const [memosLoading, setMemosLoading] = useState(false)
    const [loadingMoreMemos, setLoadingMoreMemos] = useState(false)
    const [hasMoreMemos, setHasMoreMemos] = useState(false)
    const [tagsList, setTagsList] = useState<TagCount[]>([])
    const [resources, setResources] = useState<Resource[]>([])
    const [trashCount, setTrashCount] = useState(0)
    const [dailyCounts, setDailyCounts] = useState<Record<string, number>>({})
    const [activeTab, setActiveTab] = useState<ActiveTab>('memos')
    const [content, setContent] = useState('')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [profileMenuOpen, setProfileMenuOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)
    const [resourceLoading, setResourceLoading] = useState(false)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null)
    const [editingMemo, setEditingMemo] = useState(false)
    const [editContent, setEditContent] = useState('')
    const [uploadPurpose, setUploadPurpose] = useState<UploadPurpose>('memo')
    const [checklistSavingIds, setChecklistSavingIds] = useState<Set<string>>(() => new Set())
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [profileUsername, setProfileUsername] = useState('')
    const [password, setPassword] = useState('')
    const [language, setLanguage] = useState<Language>('id')
    const theme: Theme =
        providerTheme === 'light' || providerTheme === 'dark' || providerTheme === 'system'
            ? providerTheme
            : 'system'
    const [fontSize, setFontSize] = useState<FontSize>('medium')
    const [preferencesReady, setPreferencesReady] = useState(false)
    const [randomMemo, setRandomMemo] = useState<Memo | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const importInputRef = useRef<HTMLInputElement>(null)
    const memoEditorRef = useRef<HTMLDivElement>(null)
    const memoTextareaRef = useRef<HTMLTextAreaElement>(null)
    const editTextareaRef = useRef<HTMLTextAreaElement>(null)
    const activeEditorTargetRef = useRef<'memo' | 'edit'>('memo')
    const uploadTargetRef = useRef<{
        target: 'memo' | 'edit'
        selectionStart: number
        selectionEnd: number
    } | null>(null)
    const memoFetchSequence = useRef(0)
    const memoListRef = useRef<Memo[]>([])
    const memoInitialRequestRef = useRef(false)
    const memoFiltersRef = useRef<MemoQueryFilters>({
        tagFilter: null,
        query: '',
        dateFilter: null,
        archived: false,
        includeDeleted: false,
        favoriteOnly: false,
        pinnedOnly: false,
        activeTab: 'memos',
    })
    const loadMoreRequestRef = useRef<number | null>(null)
    const latestMemoFiltersRef = useRef({ selectedTag, selectedDate, activeTab })
    const previousSearchQueryRef = useRef(searchQuery)
    const tagFetchSequence = useRef(0)
    const dailyFetchSequence = useRef(0)
    const checklistSavingRef = useRef(new Set<string>())
    const [memoEditorVisible, setMemoEditorVisible] = useState(true)
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
    const [confirmLoading, setConfirmLoading] = useState(false)

    // Handle Escape key to close confirmation modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !confirmLoading) {
                setDeleteTarget(null)
            }
        }
        if (deleteTarget) {
            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
        }
    }, [deleteTarget, confirmLoading])

    // State Kalender Mini
    const [calDate, setCalDate] = useState<Date | null>(null)

    const reportError = useCallback((message: string) => {
        setError(message)
        setSuccessMessage(null)
    }, [])

    useEffect(() => {
        if (!openMenuId) return

        const handleOutsideMouseDown = (event: MouseEvent) => {
            if (!(event.target instanceof Element) || !event.target.closest('[data-memo-menu]')) {
                setOpenMenuId(null)
            }
        }
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpenMenuId(null)
        }

        document.addEventListener('mousedown', handleOutsideMouseDown)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleOutsideMouseDown)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [openMenuId])

    useEffect(() => {
        if (!error) return
        const timeoutId = window.setTimeout(() => setError(null), 10000)
        return () => window.clearTimeout(timeoutId)
    }, [error])

    useEffect(() => {
        if (!successMessage) return
        const timeoutId = window.setTimeout(() => setSuccessMessage(null), 5000)
        return () => window.clearTimeout(timeoutId)
    }, [successMessage])

    useEffect(() => {
        memoListRef.current = memos
    }, [memos])

    useEffect(() => {
        latestMemoFiltersRef.current = { selectedTag, selectedDate, activeTab }
    }, [activeTab, selectedDate, selectedTag])

    useEffect(() => {
        if (!preferencesReady || !userId) return
        window.localStorage.setItem(`memos-settings-${userId}`, JSON.stringify({
            language,
            theme,
            fontSize,
        }))
    }, [fontSize, language, preferencesReady, theme, userId])

    useEffect(() => {
        document.documentElement.dataset.fontSize = fontSize
    }, [fontSize])

    useEffect(() => {
        if (activeTab !== 'memos' || loading || !memoEditorRef.current) return

        const observer = new IntersectionObserver(([entry]) => {
            setMemoEditorVisible(entry.isIntersecting)
        })
        observer.observe(memoEditorRef.current)
        return () => observer.disconnect()
    }, [activeTab, loading])

    const permanentlyDeleteMemos = useCallback(async (memosToDelete: Pick<Memo, 'id' | 'content'>[]): Promise<boolean> => {
        if (memosToDelete.length === 0) return true
        const ownerId = userIdRef.current
        if (!ownerId) {
            reportError('Sesi pengguna tidak tersedia.')
            return false
        }

        const memoIds = new Set(memosToDelete.map((memo) => memo.id))
        const referencedPaths = new Set<string>()
        for (const memo of memosToDelete) {
            for (const match of memo.content.matchAll(/resource:\/\/([^\s)]+)/g)) {
                try {
                    referencedPaths.add(decodeURIComponent(match[1]))
                } catch {
                    continue
                }
            }
        }

        const { data: resourceRows, error: resourcesError } = await supabase
            .from('resources')
            .select('id, storage_path, memo_id')
            .eq('user_id', ownerId)
        if (resourcesError) {
            reportError(resourcesError.message)
            return false
        }

        const relatedResources = (resourceRows ?? []).filter((row) => {
            const record = row as Record<string, unknown>
            return memoIds.has(String(record.memo_id ?? '')) ||
                (typeof record.storage_path === 'string' && referencedPaths.has(record.storage_path))
        })
        const storagePaths = relatedResources
            .map((row) => (row as Record<string, unknown>).storage_path)
            .filter((path): path is string => typeof path === 'string' && path.length > 0)
        if (storagePaths.length > 0) {
            const { error } = await supabase.storage.from('resources').remove(storagePaths)
            if (error) {
                reportError(error.message)
                return false
            }
        }

        const resourceIds = relatedResources
            .map((row) => String((row as Record<string, unknown>).id))
            .filter(Boolean)
        if (resourceIds.length > 0) {
            const { error } = await supabase.from('resources').delete().eq('user_id', ownerId).in('id', resourceIds)
            if (error) {
                reportError(error.message)
                return false
            }
        }

        const { error } = await supabase
            .from('memos')
            .delete()
            .eq('user_id', ownerId)
            .eq('visibility', 'private')
            .in('id', Array.from(memoIds))
        if (error) {
            reportError(error.message)
            return false
        }

        setMemos((current) => current.filter((memo) => !memoIds.has(memo.id)))
        setResources((current) => current.filter((resource) => !resourceIds.includes(resource.id)))
        return true
    }, [reportError, supabase])

    const fetchTrashCount = useCallback(async (): Promise<boolean> => {
        const ownerId = userIdRef.current
        if (!ownerId) return false
        const { count, error } = await supabase
            .from('memos')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', ownerId)
            .eq('visibility', 'private')
            .not('deleted_at', 'is', null)
        if (error) {
            reportError(error.message)
            return false
        }
        setTrashCount(count ?? 0)
        return true
    }, [reportError, supabase])

    const fetchMemos = useCallback(async (
        tagFilter?: string | null,
        query?: string,
        dateFilter?: string | null,
        archived = false,
        includeDeleted = false,
        activeTab: ActiveTab = 'memos',
    ): Promise<boolean> => {
        const ownerId = userIdRef.current
        if (!ownerId) return false
        const filters: MemoQueryFilters = {
            tagFilter: tagFilter ?? null,
            query: query ?? '',
            dateFilter: dateFilter ?? null,
            archived,
            includeDeleted,
            favoriteOnly: activeTab === 'favorites',
            pinnedOnly: activeTab === 'pinned',
            activeTab,
        }
        memoFiltersRef.current = filters
        const requestId = ++memoFetchSequence.current
        loadMoreRequestRef.current = null
        memoInitialRequestRef.current = true
        setLoadingMoreMemos(false)
        setMemos([])
        memoListRef.current = []
        setHasMoreMemos(false)
        setMemosLoading(true)

        try {
            if (requestId !== memoFetchSequence.current) return true

            let req = supabase
                .from('memos')
                .select('*', { count: 'exact' })
                .eq('user_id', ownerId)
                .eq('visibility', 'private')
            if (includeDeleted) {
                req = req.not('deleted_at', 'is', null)
            } else if (filters.favoriteOnly || filters.pinnedOnly) {
                req = req.is('deleted_at', null)
            } else {
                req = req.is('deleted_at', null).eq('archived', archived)
            }
            if (filters.favoriteOnly) req = req.eq('is_favorite', true)
            if (filters.pinnedOnly) req = req.eq('is_pinned', true)
            req = req.order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: false })

            if (tagFilter) {
                req = req.contains('tags', [tagFilter])
            }
            if (query && query.trim() !== '') {
                req = req.ilike('content', `%${query.trim()}%`)
            }
            if (dateFilter) {
                req = req
                    .gte('created_at', `${dateFilter}T00:00:00`)
                    .lte('created_at', `${dateFilter}T23:59:59`)
            }

            const { data, count, error } = await req.range(0, PAGE_SIZE - 1)
            if (error) {
                if (requestId !== memoFetchSequence.current) return true
                reportError(error.message)
                return false
            }
            if (requestId !== memoFetchSequence.current) return true
            const page = (data ?? []) as Memo[]
            memoListRef.current = page
            setMemos(page)
            setHasMoreMemos((count ?? page.length) > page.length)
            return fetchTrashCount()
        } catch (error) {
            if (requestId === memoFetchSequence.current) {
                reportError(error instanceof Error ? error.message : 'Gagal memuat catatan.')
            }
            return false
        } finally {
            if (requestId === memoFetchSequence.current) {
                memoInitialRequestRef.current = false
                setMemosLoading(false)
            }
        }
    }, [fetchTrashCount, reportError, supabase])

    const loadMoreMemos = useCallback(async (): Promise<boolean> => {
        const ownerId = userIdRef.current
        if (!ownerId || !hasMoreMemos || memosLoading || memoInitialRequestRef.current || loadMoreRequestRef.current !== null) return false

        const filters = { ...memoFiltersRef.current }
        const requestId = memoFetchSequence.current
        const from = memoListRef.current.length
        loadMoreRequestRef.current = requestId
        setLoadingMoreMemos(true)

        try {
            let req = supabase
                .from('memos')
                .select('*', { count: 'exact' })
                .eq('user_id', ownerId)
                .eq('visibility', 'private')
            if (filters.includeDeleted) {
                req = req.not('deleted_at', 'is', null)
            } else if (filters.favoriteOnly || filters.pinnedOnly) {
                req = req.is('deleted_at', null)
            } else {
                req = req.is('deleted_at', null).eq('archived', filters.archived)
            }
            if (filters.favoriteOnly) req = req.eq('is_favorite', true)
            if (filters.pinnedOnly) req = req.eq('is_pinned', true)
            req = req.order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: false })

            if (filters.tagFilter) req = req.contains('tags', [filters.tagFilter])
            if (filters.query.trim() !== '') req = req.ilike('content', `%${filters.query.trim()}%`)
            if (filters.dateFilter) {
                req = req
                    .gte('created_at', `${filters.dateFilter}T00:00:00`)
                    .lte('created_at', `${filters.dateFilter}T23:59:59`)
            }

            const { data, count, error } = await req.range(from, from + PAGE_SIZE - 1)
            if (requestId !== memoFetchSequence.current) return true
            if (error) {
                reportError(error.message)
                return false
            }

            const page = (data ?? []) as Memo[]
            const existingIds = new Set(memoListRef.current.map((memo) => memo.id))
            const appended = [...memoListRef.current, ...page.filter((memo) => !existingIds.has(memo.id))]
            memoListRef.current = appended
            setMemos(appended)
            setHasMoreMemos(appended.length < (count ?? from + page.length))
            return fetchTrashCount()
        } catch (error) {
            if (requestId === memoFetchSequence.current) {
                reportError(error instanceof Error ? error.message : 'Gagal memuat catatan berikutnya.')
            }
            return false
        } finally {
            if (loadMoreRequestRef.current === requestId) {
                loadMoreRequestRef.current = null
                setLoadingMoreMemos(false)
            }
        }
    }, [fetchTrashCount, hasMoreMemos, memosLoading, reportError, supabase])

    useEffect(() => {
        if (previousSearchQueryRef.current === searchQuery) return
        previousSearchQueryRef.current = searchQuery
        const timeoutId = window.setTimeout(() => {
            const filters = latestMemoFiltersRef.current
            void fetchMemos(
                filters.selectedTag,
                searchQuery,
                filters.selectedDate,
                filters.activeTab === 'archived',
                filters.activeTab === 'trash',
                filters.activeTab,
            )
        }, 300)
        return () => window.clearTimeout(timeoutId)
    }, [fetchMemos, searchQuery])

    const fetchTags = useCallback(async (): Promise<boolean> => {
        const ownerId = userIdRef.current
        if (!ownerId) return false
        const requestId = ++tagFetchSequence.current
        const rows: { tags: unknown }[] = []
        let offset = 0
        while (true) {
            const { data, error } = await supabase
                .from('memos')
                .select('tags')
                .eq('user_id', ownerId)
                .eq('visibility', 'private')
                .eq('archived', false)
                .is('deleted_at', null)
                .order('id', { ascending: true })
                .range(offset, offset + 499)
            if (error) {
                if (requestId !== tagFetchSequence.current) return true
                reportError(error.message)
                return false
            }
            if (requestId !== tagFetchSequence.current) return true
            const page = data ?? []
            if (page.length === 0) break
            rows.push(...page)
            offset += page.length
        }
        if (requestId !== tagFetchSequence.current) return true

        const counts = new Map<string, number>()
        for (const row of rows) {
            const tags = Array.isArray(row.tags)
                ? Array.from(new Set(row.tags.filter((tag): tag is string => typeof tag === 'string')))
                : []
            for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
        }
        setTagsList(Array.from(counts, ([tag, total]) => ({ tag, total })).sort((a, b) => a.tag.localeCompare(b.tag)))
        return true
    }, [reportError, supabase])

    const fetchDailyCounts = useCallback(async (): Promise<boolean> => {
        const ownerId = userIdRef.current
        if (!ownerId) return false
        const requestId = ++dailyFetchSequence.current
        const rows: { created_at: string | null }[] = []
        let offset = 0
        while (true) {
            const { data, error } = await supabase
                .from('memos')
                .select('created_at')
                .eq('user_id', ownerId)
                .eq('visibility', 'private')
                .is('deleted_at', null)
                .order('id', { ascending: true })
                .range(offset, offset + 499)
            if (error) {
                if (requestId !== dailyFetchSequence.current) return true
                reportError(error.message)
                return false
            }
            if (requestId !== dailyFetchSequence.current) return true
            const page = data ?? []
            if (page.length === 0) break
            rows.push(...page)
            offset += page.length
        }
        if (requestId !== dailyFetchSequence.current) return true
        const map: Record<string, number> = {}
        rows.forEach((row) => {
            const day = typeof row.created_at === 'string' ? row.created_at.slice(0, 10) : ''
            if (day) map[day] = (map[day] ?? 0) + 1
        })
        setDailyCounts(map)
        return true
    }, [reportError, supabase])

    const fetchResources = useCallback(async (ownerId: string): Promise<boolean> => {
        if (!ownerId) return false
        setResourceLoading(true)
        try {
            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .eq('user_id', ownerId)
                .order('created_at', { ascending: false })

            if (error) {
                reportError(error.message)
                return false
            }

            const entries = await Promise.all((data ?? []).map(async (row) => {
                const record = row as Record<string, unknown>
                const storagePath = typeof record.storage_path === 'string' ? record.storage_path : ''
                if (!storagePath) throw new Error('Metadata lampiran tidak memiliki storage_path.')
                const { data: signedData, error: signedError } = await supabase
                    .storage
                    .from('resources')
                    .createSignedUrl(storagePath, 3600)
                if (signedError) throw signedError

                return {
                    id: String(record.id),
                    filename: typeof record.filename === 'string'
                        ? record.filename
                        : storagePath.split('/').pop() ?? '',
                    storage_path: storagePath,
                    mime_type: typeof record.mime_type === 'string'
                        ? record.mime_type
                        : null,
                    size_bytes: typeof record.size_bytes === 'number' ? record.size_bytes : null,
                    created_at: String(record.created_at ?? ''),
                    signedUrl: signedData.signedUrl,
                }
            }))
            setResources(entries)
            return true
        } catch (error) {
            reportError(error instanceof Error ? error.message : 'Gagal memuat tautan lampiran.')
            return false
        } finally {
            setResourceLoading(false)
        }
    }, [reportError, supabase])

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                if (sessionError) {
                    reportError(sessionError.message)
                    router.replace('/login')
                    return
                }

                const user = session?.user
                if (!user) {
                    router.replace('/login')
                    return
                }

                setCalDate(new Date())
                userIdRef.current = user.id
                setUserId(user.id)
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('username, theme')
                    .eq('id', user.id)
                    .single()

                if (profileError) {
                    reportError(profileError.message)
                    router.replace('/login')
                    return
                }

                if (profile?.username) {
                    setUsername(profile.username)
                    setProfileUsername(profile.username)
                } else if (user.email) {
                    const fallbackUsername = user.email.split('@')[0]
                    setUsername(fallbackUsername)
                    setProfileUsername(fallbackUsername)
                }

                const savedPreferences = window.localStorage.getItem(`memos-settings-${user.id}`)
                if (savedPreferences) {
                    try {
                        const preferences = JSON.parse(savedPreferences) as {
                            language?: 'id' | 'en'
                            theme?: Theme
                            fontSize?: FontSize
                        }
                        if (preferences.language === 'id' || preferences.language === 'en') setLanguage(preferences.language)
                        if (!profile?.theme && (preferences.theme === 'light' || preferences.theme === 'dark' || preferences.theme === 'system')) {
                            setTheme(preferences.theme)
                        }
                        if (preferences.fontSize === 'small' || preferences.fontSize === 'medium' || preferences.fontSize === 'large') setFontSize(preferences.fontSize)
                    } catch {
                        window.localStorage.removeItem(`memos-settings-${user.id}`)
                    }
                }
                if (profile?.theme === 'light' || profile?.theme === 'dark' || profile?.theme === 'system') {
                    setTheme(profile.theme)
                }
                setPreferencesReady(true)

                const memosFetched = await fetchMemos()
                if (!memosFetched) {
                    router.replace('/login')
                    return
                }

                const fetchResults = await Promise.all([
                    fetchTags(),
                    fetchDailyCounts(),
                    fetchResources(user.id),
                ])
                if (fetchResults.some((succeeded) => !succeeded)) {
                    router.replace('/login')
                }
            } catch (error) {
                reportError(error instanceof Error ? error.message : 'Gagal memuat sesi dan data akun.')
                router.replace('/login')
            } finally {
                setLoading(false)
            }
        }
        void init()
    }, [fetchDailyCounts, fetchMemos, fetchResources, fetchTags, reportError, router, setTheme, supabase])

    const extractTags = (text: string): string[] => {
        const matches = text.match(/#([a-zA-Z0-9_-]+)/g)
        if (!matches) return []
        return Array.from(new Set(matches.map((t) => t.slice(1).toLowerCase())))
    }

    const handleSaveMemo = async () => {
        if (!content.trim()) return
        const ownerId = userIdRef.current
        if (!ownerId) {
            reportError('Sesi pengguna tidak tersedia.')
            return
        }
        setSubmitting(true)

        const extractedTags = extractTags(content)

        const { error } = await supabase.from('memos').insert({
            user_id: ownerId,
            content: content.trim(),
            tags: extractedTags,
            visibility: 'private',
        })

        if (!error) {
            setContent('')
            await Promise.all([
                fetchMemos(selectedTag, searchQuery, selectedDate, activeTab === 'archived', activeTab === 'trash', activeTab),
                fetchTags(),
                fetchDailyCounts(),
            ])
            setSuccessMessage('Catatan berhasil disimpan.')
        } else {
            reportError(error.message)
        }
        setSubmitting(false)
    }

    const insertSnippet = (
        snippet: string,
        target: 'memo' | 'edit' = activeEditorTargetRef.current,
        selection?: { start: number; end: number },
    ) => {
        const textarea = target === 'memo' ? memoTextareaRef.current : editTextareaRef.current
        const currentValue = target === 'memo' ? content : editContent
        const start = selection?.start ?? textarea?.selectionStart ?? currentValue.length
        const end = selection?.end ?? textarea?.selectionEnd ?? start
        const updatedValue = `${currentValue.slice(0, start)}${snippet}${currentValue.slice(end)}`

        if (target === 'memo') setContent(updatedValue)
        else setEditContent(updatedValue)

        const placeholderOffset = snippet.startsWith('```js\n\n')
            ? snippet.indexOf('\n\n') + 1
            : snippet.length
        window.requestAnimationFrame(() => {
            textarea?.focus()
            textarea?.setSelectionRange(start + placeholderOffset, start + placeholderOffset)
        })
    }

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            reportError(error.message)
            return
        }
        router.push('/login')
    }

    const navigateTo = (tab: ActiveTab) => {
        setActiveTab(tab)
        setSelectedTag(null)
        setSelectedDate(null)
        setMobileMenuOpen(false)
        setOpenMenuId(null)
        if (tab === 'archived') {
            fetchMemos(null, searchQuery, null, true, false, tab)
        } else if (tab === 'trash') {
            fetchMemos(null, searchQuery, null, false, true, tab)
        } else if (tab === 'memos' || tab === 'daily' || tab === 'favorites' || tab === 'pinned') {
            fetchMemos(null, searchQuery, null, false, false, tab)
        } else if (tab === 'resources' && userId) {
            fetchResources(userId)
        }
    }

    useBackLayer(mobileMenuOpen, () => setMobileMenuOpen(false))
    useBackLayer(activeTab !== 'memos' || Boolean(selectedTag) || Boolean(selectedDate), () => navigateTo('memos'))

    const handleTagClick = (tag: string | null) => {
        const nextTag = selectedTag === tag ? null : tag
        setSelectedTag(nextTag)
        setActiveTab('memos')
        fetchMemos(nextTag, searchQuery, selectedDate, false, false, 'memos')
        setMobileMenuOpen(false)
    }

    const handleDateClick = (dateStr: string) => {
        const nextDate = selectedDate === dateStr ? null : dateStr
        setSelectedDate(nextDate)
        setActiveTab('memos')
        fetchMemos(selectedTag, searchQuery, nextDate, false, false, 'memos')
    }

    const executeMemoAction = async (memo: Memo, action: 'archive' | 'restore') => {
        const { data, error } = await supabase
            .from('memos')
            .update({ archived: action === 'archive' })
            .eq('id', memo.id)
            .eq('user_id', userIdRef.current ?? '')
            .eq('visibility', 'private')
            .select('id')
            .maybeSingle()
        if (error) {
            reportError(error.message)
            return
        }

        if (!data) {
            reportError('Catatan tidak ditemukan atau tidak dapat diakses.')
            return
        }
        await Promise.all([
            fetchMemos(selectedTag, searchQuery, selectedDate, activeTab === 'archived', activeTab === 'trash', activeTab),
            fetchTags(),
            fetchDailyCounts(),
        ])
        setSuccessMessage(action === 'archive' ? 'Catatan diarsipkan.' : 'Catatan dipulihkan.')
    }

    const handleSoftDeleteMemo = async (memo: Memo) => {
        const { data, error } = await supabase
            .from('memos')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', memo.id)
            .eq('user_id', userIdRef.current ?? '')
            .eq('visibility', 'private')
            .is('deleted_at', null)
            .select('id')
            .maybeSingle()
        if (error) {
            reportError(error.message)
            return false
        }
        if (!data) {
            reportError('Catatan tidak ditemukan atau sudah berada di Sampah.')
            return false
        }

        setMemos((current) => current.filter((item) => item.id !== memo.id))
        setSelectedMemo((current) => current?.id === memo.id ? null : current)
        setRandomMemo((current) => current?.id === memo.id ? null : current)
        await Promise.all([fetchTrashCount(), fetchTags(), fetchDailyCounts()])
        setSuccessMessage(language === 'id' ? 'Catatan dipindahkan ke Sampah.' : 'Note moved to Trash.')
        return true
    }

    const handleMemoAction = (memo: Memo, action: MemoAction) => {
        setOpenMenuId(null)
        if (action === 'delete') {
            setDeleteTarget({ type: 'moveToTrash', memo })
            return
        }

        void executeMemoAction(memo, action)
    }

    const handleToggleMemoFlag = async (memo: Memo, flag: 'is_favorite' | 'is_pinned') => {
        const nextValue = memo[flag] !== true
        const { data, error } = await supabase
            .from('memos')
            .update({ [flag]: nextValue })
            .eq('id', memo.id)
            .eq('user_id', userIdRef.current ?? '')
            .eq('visibility', 'private')
            .select('id')
            .maybeSingle()
        if (error) {
            reportError(error.message)
            return
        }
        if (!data) {
            reportError('Catatan tidak ditemukan atau tidak dapat diperbarui.')
            return
        }

        const updatedMemo = { ...memo, [flag]: nextValue }
        const updateMemo = (current: Memo | null) => current?.id === memo.id ? { ...current, [flag]: nextValue } : current
        setMemos((current) => current.map((item) => item.id === memo.id ? updatedMemo : item))
        memoListRef.current = memoListRef.current.map((item) => item.id === memo.id ? updatedMemo : item)
        setSelectedMemo(updateMemo)
        setRandomMemo(updateMemo)

        await fetchMemos(selectedTag, searchQuery, selectedDate, activeTab === 'archived', activeTab === 'trash', activeTab)
        setSuccessMessage(flag === 'is_favorite'
            ? nextValue ? labels.favoriteAdded : labels.favoriteRemoved
            : nextValue ? labels.pinAdded : labels.pinRemoved)
    }

    const handleCopyMemo = async (memo: Memo) => {
        try {
            await navigator.clipboard.writeText(memo.content)
            setSuccessMessage(language === 'id' ? 'Catatan disalin.' : 'Note copied.')
        } catch {
            reportError(language === 'id'
                ? 'Gagal menyalin. Izinkan akses clipboard lalu coba lagi.'
                : 'Could not copy. Allow clipboard access and try again.')
        }
    }

    const handleRestoreMemo = async (id: string) => {
        const { data, error } = await supabase
            .from('memos')
            .update({ deleted_at: null })
            .eq('id', id)
            .eq('user_id', userIdRef.current ?? '')
            .eq('visibility', 'private')
            .not('deleted_at', 'is', null)
            .select('id')
            .maybeSingle()
        if (error) {
            reportError(error.message)
            return
        }
        if (!data) {
            reportError('Catatan tidak ditemukan di Sampah.')
            return
        }

        setMemos((current) => current.filter((memo) => memo.id !== id))
        await Promise.all([fetchTrashCount(), fetchTags(), fetchDailyCounts()])
        setSuccessMessage(language === 'id' ? 'Catatan dipulihkan.' : 'Note restored.')
    }

    const handlePermanentDeleteMemo = (id: string) => {
        setDeleteTarget({ id, type: 'memo' })
    }

    const handleEmptyTrash = () => {
        setDeleteTarget({ type: 'emptyTrash' })
    }

    const handleDeleteResource = (resource: Resource) => {
        setOpenMenuId(null)
        setDeleteTarget({
            id: resource.id,
            type: 'resource',
            filePath: resource.storage_path,
        })
    }

    const handleConfirmDelete = async () => {
        if (!deleteTarget || confirmLoading) return

        setConfirmLoading(true)
        setError(null)
        setSuccessMessage(null)
        try {
            if (deleteTarget.type === 'moveToTrash') {
                const moved = await handleSoftDeleteMemo(deleteTarget.memo)
                if (moved) setDeleteTarget(null)
                return
            }

            if (deleteTarget.type === 'memo' || deleteTarget.type === 'emptyTrash') {
                let memosToDelete: Pick<Memo, 'id' | 'content'>[]
                if (deleteTarget.type === 'memo') {
                    const targetMemo = memos.find((memo) => memo.id === deleteTarget.id)
                    if (targetMemo) {
                        memosToDelete = [targetMemo]
                    } else {
                        const { data, error } = await supabase
                            .from('memos')
                            .select('id, content')
                            .eq('id', deleteTarget.id)
                            .eq('user_id', userIdRef.current ?? '')
                            .eq('visibility', 'private')
                            .not('deleted_at', 'is', null)
                            .maybeSingle()
                        if (error) {
                            reportError(error.message)
                            return
                        }
                        if (!data) {
                            reportError('Catatan tidak ditemukan di Sampah.')
                            return
                        }
                        memosToDelete = [data as Pick<Memo, 'id' | 'content'>]
                    }
                } else {
                    const { data, error } = await supabase
                        .from('memos')
                        .select('id, content')
                        .eq('user_id', userIdRef.current ?? '')
                        .eq('visibility', 'private')
                        .not('deleted_at', 'is', null)
                    if (error) {
                        reportError(error.message)
                        return
                    }
                    memosToDelete = (data ?? []) as Pick<Memo, 'id' | 'content'>[]
                }

                if (!await permanentlyDeleteMemos(memosToDelete)) return
                setSelectedMemo((current) => current && memosToDelete.some((memo) => memo.id === current.id) ? null : current)
                setRandomMemo((current) => current && memosToDelete.some((memo) => memo.id === current.id) ? null : current)
                await Promise.all([fetchTrashCount(), fetchTags(), fetchDailyCounts()])
                setSuccessMessage(deleteTarget.type === 'emptyTrash'
                    ? (language === 'id' ? 'Sampah berhasil dikosongkan.' : 'Trash emptied.')
                    : (language === 'id' ? 'Catatan dihapus permanen.' : 'Note permanently deleted.'))
            } else if (deleteTarget.type === 'resource') {
                if (deleteTarget.filePath) {
                    const { error } = await supabase
                        .storage
                        .from('resources')
                        .remove([deleteTarget.filePath])
                    if (error) {
                        reportError(error.message)
                        return
                    }
                }

                const { data, error } = await supabase
                    .from('resources')
                    .delete()
                    .eq('id', deleteTarget.id)
                    .eq('user_id', userIdRef.current ?? '')
                    .select('id')
                    .maybeSingle()

                if (error) {
                    reportError(error.message)
                    return
                }
                if (!data) {
                    reportError('Lampiran tidak ditemukan atau tidak dapat diakses.')
                    return
                }

                setResources((current) => current.filter((resource) => resource.id !== deleteTarget.id))
                setSuccessMessage(language === 'id' ? 'Lampiran berhasil dihapus.' : 'Attachment deleted.')
            }

            setDeleteTarget(null)
        } finally {
            setConfirmLoading(false)
        }
    }

    const handleOpenMemo = (memo: Memo) => {
        setSelectedMemo(memo)
        setEditingMemo(false)
        setEditContent(memo.content)
    }

    const handleSaveMemoEdit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!selectedMemo || !editContent.trim()) return

        const updatedContent = editContent.trim()
        const updatedTags = extractTags(updatedContent)
        const { data, error } = await supabase
            .from('memos')
            .update({
                content: updatedContent,
                tags: updatedTags,
                visibility: 'private',
            })
            .eq('id', selectedMemo.id)
            .eq('user_id', userIdRef.current ?? '')
            .eq('visibility', 'private')
            .select('*')
            .maybeSingle()

        if (error) {
            reportError(error.message)
            return
        }
        if (!data) {
            reportError('Catatan tidak ditemukan atau tidak dapat diperbarui.')
            return
        }

        const updatedMemo = data as Memo
        setMemos((current) => current.map((memo) => memo.id === updatedMemo.id ? updatedMemo : memo))
        setSelectedMemo(updatedMemo)
        setEditingMemo(false)
        await fetchTags()
        setSuccessMessage('Catatan berhasil diperbarui.')
    }

    const handleToggleChecklist = async (
        memoId: string,
        memoContent: string,
        lineNumber: number,
        checked: boolean,
        updatedAt?: string | null,
    ) => {
        if (checklistSavingRef.current.has(memoId)) return

        const updatedContent = replaceChecklistItem(memoContent, lineNumber, checked)
        if (updatedContent === null) {
            reportError(language === 'id'
                ? 'Status checklist tidak dapat diperbarui. Muat ulang catatan dan coba lagi.'
                : 'The checklist item could not be updated. Reload the note and try again.')
            return
        }

        checklistSavingRef.current.add(memoId)
        setChecklistSavingIds(new Set(checklistSavingRef.current))
        try {
            let updateRequest = supabase
                .from('memos')
                .update({ content: updatedContent })
                .eq('id', memoId)
                .eq('user_id', userIdRef.current ?? '')
                .eq('visibility', 'private')
                .is('deleted_at', null)
            if (updatedAt) updateRequest = updateRequest.eq('updated_at', updatedAt)
            const { data, error } = await updateRequest.select('*').maybeSingle()
            if (error) {
                reportError(error.message)
                return
            }
            if (!data) {
                reportError(language === 'id'
                    ? 'Catatan berubah atau tidak dapat diakses. Muat ulang sebelum mengubah checklist.'
                    : 'The note changed or is no longer available. Reload before changing its checklist.')
                return
            }

            const updatedMemo = data as Memo
            setMemos((current) => current.map((memo) => memo.id === memoId ? updatedMemo : memo))
            setSelectedMemo((current) => current?.id === memoId ? updatedMemo : current)
        } catch {
            reportError(language === 'id'
                ? 'Checklist gagal disimpan. Periksa koneksi lalu coba lagi.'
                : 'The checklist could not be saved. Check your connection and try again.')
        } finally {
            checklistSavingRef.current.delete(memoId)
            setChecklistSavingIds(new Set(checklistSavingRef.current))
        }
    }

    const uploadResource = async (file: File): Promise<string | null> => {
        if (!userId) return null
        const safeName = file.name.replace(/[\\/?#]/g, '_')
        const path = `${userId}/${crypto.randomUUID()}/${safeName}`
        const storage = supabase.storage.from('resources')
        const { error: uploadError } = await storage.upload(path, file, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
        })
        if (uploadError) {
            reportError(uploadError.message)
            return null
        }

        const { error: metadataError } = await supabase.from('resources').insert({
            user_id: userId,
            memo_id: null,
            storage_path: path,
            filename: file.name,
            mime_type: file.type || null,
            size_bytes: file.size,
        })
        if (metadataError) {
            const { error: cleanupError } = await storage.remove([path])
            reportError(cleanupError
                ? `${metadataError.message} File di Storage juga gagal dibersihkan: ${cleanupError.message}`
                : metadataError.message)
            return null
        }

        const encodedPath = encodeURIComponent(path).replace(/[!'()*]/g, (character) =>
            `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
        const resourceLink = `resource://${encodedPath}`
        const markdownName = file.name.replace(/[\\[\]]/g, '\\$&')
        return file.type.startsWith('image/')
            ? `![${markdownName}](${resourceLink})`
            : `[${markdownName}](${resourceLink})`
    }

    const handleUploadSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file || !userId) return

        setSubmitting(true)
        setError(null)
        setSuccessMessage(null)
        const snippet = await uploadResource(file)
        if (!snippet) {
            setSubmitting(false)
            return
        }

        if (uploadPurpose !== 'library') {
            const target = uploadTargetRef.current
            if (target) {
                insertSnippet(snippet, target.target, {
                    start: target.selectionStart,
                    end: target.selectionEnd,
                })
            } else {
                insertSnippet(snippet, uploadPurpose)
            }
        }
        uploadTargetRef.current = null
        await fetchResources(userId)
        setSuccessMessage('Lampiran berhasil diunggah.')
        setSubmitting(false)
    }

    const handleEditorPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>, target: 'memo' | 'edit') => {
        const pasted = Array.from(event.clipboardData.files)
        if (pasted.length === 0 || !userId) return
        event.preventDefault()
        if (submitting) return

        const textarea = event.currentTarget
        const currentValue = target === 'memo' ? content : editContent
        const setValue = target === 'memo' ? setContent : setEditContent
        const start = textarea.selectionStart
        const end = textarea.selectionEnd

        const jobs = pasted.map((file, index) => ({
            file: renamePastedFile(file, index),
            placeholder: `[${language === 'id' ? 'Mengunggah' : 'Uploading'}... ${crypto.randomUUID().slice(0, 8)}]`,
        }))
        const inserted = jobs.map((job) => job.placeholder).join('\n')
        setValue(`${currentValue.slice(0, start)}${inserted}${currentValue.slice(end)}`)

        void (async () => {
            setSubmitting(true)
            setError(null)
            setSuccessMessage(null)
            let uploaded = 0
            for (const job of jobs) {
                const snippet = await uploadResource(job.file)
                setValue((value) => value.replace(job.placeholder, () => snippet ?? ''))
                if (snippet) uploaded += 1
            }
            if (uploaded > 0) {
                await fetchResources(userId)
                setSuccessMessage('Lampiran berhasil diunggah.')
            }
            setSubmitting(false)
        })()
    }

    const pasteToLibraryRef = useRef<(files: File[]) => Promise<void>>(async () => {})

    useEffect(() => {
        pasteToLibraryRef.current = async (files) => {
            if (!userId || submitting) return
            setSubmitting(true)
            setError(null)
            setSuccessMessage(null)
            let uploaded = 0
            for (const [index, file] of files.entries()) {
                if (await uploadResource(renamePastedFile(file, index))) uploaded += 1
            }
            if (uploaded > 0) {
                await fetchResources(userId)
                setSuccessMessage('Lampiran berhasil diunggah.')
            }
            setSubmitting(false)
        }
    })

    useEffect(() => {
        if (activeTab !== 'resources') return
        const handlePaste = (event: ClipboardEvent) => {
            if (event.defaultPrevented || isTextEntryTarget(event.target)) return
            const pasted = Array.from(event.clipboardData?.files ?? [])
            if (pasted.length === 0) return
            event.preventDefault()
            void pasteToLibraryRef.current(pasted)
        }
        document.addEventListener('paste', handlePaste)
        return () => document.removeEventListener('paste', handlePaste)
    }, [activeTab])

    const handleSaveProfile = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!userId || !profileUsername.trim()) return
        const { data, error } = await supabase
            .from('profiles')
            .update({ username: profileUsername.trim() })
            .eq('id', userId)
            .select('id')
            .maybeSingle()
        if (error) {
            reportError(error.message)
            return
        }
        if (!data) {
            reportError('Profil tidak ditemukan atau tidak dapat diperbarui.')
            return
        }
        setUsername(profileUsername.trim())
        setSuccessMessage('Profil berhasil diperbarui.')
    }

    const handleThemeChange = async (nextTheme: Theme) => {
        setTheme(nextTheme)
        if (!userId) return

        const { data, error } = await supabase
            .from('profiles')
            .update({ theme: nextTheme })
            .eq('id', userId)
            .select('id')
            .maybeSingle()
        if (error) {
            reportError(error.message)
            return
        }
        if (!data) {
            reportError('Profil tidak ditemukan atau preferensi tema tidak dapat disimpan.')
        }
    }

    const toggleTheme = () => {
        const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
        void handleThemeChange(nextTheme)
    }

    const handleChangePassword = async (event: React.FormEvent) => {
        event.preventDefault()
        if (password.length < 6) {
            reportError('Kata sandi harus terdiri dari minimal 6 karakter.')
            return
        }
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
            reportError(error.message)
            return
        }
        setPassword('')
        setSuccessMessage('Kata sandi berhasil diubah.')
    }

    const handleExportMemos = async () => {
        const ownerId = userIdRef.current
        if (!ownerId) {
            reportError('Sesi pengguna tidak tersedia.')
            return
        }
        const { data, error } = await supabase
            .from('memos')
            .select('*')
            .eq('user_id', ownerId)
            .eq('visibility', 'private')
            .order('created_at', { ascending: false })
        if (error) {
            reportError(error.message)
            return
        }
        const blob = new Blob([JSON.stringify(data ?? [], null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'memos-export.json'
        link.click()
        URL.revokeObjectURL(url)
        setSuccessMessage('Ekspor catatan berhasil.')
    }

    const handleImportMemos = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        const ownerId = userIdRef.current
        if (!ownerId) {
            reportError('Sesi pengguna tidak tersedia.')
            return
        }

        try {
            const parsed: unknown = JSON.parse(await file.text())
            if (!Array.isArray(parsed)) throw new Error('Format JSON harus berupa daftar memo.')
            const importedMemos = parsed.map((item: unknown) => {
                if (typeof item !== 'object' || item === null || !('content' in item) || typeof item.content !== 'string') {
                    throw new Error('Setiap memo harus memiliki content berupa teks.')
                }
                const memo = item as Record<string, unknown>
                return {
                    user_id: ownerId,
                    content: memo.content,
                    tags: Array.isArray(memo.tags) ? memo.tags.filter((tag): tag is string => typeof tag === 'string') : [],
                    visibility: 'private',
                    archived: memo.archived === true,
                    is_favorite: memo.is_favorite === true,
                    is_pinned: memo.is_pinned === true,
                    ...(typeof memo.created_at === 'string' && Number.isFinite(Date.parse(memo.created_at))
                        ? { created_at: memo.created_at }
                        : {}),
                }
            })
            if (importedMemos.length === 0) throw new Error('File tidak berisi catatan untuk diimpor.')
            const { error } = await supabase.from('memos').insert(importedMemos)
            if (error) throw error
            await Promise.all([fetchMemos(), fetchTags(), fetchDailyCounts()])
            setSuccessMessage(`${importedMemos.length} catatan berhasil diimpor.`)
        } catch (error) {
            reportError(error instanceof Error ? error.message : 'File impor tidak dapat dibaca.')
        }
    }

    const openUploadPicker = (purpose: UploadPurpose, imagesOnly = false) => {
        const target = purpose === 'library' ? null : purpose
        const textarea = target === 'edit' ? editTextareaRef.current : memoTextareaRef.current
        uploadTargetRef.current = target
            ? {
                target,
                selectionStart: textarea?.selectionStart ?? (target === 'edit' ? editContent.length : content.length),
                selectionEnd: textarea?.selectionEnd ?? (target === 'edit' ? editContent.length : content.length),
            }
            : null
        setUploadPurpose(purpose)
        if (fileInputRef.current) fileInputRef.current.accept = imagesOnly ? 'image/*' : ''
        fileInputRef.current?.click()
    }

    const resourceUrlByPath = useMemo(
        () => new Map(resources.map((resource) => [resource.storage_path, resource.signedUrl])),
        [resources]
    )
    const dailyGroups = useMemo(() => {
        return memos.reduce<Record<string, Memo[]>>((groups, memo) => {
            const day = memo.created_at.slice(0, 10)
            groups[day] = [...(groups[day] ?? []), memo]
            return groups
        }, {})
    }, [memos])
    const labels: AppLabels = getLabels(language)

    const getMemoDisplayContent = (memoContent: string) =>
        replaceResourceReferences(memoContent, (path) => resourceUrlByPath.get(path))

    const renderLoadMoreButton = () => hasMoreMemos ? (
        <div className="flex justify-center pt-2" role="status" aria-live="polite">
            <button
                type="button"
                disabled={loadingMoreMemos || memosLoading}
                onClick={() => void loadMoreMemos()}
                className="min-h-11 rounded-xl border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-800 dark:bg-[#18181b] dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
                {loadingMoreMemos ? labels.loadingMore : labels.loadMore}
            </button>
        </div>
    ) : null

    const renderMemoCard = (memo: Memo) => (
        <MemoCard
            key={memo.id}
            memo={memo}
            activeTab={activeTab}
            labels={labels}
            language={language}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            setEditingMemo={setEditingMemo}
            handleMemoAction={handleMemoAction}
            handleToggleMemoFlag={handleToggleMemoFlag}
            handleCopyMemo={handleCopyMemo}
            handleRestoreMemo={handleRestoreMemo}
            handlePermanentDeleteMemo={handlePermanentDeleteMemo}
            handleTagClick={handleTagClick}
            handleOpenMemo={handleOpenMemo}
            getMemoDisplayContent={getMemoDisplayContent}
            handleToggleChecklist={handleToggleChecklist}
            checklistSavingIds={checklistSavingIds}
        />
    )

    // Kalkulasi Grid Kalender Mini
    const calendarDays = useMemo<CalendarDay[]>(() => {
        if (!calDate) return []
        const year = calDate.getFullYear()
        const month = calDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        // Senin = 0 ... Minggu = 6
        const startOffset = (firstDay.getDay() + 6) % 7
        const days: { dateStr: string; dayNum: number; currentMonth: boolean }[] = []

        // Hari bulan sebelumnya
        const prevMonthLast = new Date(year, month, 0).getDate()
        for (let i = startOffset - 1; i >= 0; i--) {
            const d = prevMonthLast - i
            const prevM = month === 0 ? 12 : month
            const prevY = month === 0 ? year - 1 : year
            days.push({
                dateStr: `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                dayNum: d,
                currentMonth: false,
            })
        }

        // Hari bulan ini
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push({
                dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                dayNum: d,
                currentMonth: true,
            })
        }

        // Sisa kotak hingga 35 atau 42
        const totalCells = days.length <= 35 ? 35 : 42
        let nextD = 1
        while (days.length < totalCells) {
            const nextM = month === 11 ? 1 : month + 2
            const nextY = month === 11 ? year + 1 : year
            days.push({
                dateStr: `${nextY}-${String(nextM).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`,
                dayNum: nextD++,
                currentMonth: false,
            })
        }

        return days
    }, [calDate])

    // Kalkulasi 84 hari (12 minggu x 7 hari) untuk Heatmap Aktivitas
    const heatmapCells = useMemo(() => {
        if (!calDate) return []
        const cells: { dateStr: string; count: number }[] = []
        const today = new Date()
        for (let i = 83; i >= 0; i--) {
            const d = new Date(today)
            d.setDate(today.getDate() - i)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
                d.getDate()
            ).padStart(2, '0')}`
            cells.push({ dateStr: key, count: dailyCounts[key] || 0 })
        }
        return cells
    }, [dailyCounts, calDate])

    const getHeatColor = (count: number) => {
        if (count === 0) return 'bg-zinc-100 dark:bg-zinc-800/60'
        if (count === 1) return 'bg-zinc-300 dark:bg-zinc-600'
        if (count <= 3) return 'bg-zinc-500 dark:bg-zinc-400'
        return 'bg-zinc-800 dark:bg-zinc-200'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-[#0f0f10] flex items-center justify-center">
                <div className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-400">
                    <span className="p-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl animate-pulse flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo-kertas.png" alt="kertas." className="w-6 h-6 rounded-lg object-cover" />
                    </span>
                    <span className="text-sm font-medium">Memuat catatan...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="app-shell min-h-screen bg-zinc-50 text-zinc-900 flex flex-col lg:flex-row dark:bg-[#0f0f10] dark:text-zinc-100">
            <Sidebar
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                username={username}
                toggleTheme={toggleTheme}
                labels={labels}
                profileMenuOpen={profileMenuOpen}
                setProfileMenuOpen={setProfileMenuOpen}
                handleLogout={handleLogout}
                activeTab={activeTab}
                navigateTo={navigateTo}
                tagsList={tagsList}
                trashCount={trashCount}
                selectedTag={selectedTag}
                handleTagClick={handleTagClick}
                calDate={calDate}
                setCalDate={setCalDate}
                language={language}
                calendarDays={calendarDays}
                dailyCounts={dailyCounts}
                selectedDate={selectedDate}
                handleDateClick={handleDateClick}
            />

            {/* AREA TENGAH: EDITOR & FEED MEMO */}
            <main className="flex-1 max-w-4xl mx-auto w-full p-3 sm:p-4 lg:p-6 space-y-5">
                <div className="relative xl:hidden">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder={labels.search}
                        className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-[#18181b] dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-600"
                    />
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleUploadSelected}
                />
                <input
                    ref={importInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={handleImportMemos}
                />
                {error ? (
                    <div
                        role="alert"
                        className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        <span>{error}</span>
                        <button
                            type="button"
                            aria-label="Tutup notifikasi"
                            onClick={() => setError(null)}
                            className="shrink-0 rounded-md p-0.5 text-red-600 hover:bg-red-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : successMessage ? (
                    <div
                        role="status"
                        className="flex items-start justify-between gap-3 rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-100"
                    >
                        <span>{successMessage}</span>
                        <button
                            type="button"
                            aria-label={labels.close}
                            onClick={() => setSuccessMessage(null)}
                            className="shrink-0 rounded-md p-0.5 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {activeTab === 'settings' ? (
                    <SettingsView
                        labels={labels}
                        profileUsername={profileUsername}
                        setProfileUsername={setProfileUsername}
                        handleSaveProfile={handleSaveProfile}
                        language={language}
                        setLanguage={setLanguage}
                        theme={theme}
                        handleThemeChange={handleThemeChange}
                        fontSize={fontSize}
                        setFontSize={setFontSize}
                        handleExportMemos={handleExportMemos}
                        importInputRef={importInputRef}
                        password={password}
                        setPassword={setPassword}
                        handleChangePassword={handleChangePassword}
                        handleLogout={handleLogout}
                    />
                ) : activeTab === 'tags' ? (
                    <section className="space-y-4">
                        <h1 className="text-xl font-bold text-gray-800 dark:text-zinc-100">{labels.tags}</h1>
                        {tagsList.length === 0 ? (
                            <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-gray-500 dark:bg-[#18181b] dark:border-zinc-800 dark:text-zinc-400">{labels.noTags}</p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {tagsList.map((item) => (
                                    <button
                                        type="button"
                                        key={item.tag}
                                        onClick={() => {
                                            setSelectedTag(item.tag)
                                            setActiveTab('memos')
                                            fetchMemos(item.tag, searchQuery, null, false, false, 'memos')
                                        }}
                                        className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 text-left hover:border-zinc-400 dark:border-zinc-800 dark:bg-[#18181b] dark:hover:border-zinc-600"
                                    >
                                        <span className="font-medium text-zinc-900 dark:text-zinc-100">#{item.tag}</span>
                                        <span className="text-xs text-gray-500 dark:text-zinc-400">{item.total} {labels.tagCount}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                ) : activeTab === 'resources' ? (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-zinc-100">{labels.resources}</h1>
                                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{labels.resourceDescription}</p>
                            </div>
                            <button type="button" onClick={() => openUploadPicker('library')} disabled={submitting} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500">
                                <Upload className="h-4 w-4" />{labels.upload}
                            </button>
                        </div>
                        {resourceLoading ? (
                            <p className="text-sm text-gray-500 dark:text-zinc-400">{labels.loadingResources}</p>
                        ) : resources.length === 0 ? (
                            <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-gray-500 dark:bg-[#18181b] dark:border-zinc-800 dark:text-zinc-400">{labels.noResources}</p>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {resources.map((resource) => (
                                    <div key={resource.id} className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-[#18181b] dark:hover:border-zinc-600 transition">
                                        <a href={resource.signedUrl} target="_blank" rel="noreferrer" className="block">
                                            {resource.mime_type?.startsWith('image/') ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={resource.signedUrl} alt={resource.filename} className="h-40 w-full object-cover" />
                                            ) : (
                                                <div className="flex h-40 items-center justify-center bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"><Paperclip className="h-8 w-8" /></div>
                                            )}
                                            <div className="p-3 pr-10">
                                                <p className="truncate text-sm font-medium text-gray-800 dark:text-zinc-200">{resource.filename}</p>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{resource.size_bytes === null ? '' : `${(resource.size_bytes / 1024).toFixed(1)} KB`}</p>
                                            </div>
                                        </a>
                                        <button
                                            type="button"
                                            title="Hapus lampiran"
                                            aria-label="Hapus lampiran"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleDeleteResource(resource)
                                            }}
                                            className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ) : activeTab === 'filebridge' ? (
                    <FileBridgeView userId={userId} labels={labels} language={language} />
                ) : activeTab === 'favorites' || activeTab === 'pinned' ? (
                    <section className="space-y-4">
                        <h1 className="text-xl font-bold text-gray-800 dark:text-zinc-100">
                            {activeTab === 'favorites' ? labels.favorites : labels.pinned}
                        </h1>
                        {memos.length === 0 ? (
                            <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-gray-500 dark:bg-[#18181b] dark:border-zinc-800 dark:text-zinc-400">
                                {memosLoading ? labels.loadingMemos : activeTab === 'favorites' ? labels.noFavorites : labels.noPinned}
                            </p>
                        ) : (
                            <div className="columns-1 md:columns-2 gap-4 space-y-4">
                                {memos.map(renderMemoCard)}
                            </div>
                        )}
                        {renderLoadMoreButton()}
                    </section>
                ) : activeTab === 'trash' ? (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-zinc-100">{labels.trash}</h1>
                            </div>
                            <button
                                type="button"
                                disabled={trashCount === 0}
                                onClick={handleEmptyTrash}
                                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />{labels.emptyTrash}
                            </button>
                        </div>
                        <div className="rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                            {labels.trashDescription}
                        </div>
                        {memos.length === 0 ? (
                            <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-gray-500 dark:bg-[#18181b] dark:border-zinc-800 dark:text-zinc-400">{memosLoading ? labels.loadingMemos : labels.noTrash}</p>
                        ) : (
                            <div className="columns-1 md:columns-2 gap-4 space-y-4">
                                {memos.map(renderMemoCard)}
                            </div>
                        )}
                        {renderLoadMoreButton()}
                    </section>
                ) : activeTab === 'daily' ? (
                    <section className="space-y-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-zinc-100">{labels.daily}</h1>
                                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{labels.dailyDescription}</p>
                            </div>
                            <button
                                type="button"
                                disabled={memos.length === 0}
                                onClick={() => setRandomMemo(memos[Math.floor(Math.random() * memos.length)] ?? null)}
                                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                            >
                                {labels.randomMemo}
                            </button>
                        </div>
                        {randomMemo && (
                            <div className="space-y-2 rounded-2xl border border-zinc-300 bg-zinc-100 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                                <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                    {labels.reviewMemo}
                                    <button type="button" onClick={() => setRandomMemo(null)} className="text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-100">{labels.close}</button>
                                </div>
                                {renderMemoCard(randomMemo)}
                            </div>
                        )}
                        {Object.keys(dailyGroups).length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-zinc-400">{memosLoading ? labels.loadingMemos : 'Belum ada catatan untuk ditinjau.'}</p>
                        ) : (
                            Object.entries(dailyGroups).map(([day, dayMemos]) => (
                                <section key={day} className="space-y-3">
                                    <h2 className="text-sm font-semibold text-gray-600 dark:text-zinc-300">{day} <span className="font-normal">({dayMemos.length})</span></h2>
                                    <div className="columns-1 md:columns-2 gap-4 space-y-4">
                                        {dayMemos.map(renderMemoCard)}
                                    </div>
                                </section>
                            ))
                        )}
                        {renderLoadMoreButton()}
                    </section>
                ) : (
                    <>
                        {activeTab === 'memos' ? (
                            <MemoEditor
                                memoEditorRef={memoEditorRef}
                                memoTextareaRef={memoTextareaRef}
                                content={content}
                                setContent={setContent}
                                openUploadPicker={openUploadPicker}
                                insertSnippet={insertSnippet}
                                handleSaveMemo={handleSaveMemo}
                                submitting={submitting}
                                labels={labels}
                                language={language}
                                onPasteFiles={(event) => handleEditorPaste(event, 'memo')}
                                onEditorFocus={() => {
                                    activeEditorTargetRef.current = 'memo'
                                }}
                            />
                        ) : (
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-zinc-100">{labels.archived}</h1>
                                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{labels.archivedDescription}</p>
                            </div>
                        )}
                        {(selectedTag || selectedDate) && activeTab === 'memos' && (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-gray-500 dark:text-zinc-400">{labels.filterActive}</span>
                                {selectedTag && <span className="px-2.5 py-1 bg-zinc-900 text-white rounded-full font-medium dark:bg-zinc-100 dark:text-zinc-950">#{selectedTag}</span>}
                                {selectedDate && <span className="px-2.5 py-1 bg-zinc-900 text-white rounded-full font-medium dark:bg-zinc-100 dark:text-zinc-950">{selectedDate}</span>}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedTag(null)
                                        setSelectedDate(null)
                                        fetchMemos(null, searchQuery, null, false, false, 'memos')
                                    }}
                                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline"
                                >
                                    {labels.reset}
                                </button>
                            </div>
                        )}
                        <div className="columns-1 md:columns-2 gap-4 space-y-4">
                            {memos.length === 0 ? (
                                <p className="text-sm text-zinc-400 text-center py-10">
                                    {memosLoading
                                        ? labels.loadingMemos
                                        : activeTab === 'archived' ? labels.noArchived : labels.empty}
                                </p>
                            ) : memos.map(renderMemoCard)}
                        </div>
                        {renderLoadMoreButton()}
                    </>
                )}
            </main>

            {activeTab === 'memos' && !memoEditorVisible && (
                <button
                    type="button"
                    aria-label={labels.newMemo}
                    onClick={() => {
                        memoEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        memoTextareaRef.current?.focus({ preventScroll: true })
                    }}
                    className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-zinc-900 text-white shadow-lg transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 sm:h-12 sm:w-auto sm:px-4 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:focus-visible:ring-zinc-100"
                >
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">{labels.newMemo}</span>
                </button>
            )}

            <RightPanel
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedTag={selectedTag}
                heatmapCells={heatmapCells}
                handleDateClick={handleDateClick}
                getHeatColor={getHeatColor}
                tagsList={tagsList}
                handleTagClick={handleTagClick}
                labels={labels}
            />

            <Modals
                selectedMemo={selectedMemo}
                setSelectedMemo={setSelectedMemo}
                editingMemo={editingMemo}
                setEditingMemo={setEditingMemo}
                editContent={editContent}
                setEditContent={setEditContent}
                editTextareaRef={editTextareaRef}
                onPasteFiles={(event) => handleEditorPaste(event, 'edit')}
                onEditorFocus={() => {
                    activeEditorTargetRef.current = 'edit'
                }}
                openUploadPicker={openUploadPicker}
                insertSnippet={insertSnippet}
                handleSaveMemoEdit={handleSaveMemoEdit}
                handleToggleChecklist={handleToggleChecklist}
                checklistSavingIds={checklistSavingIds}
                labels={labels}
                language={language}
                error={error}
                getMemoDisplayContent={getMemoDisplayContent}
                deleteTarget={deleteTarget}
                setDeleteTarget={setDeleteTarget}
                confirmLoading={confirmLoading}
                handleConfirmDelete={handleConfirmDelete}
                deleteResourceName={deleteTarget?.type === 'resource'
                    ? resources.find((resource) => resource.id === deleteTarget.id)?.filename ?? null
                    : null}
            />

        </div>
    )
}
