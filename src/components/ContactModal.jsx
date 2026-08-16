import { useEffect, useId, useRef, useState } from 'react'
import { CONTACT_PHONE_HREF, CONTACT_PHONE_LABEL } from '../constants'
import { useEscToClose, useLockBodyScroll } from '../lib/hooks'
import { buildWhatsAppUrl, sendLead } from '../lib/lead'

export default function ContactModal({ selectedCategory, onClose }) {
  const [formData, setFormData] = useState({ name: '', phone: '' })
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const nameInputRef = useRef(null)
  const titleId = useId()

  useLockBodyScroll(true)
  useEscToClose(onClose)

  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('sending')
    try {
      await sendLead({
        name: formData.name,
        phone: formData.phone,
        topic: selectedCategory,
        page: window.location.href,
        submittedAt: new Date().toISOString(),
      })
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  const isSubmitted = status === 'sent' || status === 'error'

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Закрыть модальное окно"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-lg rounded-[2rem] border border-[#78AEAD]/25 bg-[var(--mint)] p-8 shadow-2xl shadow-slate-950/20 sm:p-10"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#78AEAD]/25 text-xl text-slate-500 transition-colors hover:border-slate-900 hover:text-[var(--ink)]"
          aria-label="Закрыть"
        >
          ×
        </button>

        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
          Запрос
        </p>
        <h2 id={titleId} className="mt-4 pr-12 text-3xl font-bold tracking-tight text-[var(--ink)]">
          Запрос на консультацию
        </h2>
        <p className="mt-4 text-sm uppercase tracking-[0.16em] text-slate-500">
          Тема: {selectedCategory}
        </p>

        {isSubmitted ? (
          <div className="mt-8 rounded-[1.5rem] bg-[var(--surface)] p-6">
            {status === 'sent' ? (
              <>
                <p className="text-lg font-semibold text-[var(--ink)]">Заявка принята.</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Мы свяжемся с вами по номеру {formData.phone} и уточним детали по теме "{selectedCategory}".
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-[var(--ink)]">Не получилось отправить автоматически.</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Напишите нам в WhatsApp или позвоните по номеру{' '}
                  <a href={CONTACT_PHONE_HREF} className="font-semibold text-[var(--accent)]">
                    {CONTACT_PHONE_LABEL}
                  </a>{' '}
                  — ответим быстро.
                </p>
              </>
            )}
            <a
              href={buildWhatsAppUrl({ ...formData, topic: selectedCategory })}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#25D366] px-6 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
            >
              Продублировать в WhatsApp
            </a>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Ваше имя
              </span>
              <input
                ref={nameInputRef}
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="h-14 w-full rounded-2xl border border-[#78AEAD]/25 bg-[var(--surface)] px-5 outline-none transition-all focus:border-[var(--accent)] focus:bg-[var(--mint)]"
                placeholder="Как к вам обращаться"
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Телефон
              </span>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="h-14 w-full rounded-2xl border border-[#78AEAD]/25 bg-[var(--surface)] px-5 outline-none transition-all focus:border-[var(--accent)] focus:bg-[var(--mint)]"
                placeholder="+7 (___) ___ __ __"
                autoComplete="tel"
              />
            </label>

            <div className="flex flex-col gap-3 pt-3 sm:flex-row">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex h-14 flex-1 items-center justify-center rounded-2xl bg-[var(--accent)] px-6 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95 disabled:cursor-wait disabled:opacity-70"
              >
                {status === 'sending' ? 'Отправляем…' : 'Отправить запрос'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-14 flex-1 items-center justify-center rounded-2xl border border-[#78AEAD]/35 px-6 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
              >
                Закрыть
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
