import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductCard from '../components/ProductCard'
import ProductImage from '../components/ProductImage'
import ProductSpecs from '../components/ProductSpecs'
import usePageMeta from '../hooks/usePageMeta'
import {
  formatPrice,
  getCategoryById,
  getCategoryItems,
  getProductBySlug,
} from '../data/siteData'

const RELATED_LIMIT = 3

/** Соседние позиции: сначала из того же подраздела, затем из раздела. */
function getRelatedItems(item) {
  const siblings = getCategoryItems(item.categoryId).filter((other) => other.id !== item.id)
  const sameGroup = siblings.filter((other) => other.group && other.group === item.group)
  return [...sameGroup, ...siblings.filter((other) => !sameGroup.includes(other))].slice(
    0,
    RELATED_LIMIT,
  )
}

function NotFound() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">404</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--ink)]">Позиция не найдена</h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600">
        Возможно, карточка переехала в другой раздел. Откройте каталог — или напишите нам, и мы
        подберём аналог.
      </p>
      <Link
        to="/catalog"
        className="mt-8 inline-flex h-12 items-center justify-center bg-[var(--accent)] px-6 text-xs font-bold uppercase tracking-[0.16em] text-white"
      >
        В каталог
      </Link>
    </section>
  )
}

export default function ProductPage({ onOpenModal, onPreviewProduct }) {
  const { categoryId, slug } = useParams()
  const item = getProductBySlug(categoryId, slug)
  const category = getCategoryById(categoryId)

  usePageMeta(item?.title, item?.summary)

  if (!item || !category) {
    return <NotFound />
  }

  const price = formatPrice(item.priceRub)
  const related = getRelatedItems(item)

  return (
    <>
      <Breadcrumbs
        trail={[
          { title: 'Каталог', to: '/catalog' },
          { title: category.title, to: `/catalog/${category.id}` },
          { title: item.title },
        ]}
      />

      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-12 md:px-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
            <div className="relative aspect-[4/3] w-full overflow-hidden border border-[#78AEAD]/25 bg-white">
              <ProductImage item={item} eager />
            </div>

            <div className="flex flex-col">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">
                {item.group ?? category.title}
              </p>
              <h1 className="mt-4 hyphens-auto break-words text-2xl font-black leading-tight tracking-tight text-[var(--ink)] sm:text-3xl md:text-4xl">
                {item.title}
              </h1>

              {item.brand || item.model ? (
                <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                  {item.brand ? (
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted-text)]">
                        Производитель
                      </dt>
                      <dd className="mt-1 font-semibold text-[var(--ink)]">{item.brand}</dd>
                    </div>
                  ) : null}
                  {item.model ? (
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted-text)]">
                        Модель
                      </dt>
                      <dd className="mt-1 font-semibold text-[var(--ink)]">{item.model}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              <div className="mt-7 border border-[#78AEAD]/25 bg-white p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted-text)]">
                  Стоимость
                </p>
                <p
                  className={`mt-2 text-3xl font-black tracking-tight ${
                    price ? 'text-[var(--ink)]' : 'text-[var(--muted-text)]'
                  }`}
                >
                  {price ?? 'По запросу'}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-[var(--muted-text)]">
                  Цена ориентировочная, пересчитывается на день выставления счёта. Доставка,
                  пусконаладка и обучение персонала считаются отдельно.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onOpenModal(item.title)}
                    className="inline-flex min-h-13 flex-1 items-center justify-center text-center leading-tight bg-[var(--accent)] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
                  >
                    Запросить предложение
                  </button>
                  <Link
                    to={`/catalog/${category.id}`}
                    className="inline-flex min-h-13 flex-1 items-center justify-center text-center leading-tight border border-[#78AEAD]/35 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
                  >
                    Похожие позиции
                  </Link>
                </div>
              </div>

              <p className="mt-7 text-base leading-relaxed text-slate-600">{item.summary}</p>
            </div>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
            <div className="min-w-0">
              {item.paragraphs.length > 0 ? (
                <div>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">
                    Назначение и принцип работы
                  </h2>
                  <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-600">
                    {item.paragraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              {item.features.length > 0 ? (
                <div className={item.paragraphs.length > 0 ? 'mt-10' : ''}>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">
                    Ключевые особенности
                  </h2>
                  <ul className="mt-5 space-y-3">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start text-sm leading-relaxed text-slate-700">
                        <span className="mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="min-w-0">
              {item.specs.length > 0 ? (
                <>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">
                    Технические характеристики
                  </h2>
                  <div className="mt-5">
                    <ProductSpecs specs={item.specs} />
                  </div>
                </>
              ) : (
                <div className="border border-dashed border-[#78AEAD]/35 bg-white p-6">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">
                    Технические характеристики
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    Полный паспорт прибора и протокол поверки высылаем по запросу — вместе с
                    коммерческим предложением.
                  </p>
                </div>
              )}

              {item.tags.length > 0 ? (
                <div className="mt-8 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-[#78AEAD]/25 bg-[var(--mint)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {related.length > 0 ? (
            <div className="mt-16 border-t border-[#78AEAD]/25 pt-12">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
                Смотрите также
              </h2>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {related.map((relatedItem) => (
                  <ProductCard
                    key={relatedItem.id}
                    item={relatedItem}
                    onOpenModal={onOpenModal}
                    onPreview={onPreviewProduct}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}
