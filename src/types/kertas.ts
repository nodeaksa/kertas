export type ActiveTab = 'memos' | 'tags' | 'resources' | 'daily' | 'archived' | 'trash' | 'settings'
export type Theme = 'light' | 'dark' | 'system'
export type FontSize = 'small' | 'medium' | 'large'
export type Language = 'id' | 'en'
export type UploadPurpose = 'memo' | 'edit' | 'library'
export type MemoAction = 'archive' | 'restore' | 'delete'

export type Memo = {
    id: string
    content: string
    tags: string[]
    created_at: string
    updated_at?: string | null
    archived: boolean
    deleted_at?: string | null
}

export type TagCount = {
    tag: string
    total: number
}

export type Resource = {
    id: string
    filename: string
    storage_path: string
    mime_type: string | null
    size_bytes: number | null
    created_at: string
    signedUrl: string
}

export type DailyCount = {
    day: string
    total: number
}

export type CalendarDay = {
    dateStr: string
    dayNum: number
    currentMonth: boolean
}

export type DeleteTarget =
    | { id: string; type: 'memo' }
    | { id: string; type: 'resource'; filePath?: string }
    | { type: 'emptyTrash' }
    | { type: 'moveToTrash'; memo: Memo }

export type Profile = {
    id: string
    username: string
    theme: Theme | null
}

export type MemoFilter = {
    tag: string | null
    query: string
    date: string | null
    archived: boolean
}

export type SettingsOptions = {
    language: Language
    theme: Theme
    fontSize: FontSize
}

export type AppLabels = {
    memos: string
    tags: string
    resources: string
    daily: string
    archived: string
    trash: string
    settings: string
    search: string
    showMore: string
    showLess: string
    loadMore: string
    loadingMore: string
    loadingMemos: string
    empty: string
    restore: string
    delete: string
    moveToTrash: string
    emptyTrash: string
    trashDescription: string
    noTrash: string
    settingsDescription: string
    profile: string
    username: string
    saveProfile: string
    general: string
    language: string
    theme: string
    fontSize: string
    small: string
    medium: string
    large: string
    data: string
    dataDescription: string
    export: string
    import: string
    account: string
    newPassword: string
    changePassword: string
    logout: string
    noTags: string
    tagCount: string
    resourceDescription: string
    upload: string
    loadingResources: string
    noResources: string
    dailyDescription: string
    randomMemo: string
    reviewMemo: string
    close: string
    filterActive: string
    reset: string
    saving: string
    saveMemo: string
    archivedDescription: string
    noArchived: string
    noTagsSidebar: string
    active: string
    edit: string
    save: string
    cancel: string
    createdAt: string
    updatedAt: string
    notUpdated: string
    toggleTheme: string
    newMemo: string
    write: string
    preview: string
}
