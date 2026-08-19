import { Link } from 'react-router-dom'
import ProductImage from './ProductImage'
import { formatPrice } from '../data/siteData'

/**
 * Карточка позиции в сетке каталога. Порядок блоков задан тем, как
 * читают каталог снабженцы: раздел → название с моделью → цена →
 * назначение → две ключевые характеристики → действие.
 */
/**
 * В сетке под характеристику есть одна строка, поэтому показываем не
 * первые попавшиеся, а самые компактные пары — длинные («Диапазон
 * температур нагревательного бака») превращались в «Диапазон т…».
 */
function pickKeySpecs(specs, limit = 2) {
  return specs
    .map((spec, index) => ({ spec, index }))
    .filter(({ spec }) => spec.label.length <= 22 && spec.value.length <= 22)
    .sort((a, b) => a.index - b.index)
    .slice(0, limit)
    .map(({ spec }) => spec)
}

export default function ProductCard({ item, onOpenModal, onPreview }) {
  const price = formatPrice(item.priceRub)
  const productPath = `/catalog/${item.categoryId}/${item.slug}`
  const keySpecs = pickKeySpecs(item.specs)

  return (
    <article className="group flex min-w-0 flex-col border border-[#78AEAD]/25 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition-transform hover:-translate-y-1">
      <button
        type="button"
        onClick={() => onPreview(item)}
        aria-label={`Быстрый просмотр: ${item.title}`}
        className="relative block aspect-[4/3] w-full overflow-hidden border-b border-[#78AEAD]/15 bg-white"
      >
        <ProductImage item={item} />
      </button>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
          {item.group ?? 'Оборудование'}
        </p>

        <h3 className="mt-2 break-words text-lg font-bold leading-snug tracking-tight text-[var(--ink)]">
          <Link to={productPath} className="transition-colors hover:text-[var(--accent)]">
            {item.title}
          </Link>
        </h3>

        {item.brand || item.model ? (
          <p className="mt-1 text-xs font-medium text-slate-500">
            {[item.brand, item.model].filter(Boolean).join(' · ')}
          </p>
        ) : null}

        <p
          className={`mt-3 text-lg font-bold tracking-tight ${
            price ? 'text-[var(--ink)]' : 'text-slate-500'
          }`}
        >
          {price ?? 'Цена по запросу'}
        </p>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{item.summary}</p>

        {keySpecs.length > 0 ? (
          <dl className="mt-4 space-y-1.5 border-t border-[#78AEAD]/20 pt-4 text-xs leading-relaxed">
            {keySpecs.map((spec) => (
              <div key={spec.label} className="flex justify-between gap-3">
                <dt className="min-w-0 text-slate-500">{spec.label}</dt>
                <dd className="shrink-0 text-right font-semibold text-[var(--ink)]">{spec.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-auto grid gap-2 pt-5">
          <button
            type="button"
            onClick={() => onOpenModal(item.title)}
            className="inline-flex h-11 items-center justify-center bg-[var(--accent)] px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:brightness-95"
          >
            Запросить предложение
          </button>
          <Link
            to={productPath}
            className="inline-flex h-11 items-center justify-center border border-[#78AEAD]/35 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
          >
            Подробнее
          </Link>
        </div>
      </div>
    </article>
  )
}
