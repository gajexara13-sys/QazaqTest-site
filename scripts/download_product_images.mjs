/**
 * Скачивает фото товаров из поля imageSource в public/products/ и
 * прописывает локальные пути в src/data/catalog.overrides.json.
 *
 * Пути пишутся именно в overrides, а не в catalog.json: витрина
 * перегенерируется скриптом normalize_catalog.mjs и любые правки в ней
 * затираются. После загрузки нужно пересобрать каталог.
 *
 * И ключ правки, и имя файла — `wp-<id записи в WooCommerce>`, а не порядковый
 * `qzt-N`: импорт выгрузки присваивает порядковые номера заново, и привязанные
 * к ним фото разъехались бы по чужим карточкам.
 *
 * Запуск:  npm run images:download && npm run catalog:build
 * Повторный запуск безопасен: уже скачанные файлы пропускаются.
 */

import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG_PATH = path.join(root, 'src/data/catalog.json')
const OVERRIDES_PATH = path.join(root, 'src/data/catalog.overrides.json')
const OUT_DIR = path.join(root, 'public/products')
const CONCURRENCY = 5

const exists = (p) => access(p).then(() => true, () => false)

/** Устойчивый между выгрузками ключ позиции */
const stableKey = (item) => (item.wpId == null ? item.id : `wp-${item.wpId}`)

function extFromUrl(url) {
  const ext = path.extname(new URL(url).pathname).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext) ? ext : '.jpg'
}

async function downloadOne(item) {
  const sourceUrl = item.imageSource
  if (!sourceUrl || !/^https?:\/\//.test(sourceUrl)) {
    return { item, status: 'no-remote-url' }
  }

  const fileName = `${stableKey(item)}${extFromUrl(sourceUrl)}`
  const filePath = path.join(OUT_DIR, fileName)
  const localUrl = `/products/${fileName}`

  if (await exists(filePath)) {
    return { item, status: 'exists', localUrl, sourceUrl }
  }

  const res = await fetch(sourceUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QazaqTest-site image fetcher)' },
  })
  if (!res.ok || !res.body) {
    return { item, status: `http ${res.status}` }
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(filePath))
  return { item, status: 'downloaded', localUrl, sourceUrl }
}

const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf8'))
const overrides = await readFile(OVERRIDES_PATH, 'utf8').then(JSON.parse, (error) => {
  if (error.code === 'ENOENT') {
    return {}
  }
  throw error
})
await mkdir(OUT_DIR, { recursive: true })

let ok = 0
let failed = 0
const queue = [...catalog]

async function worker() {
  while (queue.length > 0) {
    const item = queue.shift()
    try {
      const result = await downloadOne(item)
      if (result.localUrl) {
        const key = stableKey(item)
        overrides[key] = { ...overrides[key], image: result.localUrl }
        ok += 1
        console.log(`✓ ${item.id} (${result.status})`)
      } else {
        failed += 1
        console.warn(`✗ ${item.id}: ${result.status}`)
      }
    } catch (error) {
      failed += 1
      console.warn(`✗ ${item.id}: ${error.message}`)
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))

if (ok > 0) {
  await writeFile(OVERRIDES_PATH, `${JSON.stringify(overrides, null, 2)}\n`)
  console.log(`\nГотово: ${ok} с локальными фото, ошибок: ${failed}.`)
  console.log('Пути записаны в catalog.overrides.json — выполните npm run catalog:build,')
  console.log('затем закоммитьте public/products/, overrides и пересобранный catalog.json.')
} else {
  console.log(`\nНи одно фото не скачалось (ошибок: ${failed}). Файлы каталога не менялись.`)
}
