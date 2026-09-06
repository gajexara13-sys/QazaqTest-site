/**
 * Выравнивает фон фотографий товаров до чисто белого.
 *
 * Снимки приходят из медиатеки от разных поставщиков, и фон у них «почти
 * белый», но у каждого свой: 242, 246, 248. На белой подложке карточки такой
 * снимок даёт еле заметный прямоугольник — глаз читает его как дефект вёрстки,
 * хотя с самой вёрсткой всё в порядке.
 *
 * Как это делается: заливка от краёв внутрь. Светлые пиксели, связанные с
 * границей кадра, — это фон, их и осветляем до 255. Светлые области внутри
 * прибора заливка не достаёт, поэтому белый корпус весов или шкафа остаётся
 * нетронутым. Наивная коррекция уровней испортила бы именно их.
 *
 * Что скрипт не трогает:
 *   - снимки с прозрачностью — там фона нет;
 *   - снимки на цветном фоне (например, прибор на столе) — граница кадра
 *     тёмная, заливке не с чего начаться.
 *
 * Запуск:  npm run images:normalize
 * Повторный запуск безопасен: у выровненного снимка фон уже 255.
 */
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(root, 'public/products')

// Порог «светлого»: ниже него пиксель считаем частью прибора, а не фоном
const LIGHT = 235
const QUALITY = 80

const files = (await readdir(DIR)).filter((name) => /\.webp$/i.test(name))
if (files.length === 0) {
  console.log('В public/products/ нет фотографий — сначала npm run images:download.')
  process.exit(0)
}

let changed = 0
let skipped = 0

for (const name of files) {
  const file = path.join(DIR, name)
  const image = sharp(file)
  const meta = await image.metadata()

  if (meta.hasAlpha) {
    skipped += 1
    continue
  }

  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  const isLight = (index) =>
    data[index] >= LIGHT && data[index + 1] >= LIGHT && data[index + 2] >= LIGHT

  // Заливка от границы кадра. Стек вместо рекурсии: на снимке 1000×1000
  // рекурсия ушла бы на десятки тысяч уровней и переполнила бы стек.
  const seen = new Uint8Array(width * height)
  const stack = []

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return
    }
    const pixel = y * width + x
    if (seen[pixel] || !isLight(pixel * channels)) {
      return
    }
    seen[pixel] = 1
    stack.push(pixel)
  }

  for (let x = 0; x < width; x += 1) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y)
    push(width - 1, y)
  }

  let touched = 0
  while (stack.length > 0) {
    const pixel = stack.pop()
    const index = pixel * channels
    if (data[index] !== 255 || data[index + 1] !== 255 || data[index + 2] !== 255) {
      data[index] = 255
      data[index + 1] = 255
      data[index + 2] = 255
      touched += 1
    }
    const x = pixel % width
    const y = (pixel - x) / width
    push(x - 1, y)
    push(x + 1, y)
    push(x, y - 1)
    push(x, y + 1)
  }

  if (touched === 0) {
    skipped += 1
    continue
  }

  await sharp(data, { raw: { width, height, channels } })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(`${file}.tmp`)

  const { rename } = await import('node:fs/promises')
  await rename(`${file}.tmp`, file)

  changed += 1
  console.log(`${name}  выровнено пикселей фона: ${touched.toLocaleString('ru-RU')}`)
}

console.log(`\nВыровнено: ${changed}, без изменений: ${skipped}.`)
console.log('Снимки на цветном фоне и с прозрачностью пропускаются намеренно.')
