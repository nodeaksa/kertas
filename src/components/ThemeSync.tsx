'use client'

import { useEffect } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

function isThemeMode(value: unknown): value is ThemeMode {
    return value === 'light' || value === 'dark' || value === 'system'
}

export default function ThemeSync() {
    useEffect(() => {
        const root = document.documentElement
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        const applyTheme = (candidate?: unknown) => {
            let theme: ThemeMode
            if (isThemeMode(candidate)) {
                theme = candidate
            } else if (isThemeMode(root.dataset.theme)) {
                theme = root.dataset.theme
            } else {
                try {
                    const savedTheme = window.localStorage.getItem('kertas-theme')
                    theme = isThemeMode(savedTheme) ? savedTheme : 'system'
                } catch {
                    theme = 'system'
                }
            }

            const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches)
            root.dataset.theme = theme
            root.classList.toggle('dark', isDark)
            root.style.colorScheme = isDark ? 'dark' : 'light'
        }

        const handleStorage = (event: StorageEvent) => {
            if (event.key === 'kertas-theme') {
                applyTheme(event.newValue)
                return
            }
            if (event.key?.startsWith('memos-settings-') && event.newValue) {
                try {
                    const settings: unknown = JSON.parse(event.newValue)
                    if (typeof settings === 'object' && settings !== null && 'theme' in settings) {
                        applyTheme(settings.theme)
                    }
                } catch {
                    // Ignore malformed preferences from another tab.
                }
            }
        }
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') applyTheme()
        }

        applyTheme()
        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', handleVisibility)
        } else {
            mediaQuery.addListener(handleVisibility)
        }
        window.addEventListener('storage', handleStorage)
        document.addEventListener('visibilitychange', handleVisibility)

        return () => {
            if (typeof mediaQuery.removeEventListener === 'function') {
                mediaQuery.removeEventListener('change', handleVisibility)
            } else {
                mediaQuery.removeListener(handleVisibility)
            }
            window.removeEventListener('storage', handleStorage)
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [])

    return null
}
