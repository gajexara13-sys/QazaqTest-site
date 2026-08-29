import { useId } from 'react'
import { Link } from 'react-router-dom'
import ProductImage from './ProductImage'
import ProductSpecs from './ProductSpecs'
import { formatPrice, getCategoryById } from '../data/siteData'
import { useEscToClose, useLockBodyScroll } from '../lib/hooks'

export default function ProductModal({ item, onOpenModal, onClose }) {
  const category = getCategoryById(item.categoryId)
  const price = formatPrice(item.priceRub)
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
        className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto border border-[#78AEAD]/25 bg-white shadow-2xl shadow-slate-950/20"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center border border-[#78AEAD]/35 bg-white text-xl text-[var(--muted-text)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
          aria-label="Закрыть"
        >
          ×
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="relative min-h-[280px] border-b border-[#78AEAD]/20 bg-[var(--surface)] lg:min-h-full lg:border-b-0 lg:border-r">
            <ProductImage item={item} eager />
          </div>

          <div className="p-7 md:p-9">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">
              {item.group ?? category?.title}
            </p>
            <h2
              id={titleId}
              className="mt-3 pr-10 text-2xl font-bold leading-tight tracking-tight text-[var(--ink)] md:text-3xl"
            >
              {item.title}
            </h2>

            {item.brand || item.model ? (
              <p className="mt-2 text-sm font-medium text-[var(--muted-text)]">
                {[item.brand, item.model].filter(Boolean).join(' · ')}
              </p>
            ) : null}

            <p
              className={`mt-4 text-2xl font-black tracking-tight ${
                price ? 'text-[var(--ink)]' : 'text-[var(--muted-text)]'
              }`}
            >
              {price ?? 'Цена по запросу'}
            </p>

            <p className="mt-5 text-base leading-relaxed text-slate-600">{item.summary}</p>

            {item.features.length > 0 ? (
              <div className="mt-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted-text)]">
                  Ключевые особенности
                </p>
                <ul className="mt-4 space-y-2.5">
                  {item.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex items-start text-sm leading-relaxed text-slate-700">
                      <span className="mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {item.specs.length > 0 ? (
              <div className="mt-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted-text)]">
                  Основные характеристики
                </p>
                <div className="mt-4">
                  <ProductSpecs specs={item.specs.slice(0, 6)} />
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onOpenModal(item.title)}
                className="inline-flex min-h-13 flex-1 items-center justify-center text-center leading-tight bg-[var(--accent)] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
              >
                Запросить предложение
              </button>
              <Link
                to={`/catalog/${item.categoryId}/${item.slug}`}
                onClick={onClose}
                className="inline-flex min-h-13 flex-1 items-center justify-center text-center leading-tight border border-[#78AEAD]/35 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
              >
                Открыть карточку
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
