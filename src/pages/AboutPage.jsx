import Breadcrumbs from '../components/Breadcrumbs'
import { benefits } from '../data/siteData'

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs trail={[{ title: 'О компании' }]} />
      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-20 md:px-12">
          <h1 className="text-4xl font-black tracking-tight text-[var(--ink)] md:text-5xl">О компании QAZAQTEST</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">
            Мы поставляем лабораторное оборудование для дорожных, строительных и материаловедческих
            лабораторий по всему Казахстану и сопровождаем клиентов на каждом этапе внедрения.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="border border-[#78AEAD]/25 bg-[var(--surface-card)] p-6">
                {benefit.value ? (
                  <div className="text-4xl font-black tabular-nums text-[var(--accent-bright)]">{benefit.value}</div>
                ) : null}
                <h2
                  className={`text-2xl font-bold tracking-tight text-[var(--ink)] ${
                    benefit.value ? 'mt-3' : ''
                  }`}
                >
                  {benefit.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
