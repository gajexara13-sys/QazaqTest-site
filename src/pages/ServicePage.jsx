import { StaticPageBreadcrumbs } from '../components/Breadcrumbs'

const SERVICE_BLOCKS = [
  {
    title: 'Диагностика',
    description: 'Проверка текущего состояния оборудования и рекомендации по обслуживанию.',
  },
  {
    title: 'Калибровка',
    description: 'Настройка приборов и восстановление точности измерений по требованиям методик.',
  },
  {
    title: 'Выезд инженера',
    description: 'Оперативная помощь на площадке для решения технических и эксплуатационных вопросов.',
  },
]

export default function ServicePage() {
  return (
    <>
      <StaticPageBreadcrumbs currentTitle="Сервис" />
      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-20 md:px-12">
          <h1 className="text-4xl font-black tracking-tight text-[var(--ink)] md:text-5xl">Сервис</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">
            Техническое сопровождение оборудования, контроль состояния приборов и регулярные регламентные
            работы для бесперебойной работы лаборатории.
          </p>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {SERVICE_BLOCKS.map((block) => (
              <article key={block.title} className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-8">
                <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{block.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{block.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
