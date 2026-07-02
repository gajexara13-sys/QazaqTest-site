import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import {
  HashRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import CategoriesBentoGrid from './components/CategoriesBentoGrid'
import { benefits, brands, catalogItems, categories, getCategoryById } from './data/siteData'

const defaultCategory = 'Общий запрос'

/** Логотипы, которые визуально мельче остальных — чуть крупнее в карусели */
const BRAND_LOGO_UPSCALE = new Set(['Техком', 'Lithostek', 'Грин-Тех'])

/** Доп. коэффициент к --brands-logo-boost (1 = как базовый boost) */
const BRAND_LOGO_EXTRA_SCALE = {
  Техком: 0.5,
  'Грин-Тех': 0.5,
  Lithostek: 0.7,
}

/** Множитель базовой высоты логотипа (1 = по умолчанию) */
const BRAND_LOGO_HEIGHT_MUL = {
  СТМ: 0.9,
}

function useLockBodyScroll(isLocked) {
  useEffect(() => {
    if (!isLocked) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isLocked])
}

function useEscToClose(onClose) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])
}

function getFilteredItems(items, activeCategoryId, searchQuery) {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  return items.filter((item) => {
    const matchesCategory = activeCategoryId === 'all' || item.categoryId === activeCategoryId
    const blob = [
      item.title,
      item.summary,
      item.description,
      item.model,
      item.brand,
      item.priceLabel,
      item.originalCategory,
      item.sku,
      ...(item.tags ?? []),
    ]
      .filter(Boolean)
      .join('\n')
      .toLowerCase()
    const matchesSearch = normalizedQuery.length === 0 || blob.includes(normalizedQuery)

    return matchesCategory && matchesSearch
  })
}

function UtilityBar() {
  return (
    <div className="bg-[var(--ink)] text-white">
      <div className="mx-auto flex max-w-[var(--page-shell-max)] items-center justify-between gap-4 px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] md:px-12">
        <div className="flex items-center gap-3 text-white/90">
          <span>RU</span>
          <span className="text-white/50">▼</span>
        </div>
        <a
          href="tel:+77000000000"
          className="inline-flex text-white/75 transition-colors hover:text-white"
        >
          +7 (700) 000 00 00
        </a>
      </div>
    </div>
  )
}

function MegaMenu({ onClose, onMouseEnter, onMouseLeave }) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? null)
  const activeCategory = getCategoryById(activeCategoryId) ?? categories[0]

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
              {activeCategory.items.map((item) => (
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
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--accent)]">
              Превью категории
            </p>
            <div
              className="mt-4 min-h-[130px] rounded"
              style={{ background: activeCategory.image }}
            />
            <div className="mt-4 text-[13px] font-medium text-slate-800">{activeCategory.heroLabel}</div>
            <Link
              to={`/catalog/${activeCategory.id}`}
              onClick={onClose}
              className="mt-5 inline-flex h-10 items-center justify-center bg-[var(--accent)] px-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:brightness-95"
            >
              Открыть категорию
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Header() {
  const navigate = useNavigate()
  const [isProductsOpen, setProductsOpen] = useState(false)
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

  useEffect(() => () => clearProductsMenuCloseTimer(), [])

  return (
    <header className="sticky top-0 z-50">
      <UtilityBar />
      <div className="relative bg-[var(--panel)] text-white">
        <div className="mx-auto flex max-w-[var(--page-shell-max)] items-stretch px-6 md:px-12">
          <Link
            to="/"
            className="flex min-h-[88px] min-w-[190px] items-center text-3xl font-black tracking-tight text-white transition-opacity hover:opacity-90 md:min-w-[260px] md:text-4xl"
            aria-label="QAZAQTEST, перейти на главную"
          >
            QAZAQ<span className="text-[var(--accent)]">TEST</span>
          </Link>

          <nav className="flex flex-1 items-stretch justify-end" aria-label="Основное меню">
            <div
              className="relative flex min-w-[180px]"
              onMouseEnter={openProductsMenu}
              onMouseLeave={scheduleCloseProductsMenu}
            >
              <button
                type="button"
                onMouseEnter={openProductsMenu}
                onFocus={openProductsMenu}
                onClick={() => navigate('/catalog')}
                className={`inline-flex min-w-[160px] items-center justify-center gap-3 px-5 text-[16px] font-semibold transition-colors ${
                  isProductsOpen ? 'bg-[var(--accent)] text-white' : 'hover:bg-white/8'
                }`}
              >
                <span className="text-[17px] font-bold">КАТАЛОГ</span>
                <span className="text-xs">▼</span>
              </button>
            </div>
            <Link
              to="/services"
              onMouseEnter={closeProductsMenuNow}
              className="inline-flex items-center px-5 text-[16px] font-semibold transition-colors hover:bg-white/8"
            >
              УСЛУГИ
            </Link>
            <Link
              to="/service"
              onMouseEnter={closeProductsMenuNow}
              className="inline-flex items-center px-5 text-[16px] font-semibold transition-colors hover:bg-white/8"
            >
              СЕРВИС
            </Link>
            <Link
              to="/guides"
              onMouseEnter={closeProductsMenuNow}
              className="inline-flex items-center px-5 text-[16px] font-semibold transition-colors hover:bg-white/8"
            >
              ГАЙДЫ
            </Link>
            <Link
              to="/about"
              onMouseEnter={closeProductsMenuNow}
              className="inline-flex items-center px-5 text-[16px] font-semibold transition-colors hover:bg-white/8"
            >
              О КОМПАНИИ
            </Link>
            <Link
              to="/contact"
              onMouseEnter={closeProductsMenuNow}
              className="inline-flex items-center px-5 text-[16px] font-semibold transition-colors hover:bg-white/8"
            >
              КОНТАКТЫ
            </Link>
          </nav>
        </div>
        {isProductsOpen ? (
          <MegaMenu
            onClose={closeProductsMenuNow}
            onMouseEnter={openProductsMenu}
            onMouseLeave={scheduleCloseProductsMenu}
          />
        ) : null}
      </div>
    </header>
  )
}

function ContactModal({ selectedCategory, onClose }) {
  const [formData, setFormData] = useState({ name: '', phone: '' })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const nameInputRef = useRef(null)
  const titleId = useId()

  useLockBodyScroll(true)
  useEscToClose(onClose)

  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setIsSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Закрыть модальное окно"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-lg rounded-[2rem] border border-[#78AEAD]/25 bg-[var(--mint)] p-8 shadow-2xl shadow-slate-950/20 sm:p-10"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#78AEAD]/25 text-xl text-slate-500 transition-colors hover:border-slate-900 hover:text-[var(--ink)]"
          aria-label="Закрыть"
        >
          ×
        </button>

        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
          Запрос
        </p>
        <h2 id={titleId} className="mt-4 pr-12 text-3xl font-bold tracking-tight text-[var(--ink)]">
          Запрос на консультацию
        </h2>
        <p className="mt-4 text-sm uppercase tracking-[0.22em] text-slate-500">
          Тема: {selectedCategory}
        </p>

        {isSubmitted ? (
          <div className="mt-8 rounded-[1.5rem] bg-[var(--surface)] p-6">
            <p className="text-lg font-semibold text-[var(--ink)]">Заявка принята.</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Мы свяжемся с вами по номеру {formData.phone} и уточним детали по теме "{selectedCategory}".
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                Ваше имя
              </span>
              <input
                ref={nameInputRef}
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="h-14 w-full rounded-2xl border border-[#78AEAD]/25 bg-[var(--surface)] px-5 outline-none transition-all focus:border-[var(--accent)] focus:bg-[var(--mint)]"
                placeholder="Как к вам обращаться"
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                Телефон
              </span>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="h-14 w-full rounded-2xl border border-[#78AEAD]/25 bg-[var(--surface)] px-5 outline-none transition-all focus:border-[var(--accent)] focus:bg-[var(--mint)]"
                placeholder="+7 (___) ___ __ __"
                autoComplete="tel"
              />
            </label>

            <div className="flex flex-col gap-3 pt-3 sm:flex-row">
              <button
                type="submit"
                className="inline-flex h-14 flex-1 items-center justify-center rounded-2xl bg-[var(--accent)] px-6 text-xs font-bold uppercase tracking-[0.24em] text-white transition-colors hover:brightness-95"
              >
                Отправить запрос
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-14 flex-1 items-center justify-center rounded-2xl border border-[#78AEAD]/35 px-6 text-xs font-bold uppercase tracking-[0.24em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
              >
                Закрыть
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ProductModal({ item, onOpenModal, onClose }) {
  const category = getCategoryById(item.categoryId)
  const titleId = useId()

  useLockBodyScroll(true)
  useEscToClose(onClose)

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Закрыть окно товара"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-[#78AEAD]/25 bg-[var(--mint)] shadow-2xl shadow-slate-950/20"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/85 text-xl text-slate-500 transition-colors hover:text-[var(--ink)]"
          aria-label="Закрыть"
        >
          ×
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="relative min-h-[360px] overflow-hidden rounded-t-[2rem] lg:rounded-l-[2rem] lg:rounded-tr-none">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="absolute inset-0" style={{ background: category?.image }} />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.2),rgba(15,23,42,0.55))]" />
            <div className="relative flex min-h-[360px] flex-col justify-between p-8 text-white md:p-10">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/80">
                  {category?.title}
                </p>
                <h2 id={titleId} className="mt-4 max-w-lg text-4xl font-bold tracking-tight">
                  {item.title}
                </h2>
                {item.priceLabel ? (
                  <p className="mt-4 text-lg font-semibold tracking-tight text-white">{item.priceLabel}</p>
                ) : null}
                {item.brand ? (
                  <p className="mt-2 text-sm font-medium text-white/85">{item.brand}</p>
                ) : null}
              </div>

              <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/70">
                  {item.imageUrl ? 'Фото' : 'Превью'}
                </p>
                <div className="mt-4 flex min-h-[120px] items-center justify-center overflow-hidden rounded-[1.35rem] border border-dashed border-white/30 bg-white/5 p-2 text-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="max-h-[200px] w-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="p-6 text-sm uppercase tracking-[0.28em] text-white/75">{item.imageLabel}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
              Обзор оборудования
            </p>
            <p className="mt-5 text-base leading-relaxed text-slate-600">{item.description}</p>

            {item.features?.length > 0 ? (
              <div className="mt-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-500">
                  Ключевые особенности
                </p>
                <div className="mt-4 space-y-3">
                  {item.features.map((feature) => (
                    <div key={feature} className="flex items-start text-sm leading-relaxed text-slate-700">
                      <span className="mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {item.specs?.length > 0 ? (
              <div className="mt-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-500">
                  Основные характеристики
                </p>
                <div className="mt-4 grid gap-3">
                  {item.specs.map((spec) => (
                    <div
                      key={spec}
                      className="rounded-2xl border border-[#78AEAD]/25 bg-[var(--surface)] px-4 py-3 text-sm font-medium text-slate-700"
                    >
                      {spec}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {item.tags?.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#78AEAD]/25 bg-[var(--mint)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => onOpenModal(item.title)}
                className="inline-flex h-14 flex-1 items-center justify-center rounded-2xl bg-[var(--accent)] px-6 text-xs font-bold uppercase tracking-[0.24em] text-white transition-colors hover:brightness-95"
              >
                Запросить предложение
              </button>
              {item.productUrl ? (
                <a
                  href={item.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-14 flex-1 items-center justify-center rounded-2xl border border-[#78AEAD]/35 px-6 text-xs font-bold uppercase tracking-[0.24em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
                >
                  Карточка товара (источник)
                </a>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-14 min-w-[12rem] flex-1 items-center justify-center rounded-2xl border border-[#78AEAD]/35 px-6 text-xs font-bold uppercase tracking-[0.24em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
              >
                Закрыть превью
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Наверх"
      className="fixed bottom-6 right-6 z-40 hidden h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-transform hover:-translate-y-1 xl:flex"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}

function SiteFooter({ onOpenModal }) {
  return (
    <footer id="about" className="border-t border-[#78AEAD]/25 bg-[var(--page-bg)]">
      <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-14 md:px-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <div className="text-3xl font-black tracking-tight text-[var(--ink)]">
              QAZAQ<span className="text-[var(--accent)]">TEST</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
              Поставка лабораторного оборудования для дорожных, строительных и материаловедческих
              лабораторий по Казахстану: подбор, логистика, монтаж и сервисное сопровождение.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Ниже — пример заполнения блоков подвала. Замените телефоны, e-mail и реквизиты на ваши
              актуальные данные.
            </p>
          </div>

          <nav className="lg:col-span-3" aria-label="Разделы сайта в подвале">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">
              Разделы
            </p>
            <ul className="mt-5 space-y-3 text-sm font-medium text-[var(--ink)]">
              <li>
                <Link to="/catalog" className="transition-colors hover:text-[var(--accent)]">
                  Каталог
                </Link>
              </li>
              <li>
                <Link to="/services" className="transition-colors hover:text-[var(--accent)]">
                  Услуги
                </Link>
              </li>
              <li>
                <Link to="/service" className="transition-colors hover:text-[var(--accent)]">
                  Сервис
                </Link>
              </li>
              <li>
                <Link to="/guides" className="transition-colors hover:text-[var(--accent)]">
                  Гайды
                </Link>
              </li>
              <li>
                <Link to="/about" className="transition-colors hover:text-[var(--accent)]">
                  О компании
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors hover:text-[var(--accent)]">
                  Контакты
                </Link>
              </li>
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">
              Связь
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-600">
              <li>
                <span className="font-semibold text-[var(--ink)]">Телефон</span>
                <br />
                <a href="tel:+77055640535" className="text-[var(--accent)] hover:underline">
                  +7 (705) 564 05 35
                </a>
              </li>
              <li>
                <span className="font-semibold text-[var(--ink)]">E-mail</span>
                <br />
                <a href="mailto:office@qazaqtest.kz" className="text-[var(--accent)] hover:underline">
                  office@qazaqtest.kz
                </a>
              </li>
              <li>
                <span className="font-semibold text-[var(--ink)]">Режим работы</span>
                <br />
                Пн–Пт 9:00–18:00 (GMT+5), выходные — сб, вс
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">
              Реквизиты (пример)
            </p>
            <address className="mt-5 not-italic text-sm leading-relaxed text-slate-600">
              ТОО «QAZAQTEST»
              <br />
              БИН 941240012345
              <br />
              г. Алматы, ул. Примерная, 42, офис 305
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-[#78AEAD]/25 pt-10 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => onOpenModal(defaultCategory)}
            className="inline-flex h-14 w-full max-w-xs items-center justify-center bg-[var(--accent)] px-8 text-xs font-bold uppercase tracking-[0.24em] text-white transition-colors hover:brightness-95 md:w-auto"
          >
            Связаться с нами
          </button>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} QAZAQTEST. Все права защищены.</span>
            <a href="#" className="transition-colors hover:text-[var(--accent)]">
              Политика конфиденциальности (пример)
            </a>
            <a href="#" className="transition-colors hover:text-[var(--accent)]">
              Договор оферты (пример)
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function BrandMarqueeLogo({ brand, decorative }) {
  const [isLogoAvailable, setLogoAvailable] = useState(true)
  const upscaleLogo = BRAND_LOGO_UPSCALE.has(brand.name)

  if (!isLogoAvailable) {
    return (
      <span className="max-w-[11rem] text-center text-sm font-bold leading-tight tracking-tight text-[var(--ink)]/80 md:text-base">
        {brand.name}
      </span>
    )
  }

  return (
    <div className={upscaleLogo ? 'brands-marquee-img-wrap brands-marquee-img-wrap--boost' : 'brands-marquee-img-wrap'}>
      <img
        src={brand.logo}
        alt={decorative ? '' : brand.name}
        loading="eager"
        decoding="sync"
        aria-hidden={decorative}
        onError={() => setLogoAvailable(false)}
        className="brands-marquee-img"
      />
    </div>
  )
}

const BRANDS_MARQUEE_PERIOD_MS = 32_000

function BrandsMarquee() {
  const firstSegRef = useRef(null)
  const secondSegRef = useRef(null)
  const trackRef = useRef(null)
  const [marqueeShiftPx, setMarqueeShiftPx] = useState(null)
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const slotClass = 'brands-marquee-slot min-h-0 min-w-0'

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      setReducedMotion(mq.matches)
    }
    onChange()
    mq.addEventListener('change', onChange)
    return () => {
      mq.removeEventListener('change', onChange)
    }
  }, [])

  useEffect(() => {
    brands.forEach((b) => {
      const img = new Image()
      img.src = b.logo
    })
  }, [])

  useLayoutEffect(() => {
    const seg1 = firstSegRef.current
    if (!seg1) {
      return undefined
    }

    const MIN_SEG_WIDTH = 120
    let debounceId = null
    let ro = null
    let locked = false

    const commitWidth = () => {
      const s1 = firstSegRef.current
      const s2 = secondSegRef.current
      const track = trackRef.current
      if (!s1 || !s2 || !track) {
        return
      }

      const prevTransform = track.style.transform
      track.style.transform = 'translate3d(0px,0px,0px)'
      void track.offsetHeight

      const r1 = s1.getBoundingClientRect()
      const r2 = s2.getBoundingClientRect()
      const raw = r2.left - r1.left

      track.style.transform = prevTransform

      if (!Number.isFinite(raw) || raw < MIN_SEG_WIDTH) {
        return
      }
      setMarqueeShiftPx((prev) =>
        prev != null && Math.abs(prev - raw) < 0.35 ? prev : raw,
      )
    }

    const schedule = () => {
      if (debounceId != null) {
        window.clearTimeout(debounceId)
      }
      debounceId = window.setTimeout(() => {
        debounceId = null
        commitWidth()
      }, 120)
    }

    ro = new ResizeObserver(() => {
      if (!locked) {
        schedule()
      }
    })
    ro.observe(seg1)
    const s2 = secondSegRef.current
    if (s2) {
      ro.observe(s2)
    }
    schedule()

    const imgs = [
      ...seg1.querySelectorAll('img'),
      ...(secondSegRef.current?.querySelectorAll('img') ?? []),
    ]
    const onImg = () => {
      if (!locked) {
        schedule()
      }
    }
    imgs.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', onImg)
      }
    })

    const onWinResize = () => {
      locked = false
      if (!ro) {
        ro = new ResizeObserver(() => {
          if (!locked) {
            schedule()
          }
        })
        ro.observe(seg1)
        const dup = secondSegRef.current
        if (dup) {
          ro.observe(dup)
        }
      }
      schedule()
    }
    window.addEventListener('resize', onWinResize)

    const lockTimer = window.setTimeout(() => {
      locked = true
      ro?.disconnect()
      ro = null
    }, 2000)

    return () => {
      window.clearTimeout(lockTimer)
      ro?.disconnect()
      window.removeEventListener('resize', onWinResize)
      if (debounceId != null) {
        window.clearTimeout(debounceId)
      }
      imgs.forEach((img) => {
        img.removeEventListener('load', onImg)
      })
    }
  }, [])

  useEffect(() => {
    const track = trackRef.current
    const shift = marqueeShiftPx

    if (!track || shift == null || shift <= 0) {
      return undefined
    }

    if (reducedMotion) {
      return undefined
    }

    const period = shift
    let pos = 0
    let last = performance.now()
    const pxPerMs = period / BRANDS_MARQUEE_PERIOD_MS

    let rafId = 0
    const tick = (now) => {
      const dt = Math.min(80, now - last)
      last = now
      pos += pxPerMs * dt
      while (pos >= period) {
        pos -= period
      }
      track.style.transform = `translate3d(${-pos}px,0,0)`
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      track.style.removeProperty('transform')
    }
  }, [marqueeShiftPx, reducedMotion])

  const slotPropsForBrand = (brand) => {
    const heightMul = BRAND_LOGO_HEIGHT_MUL[brand.name] ?? 1
    const style = {}
    if (heightMul !== 1) {
      style['--brands-logo-mul'] = String(heightMul)
    }
    if (BRAND_LOGO_UPSCALE.has(brand.name)) {
      style['--brands-brand-extra'] = String(BRAND_LOGO_EXTRA_SCALE[brand.name] ?? 1)
      return {
        className: `${slotClass} brands-marquee-slot--boost`,
        style,
      }
    }
    if (heightMul !== 1) {
      return { className: slotClass, style }
    }
    return { className: slotClass }
  }

  const useRafDriver =
    marqueeShiftPx != null && marqueeShiftPx > 0 && !reducedMotion

  const trackClassName = useRafDriver
    ? 'brands-marquee-track brands-marquee-track--raf'
    : 'brands-marquee-track'

  return (
    <div className="brands-marquee overflow-hidden py-4 md:py-5">
      <div ref={trackRef} className={trackClassName}>
        <div ref={firstSegRef} className="brands-marquee-seg">
          {brands.map((brand) => {
            const p = slotPropsForBrand(brand)
            return (
              <div key={`${brand.name}-a`} className={p.className} style={p.style}>
                <BrandMarqueeLogo brand={brand} decorative={false} />
              </div>
            )
          })}
        </div>
        <div
          ref={secondSegRef}
          className="brands-marquee-seg brands-marquee-seg--dup"
          aria-hidden="true"
        >
          {brands.map((brand) => {
            const p = slotPropsForBrand(brand)
            return (
              <div key={`${brand.name}-b`} className={p.className} style={p.style}>
                <BrandMarqueeLogo brand={brand} decorative />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function HomePage({ onOpenModal }) {
  return (
    <>
      <section className="relative overflow-hidden bg-[var(--hero-mid)] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,174,84,0.14),_transparent_36%),linear-gradient(135deg,_rgba(212,236,233,0.06),_transparent_48%)]" />
        <div className="relative mx-auto grid max-w-[var(--page-shell-max)] gap-10 px-6 py-20 md:gap-12 md:px-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14 lg:py-28">
          <div className="max-w-4xl">
            <h1 className="max-w-4xl text-5xl font-black leading-[0.88] tracking-[0.008em] text-balance md:text-7xl md:leading-[0.91] md:tracking-[0.012em]">
              Оборудование для{' '}
              <span className="text-[var(--accent-bright)]">дорожных и строительных</span> лабораторий в Казахстане.
            </h1>
            <div className="mt-8 h-1 w-28 rounded-full bg-[var(--accent)]" />
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/74">
              Поставляем оборудование, которое знаем технически — не по каталогу, а по опыту работы в
              лаборатории. Имеем собственную сервисную службу.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/catalog"
                className="inline-flex h-16 items-center justify-center rounded-none bg-[var(--accent)] px-10 text-sm font-bold uppercase tracking-[0.24em] text-white transition-transform hover:-translate-y-0.5"
              >
                Перейти в каталог
              </Link>
              <button
                type="button"
                onClick={() => onOpenModal(defaultCategory)}
                className="inline-flex h-16 items-center justify-center border border-white/20 px-10 text-sm font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-white/8"
              >
                Связаться с нами
              </button>
            </div>
          </div>

          <div className="grid gap-4 self-end">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="border border-white/12 bg-white/6 p-6 backdrop-blur-sm">
                {benefit.value ? (
                  <div className="text-5xl font-black italic text-[var(--accent-bright)]">{benefit.value}</div>
                ) : null}
                <div
                  className={`text-xs font-extrabold uppercase tracking-[0.28em] text-white/75 ${
                    benefit.value ? 'mt-3' : ''
                  }`}
                >
                  {benefit.title}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/70">{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="brands" className="border-b border-[#78AEAD]/25 bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-14 md:px-12 md:py-16 lg:py-20">
          <h2 className="max-w-4xl text-5xl font-black tracking-tight text-[var(--accent)]">
            Оборудование от проверенных производителей
          </h2>
          <div className="mt-8 md:mt-10">
            <BrandsMarquee />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[var(--hero-mid)] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,174,84,0.14),_transparent_36%),linear-gradient(135deg,_rgba(212,236,233,0.06),_transparent_48%)]" />
        <div className="relative mx-auto max-w-[var(--page-shell-max)] px-6 py-20 md:px-12">
          <div className="max-w-3xl">
            <h2 className="text-5xl font-black tracking-tight text-white">Категории оборудования</h2>
            <div className="mt-6 h-1 w-28 rounded-full bg-[var(--accent)]" />
            <p className="mt-8 text-lg leading-relaxed text-white/75">
              Каталог построен по материалам и направлениям испытаний, чтобы клиент мог быстро
              перейти от раздела к нужной номенклатуре.
            </p>
          </div>

          <div className="mt-14">
            <CategoriesBentoGrid />
          </div>
        </div>
      </section>

      <section id="service" className="bg-[var(--page-bg)]">
        <div className="mx-auto grid max-w-[var(--page-shell-max)] gap-8 px-6 py-20 md:px-12 lg:grid-cols-3">
          <article className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
              Сервис
            </p>
            <h3 className="mt-4 text-3xl font-bold tracking-tight text-[var(--ink)]">Монтаж и запуск</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Ввод в эксплуатацию, настройка режимов и сопровождение при первых циклах испытаний.
            </p>
          </article>
          <article className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
              Поддержка
            </p>
            <h3 className="mt-4 text-3xl font-bold tracking-tight text-[var(--ink)]">Обучение и методики</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Помогаем лаборатории быстрее встроить оборудование в действующие методы и регламенты.
            </p>
          </article>
          <article className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
              Логистика
            </p>
            <h3 className="mt-4 text-3xl font-bold tracking-tight text-[var(--ink)]">Доставка по Казахстану</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Поставка, комплектация и организация логистики под задачи региональных лабораторий.
            </p>
          </article>
        </div>
      </section>

      <section
        id="support"
        className="relative overflow-hidden border-y border-[#78AEAD]/25 bg-[var(--hero-mid)] text-white"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,174,84,0.14),_transparent_36%),linear-gradient(135deg,_rgba(212,236,233,0.06),_transparent_48%)]" />
        <div className="relative mx-auto grid max-w-[var(--page-shell-max)] gap-10 px-6 py-20 md:px-12 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[var(--accent)]">
              Материалы и поддержка
            </p>
            <h2 className="mt-5 text-5xl font-black tracking-tight">Создано для технических специалистов и лабораторий.</h2>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/72">
              Следующий шаг для сайта: стандарты, методики, downloadable материалы, сервисные блоки
              и более детальная структура категорий.
            </p>
          </div>

          <div className="border border-white/12 bg-white/6 p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/62">
              Канал связи
            </p>
            <h3 className="mt-4 text-3xl font-bold tracking-tight">Нужна конфигурация под вашу задачу?</h3>
            <button
              type="button"
              onClick={() => onOpenModal(defaultCategory)}
              className="mt-8 inline-flex h-14 items-center justify-center bg-[var(--accent)] px-8 text-xs font-bold uppercase tracking-[0.24em] text-white transition-colors hover:brightness-95"
            >
              Запросить консультацию
            </button>
          </div>
        </div>
      </section>

    </>
  )
}

function Breadcrumbs({ categoryTitle }) {
  return (
    <div className="border-b border-[#78AEAD]/25 bg-[var(--page-bg)]">
      <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-4 text-sm text-slate-600 md:px-12">
        <Link to="/" className="text-[var(--accent)] hover:underline">
          QAZAQTEST
        </Link>{' '}
        {'>'} <Link to="/catalog" className="text-[var(--accent)] hover:underline">Каталог</Link>{' '}
        {'>'} <span>{categoryTitle}</span>
      </div>
    </div>
  )
}

function CatalogBreadcrumbs() {
  return (
    <div className="border-b border-[#78AEAD]/25 bg-[var(--page-bg)]">
      <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-4 text-sm text-slate-600 md:px-12">
        <Link to="/" className="text-[var(--accent)] hover:underline">
          QAZAQTEST
        </Link>{' '}
        {'>'} <span>Каталог</span>
      </div>
    </div>
  )
}

function StaticPageBreadcrumbs({ currentTitle }) {
  return (
    <div className="border-b border-[#78AEAD]/25 bg-[var(--page-bg)]">
      <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-4 text-sm text-slate-600 md:px-12">
        <Link to="/" className="text-[var(--accent)] hover:underline">
          QAZAQTEST
        </Link>{' '}
        {'>'} <span>{currentTitle}</span>
      </div>
    </div>
  )
}

function ServicesPage() {
  return (
    <>
      <StaticPageBreadcrumbs currentTitle="Услуги" />
      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-20 md:px-12">
          <h1 className="text-5xl font-black tracking-tight text-[var(--ink)]">Услуги</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">
            Закрываем полный цикл: от ввода оборудования в эксплуатацию до сопровождения лаборатории в
            рабочих процессах.
          </p>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <article className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-8">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">Монтаж и запуск</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Ввод в эксплуатацию, настройка режимов и сопровождение при первых циклах испытаний.
              </p>
            </article>
            <article className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-8">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">Обучение и методики</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Помогаем лаборатории быстрее встроить оборудование в действующие методы и регламенты.
              </p>
            </article>
            <article className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-8">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">Логистика и поставка</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Поставка, комплектация и организация логистики под задачи региональных лабораторий.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  )
}

function GuidesPage({ onOpenModal }) {
  return (
    <>
      <StaticPageBreadcrumbs currentTitle="Гайды" />
      <section className="bg-[var(--navy)] text-white">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-20 md:px-12">
          <h1 className="text-5xl font-black tracking-tight">Гайды</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/72">
            Практические инструкции по выбору оборудования, запуску лабораторий и подготовке к
            испытаниям по основным направлениям.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <article className="border border-white/20 bg-white/8 p-6">
              <h2 className="text-2xl font-bold tracking-tight">Как выбрать оборудование для лаборатории</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                Чек-лист по выбору комплектации под дорожные, бетонные и грунтовые испытания.
              </p>
            </article>
            <article className="border border-white/20 bg-white/8 p-6">
              <h2 className="text-2xl font-bold tracking-tight">Подготовка к запуску и поверке</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                Пошаговый план внедрения оборудования: от установки до первых протоколов испытаний.
              </p>
            </article>
          </div>
          <div className="mt-10">
            <button
              type="button"
              onClick={() => onOpenModal(defaultCategory)}
              className="inline-flex h-14 items-center justify-center bg-[var(--accent)] px-8 text-xs font-bold uppercase tracking-[0.24em] text-white transition-colors hover:brightness-95"
            >
              Получить консультацию
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

function ServicePage() {
  return (
    <>
      <StaticPageBreadcrumbs currentTitle="Сервис" />
      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-20 md:px-12">
          <h1 className="text-5xl font-black tracking-tight text-[var(--ink)]">Сервис</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">
            Техническое сопровождение оборудования, контроль состояния приборов и регулярные регламентные
            работы для бесперебойной работы лаборатории.
          </p>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <article className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-8">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">Диагностика</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Проверка текущего состояния оборудования и рекомендации по обслуживанию.
              </p>
            </article>
            <article className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-8">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">Калибровка</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Настройка приборов и восстановление точности измерений по требованиям методик.
              </p>
            </article>
            <article className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-8">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">Выезд инженера</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Оперативная помощь на площадке для решения технических и эксплуатационных вопросов.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  )
}

function AboutPage() {
  return (
    <>
      <StaticPageBreadcrumbs currentTitle="О компании" />
      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-20 md:px-12">
          <h1 className="text-5xl font-black tracking-tight text-[var(--ink)]">О компании QAZAQTEST</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">
            Мы поставляем лабораторное оборудование для дорожных, строительных и материаловедческих
            лабораторий по всему Казахстану и сопровождаем клиентов на каждом этапе внедрения.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-6">
                {benefit.value ? (
                  <div className="text-4xl font-black italic text-[var(--accent-bright)]">{benefit.value}</div>
                ) : null}
                <h2
                  className={`text-2xl font-bold tracking-tight text-[var(--ink)] ${
                    benefit.value ? 'mt-3' : ''
                  }`}
                >
                  {benefit.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function ContactPage({ onOpenModal }) {
  return (
    <>
      <StaticPageBreadcrumbs currentTitle="Контакты" />
      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-20 md:px-12">
          <h1 className="text-5xl font-black tracking-tight text-[var(--ink)]">Контакты</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">
            Оставьте заявку, и мы поможем подобрать оборудование под вашу лабораторию, бюджет и
            технические требования.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="tel:+77000000000"
              className="inline-flex h-14 items-center justify-center border border-[#78AEAD]/35 px-8 text-xs font-bold uppercase tracking-[0.24em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
            >
              +7 (705) 564 05 35
            </a>
            <button
              type="button"
              onClick={() => onOpenModal(defaultCategory)}
              className="inline-flex h-14 items-center justify-center bg-[var(--accent)] px-8 text-xs font-bold uppercase tracking-[0.24em] text-white transition-colors hover:brightness-95"
            >
              Оставить заявку
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

function CategoryHubCard({ category }) {
  return (
    <Link
      to={`/catalog/${category.id}`}
      className="group grid min-h-[150px] grid-cols-[150px_minmax(0,1fr)] overflow-hidden border border-[#78AEAD]/25 bg-white shadow-[0_8px_18px_rgba(19,44,71,0.08)] transition-transform hover:-translate-y-1"
    >
      <div className="angled-thumb" style={{ background: category.image }} />
      <div className="flex items-center justify-between gap-4 px-6">
        <div>
          <div className="text-3xl">{category.icon}</div>
          <div className="mt-3 text-2xl font-medium tracking-tight text-[var(--ink)]">{category.title}</div>
        </div>
        <div className="text-4xl text-slate-500 transition-transform group-hover:translate-x-1">→</div>
      </div>
    </Link>
  )
}

function CatalogPage() {
  return (
    <>
      <CatalogBreadcrumbs />

      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-20 md:px-12">
          <div className="max-w-3xl">
            <h1 className="text-6xl font-black tracking-tight text-[var(--ink)]">Каталог</h1>
            <div className="mt-7 h-1 w-28 rounded-full bg-[var(--accent)]" />
            <p className="mt-8 text-lg leading-relaxed text-slate-600">
              Изучите линейку испытательного оборудования, отсортированную по материалам и задачам
              лаборатории.
            </p>
          </div>

          <div className="mt-16">
            <CategoriesBentoGrid />
          </div>
        </div>
      </section>
    </>
  )
}

function CatalogFilterBar({ searchQuery, onSearchChange, resultCount }) {
  return (
    <div className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <label className="block w-full max-w-xl">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
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
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
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

function CatalogItemCard({ item, onOpenModal, onPreview }) {
  const category = getCategoryById(item.categoryId)

  return (
    <article className="border border-[#78AEAD]/25 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition-transform hover:-translate-y-1">
      <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative min-h-[220px] overflow-hidden bg-white">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-contain p-4"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: category?.image }} />
          )}
        </div>
        <div className="p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">
              {category?.title}
            </p>
            <h3 className="mt-3 text-3xl font-bold tracking-tight text-[var(--ink)]">{item.title}</h3>
            {item.model ? (
              <p className="mt-2 text-sm font-medium text-slate-500">Модель: {item.model}</p>
            ) : null}
            {item.brand ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.brand}</p> : null}
            {item.priceLabel ? (
              <p className="mt-3 text-xl font-bold tracking-tight text-[var(--ink)]">{item.priceLabel}</p>
            ) : null}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-600">{item.summary}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onPreview(item)}
              className="inline-flex h-12 flex-1 items-center justify-center border border-[#78AEAD]/35 px-5 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
            >
              Быстрый просмотр
            </button>
            <button
              type="button"
              onClick={() => onOpenModal(item.title)}
              className="inline-flex h-12 flex-1 items-center justify-center bg-[var(--accent)] px-5 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:brightness-95"
            >
              Запросить предложение
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function EmptyCatalogState() {
  return (
    <div className="border border-dashed border-[#78AEAD]/35 bg-white px-6 py-14 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--accent)]">Ничего не найдено</p>
      <h3 className="mt-4 text-3xl font-bold tracking-tight text-[var(--ink)]">
        Фильтр ничего не нашёл
      </h3>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
        Попробуйте другой запрос или откройте соседнюю категорию из панели выше.
      </p>
    </div>
  )
}

function CategoryPage({ onOpenModal, onPreviewProduct }) {
  const { id } = useParams()
  const category = getCategoryById(id)
  const [searchQuery, setSearchQuery] = useState('')

  if (!category) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[var(--accent)]">404</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--ink)]">Раздел не найден</h1>
        <Link
          to="/catalog"
          className="mt-8 inline-flex h-12 items-center justify-center bg-[var(--accent)] px-6 text-xs font-bold uppercase tracking-[0.24em] text-white"
        >
          В каталог
        </Link>
      </section>
    )
  }

  const filteredItems = getFilteredItems(catalogItems, category.id, searchQuery)

  return (
    <>
      <Breadcrumbs categoryTitle={category.title} />

      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-12 md:px-12 md:py-14">
          <div className="max-w-4xl">
            <h1 className="text-6xl font-black tracking-tight text-[var(--ink)]">{category.title}</h1>
            <div className="mt-7 h-1 w-28 rounded-full bg-[var(--accent)]" />
            <p className="mt-6 text-lg leading-relaxed text-slate-600">{category.description}</p>
          </div>

          <div className="mt-10">
            <CategoryNavigation currentCategoryId={category.id} />
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
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

            <div>
              <CatalogFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                resultCount={filteredItems.length}
              />

              <div className="mt-8 grid gap-6">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <CatalogItemCard
                      key={item.id}
                      item={item}
                      onOpenModal={onOpenModal}
                      onPreview={onPreviewProduct}
                    />
                  ))
                ) : (
                  <EmptyCatalogState />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const root = document.documentElement
    const prevHtml = root.style.scrollBehavior
    const prevBody = document.body.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    document.body.style.scrollBehavior = 'auto'

    window.scrollTo(0, 0)
    root.scrollTop = 0
    document.body.scrollTop = 0

    root.style.scrollBehavior = prevHtml
    document.body.style.scrollBehavior = prevBody
  }, [pathname])

  return null
}

function AppShell() {
  const [isContactOpen, setContactOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory)
  const [previewItem, setPreviewItem] = useState(null)

  const handleOpenModal = (category) => {
    setSelectedCategory(category)
    setPreviewItem(null)
    setContactOpen(true)
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)] antialiased">
      <ScrollToTop />
      <Header />
      <BackToTop />
      {previewItem ? (
        <ProductModal
          item={previewItem}
          onOpenModal={handleOpenModal}
          onClose={() => setPreviewItem(null)}
        />
      ) : null}
      {isContactOpen ? (
        <ContactModal
          selectedCategory={selectedCategory}
          onClose={() => setContactOpen(false)}
        />
      ) : null}
      <main className="relative z-0 [overflow-anchor:none]">
        <Routes>
          <Route path="/" element={<HomePage onOpenModal={handleOpenModal} />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/service" element={<ServicePage />} />
          <Route path="/guides" element={<GuidesPage onOpenModal={handleOpenModal} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage onOpenModal={handleOpenModal} />} />
          <Route
            path="/catalog/:id"
            element={
              <CategoryPage
                onOpenModal={handleOpenModal}
                onPreviewProduct={(item) => setPreviewItem(item)}
              />
            }
          />
        </Routes>
      </main>
      <SiteFooter onOpenModal={handleOpenModal} />
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}

export default App
