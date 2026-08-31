import Breadcrumbs from '../components/Breadcrumbs'
import usePageMeta from '../hooks/usePageMeta'

const SERVICES = [
  {
    title: 'Монтаж и запуск',
    description: 'Ввод в эксплуатацию, настройка режимов и сопровождение при первых циклах испытаний.',
  },
  {
    title: 'Обучение и методики',
    description: 'Помогаем лаборатории быстрее встроить оборудование в действующие методы и регламенты.',
  },
  {
    title: 'Логистика и поставка',
    description: 'Поставка, комплектация и организация логистики под задачи региональных лабораторий.',
  },
]

export default function ServicesPage() {
  usePageMeta('Услуги', 'Монтаж и запуск оборудования, обучение методикам испытаний, логистика и поставка в лаборатории Казахстана.')

  return (
    <>
      <Breadcrumbs trail={[{ title: 'Услуги' }]} />
      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-20 md:px-12">
          <h1 className="text-4xl font-black tracking-tight text-[var(--ink)] md:text-5xl">Услуги</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">
            Закрываем полный цикл: от ввода оборудования в эксплуатацию до сопровождения лаборатории в
            рабочих процессах.
          </p>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <article
                key={service.title}
                className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-8"
              >
                <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{service.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
