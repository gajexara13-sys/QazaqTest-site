import { getCategoryById } from '../data/siteData'
import { formatPriceLabel } from '../lib/format'

export default function CatalogItemCard({ item, onOpenModal, onPreview }) {
  const category = getCategoryById(item.categoryId)

  return (
    <article className="flex min-w-0 flex-col border border-[#78AEAD]/25 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition-transform hover:-translate-y-1">
      <button
        type="button"
        onClick={() => onPreview(item)}
        aria-label={`Быстрый просмотр: ${item.title}`}
        className="relative block aspect-[4/3] w-full overflow-hidden border-b border-[#78AEAD]/15 bg-white"
      >
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
      </button>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
          {category?.title}
        </p>
        <h3 className="mt-2 break-words text-lg font-bold leading-snug tracking-tight text-[var(--ink)]">
          {item.title}
        </h3>
        {item.model ? (
          <p className="mt-1 text-xs font-medium text-slate-500">Модель: {item.model}</p>
        ) : null}
        {item.priceLabel ? (
          <p className="mt-2 text-lg font-bold tracking-tight text-[var(--ink)]">
            {formatPriceLabel(item.priceLabel)}
          </p>
        ) : null}
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{item.summary}</p>

        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={() => onOpenModal(item.title)}
            className="inline-flex h-11 items-center justify-center bg-[var(--accent)] px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:brightness-95"
          >
            Запросить предложение
          </button>
          <button
            type="button"
            onClick={() => onPreview(item)}
            className="inline-flex h-11 items-center justify-center border border-[#78AEAD]/35 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
          >
            Быстрый просмотр
          </button>
        </div>
      </div>
    </article>
  )
}
