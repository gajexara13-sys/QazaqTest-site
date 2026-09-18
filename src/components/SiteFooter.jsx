import { Link } from 'react-router-dom'
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_HREF,
  CONTACT_PHONE_LABEL,
  DEFAULT_TOPIC,
} from '../constants'
import { COMPANY_DETAILS } from '../data/content'

const FOOTER_LINKS = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/services', label: 'Услуги' },
  { to: '/service', label: 'Сервис' },
  { to: '/guides', label: 'Гайды' },
  { to: '/about', label: 'О компании' },
  { to: '/contact', label: 'Контакты' },
]

export default function SiteFooter({ onOpenModal }) {
  return (
    <footer id="about" className="border-t border-[#78AEAD]/25 bg-[var(--page-bg)]">
      <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-14 md:px-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <div className="text-3xl font-black tracking-tight text-[var(--ink)]">
              QAZAQ<span className="text-[var(--accent-text)]">TEST</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
              Поставка лабораторного оборудования для дорожных, строительных и материаловедческих
              лабораторий по Казахстану: подбор, логистика, монтаж и сервисное сопровождение.
            </p>
          </div>

          <nav className="lg:col-span-3" aria-label="Разделы сайта в подвале">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-text)]">
              Разделы
            </p>
            <ul className="mt-5 space-y-3 text-sm font-medium text-[var(--ink)]">
              {FOOTER_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="transition-colors hover:text-[var(--accent-text)]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-text)]">
              Связь
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-600">
              <li>
                <span className="font-semibold text-[var(--ink)]">Телефон</span>
                <br />
                <a href={CONTACT_PHONE_HREF} className="text-[var(--accent-text)] hover:underline">
                  {CONTACT_PHONE_LABEL}
                </a>
              </li>
              <li>
                <span className="font-semibold text-[var(--ink)]">E-mail</span>
                <br />
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent-text)] hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <span className="font-semibold text-[var(--ink)]">Режим работы</span>
                <br />
                Пн–Пт 9:00–18:00 (GMT+5), выходные — сб, вс
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-text)]">
              Реквизиты
            </p>
            {/* Реквизиты берём из COMPANY_DETAILS. Пустой БИН строку не выводит:
                выдуманные реквизиты в подвале хуже, чем их отсутствие. */}
            <address className="mt-5 not-italic text-sm leading-relaxed text-slate-600">
              {COMPANY_DETAILS.legalName}
              {COMPANY_DETAILS.bin ? (
                <>
                  <br />
                  БИН {COMPANY_DETAILS.bin}
                </>
              ) : null}
              <br />
              {COMPANY_DETAILS.address}
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-[#78AEAD]/25 pt-10 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => onOpenModal(DEFAULT_TOPIC)}
            className="inline-flex h-14 w-full max-w-xs items-center justify-center bg-[var(--accent)] px-8 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95 md:w-auto"
          >
            Связаться с нами
          </button>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--muted-text)]">
            <span>© {new Date().getFullYear()} QAZAQTEST. Все права защищены.</span>
            <Link to="/privacy" className="transition-colors hover:text-[var(--accent-text)]">
              Политика конфиденциальности
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
