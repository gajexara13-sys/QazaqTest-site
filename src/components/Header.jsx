import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CONTACT_PHONE_HREF, CONTACT_PHONE_LABEL, NAV_LINKS } from '../constants'
import { categories, categoryCounts, getCategoryById, getCategoryGroups } from '../data/categoryMeta'
import { useEscToClose } from '../lib/hooks'
import SearchIcon from './SearchIcon'

// Живой поиск тянет за собой каталог целиком (catalogItems из siteData.js —
// 422 КБ описаний всех 135 позиций), а нужен только тем, кто открыл поле
// поиска. Ленивая загрузка не даёт этому весу попасть в общий чанк, который
// подгружает вообще каждый посетитель, включая тех, кто поиском ни разу не
// воспользуется.
const HeaderSearch = lazy(() => import('./HeaderSearch'))

// Сколько реальных подразделов показать в превью мегаменю: раздел «Общая
// лаборатория» держит 11 подразделов сразу, и все сразу в узкую колонку не
// поместятся — здесь только самые крупные, полный список даёт сама страница
// раздела.
const MEGA_MENU_GROUP_LIMIT = 6

function UtilityBar() {
  return (
    <div className="bg-[var(--ink)] text-white">
      <div className="mx-auto flex max-w-[var(--page-shell-max)] items-center justify-between gap-4 px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] md:px-12">
        <div className="flex items-center gap-3 text-white/90">
          <span>RU</span>
        </div>
        <a href={CONTACT_PHONE_HREF} className="inline-flex text-white/75 transition-colors hover:text-white">
          {CONTACT_PHONE_LABEL}
        </a>
      </div>
    </div>
  )
}

function MegaMenu({ onClose, onMouseEnter, onMouseLeave }) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? null)
  const activeCategory = getCategoryById(activeCategoryId) ?? categories[0]

  // Раздел без позиций показывает задуманное наполнение как есть, обычным
  // текстом на странице раздела — здесь то же самое, ссылка ведёт на форму
  // подбора. Раздел с товарами — настоящие подразделы из каталога, а не
  // придуманные заранее названия: та выгрузка из WooCommerce, на которой
  // построен сайт, разложилась на другие подразделы, и старый список во
  // многом не совпадает с тем, что реально есть в продаже.
  const hasProducts = (categoryCounts[activeCategory.id] ?? 0) > 0
  const realGroups = hasProducts ? getCategoryGroups(activeCategory.id) : []
  const shownGroups = realGroups.slice(0, MEGA_MENU_GROUP_LIMIT)

  return (
    <div
      className="mega-menu-shell absolute left-1/2 top-full z-40 mt-0 w-[min(1020px,calc(100vw-3rem))] -translate-x-1/2 overflow-hidden bg-[rgba(226,232,240,0.62)] text-slate-800 shadow-[0_40px_100px_rgba(15,23,42,0.42)]"
      style={{
        backdropFilter: 'blur(48px) saturate(150%)',
        WebkitBackdropFilter: 'blur(48px) saturate(150%)',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[rgba(255,255,255,0.2)]"
        style={{
          backdropFilter: 'blur(72px) saturate(140%)',
          WebkitBackdropFilter: 'blur(72px) saturate(140%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.52),rgba(255,255,255,0.28)_38%,rgba(148,163,184,0.2)_100%)]" />
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="bg-[rgba(241,245,249,0.72)]">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/catalog/${category.id}`}
              onClick={onClose}
              onMouseEnter={() => setActiveCategoryId(category.id)}
              onFocus={() => setActiveCategoryId(category.id)}
              className={`block px-5 py-3 text-[15px] font-medium transition-colors ${
                activeCategoryId === category.id
                  ? 'bg-white/88 text-[var(--ink)]'
                  : 'text-slate-700 hover:bg-white/80 hover:text-[var(--ink)]'
              }`}
            >
              {category.title}
            </Link>
          ))}
        </div>

        <div className="grid gap-6 bg-[rgba(248,250,252,0.58)] px-6 py-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div>
            <p className="text-[15px] font-bold uppercase tracking-tight text-slate-700">
              {activeCategory.title}
            </p>
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-slate-700">
              {activeCategory.description}
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {hasProducts
                ? shownGroups.map((group) => (
                    <Link
                      key={group.title}
                      to={`/catalog/${activeCategory.id}?group=${encodeURIComponent(group.title)}`}
                      onClick={onClose}
                      className="flex items-center justify-between gap-2 rounded bg-white/76 px-3 py-2 text-[13px] leading-snug text-slate-800 transition-colors hover:bg-white/90 hover:text-[var(--ink)]"
                    >
                      <span className="min-w-0">{group.title}</span>
                      <span className="shrink-0 text-xs text-slate-500">{group.count}</span>
                    </Link>
                  ))
                : activeCategory.items.map((item) => (
                    <Link
                      key={item}
                      to={`/catalog/${activeCategory.id}`}
                      onClick={onClose}
                      className="rounded bg-white/76 px-3 py-2 text-[13px] leading-snug text-slate-800 transition-colors hover:bg-white/90 hover:text-[var(--ink)]"
                    >
                      {item}
                    </Link>
                  ))}
            </div>
          </div>

          <div className="pl-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">
              Превью категории
            </p>
            <div className="mt-4 min-h-[130px] rounded" style={{ background: activeCategory.image }} />
            <div className="mt-4 text-[13px] font-medium text-slate-800">{activeCategory.heroLabel}</div>
            <Link
              to={`/catalog/${activeCategory.id}`}
              onClick={onClose}
              className="mt-5 inline-flex h-10 items-center justify-center bg-[var(--accent)] px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
            >
              Открыть категорию
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileMenu({ onClose }) {
  return (
    <div className="absolute left-0 right-0 top-full z-40 max-h-[calc(100vh-120px)] overflow-y-auto border-t border-white/10 bg-[var(--panel)] shadow-[0_30px_60px_rgba(15,23,42,0.45)] lg:hidden">
      <nav className="flex flex-col" aria-label="Мобильное меню">
        <Link
          to="/catalog"
          onClick={onClose}
          className="border-b border-white/10 px-6 py-4 text-[15px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white/8"
        >
          Каталог
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/catalog/${category.id}`}
            onClick={onClose}
            className="border-b border-white/5 px-6 py-3 text-sm text-white/75 transition-colors hover:bg-white/8 hover:text-white"
          >
            {category.title}
          </Link>
        ))}
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={onClose}
            className="border-b border-white/10 px-6 py-4 text-[15px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white/8"
          >
            {link.label}
          </Link>
        ))}
        <a href={CONTACT_PHONE_HREF} className="px-6 py-4 text-[15px] font-bold text-[var(--accent-bright)]">
          {CONTACT_PHONE_LABEL}
        </a>
      </nav>
    </div>
  )
}

export default function Header() {
  const navigate = useNavigate()
  const [isProductsOpen, setProductsOpen] = useState(false)
  const [isMobileOpen, setMobileOpen] = useState(false)
  const [isSearchOpen, setSearchOpen] = useState(false)
  const productsMenuCloseTimerRef = useRef(null)

  const clearProductsMenuCloseTimer = () => {
    if (productsMenuCloseTimerRef.current != null) {
      window.clearTimeout(productsMenuCloseTimerRef.current)
      productsMenuCloseTimerRef.current = null
    }
  }

  const openProductsMenu = () => {
    clearProductsMenuCloseTimer()
    setProductsOpen(true)
  }

  const scheduleCloseProductsMenu = () => {
    clearProductsMenuCloseTimer()
    productsMenuCloseTimerRef.current = window.setTimeout(() => {
      productsMenuCloseTimerRef.current = null
      setProductsOpen(false)
    }, 160)
  }

  const closeProductsMenuNow = () => {
    clearProductsMenuCloseTimer()
    setProductsOpen(false)
  }

  const closeSearch = useCallback(() => setSearchOpen(false), [])
  useEscToClose(closeSearch)

  useEffect(() => () => clearProductsMenuCloseTimer(), [])

  return (
    <header className="sticky top-0 z-50">
      <UtilityBar />
      <div className="relative bg-[var(--panel)] text-white">
        <div className="mx-auto flex max-w-[var(--page-shell-max)] items-stretch px-6 md:px-12">
          <Link
            to="/"
            className="flex min-h-[72px] items-center text-3xl font-black tracking-tight text-white transition-opacity hover:opacity-90 md:min-h-[88px] md:min-w-[260px] md:text-4xl"
            aria-label="QAZAQTEST, перейти на главную"
          >
            QAZAQ<span className="text-[var(--coral)]">TEST</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setMobileOpen(false)
              setSearchOpen((open) => !open)
            }}
            aria-expanded={isSearchOpen}
            aria-label={isSearchOpen ? 'Закрыть поиск' : 'Открыть поиск'}
            className="ml-auto flex items-center justify-center self-center p-3 lg:hidden"
          >
            <SearchIcon className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchOpen(false)
              setMobileOpen((open) => !open)
            }}
            aria-expanded={isMobileOpen}
            aria-label={isMobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            className="flex items-center justify-center self-center p-3 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              {isMobileOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>

          <nav className="hidden flex-1 items-stretch justify-end lg:flex" aria-label="Основное меню">
            <div
              className="relative flex"
              onMouseEnter={openProductsMenu}
              onMouseLeave={scheduleCloseProductsMenu}
            >
              <button
                type="button"
                onMouseEnter={openProductsMenu}
                onFocus={openProductsMenu}
                onClick={() => navigate('/catalog')}
                className={`inline-flex items-center whitespace-nowrap gap-2 px-5 text-[16px] font-semibold transition-colors ${
                  isProductsOpen ? 'bg-[var(--accent)] text-white' : 'hover:bg-white/8'
                }`}
              >
                <span>КАТАЛОГ</span>
                <span className="text-xs">▼</span>
              </button>
            </div>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onMouseEnter={closeProductsMenuNow}
                className="inline-flex items-center whitespace-nowrap px-5 text-[16px] font-semibold transition-colors hover:bg-white/8"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                closeProductsMenuNow()
                setSearchOpen((open) => !open)
              }}
              aria-expanded={isSearchOpen}
              aria-label={isSearchOpen ? 'Закрыть поиск' : 'Открыть поиск'}
              className={`inline-flex items-center justify-center px-5 transition-colors ${
                isSearchOpen ? 'bg-[var(--accent)] text-white' : 'hover:bg-white/8'
              }`}
            >
              <SearchIcon className="h-6 w-6" />
            </button>
          </nav>
        </div>
        {isProductsOpen ? (
          <MegaMenu
            onClose={closeProductsMenuNow}
            onMouseEnter={openProductsMenu}
            onMouseLeave={scheduleCloseProductsMenu}
          />
        ) : null}
        {isSearchOpen ? (
          <Suspense fallback={null}>
            <HeaderSearch onClose={closeSearch} />
          </Suspense>
        ) : null}
        {isMobileOpen ? <MobileMenu onClose={() => setMobileOpen(false)} /> : null}
      </div>
    </header>
  )
}
