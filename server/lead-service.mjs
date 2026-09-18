/**
 * Приём заявок с сайта. Небольшой HTTP-сервис под VPS: nginx отдаёт статику и
 * проксирует сюда только POST /lead.
 *
 * Зависимостей нет — работает на голом Node 20+, `npm install` на сервере не
 * нужен.
 *
 * Порядок действий при заявке:
 *   1. записать в журнал на диск — это происходит всегда и первым;
 *   2. отправить уведомление в Telegram;
 *   3. ответить сайту.
 *
 * Журнал первым не случайно: уведомление может не уйти (Telegram недоступен,
 * токен протух, сеть легла), и заявка не должна пропасть вместе с ним. Пока
 * строка записана на диск, клиента можно найти и перезвонить.
 *
 * Переменные окружения:
 *   LEAD_PORT            порт, по умолчанию 8081 (только localhost)
 *   LEAD_LOG             путь к журналу, по умолчанию ./leads.jsonl
 *   LEAD_TG_BOT_TOKEN    токен бота от @BotFather
 *   LEAD_TG_CHAT_ID      куда слать: ваш id или id группы
 *   LEAD_ALLOWED_ORIGIN  ожидаемый Origin, например https://qazaqtest.kz
 *
 * Без токена Telegram сервис работает: пишет в журнал и отвечает успехом,
 * а в консоль печатает предупреждение — так видно, что уведомления выключены.
 */
import { appendFile, mkdir } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'

const PORT = Number(process.env.LEAD_PORT ?? 8081)
const LOG_PATH = path.resolve(process.env.LEAD_LOG ?? 'leads.jsonl')
const TG_TOKEN = process.env.LEAD_TG_BOT_TOKEN ?? ''
const TG_CHAT = process.env.LEAD_TG_CHAT_ID ?? ''
const ALLOWED_ORIGIN = process.env.LEAD_ALLOWED_ORIGIN ?? ''

const MAX_BODY_BYTES = 4 * 1024

/**
 * Ограничений два, и считают они разное.
 *
 * Один счётчик — на все обращения подряд: он держит поток мусора и не даёт
 * забить сервис. Второй — только на принятые заявки: он против спам-ботов,
 * рассылающих правдоподобные формы.
 *
 * Разделены они потому, что общий счётчик наказывал бы живого человека: тот,
 * кто дважды опечатался в телефоне, а потом исправил, расходовал бы лимит
 * наравне с ботом и упирался в отказ на настоящей заявке.
 */
const LIMITS = {
  requests: { windowMs: 60_000, max: 20 },
  accepted: { windowMs: 10 * 60_000, max: 5 },
}

const counters = { requests: new Map(), accepted: new Map() }

function hit(kind, ip) {
  const { windowMs, max } = LIMITS[kind]
  const now = Date.now()
  const fresh = (counters[kind].get(ip) ?? []).filter((at) => now - at < windowMs)
  fresh.push(now)
  counters[kind].set(ip, fresh)
  return fresh.length > max
}

// Карты адресов иначе растут бесконечно
setInterval(() => {
  const now = Date.now()
  for (const [kind, map] of Object.entries(counters)) {
    for (const [ip, times] of map) {
      if (times.every((at) => now - at >= LIMITS[kind].windowMs)) {
        map.delete(ip)
      }
    }
  }
}, 60_000).unref()

const clean = (value, limit) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, limit) : ''

/** Заявка без имени или телефона бесполезна: перезвонить некому */
function validate(raw) {
  const name = clean(raw.name, 120)
  const phone = clean(raw.phone, 40)
  if (!name || !phone) {
    return { error: 'Укажите имя и телефон' }
  }
  if ((phone.match(/\d/g) ?? []).length < 10) {
    return { error: 'Телефон выглядит неполным' }
  }
  return {
    lead: {
      name,
      phone,
      topic: clean(raw.topic, 200) || 'Общий запрос',
      page: clean(raw.page, 300),
      submittedAt: new Date().toISOString(),
    },
  }
}

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function notifyTelegram(lead) {
  if (!TG_TOKEN || !TG_CHAT) {
    return { sent: false, reason: 'не настроен' }
  }
  const text = [
    '<b>Заявка с сайта QAZAQTEST</b>',
    '',
    `<b>Имя:</b> ${escapeHtml(lead.name)}`,
    `<b>Телефон:</b> ${escapeHtml(lead.phone)}`,
    `<b>Тема:</b> ${escapeHtml(lead.topic)}`,
    lead.page ? `<b>Страница:</b> ${escapeHtml(lead.page)}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const response = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    return { sent: false, reason: `HTTP ${response.status}` }
  }
  return { sent: true }
}

class BodyTooLarge extends Error {}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    let stopped = false
    const chunks = []
    req.on('data', (chunk) => {
      if (stopped) {
        return
      }
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        // Соединение здесь не рвём: оборванный сокет оставит отправителя без
        // ответа, и он не узнает, почему заявка не прошла. Дочитываем молча,
        // а причину сообщаем кодом 413.
        stopped = true
        reject(new BodyTooLarge())
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/**
 * Заголовки для запроса с другого источника.
 *
 * В штатной схеме они не нужны: nginx проксирует /api/lead на том же домене,
 * и браузер считает запрос своим. Но если эндпоинт пропишут абсолютным
 * адресом (другой поддомен, отдельный сервер под API), браузер сначала пришлёт
 * OPTIONS, и без ответа на него форма ляжет молча — на экране будет только
 * «заявка не ушла», а в журнале сервиса ни строчки.
 */
function corsHeaders(origin) {
  if (!ALLOWED_ORIGIN || origin !== ALLOWED_ORIGIN) {
    return {}
  }
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

const json = (res, code, payload, origin) => {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders(origin),
  })
  res.end(JSON.stringify(payload))
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin

  if (req.method === 'GET' && req.url === '/health') {
    json(res, 200, { ok: true, telegram: Boolean(TG_TOKEN && TG_CHAT) }, origin)
    return
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders(origin))
    res.end()
    return
  }

  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' }, origin)
    return
  }

  // За nginx настоящий адрес приходит в X-Forwarded-For
  const ip = (req.headers['x-forwarded-for'] ?? '').toString().split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown'

  if (hit('requests', ip)) {
    json(res, 429, { error: 'Слишком много обращений, попробуйте через минуту' }, origin)
    return
  }

  // Заявку с чужого домена не принимаем: форма живёт только на нашем сайте
  if (ALLOWED_ORIGIN && origin && origin !== ALLOWED_ORIGIN) {
    json(res, 403, { error: 'Forbidden origin' }, origin)
    return
  }

  let raw
  try {
    raw = JSON.parse(await readBody(req))
  } catch (parseError) {
    if (parseError instanceof BodyTooLarge) {
      json(res, 413, { error: 'Слишком длинный запрос' }, origin)
      return
    }
    json(res, 400, { error: 'Некорректный запрос' }, origin)
    return
  }

  const { lead, error } = validate(raw)
  if (error) {
    json(res, 400, { error }, origin)
    return
  }

  if (hit('accepted', ip)) {
    json(res, 429, { error: 'Заявка уже отправлена, мы свяжемся с вами' }, origin)
    return
  }

  try {
    await mkdir(path.dirname(LOG_PATH), { recursive: true })
    await appendFile(LOG_PATH, `${JSON.stringify({ ...lead, ip })}\n`, 'utf8')
  } catch (writeError) {
    // Записать не смогли — принимать заявку нельзя: сайт скажет клиенту
    // «принято», а её нигде не будет. Пусть лучше сработает WhatsApp.
    console.error('[lead] журнал недоступен:', writeError.message)
    json(res, 500, { error: 'Не удалось сохранить заявку' }, origin)
    return
  }

  const telegram = await notifyTelegram(lead).catch((notifyError) => ({
    sent: false,
    reason: notifyError.message,
  }))
  // О невыключённом Telegram уже сказано при старте — здесь важны только сбои
  if (!telegram.sent && telegram.reason !== 'не настроен') {
    console.warn(`[lead] уведомление не ушло (${telegram.reason}), заявка в журнале`)
  }

  console.log(`[lead] ${lead.name} · ${lead.phone} · ${lead.topic}`)
  json(res, 200, { ok: true }, origin)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[lead] слушает 127.0.0.1:${PORT}, журнал: ${LOG_PATH}`)
  if (!TG_TOKEN || !TG_CHAT) {
    console.warn('[lead] Telegram не настроен: заявки только в журнал')
  }
})
