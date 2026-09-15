/**
 * Предрендер: для каждого адреса из карты сайта кладёт рядом со сборкой
 * настоящий HTML-файл с готовым заголовком, описанием и текстом страницы.
 *
 * Зачем. Сайт — одностраничное приложение: сервер отдаёт один index.html с
 * пустым <div id="root">, а заголовок, описание и содержимое дописывает
 * JavaScript уже в браузере. Поисковому роботу по всем 154 адресам
 * приходило одно и то же:
 *
 *     <title>QAZAQTEST — лабораторное оборудование…</title>   заголовок главной
 *     <link rel="canonical" href="https://qazaqtest.kz/">      «это копия главной»
 *     <body><div id="root"></div></body>                       пусто
 *
 * Причём canonical со всех 134 карточек указывал на главную — это прямое
 * указание поисковику не индексировать страницу, а взять вместо неё главную.
 * Google выполняет JavaScript, но во вторую очередь и с задержкой; Яндекс в
 * основном не выполняет вовсе. Отсюда и результат: главная в выдаче есть,
 * товаров нет.
 *
 * Как. Поднимаем локальный сервер над dist/, проходим настоящим браузером по
 * каждому адресу из sitemap.xml, дожидаемся отрисовки и сохраняем получившийся
 * HTML в файл. Дальше .htaccess отдаёт этот файл напрямую — робот получает
 * готовую страницу, не выполняя ни строчки JavaScript.
 *
 * Список адресов берём из самой карты сайта, а не собираем заново: так
 * предрендер и карта не могут разойтись по составу.
 */
import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')

const PORT = 4321
const CONCURRENCY = 4

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
}

/**
 * Статика из dist/ с откатом на пустую заготовку — как ведёт себя боевой
 * сервер до выкладки готовых страниц.
 *
 * Заготовку держим в памяти и отдаём её же на любой неизвестный адрес.
 * Читать её с диска нельзя: маршрут «/» пишется в тот же dist/index.html, и
 * стоит ему отрисоваться первым, как все следующие страницы начинают
 * строиться поверх уже отрисованной главной — с её подсказками на чанки и её
 * разметкой в <head>.
 */
function startServer(shell) {
  const server = createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    const file = path.join(dist, urlPath)

    try {
      const info = await stat(file)
      if (!info.isFile()) {
        throw new Error('не файл')
      }
    } catch {
      res.writeHead(200, { 'Content-Type': MIME['.html'] })
      return res.end(shell)
    }

    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  })

  return new Promise((resolve) => server.listen(PORT, () => resolve(server)))
}

/** Адреса берём из готовой карты сайта — она и есть список индексируемых страниц. */
async function readRoutes() {
  const xml = await readFile(path.join(dist, 'sitemap.xml'), 'utf8')
  const routes = [...xml.matchAll(/<loc>https:\/\/qazaqtest\.kz([^<]*)<\/loc>/g)].map((m) => m[1] || '/')

  if (routes.length === 0) {
    throw new Error('В dist/sitemap.xml не нашлось ни одного адреса')
  }
  return routes
}

/** /catalog/asphalt/press → dist/catalog/asphalt/press.html, / → dist/index.html */
function outputPath(route) {
  if (route === '/') {
    return path.join(dist, 'index.html')
  }
  return path.join(dist, `${route.replace(/^\//, '')}.html`)
}

/**
 * Страницы подключаются лениво, поэтому код конкретной страницы лежит в
 * отдельном чанке. Без этой подсказки браузер узнавал бы о нём только после
 * запуска основного скрипта: готовый HTML успел бы отрисоваться, а React —
 * стереть его и показать пустоту, пока догружается чанк. Перечисляем чанки,
 * которые реально запросил браузер при отрисовке этой страницы, чтобы они
 * грузились сразу и параллельно.
 */
function injectPreloads(html, chunks) {
  const already = new Set([...html.matchAll(/href="([^"]+\.js)"/g)].map((m) => m[1]))
  const missing = [...chunks].filter((chunk) => !already.has(chunk))

  if (missing.length === 0) {
    return html
  }

  const tags = missing
    .map((chunk) => `    <link rel="modulepreload" crossorigin href="${chunk}">`)
    .join('\n')

  return html.replace('</head>', `${tags}\n  </head>`)
}

async function renderRoute(browser, route) {
  const page = await browser.newPage()
  const chunks = new Set()
  const problems = []

  page.on('response', (res) => {
    const { pathname } = new URL(res.url())
    if (pathname.startsWith('/assets/') && pathname.endsWith('.js')) {
      chunks.add(pathname)
    }
  })
  page.on('pageerror', (error) => problems.push(String(error)))

  try {
    await page.goto(`http://localhost:${PORT}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    // Заголовок первого уровня есть на каждой странице сайта — значит,
    // маршрут догрузился и отрисовался, а не висит на заглушке Suspense.
    await page.waitForSelector('h1', { timeout: 30_000 })
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})

    const html = await page.content()

    if (problems.length > 0) {
      throw new Error(`ошибки страницы: ${problems.join('; ')}`)
    }

    return { file: outputPath(route), html: injectPreloads(html, chunks) }
  } finally {
    await page.close()
  }
}

// ---------------------------------------------------------------------------

const shell = await readFile(path.join(dist, 'index.html'), 'utf8')
const server = await startServer(shell)
const routes = await readRoutes()

let browser
try {
  browser = await chromium.launch()
} catch (error) {
  server.close()
  console.error('Не удалось запустить Chromium для предрендера.')
  console.error('Установите браузер командой:  npx playwright install chromium')
  console.error(`\nИсходная ошибка: ${error.message.split('\n')[0]}`)
  process.exit(1)
}

const failures = []
const pages = []
let done = 0

async function worker(queue) {
  while (queue.length > 0) {
    const route = queue.shift()
    try {
      pages.push(await renderRoute(browser, route))
    } catch (error) {
      failures.push(`${route}: ${error.message}`)
    }
    done += 1
    if (done % 25 === 0 || done === routes.length) {
      process.stdout.write(`  отрисовано ${done} из ${routes.length}\n`)
    }
  }
}

const queue = [...routes]
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)))

await browser.close()
server.close()

if (failures.length > 0) {
  console.error(`\nне отрисовалось страниц: ${failures.length}`)
  for (const failure of failures) {
    console.error(`  ${failure}`)
  }
  process.exit(1)
}

// Пишем только теперь, когда отрисованы все страницы: иначе готовая главная
// легла бы в dist/index.html посреди работы и стала бы заготовкой для
// остальных страниц.
for (const { file, html } of pages) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, html)
}

console.log(`предрендер: ${pages.length} страниц`)
