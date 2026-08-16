import { useState } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { CategoryBreadcrumbs } from '../components/Breadcrumbs'
import CatalogItemCard from '../components/CatalogItemCard'
import EmptyCatalogState from '../components/EmptyCatalogState'
import { catalogItems, categories, getCategoryById } from '../data/siteData'
import { buildSearchUrl, getFilteredItems } from '../lib/search'

const CATEGORY_PAGE_SIZE = 12

function CatalogFilterBar({ searchQuery, onSearchChange, resultCount }) {
  return (
    <div className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <label className="block w-full max-w-xl">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Поиск по категории
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Например: пресс, плотность, вискозиметр"
            className="h-14 w-full border border-[#78AEAD]/35 bg-white px-5 outline-none transition-all focus:border-[var(--accent)]"
          />
        </label>
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Найдено: <span className="text-[var(--ink)]">{resultCount}</span>
        </div>
      </div>
    </div>
  )
}

function CategoryNavigation({ currentCategoryId }) {
  return (
    <div className="flex flex-wrap gap-3 border-b border-[#78AEAD]/25 pb-6">
      {categories.map((category) => (
        <NavLink
          key={category.id}
          to={`/catalog/${category.id}`}
          className={({ isActive }) =>
            `inline-flex min-h-11 items-center border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
              isActive || currentCategoryId === category.id
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[#78AEAD]/35 bg-white text-slate-700 hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white'
            }`
          }
        >
          {category.title}
        </NavLink>
      ))}
    </div>
  )
}

export default function CategoryPage({ onOpenModal, onPreviewProduct }) {
  const { id } = useParams()
  const category = getCategoryById(id)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(CATEGORY_PAGE_SIZE)

  // Сброс поиска и пагинации при переходе в другую категорию
  const [prevId, setPrevId] = useState(id)
  if (prevId !== id) {
    setPrevId(id)
    setSearchQuery('')
    setVisibleCount(CATEGORY_PAGE_SIZE)
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setVisibleCount(CATEGORY_PAGE_SIZE)
  }

  if (!category) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">404</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--ink)]">Раздел не найден</h1>
        <Link
          to="/catalog"
          className="mt-8 inline-flex h-12 items-center justify-center bg-[var(--accent)] px-6 text-xs font-bold uppercase tracking-[0.16em] text-white"
        >
          В каталог
        </Link>
      </section>
    )
  }

  const categoryItems = catalogItems.filter((item) => item.categoryId === category.id)
  const filteredItems = getFilteredItems(catalogItems, category.id, searchQuery)
  const visibleItems = filteredItems.slice(0, visibleCount)
  const hiddenCount = filteredItems.length - visibleItems.length

  return (
    <>
      <CategoryBreadcrumbs categoryTitle={category.title} />

      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-12 md:px-12 md:py-14">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-black tracking-tight text-[var(--ink)] md:text-6xl">{category.title}</h1>
            <div className="mt-7 h-1 w-28 rounded-full bg-[var(--accent)]" />
            <p className="mt-6 text-lg leading-relaxed text-slate-600">{category.description}</p>
          </div>

          <div className="mt-10">
            <CategoryNavigation currentCategoryId={category.id} />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="order-last min-w-0 border border-[#78AEAD]/25 bg-[var(--surface-card)] p-6 lg:order-none">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                Состав раздела
              </p>
              <div className="mt-6 space-y-3">
                {category.items.map((item) => (
                  <div key={item} className="border border-[#78AEAD]/25 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </aside>

            <div className="min-w-0">
              <CatalogFilterBar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                resultCount={filteredItems.length}
              />

              {filteredItems.length > 0 ? (
                <>
                  <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleItems.map((item) => (
                      <CatalogItemCard
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
                        onClick={() => setVisibleCount((count) => count + CATEGORY_PAGE_SIZE)}
                        className="inline-flex items-center justify-center border border-[#78AEAD]/35 bg-white px-10 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
                      >
                        Показать ещё ({hiddenCount})
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-8">
                  <EmptyCatalogState
                    categoryTitle={category.title}
                    onOpenModal={categoryItems.length === 0 ? onOpenModal : undefined}
                  />
                  {categoryItems.length > 0 && searchQuery.trim().length > 0 ? (
                    <div className="mt-6 text-center">
                      <Link
                        to={buildSearchUrl(searchQuery)}
                        className="inline-flex h-12 items-center justify-center bg-[var(--accent)] px-8 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
                      >
                        Искать «{searchQuery.trim()}» по всему каталогу
                      </Link>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
