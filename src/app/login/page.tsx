'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
    const supabase = createClient()
    const router = useRouter()

    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Jika sudah login, redirect langsung ke homepage
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                router.push('/')
            }
        }
        checkUser()
    }, [])

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage(null)
        setSuccessMessage(null)
        setLoading(true)

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username || email.split('@')[0],
                        },
                    },
                })

                if (error) {
                    setErrorMessage(error.message)
                } else if (data.session) {
                    // Berhasil daftar dan langsung punya sesi
                    router.push('/')
                } else {
                    setSuccessMessage('Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi akun atau coba login.')
                    setIsSignUp(false)
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })

                if (error) {
                    setErrorMessage(error.message)
                } else {
                    router.push('/')
                    router.refresh()
                }
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
            } else {
                setErrorMessage('Terjadi kesalahan yang tidak terduga.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#0f0f10] text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 space-y-6">
                {/* Header Logo */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl shadow-xs mb-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo-kertas.png" alt="kertas." className="w-12 h-12 rounded-xl object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">kertas.</h1>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {isSignUp
                            ? 'Buat akun baru untuk mulai mencatat ide dan kertas harian Anda'
                            : 'Masuk ke akun Anda untuk mengakses catatan pribadi'}
                    </p>
                </div>

                {/* Notifikasi Error / Sukses */}
                {errorMessage && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                    </div>
                )}
                {successMessage && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Form Input */}
                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                Username
                            </label>
                            <div className="relative">
                                <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3" />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="nama_pengguna"
                                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 focus:bg-white dark:focus:bg-zinc-900 transition"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 focus:bg-white dark:focus:bg-zinc-900 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3" />
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimal 6 karakter"
                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 focus:bg-white dark:focus:bg-zinc-900 transition"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium text-sm rounded-xl transition shadow-sm disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:cursor-not-allowed"
                    >
                        {loading
                            ? 'Memproses...'
                            : isSignUp
                            ? 'Daftar Akun'
                            : 'Masuk'}
                    </button>
                </form>

                {/* Switcher Masuk / Daftar */}
                <div className="text-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {isSignUp ? 'Sudah memiliki akun?' : 'Belum memiliki akun?'}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp)
                                setErrorMessage(null)
                                setSuccessMessage(null)
                            }}
                            className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
                        >
                            {isSignUp ? 'Masuk di sini' : 'Daftar sekarang'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
