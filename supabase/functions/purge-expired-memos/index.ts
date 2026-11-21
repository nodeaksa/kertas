import { createClient } from 'npm:@supabase/supabase-js@2'

const retentionMs = 7 * 24 * 60 * 60 * 1000
const batchSize = 100
const storageBatchSize = 100

type ExpiredMemo = {
    id: string
    user_id: string
    content: string
    deleted_at: string
}

function matchesSecret(provided: string, expected: string): boolean {
    let difference = provided.length ^ expected.length
    const length = Math.max(provided.length, expected.length)
    for (let index = 0; index < length; index++) {
        difference |= (provided.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0)
    }
    return difference === 0
}

function getResourcePaths(content: string, userId: string): string[] {
    const paths = new Set<string>()
    for (const match of content.matchAll(/resource:\/\/([^\s)]+)/g)) {
        try {
            const path = decodeURIComponent(match[1])
            if (path.startsWith(`${userId}/`)) paths.add(path)
        } catch {
            continue
        }
    }
    return Array.from(paths)
}

Deno.serve(async (request: Request) => {
    if (request.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 })
    }

    const cronSecret = Deno.env.get('PURGE_CRON_SECRET')
    if (!cronSecret) {
        return Response.json({ error: 'Purge function is not configured' }, { status: 500 })
    }
    if (!matchesSecret(request.headers.get('x-purge-cron-secret') ?? '', cronSecret)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
        return Response.json({ error: 'Purge function is not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
    const cutoff = new Date(Date.now() - retentionMs).toISOString()
    let deleted = 0
    let skipped = 0
    let failed = 0
    let processed = 0
    let cursor: ExpiredMemo | null = null

    while (true) {
        let query = supabase
            .from('memos')
            .select('id, user_id, content, deleted_at')
            .not('deleted_at', 'is', null)
            .lt('deleted_at', cutoff)
            .order('deleted_at', { ascending: true })
            .order('id', { ascending: true })
            .limit(batchSize)
        if (cursor) {
            query = query.or(
                `deleted_at.gt.${cursor.deleted_at},and(deleted_at.eq.${cursor.deleted_at},id.gt.${cursor.id})`,
            )
        }

        const { data: expiredMemos, error: fetchError } = await query
        if (fetchError) {
            failed++
            break
        }
        const page = (expiredMemos ?? []) as ExpiredMemo[]
        if (page.length === 0) break
        cursor = page[page.length - 1]
        processed += page.length

        for (const memo of page) {
            const linkedPaths = getResourcePaths(memo.content, memo.user_id)
            const { data: linkedResources, error: linkedError } = await supabase
                .from('resources')
                .select('storage_path')
                .eq('user_id', memo.user_id)
                .eq('memo_id', memo.id)
            if (linkedError) {
                failed++
                continue
            }

            const { data: referencedResources, error: referencedError } = linkedPaths.length > 0
                ? await supabase
                    .from('resources')
                    .select('storage_path')
                    .eq('user_id', memo.user_id)
                    .in('storage_path', linkedPaths)
                : { data: [], error: null }
            if (referencedError) {
                failed++
                continue
            }

            const paths = new Set(linkedPaths)
            let invalidStoragePath = false
            for (const resource of [...(linkedResources ?? []), ...(referencedResources ?? [])]) {
                if (!resource.storage_path.startsWith(`${memo.user_id}/`)) {
                    invalidStoragePath = true
                    break
                }
                paths.add(resource.storage_path)
            }
            if (invalidStoragePath) {
                failed++
                continue
            }

            const sharedPaths = new Set<string>()
            let otherMemosOffset = 0
            let otherMemosFailed = false
            while (true) {
                const { data: otherMemos, error: otherMemosError } = await supabase
                    .from('memos')
                    .select('content')
                    .eq('user_id', memo.user_id)
                    .neq('id', memo.id)
                    .order('id', { ascending: true })
                    .range(otherMemosOffset, otherMemosOffset + 499)
                if (otherMemosError) {
                    otherMemosFailed = true
                    break
                }
                const otherMemosPage = otherMemos ?? []
                if (otherMemosPage.length === 0) break
                for (const otherMemo of otherMemosPage) {
                    for (const path of getResourcePaths(otherMemo.content, memo.user_id)) {
                        sharedPaths.add(path)
                    }
                }
                otherMemosOffset += otherMemosPage.length
            }
            if (otherMemosFailed) {
                failed++
                continue
            }
            for (const path of sharedPaths) paths.delete(path)

            let storageFailed = false
            const pathList = Array.from(paths)
            for (let index = 0; index < pathList.length; index += storageBatchSize) {
                const { error } = await supabase.storage
                    .from('resources')
                    .remove(pathList.slice(index, index + storageBatchSize))
                if (error) {
                    storageFailed = true
                    break
                }
            }
            if (storageFailed) {
                failed++
                continue
            }

            const { data: didDelete, error: deleteError } = await supabase.rpc('purge_expired_memo', {
                p_memo_id: memo.id,
                p_user_id: memo.user_id,
                p_storage_paths: pathList,
            })
            if (deleteError) {
                failed++
            } else if (didDelete) {
                deleted++
            } else {
                skipped++
            }
        }
        if (page.length < batchSize) break
    }

    return Response.json({ processed, deleted, skipped, failed }, {
        status: failed > 0 ? 500 : 200,
    })
})
