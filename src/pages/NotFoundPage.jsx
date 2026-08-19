import { Link } from 'react-router-dom'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Страница не найдена')

  return (
    <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">404</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--ink)]">Страница не найдена</h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600">
        Проверьте адрес или начните с каталога — там собраны все направления оборудования.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/catalog"
          className="inline-flex h-12 items-center justify-center bg-[var(--accent)] px-8 text-xs font-bold uppercase tracking-[0.16em] text-white"
        >
          В каталог
        </Link>
        <Link
          to="/contact"
          className="inline-flex h-12 items-center justify-center border border-[#78AEAD]/35 px-8 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
        >
          Связаться с нами
        </Link>
      </div>
    </section>
  )
}
