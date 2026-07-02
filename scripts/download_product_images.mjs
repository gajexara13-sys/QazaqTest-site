/**
 * Скачивает фото товаров из imageUrl (rutestin.com) в public/products/
 * и переписывает imageUrl в src/data/catalog.generated.json на локальные пути.
 * Исходный адрес сохраняется в imageSourceUrl.
 *
 * Запуск:  npm run images:download
 * Повторный запуск безопасен: уже скачанные файлы пропускаются.
 */

import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG_PATH = path.join(root, 'src/data/catalog.generated.json')
const OUT_DIR = path.join(root, 'public/products')
const CONCURRENCY = 5

const exists = (p) => access(p).then(() => true, () => false)

function extFromUrl(url) {
  const ext = path.extname(new URL(url).pathname).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext) ? ext : '.jpg'
}

async function downloadOne(item) {
  const sourceUrl = item.imageSourceUrl ?? item.imageUrl
  if (!sourceUrl || !/^https?:\/\//.test(sourceUrl)) {
    return { item, status: 'no-remote-url' }
  }

  const fileName = `${item.id}${extFromUrl(sourceUrl)}`
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
        item.imageSourceUrl = result.sourceUrl
        item.imageUrl = result.localUrl
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
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`)
  console.log(`\nГотово: ${ok} с локальными фото, ошибок: ${failed}.`)
  console.log('Пути в catalog.generated.json обновлены. Проверьте сайт и закоммитьте public/products/.')
} else {
  console.log(`\nНи одно фото не скачалось (ошибок: ${failed}). Файл каталога не менялся.`)
}
