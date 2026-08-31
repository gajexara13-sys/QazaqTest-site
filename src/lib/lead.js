import { WHATSAPP_PHONE } from '../constants'

export function buildWhatsAppUrl({ name, phone, topic }) {
  const text = `Здравствуйте! Меня зовут ${name || '—'}. Интересует: ${topic}. Мой телефон: ${phone || '—'}.`
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`
}

/**
 * Отправка заявки на бэкенд/вебхук, если он настроен через VITE_LEAD_ENDPOINT
 * (например, Formspree или собственный обработчик). Без него заявка уходит
 * только через WhatsApp-кнопку на экране подтверждения.
 */
export async function sendLead(payload) {
  const endpoint = import.meta.env.VITE_LEAD_ENDPOINT
  if (!endpoint) {
    return { delivered: false }
  }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Lead endpoint responded with ${response.status}`)
  }
  return { delivered: true }
}
