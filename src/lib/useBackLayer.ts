'use client'

import { useEffect, useRef } from 'react'

type BackLayer = {
    active: boolean
    onClose: () => void
}

const backLayers: BackLayer[] = []
let ignoredPops = 0
let popstateListenerInstalled = false
let removalTimeout: number | undefined

function updatePopstateListener() {
    const shouldListen = backLayers.length > 0 || ignoredPops > 0
    if (shouldListen === popstateListenerInstalled) return

    if (shouldListen) {
        window.addEventListener('popstate', handlePopState)
    } else {
        window.removeEventListener('popstate', handlePopState)
    }
    popstateListenerInstalled = shouldListen
}

function flushInactiveLayers() {
    while (backLayers.length > 0 && !backLayers[backLayers.length - 1].active) {
        backLayers.pop()
        ignoredPops += 1
        window.history.back()
    }
    updatePopstateListener()
}

function handlePopState() {
    if (ignoredPops > 0) {
        ignoredPops -= 1
        flushInactiveLayers()
        return
    }

    const layer = backLayers.pop()
    if (layer?.active) {
        layer.active = false
        layer.onClose()
    }
    flushInactiveLayers()
    updatePopstateListener()
}

function registerLayer(layer: BackLayer) {
    window.history.pushState({ kertasLayer: true }, '')
    backLayers.push(layer)
    updatePopstateListener()
}

function unregisterLayer(layer: BackLayer) {
    layer.active = false
    if (removalTimeout !== undefined) window.clearTimeout(removalTimeout)
    removalTimeout = window.setTimeout(() => {
        removalTimeout = undefined
        flushInactiveLayers()
    }, 0)
}

export default function useBackLayer(active: boolean, onClose: () => void) {
    const onCloseRef = useRef(onClose)

    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    useEffect(() => {
        if (!active) return

        const layer: BackLayer = {
            active: true,
            onClose: () => onCloseRef.current(),
        }
        const timeoutId = window.setTimeout(() => registerLayer(layer), 0)

        return () => {
            window.clearTimeout(timeoutId)
            if (backLayers.includes(layer)) unregisterLayer(layer)
        }
    }, [active])
}
