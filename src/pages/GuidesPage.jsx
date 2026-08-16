import { StaticPageBreadcrumbs } from '../components/Breadcrumbs'
import { DEFAULT_TOPIC } from '../constants'

const GUIDES = [
  {
    title: 'Как выбрать оборудование для лаборатории',
    description: 'Чек-лист по выбору комплектации под дорожные, бетонные и грунтовые испытания.',
  },
  {
    title: 'Подготовка к запуску и поверке',
    description: 'Пошаговый план внедрения оборудования: от установки до первых протоколов испытаний.',
  },
]

export default function GuidesPage({ onOpenModal }) {
  return (
    <>
      <StaticPageBreadcrumbs currentTitle="Гайды" />
      <section className="bg-[var(--navy)] text-white">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-20 md:px-12">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Гайды</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/75">
            Практические инструкции по выбору оборудования, запуску лабораторий и подготовке к
            испытаниям по основным направлениям.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {GUIDES.map((guide) => (
              <article key={guide.title} className="border border-white/20 bg-white/8 p-6">
                <h2 className="text-2xl font-bold tracking-tight">{guide.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/75">{guide.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-10">
            <button
              type="button"
              onClick={() => onOpenModal(DEFAULT_TOPIC)}
              className="inline-flex h-14 items-center justify-center bg-[var(--accent)] px-8 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
            >
              Получить консультацию
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
