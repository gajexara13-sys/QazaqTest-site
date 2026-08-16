import { StaticPageBreadcrumbs } from '../components/Breadcrumbs'
import { CONTACT_PHONE_HREF, CONTACT_PHONE_LABEL, DEFAULT_TOPIC } from '../constants'

export default function ContactPage({ onOpenModal }) {
  return (
    <>
      <StaticPageBreadcrumbs currentTitle="Контакты" />
      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-20 md:px-12">
          <h1 className="text-4xl font-black tracking-tight text-[var(--ink)] md:text-5xl">Контакты</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">
            Оставьте заявку, и мы поможем подобрать оборудование под вашу лабораторию, бюджет и
            технические требования.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href={CONTACT_PHONE_HREF}
              className="inline-flex h-14 items-center justify-center border border-[#78AEAD]/35 px-8 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
            >
              {CONTACT_PHONE_LABEL}
            </a>
            <button
              type="button"
              onClick={() => onOpenModal(DEFAULT_TOPIC)}
              className="inline-flex h-14 items-center justify-center bg-[var(--accent)] px-8 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
            >
              Оставить заявку
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
