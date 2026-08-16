import { Link } from 'react-router-dom'
import BrandsMarquee from '../components/BrandsMarquee'
import CategoriesBentoGrid from '../components/CategoriesBentoGrid'
import { DEFAULT_TOPIC } from '../constants'
import { benefits } from '../data/siteData'

export default function HomePage({ onOpenModal }) {
  return (
    <>
      <section className="relative overflow-hidden bg-[var(--hero-mid)] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,174,84,0.14),_transparent_36%),linear-gradient(135deg,_rgba(212,236,233,0.06),_transparent_48%)]" />
        <div className="relative mx-auto grid max-w-[var(--page-shell-max)] gap-10 px-6 py-20 md:gap-12 md:px-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14 lg:py-28">
          <div className="max-w-4xl">
            <h1 className="max-w-4xl text-balance text-4xl font-black leading-[1.06] tracking-[-0.01em] sm:text-5xl sm:leading-[1.04] md:text-7xl md:leading-[1.0]">
              Оборудование для{' '}
              <span className="text-[var(--accent-bright)]">дорожных и строительных</span> лабораторий в Казахстане.
            </h1>
            <div className="mt-8 h-1 w-28 rounded-full bg-[var(--accent)]" />
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/75">
              Поставляем оборудование, которое знаем технически — не по каталогу, а по опыту работы в
              лаборатории. Имеем собственную сервисную службу.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/catalog"
                className="inline-flex h-16 items-center justify-center rounded-none bg-[var(--accent)] px-10 text-sm font-bold uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-0.5"
              >
                Перейти в каталог
              </Link>
              <button
                type="button"
                onClick={() => onOpenModal(DEFAULT_TOPIC)}
                className="inline-flex h-16 items-center justify-center border border-white/20 px-10 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/8"
              >
                Связаться с нами
              </button>
            </div>
          </div>

          <div className="grid gap-4 self-end">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="border border-white/12 bg-white/6 p-6 backdrop-blur-sm">
                {benefit.value ? (
                  <div className="text-5xl font-black tabular-nums text-[var(--accent-bright)]">{benefit.value}</div>
                ) : null}
                <div
                  className={`text-xs font-extrabold uppercase tracking-[0.18em] text-white/75 ${
                    benefit.value ? 'mt-3' : ''
                  }`}
                >
                  {benefit.title}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/75">{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="brands" className="border-b border-[#78AEAD]/25 bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-14 md:px-12 md:py-16 lg:py-20">
          <h2 className="max-w-4xl text-3xl font-black tracking-tight text-[var(--ink)] md:text-5xl">
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
            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">Категории оборудования</h2>
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
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              Сервис
            </p>
            <h3 className="mt-4 text-3xl font-bold tracking-tight text-[var(--ink)]">Монтаж и запуск</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Ввод в эксплуатацию, настройка режимов и сопровождение при первых циклах испытаний.
            </p>
          </article>
          <article className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              Поддержка
            </p>
            <h3 className="mt-4 text-3xl font-bold tracking-tight text-[var(--ink)]">Обучение и методики</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Помогаем лаборатории быстрее встроить оборудование в действующие методы и регламенты.
            </p>
          </article>
          <article className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
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
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              Материалы и поддержка
            </p>
            <h2 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">Создано для технических специалистов и лабораторий.</h2>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/75">
              Подскажем по стандартам и методикам испытаний, поможем укомплектовать лабораторию под
              требования аккредитации и сопроводим запуск оборудования на площадке.
            </p>
          </div>

          <div className="border border-white/12 bg-white/6 p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              Канал связи
            </p>
            <h3 className="mt-4 text-3xl font-bold tracking-tight">Нужна конфигурация под вашу задачу?</h3>
            <button
              type="button"
              onClick={() => onOpenModal(DEFAULT_TOPIC)}
              className="mt-8 inline-flex h-14 items-center justify-center bg-[var(--accent)] px-8 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
            >
              Запросить консультацию
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
