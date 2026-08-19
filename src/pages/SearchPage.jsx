import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Breadcrumbs from '../components/Breadcrumbs'
import SearchIcon from '../components/SearchIcon'
import useDocumentTitle from '../hooks/useDocumentTitle'
import {
  getBrandFacets,
  getCategoryFacets,
  searchCatalog,
  SORT_OPTIONS,
  sortItems,
} from '../lib/search'

const PAGE_SIZE = 12

function FacetButton({ isActive, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center border px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
        isActive
          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
          : 'border-[#78AEAD]/35 bg-white text-slate-700 hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

export default function SearchPage({ onOpenModal, onPreviewProduct }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const [inputValue, setInputValue] = useState(query)
  const [categoryId, setCategoryId] = useState('all')
  const [brand, setBrand] = useState('all')
  const [sort, setSort] = useState('default')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Новый запрос из адресной строки (шапка, ссылка) сбрасывает фильтры
  useDocumentTitle(query.trim() ? `Поиск: ${query.trim()}` : 'Поиск по каталогу')

  const [prevQuery, setPrevQuery] = useState(query)
  if (prevQuery !== query) {
    setPrevQuery(query)
    setInputValue(query)
    setCategoryId('all')
    setBrand('all')
    setSort('default')
    setVisibleCount(PAGE_SIZE)
  }

  const matches = searchCatalog(query)
  const categoryFacets = getCategoryFacets(matches)
  const brandFacets = getBrandFacets(matches)

  const filtered = matches.filter(
    (item) =>
      (categoryId === 'all' || item.categoryId === categoryId) &&
      (brand === 'all' || item.brand === brand),
  )
  const results = sortItems(filtered, sort)
  const visibleItems = results.slice(0, visibleCount)
  const hiddenCount = results.length - visibleItems.length

  const handleSubmit = (event) => {
    event.preventDefault()
    setSearchParams(inputValue.trim() ? { q: inputValue.trim() } : {})
  }

  const resetFilters = () => {
    setCategoryId('all')
    setBrand('all')
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <>
      <Breadcrumbs trail={[{ title: 'Поиск' }]} />

      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-12 md:px-12 md:py-14">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-black tracking-tight text-[var(--ink)] md:text-6xl">Поиск</h1>
            <div className="mt-7 h-1 w-28 rounded-full bg-[var(--accent)]" />
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Ищем по названиям, моделям, брендам, характеристикам и описаниям всех позиций каталога.
            </p>
          </div>

          <form onSubmit={handleSubmit} role="search" className="mt-10 flex max-w-3xl gap-3">
            <label htmlFor="search-page-input" className="sr-only">
              Поисковый запрос
            </label>
            <input
              id="search-page-input"
              type="search"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Например: пресс, дуктилометр, сушильный шкаф"
              autoComplete="off"
              className="h-14 w-full border border-[#78AEAD]/35 bg-white px-5 outline-none transition-colors focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="inline-flex h-14 shrink-0 items-center justify-center gap-2 bg-[var(--accent)] px-6 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
            >
              <SearchIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Найти</span>
            </button>
          </form>

          {query.trim().length === 0 ? (
            <div className="mt-12 border border-dashed border-[#78AEAD]/35 bg-white px-6 py-14 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                Введите запрос
              </p>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-[var(--ink)] md:text-3xl">
                Начните с названия прибора или задачи
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
                Или откройте{' '}
                <Link to="/catalog" className="font-semibold text-[var(--accent)] hover:underline">
                  каталог по категориям
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <div className="mt-10 border border-[#78AEAD]/25 bg-[var(--surface-card)] p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  По запросу «{query}» найдено:{' '}
                  <span className="text-[var(--ink)]">{results.length}</span>
                  {results.length !== matches.length ? (
                    <span className="text-slate-400"> из {matches.length}</span>
                  ) : null}
                </p>

                {matches.length > 0 ? (
                  <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                        Категория
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <FacetButton
                          isActive={categoryId === 'all'}
                          onClick={() => {
                            setCategoryId('all')
                            setVisibleCount(PAGE_SIZE)
                          }}
                        >
                          Все ({matches.length})
                        </FacetButton>
                        {categoryFacets.map((facet) => (
                          <FacetButton
                            key={facet.id}
                            isActive={categoryId === facet.id}
                            onClick={() => {
                              setCategoryId(facet.id)
                              setVisibleCount(PAGE_SIZE)
                            }}
                          >
                            {facet.title} ({facet.count})
                          </FacetButton>
                        ))}
                      </div>
                    </div>

                    {brandFacets.length > 0 ? (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                          Бренд
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <FacetButton
                            isActive={brand === 'all'}
                            onClick={() => {
                              setBrand('all')
                              setVisibleCount(PAGE_SIZE)
                            }}
                          >
                            Все
                          </FacetButton>
                          {brandFacets.map((facet) => (
                            <FacetButton
                              key={facet.name}
                              isActive={brand === facet.name}
                              onClick={() => {
                                setBrand(facet.name)
                                setVisibleCount(PAGE_SIZE)
                              }}
                            >
                              {facet.name} ({facet.count})
                            </FacetButton>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <label
                        htmlFor="search-sort"
                        className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]"
                      >
                        Сортировка
                      </label>
                      <select
                        id="search-sort"
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                        className="mt-3 h-11 w-full border border-[#78AEAD]/35 bg-white px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                      >
                        {SORT_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}
              </div>

              {results.length > 0 ? (
                <>
                  <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visibleItems.map((item) => (
                      <ProductCard
                        key={item.id}
                        item={item}
                        onOpenModal={onOpenModal}
                        onPreview={onPreviewProduct}
                      />
                    ))}
                  </div>
                  {hiddenCount > 0 ? (
                    <div className="mt-10 text-center">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                        className="inline-flex items-center justify-center border border-[#78AEAD]/35 bg-white px-10 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
                      >
                        Показать ещё ({hiddenCount})
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-10 border border-dashed border-[#78AEAD]/35 bg-white px-6 py-14 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                    Ничего не найдено
                  </p>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-[var(--ink)] md:text-3xl">
                    По запросу «{query}» совпадений нет
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
                    {matches.length > 0
                      ? 'Попробуйте снять фильтры по категории и бренду.'
                      : 'Проверьте написание, попробуйте более общее слово или оставьте заявку — подберём оборудование под задачу.'}
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {matches.length > 0 ? (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex h-12 items-center justify-center border border-[#78AEAD]/35 px-8 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
                      >
                        Сбросить фильтры
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onOpenModal(`Поиск: ${query}`)}
                      className="inline-flex h-12 items-center justify-center bg-[var(--accent)] px-8 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
                    >
                      Запросить подбор
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
