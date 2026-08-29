import { Link } from 'react-router-dom'

/**
 * Хлебные крошки для всех внутренних страниц.
 * trail: [{ title, to? }] — последний элемент всегда текущая страница.
 */
export default function Breadcrumbs({ trail }) {
  const items = [{ title: 'QAZAQTEST', to: '/' }, ...trail]

  return (
    <nav aria-label="Навигационная цепочка" className="border-b border-[#78AEAD]/25 bg-[var(--page-bg)]">
      <ol className="mx-auto flex max-w-[var(--page-shell-max)] flex-wrap items-center gap-x-2 gap-y-1 px-6 py-4 text-sm text-slate-600 md:px-12">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.title}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span className="text-[var(--muted-text)]">/</span> : null}
              {item.to && !isLast ? (
                <Link to={item.to} className="text-[var(--accent-text)] hover:underline">
                  {item.title}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{item.title}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
