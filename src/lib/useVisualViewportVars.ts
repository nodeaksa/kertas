'use client'

import { useEffect } from 'react'

export default function useVisualViewportVars(active: boolean) {
    useEffect(() => {
        if (!active) return

        const viewport = window.visualViewport
        const root = document.documentElement
        const updateViewportVars = () => {
            root.style.setProperty('--vvh', `${viewport?.height ?? window.innerHeight}px`)
            root.style.setProperty('--vvt', `${viewport?.offsetTop ?? 0}px`)
        }

        updateViewportVars()
        viewport?.addEventListener('resize', updateViewportVars)
        viewport?.addEventListener('scroll', updateViewportVars)

        return () => {
            viewport?.removeEventListener('resize', updateViewportVars)
            viewport?.removeEventListener('scroll', updateViewportVars)
            root.style.removeProperty('--vvh')
            root.style.removeProperty('--vvt')
        }
    }, [active])
}
