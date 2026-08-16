import { Link } from 'react-router-dom'

function BreadcrumbsShell({ children }) {
  return (
    <div className="border-b border-[#78AEAD]/25 bg-[var(--page-bg)]">
      <nav
        aria-label="Хлебные крошки"
        className="mx-auto max-w-[var(--page-shell-max)] px-6 py-4 text-sm text-slate-600 md:px-12"
      >
        <Link to="/" className="text-[var(--accent)] hover:underline">
          QAZAQTEST
        </Link>{' '}
        {children}
      </nav>
    </div>
  )
}

/** Главная / Каталог / <категория> */
export function CategoryBreadcrumbs({ categoryTitle }) {
  return (
    <BreadcrumbsShell>
      <span className="text-slate-400">/</span>{' '}
      <Link to="/catalog" className="text-[var(--accent)] hover:underline">
        Каталог
      </Link>{' '}
      <span className="text-slate-400">/</span> <span>{categoryTitle}</span>
    </BreadcrumbsShell>
  )
}

/** Главная / <раздел> */
export function StaticPageBreadcrumbs({ currentTitle }) {
  return (
    <BreadcrumbsShell>
      <span className="text-slate-400">/</span> <span>{currentTitle}</span>
    </BreadcrumbsShell>
  )
}
