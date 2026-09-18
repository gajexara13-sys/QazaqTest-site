/**
 * Отрезает у фотографий товаров нижнюю полосу «细节展示» — коллаж деталей,
 * который китайские поставщики приклеивают к основному кадру.
 *
 * Зачем: на витрине это выглядит как чужой прямоугольник другого оттенка под
 * снимком, а внутри него — подписи на китайском и баннер производителя.
 * На русскоязычном сайте они не к месту, и никакой цвет подложки этого не
 * исправит: дело не в фоне, а в содержимом кадра.
 *
 * Как отличаем полосу от прибора: между основным кадром и коллажем поставщик
 * оставляет сплошной белый разрыв во всю ширину. Ищем самый широкий такой
 * разрыв в средне-нижней части кадра и режем по нему. Если разрыва нет —
 * снимок цельный, не трогаем.
 *
 * Запуск:  npm run images:crop
 * Повторный запуск безопасен: у обрезанного снимка полосы уже нет.
 */
import { readdir, rename } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(root, 'public/products')

const LIGHT = 245          // порог «фоновой» яркости
const MAX_STRIP = 0.4      // полоса заведомо меньше половины кадра
const BAND = [0.45, 0.92]  // где искать разрыв: середина-низ

/** Границы сплошного белого разрыва, отделяющего нижнюю полосу */
function findGap(data, width, height, channels) {
  const isEmptyRow = (y) => {
    let dark = 0
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * channels
      if (data[i] < LIGHT || data[i + 1] < LIGHT || data[i + 2] < LIGHT) {
        dark += 1
        if (dark > 1) return false
      }
    }
    return true
  }

  const empty = []
  for (let y = 0; y < height; y += 1) empty.push(isEmptyRow(y))

  let best = null
  let run = null
  for (let y = 0; y <= height; y += 1) {
    if (y < height && empty[y]) {
      if (run === null) run = y
    } else if (run !== null) {
      const middle = (run + y) / 2 / height
      if (middle > BAND[0] && middle < BAND[1] && (!best || y - run > best.end - best.start)) {
        best = { start: run, end: y }
      }
      run = null
    }
  }
  if (!best) return null

  // Ниже разрыва должен быть контент, и он должен быть именно полосой
  let lowest = -1
  for (let y = best.end; y < height; y += 1) if (!empty[y]) lowest = y
  if (lowest < 0) return null
  if ((lowest - best.end) / height >= MAX_STRIP) return null

  return best
}

const files = (await readdir(DIR)).filter((n) => /\.webp$/i.test(n))
let cropped = 0

for (const name of files) {
  const file = path.join(DIR, name)
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const gap = findGap(data, info.width, info.height, info.channels)
  if (!gap) continue

  await sharp(file)
    .extract({ left: 0, top: 0, width: info.width, height: gap.start })
    .webp({ quality: 80, effort: 6 })
    .toFile(`${file}.tmp`)
  await rename(`${file}.tmp`, file)

  cropped += 1
  console.log(`${name}  ${info.height} → ${gap.start} px (срезано ${info.height - gap.start})`)
}

console.log(`\nОбрезано: ${cropped} из ${files.length}.`)
