import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatPrice, getCategoryById } from '../data/siteData'
import { buildSearchUrl, searchCatalog } from '../lib/search'
import ProductImage from './ProductImage'
import SearchIcon from './SearchIcon'

const SUGGESTION_LIMIT = 6

/**
 * Панель поиска под шапкой: живые подсказки по всему каталогу.
 * Enter (или «Показать все») уводит на /search, клик по подсказке —
 * сразу на страницу товара.
 */
export default function HeaderSearch({ onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const suggestions = query.trim().length >= 2 ? searchCatalog(query, { limit: SUGGESTION_LIMIT }) : []
  const totalCount = query.trim().length >= 2 ? searchCatalog(query).length : 0

  const goToResults = () => {
    if (query.trim().length === 0) {
      return
    }
    navigate(buildSearchUrl(query))
    onClose()
  }


  const handleSubmit = (event) => {
    event.preventDefault()
    const active = suggestions[activeIndex]
    if (active) {
      navigate(`/catalog/${active.categoryId}/${active.slug}`)
      onClose()
      return
    }
    goToResults()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (suggestions.length === 0 ? -1 : (index + 1) % suggestions.length))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) =>
        suggestions.length === 0 ? -1 : (index - 1 + suggestions.length) % suggestions.length,
      )
    }
  }

  return (
    <div className="absolute left-0 right-0 top-full z-40 border-t border-white/10 bg-[var(--panel)] shadow-[0_30px_60px_rgba(15,23,42,0.45)]">
      <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-6 md:px-12">
        <form onSubmit={handleSubmit} role="search">
          <label htmlFor="site-search" className="sr-only">
            Поиск по каталогу
          </label>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              id="site-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(-1)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Поиск по каталогу: пресс, дуктилометр, HYJB-30…"
              autoComplete="off"
              className="h-14 w-full border border-white/20 bg-white/10 px-5 text-white outline-none transition-colors placeholder:text-white/50 focus:border-[var(--accent)] focus:bg-white/15"
            />
            <button
              type="submit"
              className="inline-flex h-14 shrink-0 items-center justify-center gap-2 bg-[var(--accent)] px-6 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
            >
              <SearchIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Найти</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть поиск"
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center border border-white/20 text-xl text-white/70 transition-colors hover:border-white/50 hover:text-white"
            >
              ×
            </button>
          </div>
        </form>

        {query.trim().length >= 2 ? (
          <div className="mt-4">
            {suggestions.length > 0 ? (
              <>
                <ul className="divide-y divide-[#78AEAD]/20 border border-white/10 bg-white">
                  {suggestions.map((item, index) => (
                    <li key={item.id}>
                      <Link
                        to={`/catalog/${item.categoryId}/${item.slug}`}
                        onClick={onClose}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors ${
                          index === activeIndex ? 'bg-[var(--mint)]' : 'hover:bg-[var(--mint)]'
                        }`}
                      >
                        <span className="relative block h-14 w-14 shrink-0 overflow-hidden border border-[#78AEAD]/25 bg-white">
                          <ProductImage item={item} compact />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold leading-snug text-[var(--ink)]">
                            {item.title}
                          </span>
                          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                            {item.group ?? getCategoryById(item.categoryId)?.title}
                          </span>
                        </span>
                        {item.priceRub ? (
                          <span className="hidden shrink-0 text-sm font-bold text-[var(--ink)] sm:block">
                            {formatPrice(item.priceRub)}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={goToResults}
                  className="mt-3 inline-flex h-11 items-center justify-center border border-white/20 px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:border-white/50"
                >
                  Показать все результаты ({totalCount})
                </button>
              </>
            ) : (
              <p className="border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                Ничего не найдено. Попробуйте другое слово или{' '}
                <button
                  type="button"
                  onClick={goToResults}
                  className="font-semibold text-[var(--accent-bright)] underline"
                >
                  откройте страницу поиска
                </button>
                .
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
