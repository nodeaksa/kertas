export function replaceChecklistItem(
    content: string,
    lineNumber: number,
    checked: boolean,
): string | null {
    const lines = content.split('\n')
    const lineIndex = lineNumber - 1
    const line = lines[lineIndex]
    if (line === undefined) return null

    const taskMatch = line.match(/^(\s*(?:>\s*)*(?:[-*+]|\d+[.)])\s+\[)[ xX](\])/)
    if (!taskMatch) return null

    lines[lineIndex] = line.replace(taskMatch[0], `${taskMatch[1]}${checked ? 'x' : ' '}${taskMatch[2]}`)
    return lines.join('\n')
}

export function replaceResourceReferences(
    content: string,
    getUrl: (path: string) => string | undefined,
): string {
    return content.replace(/resource:\/\/([^\s)]+)/g, (reference, encodedPath: string) => {
        try {
            const url = getUrl(decodeURIComponent(encodedPath))
            return url ?? reference
        } catch {
            return reference
        }
    })
}
