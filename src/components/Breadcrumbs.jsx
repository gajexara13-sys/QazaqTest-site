import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SITE_ORIGIN } from '../constants'

/**
 * Разметка BreadcrumbList поверх той же цепочки, что показана на экране —
 * второй источник для тех же данных заводить незачем, а несовпадение с
 * видимыми крошками поисковик расценивает как маскировку контента.
 */
function useBreadcrumbSchema(items) {
  const { pathname } = useLocation()

  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        item: `${SITE_ORIGIN}${item.to ?? pathname}`,
      })),
    }

    const node = document.createElement('script')
    node.type = 'application/ld+json'
    node.text = JSON.stringify(schema)
    document.head.appendChild(node)

    return () => node.remove()
  }, [items, pathname])
}

/**
 * Хлебные крошки для всех внутренних страниц.
 * trail: [{ title, to? }] — последний элемент всегда текущая страница.
 */
export default function Breadcrumbs({ trail }) {
  const items = [{ title: 'QAZAQTEST', to: '/' }, ...trail]
  useBreadcrumbSchema(items)

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
