import { useId } from 'react'
import { getCategoryById } from '../data/siteData'
import { formatPriceLabel } from '../lib/format'
import { useEscToClose, useLockBodyScroll } from '../lib/hooks'

export default function ProductModal({ item, onOpenModal, onClose }) {
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
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
                  {category?.title}
                </p>
                <h2 id={titleId} className="mt-4 max-w-lg text-2xl font-bold tracking-tight md:text-4xl">
                  {item.title}
                </h2>
                {item.priceLabel ? (
                  <p className="mt-4 text-lg font-semibold tracking-tight text-white">
                    {formatPriceLabel(item.priceLabel)}
                  </p>
                ) : null}
                {item.brand ? (
                  <p className="mt-2 text-sm font-medium text-white/85">{item.brand}</p>
                ) : null}
              </div>

              <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">
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
                    <div className="p-6 text-sm uppercase tracking-[0.18em] text-white/75">{item.imageLabel}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              Обзор оборудования
            </p>
            <p className="mt-5 text-base leading-relaxed text-slate-600">{item.description}</p>

            {item.features?.length > 0 ? (
              <div className="mt-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
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
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
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
                className="inline-flex h-14 flex-1 items-center justify-center rounded-2xl bg-[var(--accent)] px-6 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
              >
                Запросить предложение
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-14 min-w-[12rem] flex-1 items-center justify-center rounded-2xl border border-[#78AEAD]/35 px-6 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
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
