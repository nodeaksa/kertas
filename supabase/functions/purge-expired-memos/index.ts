Deno.serve(() => {
    return Response.json(
        { error: 'Automatic Trash purging has been disabled. Manage Trash manually in the app.' },
        { status: 410 },
    )
})
