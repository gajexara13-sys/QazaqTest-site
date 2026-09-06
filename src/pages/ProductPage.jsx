import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductCard from '../components/ProductCard'
import ProductImage from '../components/ProductImage'
import ProductSpecs from '../components/ProductSpecs'
import { SITE_ORIGIN } from '../constants'
import usePageMeta from '../hooks/usePageMeta'
import useProductSchema from '../hooks/useProductSchema'
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
  useProductSchema(item, item ? `${SITE_ORIGIN}/catalog/${item.categoryId}/${item.slug}` : null)

  if (!item || !category) {
    return <NotFound />
  }

  const price = formatPrice(item.priceKzt)
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

      <section className="bg-white">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-12 md:px-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-0">
            {/*
              Квадрат, а не 4:3: из 135 снимков 93 квадратные или вертикальные,
              и в широком контейнере прибор висел в пустоте, занимая едва
              половину высоты. Медиана пропорций по всей витрине — ровно 1:1.
            */}
            <div className="lg:order-2 lg:flex lg:items-center lg:border-l lg:border-[var(--ink)]/12 lg:pl-12">
              <div className="relative aspect-square w-full overflow-hidden bg-white">
                <ProductImage item={item} eager />
              </div>
            </div>

            {/*
              Колонки делит тонкая линия в цвет шапки — как в газетной вёрстке.
              Толстая и контрастная читалась бы как стена: на бледном поле она
              оказывалась самым тёмным пятном страницы и спорила с содержимым.
            */}
            <div className="flex flex-col lg:order-1 lg:pr-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">
                {item.group ?? category.title}
              </p>
              <h1 className="mt-4 hyphens-auto break-words text-2xl font-black leading-tight tracking-tight text-[var(--ink)] sm:text-3xl md:text-4xl">
                {item.title}
              </h1>

              {/* Короткий акцентный штрих — тот же приём, что в первом экране главной. */}
              <span aria-hidden="true" className="mt-6 block h-[3px] w-16 bg-[var(--accent)]" />

              {/*
                Аннотация встала сразу под заголовком, до цены: сначала что это
                за прибор, потом сколько он стоит. Раньше описание оказывалось
                под кнопками, то есть после того, как решение уже предложено.
              */}
              <p className="mt-6 text-base leading-relaxed text-slate-600">{item.summary}</p>

              {item.brand || item.model ? (
                <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-sm">
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

              {/*
                Цену держит не рамка, а воздух и размер числа. Коробка внутри
                белого блока добавляла ещё одну границу там, где хватает
                горизонтальной линии.
              */}
              <div className="mt-8 border-t border-[var(--ink)]/12 pt-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted-text)]">
                  Стоимость
                </p>
                <p
                  className={`mt-2 text-3xl font-black tracking-tight sm:text-4xl ${
                    price ? 'text-[var(--ink)]' : 'text-[var(--muted-text)]'
                  }`}
                >
                  {price ?? 'По запросу'}
                </p>
                <p className="mt-3 max-w-md text-xs leading-relaxed text-[var(--muted-text)]">
                  Цена ориентировочная, пересчитывается на день выставления счёта. Доставка,
                  пусконаладка и обучение персонала считаются отдельно.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onOpenModal(item.title)}
                    className="inline-flex min-h-13 flex-1 items-center justify-center text-center leading-tight bg-[var(--accent)] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
                  >
                    Запросить предложение
                  </button>
                  <Link
                    to={`/catalog/${category.id}`}
                    className="inline-flex min-h-13 flex-1 items-center justify-center text-center leading-tight border border-[var(--ink)]/20 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
                  >
                    Похожие позиции
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-12 md:px-12 md:py-16">
          {/*
            Пропорции те же, что в верхнем блоке, — тогда обе вертикальные
            линейки встают на одну ось и держат страницу единой сеткой.
            Раньше колонки делились как 1,15:1 против 1:1, линейки расходились
            на 35 пикселей, и это читалось как брак вёрстки, а не как приём.
          */}
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-0">
            <div className="min-w-0 lg:pr-12">
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

            <div className="min-w-0 lg:border-l lg:border-[var(--ink)]/12 lg:pl-12">
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
                <div className="border border-dashed border-[var(--ink)]/20 p-6">
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
                      className="border border-[var(--ink)]/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {related.length > 0 ? (
            <div className="mt-16 border-t border-[var(--ink)]/12 pt-12">
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
