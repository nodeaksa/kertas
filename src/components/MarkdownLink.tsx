'use client'

type MarkdownLinkProps = React.ComponentProps<'a'> & { node?: unknown }

export default function MarkdownLink({
    node,
    href,
    children,
    onClick,
    className,
    ...props
}: MarkdownLinkProps) {
    void node

    if (!href || !/^(https?:|mailto:)/i.test(href)) return <>{children}</>

    const opensNewTab = /^https?:/i.test(href)

    return (
        <a
            {...props}
            href={href}
            target={opensNewTab ? '_blank' : undefined}
            rel={opensNewTab ? 'noopener noreferrer' : undefined}
            className={`${className ? `${className} ` : ''}text-blue-600 underline underline-offset-2 decoration-blue-600/40 hover:decoration-blue-600 break-words [overflow-wrap:anywhere] dark:text-blue-400 dark:decoration-blue-400/40 dark:hover:decoration-blue-400`}
            onClick={(event) => {
                event.stopPropagation()
                onClick?.(event)
            }}
        >
            {children}
        </a>
    )
}
