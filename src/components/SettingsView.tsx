'use client'

import type { Dispatch, FormEvent, RefObject, SetStateAction } from 'react'
import { Download, LogOut, Palette, Upload, User } from 'lucide-react'
import type { AppLabels, FontSize, Language, Theme } from '@/types/kertas'

type SettingsViewProps = {
    labels: AppLabels
    profileUsername: string
    setProfileUsername: Dispatch<SetStateAction<string>>
    handleSaveProfile: (event: FormEvent) => void
    language: Language
    setLanguage: Dispatch<SetStateAction<Language>>
    theme: Theme
    handleThemeChange: (theme: Theme) => Promise<void>
    fontSize: FontSize
    setFontSize: Dispatch<SetStateAction<FontSize>>
    handleExportMemos: () => void
    importInputRef: RefObject<HTMLInputElement | null>
    password: string
    setPassword: Dispatch<SetStateAction<string>>
    handleChangePassword: (event: FormEvent) => void
    handleLogout: () => Promise<void>
}

export default function SettingsView({
    labels,
    profileUsername,
    setProfileUsername,
    handleSaveProfile,
    language,
    setLanguage,
    theme,
    handleThemeChange,
    fontSize,
    setFontSize,
    handleExportMemos,
    importInputRef,
    password,
    setPassword,
    handleChangePassword,
    handleLogout,
}: SettingsViewProps) {
    return (
        <section className="space-y-4 sm:space-y-5">
            <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-zinc-100">{labels.settings}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{labels.settingsDescription}</p>
            </div>
            <form onSubmit={handleSaveProfile} className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 space-y-4 dark:bg-[#18181b] dark:border-zinc-800">
                <h2 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-zinc-100"><User className="h-4 w-4" />{labels.profile}</h2>
                <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400">
                    {labels.username}
                    <input
                        value={profileUsername}
                        onChange={(event) => setProfileUsername(event.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-600"
                        required
                    />
                </label>
                <button type="submit" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500">{labels.saveProfile}</button>
            </form>

            <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 space-y-4 dark:bg-[#18181b] dark:border-zinc-800">
                <h2 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-zinc-100"><Palette className="h-4 w-4" />{labels.general}</h2>
                <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400">
                    {labels.language}
                    <select value={language} onChange={(event) => setLanguage(event.target.value as Language)} className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                    </select>
                </label>
                <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400">
                    {labels.theme}
                    <select value={theme} onChange={(event) => void handleThemeChange(event.target.value as Theme)} className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                    </select>
                </label>
                <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400">
                    {labels.fontSize}
                    <select value={fontSize} onChange={(event) => setFontSize(event.target.value as FontSize)} className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                        <option value="small">{labels.small}</option>
                        <option value="medium">{labels.medium}</option>
                        <option value="large">{labels.large}</option>
                    </select>
                </label>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 space-y-3 dark:bg-[#18181b] dark:border-zinc-800">
                <h2 className="font-semibold text-gray-800 dark:text-zinc-100">{labels.data}</h2>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{labels.dataDescription}</p>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleExportMemos} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                        <Download className="h-4 w-4" />{labels.export}
                    </button>
                    <button type="button" onClick={() => importInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                        <Upload className="h-4 w-4" />{labels.import}
                    </button>
                </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 space-y-4 dark:bg-[#18181b] dark:border-zinc-800">
                <h2 className="font-semibold text-gray-800 dark:text-zinc-100">{labels.account}</h2>
                <form onSubmit={handleChangePassword} className="space-y-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400">
                        {labels.newPassword}
                        <input
                            type="password"
                            minLength={6}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                            required
                        />
                    </label>
                    <button type="submit" className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">{labels.changePassword}</button>
                </form>
                <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50">
                    <LogOut className="h-4 w-4" />{labels.logout}
                </button>
            </section>
        </section>
    )
}
