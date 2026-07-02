import { Link } from 'react-router-dom'
import { categories } from '../data/siteData'

/** Короткие подписи в сетке, чтобы прямоугольники были одинаковой высоты */
const SHORT_TITLE = {
  'general-lab': 'Общелаб',
}

/**
 * Сетка категорий: карточки каталога с фотофоном вверху и
 * белой подписью снизу. Без свечений, ротаций текста и разных размеров —
 * строгая, фотогеничная сетка.
 */
export default function CategoriesBentoGrid() {
  return (
    <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/catalog/${category.id}`}
          className="group relative flex min-h-[150px] flex-col overflow-hidden border border-white/12 bg-white/[0.04] transition-transform duration-300 ease-out hover:-translate-y-0.5"
        >
          <div className="relative flex-1 w-full overflow-hidden bg-[var(--panel)]">
            <div
              className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              style={{ background: category.image }}
              aria-hidden
            />
          </div>
          <div className="flex items-center justify-between gap-3 bg-white px-4 py-[8px] sm:gap-4 sm:px-5">
            <span className="min-w-0 flex-1 text-sm font-bold uppercase leading-snug tracking-tight text-[var(--ink)] sm:text-base">
              {SHORT_TITLE[category.id] ?? category.title}
            </span>
            <span className="text-2xl leading-none text-[var(--accent)] transition-transform duration-300 ease-out group-hover:translate-x-1">
              →
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
