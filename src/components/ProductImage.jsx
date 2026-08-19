import { useState } from 'react'
import { getCategoryById } from '../data/siteData'

/**
 * Заглушка вместо фото. Фотографии позиций в выгрузке лежали на стороннем
 * хостинге и на сайте не отдаются, поэтому карточка без снимка должна
 * выглядеть осознанно: схематичный силуэт прибора, код модели и раздел —
 * вместо серого прямоугольника с иконкой битой картинки.
 *
 * compact — для миниатюр (подсказки поиска): подпись там не помещается,
 * остаётся только силуэт. Родитель обязан быть позиционированным.
 */
function ProductPlaceholder({ item, compact }) {
  const category = getCategoryById(item.categoryId)
  const caption = item.model ?? item.brand ?? category?.title

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[linear-gradient(150deg,var(--surface)_0%,#ffffff_55%,var(--surface-card)_100%)] px-4 text-center">
      <svg
        viewBox="0 0 64 64"
        className={compact ? 'h-12 w-12' : 'h-20 w-20'}
        fill="none"
        stroke="var(--panel)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        opacity="0.45"
      >
        <rect x="12" y="8" width="40" height="48" rx="4" />
        <path d="M12 20h40" />
        <circle cx="32" cy="36" r="9" />
        <path d="M32 27v9l6 4M20 14h6M38 14h6" />
      </svg>
      {caption ? (
        <span
          className={`font-bold uppercase tracking-[0.18em] text-slate-500 ${
            compact ? 'text-[9px]' : 'text-[10px]'
          }`}
        >
          {caption}
        </span>
      ) : null}
      <span className="sr-only">Фото уточняется</span>
    </div>
  )
}

/**
 * Фото товара с деградацией до заглушки: и когда снимка нет в данных,
 * и когда он есть, но не загрузился.
 */
export default function ProductImage({ item, compact = false, eager = false, className = '' }) {
  const [hasFailed, setFailed] = useState(false)

  if (!item.image || hasFailed) {
    return <ProductPlaceholder item={item} compact={compact} />
  }

  return (
    <img
      src={item.image}
      alt={`${item.title}${item.model ? `, модель ${item.model}` : ''}`}
      onError={() => setFailed(true)}
      className={`absolute inset-0 h-full w-full object-contain p-4 ${className}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}
