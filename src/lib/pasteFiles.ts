export function renamePastedFile(file: File, index = 0): File {
    if (file.name && !/^image\.\w+$/i.test(file.name)) return file
    const extension = file.type.split('/')[1]?.split('+')[0] || 'bin'
    const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
    const suffix = index > 0 ? `-${index + 1}` : ''
    return new File([file], `pasted-${stamp}${suffix}.${extension}`, { type: file.type })
}

export function isTextEntryTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement
        && Boolean(target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'))
}
