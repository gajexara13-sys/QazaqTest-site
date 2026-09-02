import { useState } from 'react'
import { Link, NavLink, useParams, useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductCard from '../components/ProductCard'
import usePageMeta from '../hooks/usePageMeta'
import {
  categories,
  categoryCounts,
  getCategoryById,
  getCategoryGroups,
  getCategoryItems,
  catalogItems,
} from '../data/siteData'
import { buildSearchUrl, getFilteredItems, SORT_OPTIONS, sortItems } from '../lib/search'

const CATEGORY_PAGE_SIZE = 12

function CatalogFilterBar({ searchQuery, onSearchChange, sortId, onSortChange, resultCount }) {
  return (
    <div className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <label className="block w-full max-w-md">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
            Поиск по разделу
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Название, модель или характеристика"
            className="h-14 w-full border border-[#78AEAD]/35 bg-white px-5 outline-none transition-all focus:border-[var(--accent)]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
            Сортировка
          </span>
          <select
            value={sortId}
            onChange={(event) => onSortChange(event.target.value)}
            className="h-14 w-full border border-[#78AEAD]/35 bg-white px-4 pr-8 text-sm font-medium text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)] lg:w-56"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted-text)] lg:pb-5">
          Найдено: <span className="text-[var(--ink)]">{resultCount}</span>
        </div>
      </div>
    </div>
  )
}

function GroupFilter({ groups, activeGroup, onChange, totalCount, fallbackItems }) {
  const hasGroups = groups.length >= 2

  return (
    <aside className="min-w-0 border border-[#78AEAD]/25 bg-[var(--surface-card)] p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">
        {hasGroups ? 'Подразделы' : 'Состав раздела'}
      </p>

      {hasGroups ? (
        <div className="mt-6 space-y-2">
          {[{ title: 'all', label: 'Все позиции', count: totalCount }, ...groups.map((group) => ({
            title: group.title,
            label: group.title,
            count: group.count,
          }))].map((option) => {
            const isActive = activeGroup === option.title

            return (
              <button
                key={option.title}
                type="button"
                onClick={() => onChange(option.title)}
                aria-pressed={isActive}
                className={`flex w-full min-h-11 items-center justify-between gap-3 border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                    : 'border-[#78AEAD]/25 bg-white text-slate-700 hover:border-[var(--ink)]'
                }`}
              >
                <span className="min-w-0">{option.label}</span>
                <span className={`shrink-0 text-xs ${isActive ? 'text-white/60' : 'text-[var(--muted-text)]'}`}>
                  {option.count}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {fallbackItems.map((item) => (
            <div
              key={item}
              className="border border-[#78AEAD]/25 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

function CategoryNavigation({ currentCategoryId }) {
  return (
    <nav aria-label="Разделы каталога" className="flex flex-wrap gap-3 border-b border-[#78AEAD]/25 pb-6">
      {categories.map((category) => {
        const count = categoryCounts[category.id] ?? 0

        return (
          <NavLink
            key={category.id}
            to={`/catalog/${category.id}`}
            className={({ isActive }) =>
              `inline-flex min-h-11 items-center gap-2 border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                isActive || currentCategoryId === category.id
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[#78AEAD]/35 bg-white text-slate-700 hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white'
              }`
            }
          >
            {category.title}
            {/* Раздел без позиций честно показываем как «под заказ», а не пустым.
                Счётчик без opacity: полупрозрачность поверх заливки давала 2,12:1. */}
            <span className="text-[10px] font-semibold">{count > 0 ? count : '—'}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

function EmptyCatalogState({ categoryTitle, onOpenModal }) {
  if (onOpenModal) {
    return (
      <div className="border border-dashed border-[#78AEAD]/35 bg-white px-6 py-14 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">
          Раздел наполняется
        </p>
        <h3 className="mt-4 text-2xl font-bold tracking-tight text-[var(--ink)] md:text-3xl">
          Позиции этого раздела скоро появятся на сайте
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
          Оборудование по направлению «{categoryTitle}» мы уже поставляем — оставьте заявку, и
          инженер подберёт комплектацию под вашу задачу.
        </p>
        <button
          type="button"
          onClick={() => onOpenModal(categoryTitle)}
          className="mt-8 inline-flex h-12 items-center justify-center bg-[var(--accent)] px-8 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
        >
          Запросить подбор
        </button>
      </div>
    )
  }

  return (
    <div className="border border-dashed border-[#78AEAD]/35 bg-white px-6 py-14 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">Ничего не найдено</p>
      <h3 className="mt-4 text-2xl font-bold tracking-tight text-[var(--ink)] md:text-3xl">
        Фильтр ничего не нашёл
      </h3>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
        Попробуйте другой запрос или откройте соседнюю категорию из панели выше.
      </p>
    </div>
  )
}

export default function CategoryPage({ onOpenModal, onPreviewProduct }) {
  const { id } = useParams()
  const category = getCategoryById(id)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  // Подраздел читается из ?group= — на эту ссылку ведёт мегаменю в шапке,
  // и по ней же подраздел можно переслать или открыть заново.
  const [activeGroup, setActiveGroup] = useState(() => searchParams.get('group') ?? 'all')
  const [sortId, setSortId] = useState('default')
  const [visibleCount, setVisibleCount] = useState(CATEGORY_PAGE_SIZE)

  // Сброс поиска, фильтров и пагинации при переходе в другую категорию
  const [prevId, setPrevId] = useState(id)
  if (prevId !== id) {
    setPrevId(id)
    setSearchQuery('')
    setActiveGroup(searchParams.get('group') ?? 'all')
    setSortId('default')
    setVisibleCount(CATEGORY_PAGE_SIZE)
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setVisibleCount(CATEGORY_PAGE_SIZE)
  }

  const handleGroupChange = (group) => {
    setActiveGroup(group)
    setVisibleCount(CATEGORY_PAGE_SIZE)
    setSearchParams(
      (params) => {
        if (group === 'all') {
          params.delete('group')
        } else {
          params.set('group', group)
        }
        return params
      },
      { replace: true },
    )
  }

  usePageMeta(category?.title, category?.description)

  if (!category) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">404</p>
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

  const categoryItems = getCategoryItems(category.id)
  const groups = getCategoryGroups(category.id)
  const filteredItems = sortItems(
    getFilteredItems(catalogItems, category.id, searchQuery, activeGroup),
    sortId,
  )
  const visibleItems = filteredItems.slice(0, visibleCount)
  const hiddenCount = filteredItems.length - visibleItems.length

  return (
    <>
      <Breadcrumbs trail={[{ title: 'Каталог', to: '/catalog' }, { title: category.title }]} />

      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-12 md:px-12 md:py-14">
          <div className="max-w-4xl">
            <h1 className="hyphens-auto break-words text-3xl font-black tracking-tight text-[var(--ink)] sm:text-4xl md:text-6xl">
              {category.title}
            </h1>
            <div className="mt-7 h-1 w-28 rounded-full bg-[var(--accent)]" />
            <p className="mt-6 text-lg leading-relaxed text-slate-600">{category.description}</p>
          </div>

          <div className="mt-10">
            <CategoryNavigation currentCategoryId={category.id} />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
            <GroupFilter
              groups={groups}
              activeGroup={activeGroup}
              onChange={handleGroupChange}
              totalCount={categoryItems.length}
              fallbackItems={category.items}
            />

            <div className="min-w-0">
              <CatalogFilterBar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                sortId={sortId}
                onSortChange={setSortId}
                resultCount={filteredItems.length}
              />

              {filteredItems.length > 0 ? (
                <>
                  {/* Карточка в сетке — это h3, поэтому секции результатов нужен
                      свой h2: иначе уровни идут H1 → H3 с пропуском. */}
                  <h2 className="sr-only">Позиции раздела «{category.title}»</h2>
                  <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
                        onClick={() => setVisibleCount((count) => count + CATEGORY_PAGE_SIZE)}
                        className="inline-flex h-13 items-center justify-center border border-[#78AEAD]/35 bg-white px-10 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
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
                  {/* Фильтр раздела пуст, но позиция может найтись в соседнем */}
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
