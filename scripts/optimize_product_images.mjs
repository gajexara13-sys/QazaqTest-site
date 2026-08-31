/**
 * Сжимает фото товаров в public/products/ под размеры витрины.
 *
 * Снимки приходят из медиатеки магазина как есть: до 2565 px по длинной
 * стороне и до 4 МБ на файл. Карточка выводит их в контейнере около 300 px, на
 * странице товара — около 600 px, поэтому всё, что шире MAX_SIDE, — это трафик
 * впустую.
 *
 * Формат — WebP: он мельче JPEG при том же качестве и, в отличие от него,
 * умеет прозрачность, которая есть у части снимков.
 *
 * Запуск:  npm run images:optimize && npm run catalog:build
 * Повторный запуск безопасен: уже сжатые файлы пропускаются, поэтому WebP не
 * пережимается по кругу с потерей качества на каждом проходе.
 */
import { readdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(root, 'public/products')
const OVERRIDES_PATH = path.join(root, 'src/data/catalog.overrides.json')

const MAX_SIDE = 1000
const QUALITY = 80

const kb = (bytes) => `${Math.round(bytes / 1024)} КБ`

const files = (await readdir(DIR)).filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
if (files.length === 0) {
  console.log('В public/products/ нет фотографий — сначала npm run images:download.')
  process.exit(0)
}

let before = 0
let after = 0
let converted = 0
let skipped = 0
const renamed = new Map()

for (const name of files) {
  const from = path.join(DIR, name)
  const size = (await stat(from)).size
  before += size

  const image = sharp(from)
  const meta = await image.metadata()
  const longSide = Math.max(meta.width ?? 0, meta.height ?? 0)
  const isWebp = meta.format === 'webp'

  // Уже сжатый файл трогать нельзя: каждое пережатие WebP теряет качество
  if (isWebp && longSide <= MAX_SIDE) {
    after += size
    skipped += 1
    continue
  }

  const base = name.replace(/\.[^.]+$/, '')
  const target = path.join(DIR, `${base}.webp`)
  const temp = path.join(DIR, `${base}.tmp.webp`)

  await image
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(temp)

  const newSize = (await stat(temp)).size

  // Пережатие, которое ничего не выигрывает, только портит картинку
  if (newSize >= size && isWebp) {
    await unlink(temp)
    after += size
    skipped += 1
    continue
  }

  if (from !== target) {
    await unlink(from)
    renamed.set(`/products/${name}`, `/products/${base}.webp`)
  }
  await rename(temp, target)

  after += newSize
  converted += 1
  console.log(
    `${base}  ${kb(size)} → ${kb(newSize)}  (${meta.width}×${meta.height} → ${
      Math.min(meta.width ?? 0, MAX_SIDE) === MAX_SIDE || longSide > MAX_SIDE ? '≤' : ''
    }${Math.min(longSide, MAX_SIDE)} px)`,
  )
}

// Расширение сменилось — пути в правках нужно перевести, иначе карточка
// останется с заглушкой, а файл будет лежать рядом никем не востребованный.
if (renamed.size > 0) {
  const overrides = JSON.parse(await readFile(OVERRIDES_PATH, 'utf8'))
  let patched = 0
  for (const entry of Object.values(overrides)) {
    const next = renamed.get(entry.image)
    if (next) {
      entry.image = next
      patched += 1
    }
  }
  await writeFile(OVERRIDES_PATH, `${JSON.stringify(overrides, null, 2)}\n`)
  console.log(`\nПути обновлены в catalog.overrides.json: ${patched}`)
}

console.log(
  `\nСжато: ${converted}, пропущено: ${skipped}. ` +
    `${(before / 1024 / 1024).toFixed(1)} МБ → ${(after / 1024 / 1024).toFixed(1)} МБ ` +
    `(−${Math.round((1 - after / before) * 100)} %).`,
)
console.log('Дальше: npm run catalog:build')
