/**
 * Импорт каталога из штатного экспорта WooCommerce в catalog.generated.json.
 *
 * Каталог сайта rutestin.com ведётся в WooCommerce, поэтому источник позиций —
 * не парсинг страниц, а выгрузка из админки: Товары → Экспорт → CSV.
 *
 * Использование:
 *   node scripts/import_woocommerce_csv.mjs data/wc-products.csv
 *   npm run catalog:build      # дальше как обычно: нормализация + overrides
 *
 * Заголовки колонок WooCommerce локализованы под язык сайта, поэтому каждое
 * поле ищется по нескольким вариантам — русскому и английскому.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_PATH = path.join(root, 'src/data/catalog.generated.json')

/** Разделы сайта: название категории в WooCommerce → id раздела витрины */
const CATEGORY_BY_NAME = {
  'асфальтобетоны': 'asphalt',
  'битумные вяжущие': 'bitumen',
  'каменные заполнители': 'aggregates',
  'минеральные порошки': 'min-powder',
  'бетоны и растворы': 'concrete',
  'цементные вяжущие': 'cement',
  'укрепленные грунты': 'stabilized-soil',
  'укреплённые грунты': 'stabilized-soil',
  'грунты и почвы': 'soil',
  'общелабораторное оборудование': 'general-lab',
  'битумные эмульсии': 'bitumen-emulsions',
  'полевые испытания': 'field-testing',
  'неразрушающий контроль': 'ndt',
}

/** Имена колонок в русской и английской локали экспорта */
const COLUMNS = {
  wpId: ['id', 'идентификатор'],
  sku: ['sku', 'артикул'],
  title: ['name', 'имя', 'название'],
  summary: ['short description', 'краткое описание'],
  description: ['description', 'описание'],
  price: ['regular price', 'обычная цена', 'базовая цена'],
  categories: ['categories', 'категории'],
  tags: ['tags', 'метки'],
  images: ['images', 'изображения'],
  published: ['published', 'опубликован'],
  type: ['type', 'тип'],
}

/** Разбор CSV по RFC 4180: кавычки, переводы строк внутри полей, «""» */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') {
        i += 1
      }
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((entry) => entry.some((value) => value.trim().length > 0))
}

/** Индексы колонок по любому из известных имён */
function mapColumns(header) {
  const normalized = header.map((name) => name.trim().toLowerCase().replace(/^﻿/, ''))
  const index = {}
  for (const [field, names] of Object.entries(COLUMNS)) {
    const found = normalized.findIndex((name) => names.includes(name))
    if (found !== -1) {
      index[field] = found
    }
  }
  return index
}

/** Товар без раздела на витрине не появится — сообщаем, а не молчим */
function resolveCategory(raw) {
  for (const name of raw.split(',').map((entry) => entry.trim().toLowerCase())) {
    // «Родитель > Ребёнок» — берём последний уровень, он конкретнее
    const leaf = name.split('>').pop().trim()
    if (CATEGORY_BY_NAME[leaf]) {
      return { id: CATEGORY_BY_NAME[leaf], original: leaf }
    }
  }
  return null
}

const htmlToText = (value) =>
  value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h\d)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const inputPath = process.argv[2]
if (!inputPath) {
  console.error('Укажите файл экспорта: node scripts/import_woocommerce_csv.mjs data/wc-products.csv')
  process.exit(1)
}

const rows = parseCsv(await readFile(path.resolve(inputPath), 'utf8'))
const columns = mapColumns(rows[0])

const missing = ['title', 'categories'].filter((field) => columns[field] === undefined)
if (missing.length > 0) {
  console.error(`В файле не найдены колонки: ${missing.join(', ')}`)
  console.error(`Заголовки файла: ${rows[0].slice(0, 12).join(' | ')}`)
  process.exit(1)
}

const get = (row, field) => (columns[field] === undefined ? '' : (row[columns[field]] ?? '').trim())

const items = []
const skipped = { noCategory: [], notPublished: [], variation: [] }

rows.slice(1).forEach((row) => {
  const title = get(row, 'title')
  if (!title) {
    return
  }
  if (get(row, 'type') === 'variation') {
    skipped.variation.push(title)
    return
  }
  const published = get(row, 'published')
  if (published && published !== '1') {
    skipped.notPublished.push(title)
    return
  }

  const category = resolveCategory(get(row, 'categories'))
  if (!category) {
    skipped.noCategory.push(`${title} — «${get(row, 'categories')}»`)
    return
  }

  const price = get(row, 'price').replace(/\s/g, '').replace(',', '.')
  const images = get(row, 'images').split(',').map((url) => url.trim()).filter(Boolean)

  items.push({
    id: `qzt-${items.length + 1}`,
    categoryId: category.id,
    title,
    summary: htmlToText(get(row, 'summary')),
    tags: get(row, 'tags').split(',').map((tag) => tag.trim()).filter(Boolean),
    imageLabel: title,
    description: htmlToText(get(row, 'description')),
    features: [],
    specs: [],
    model: null,
    sku: get(row, 'sku') || null,
    brand: null,
    priceLabel: price ? `${price} ₽` : 'по запросу',
    imageUrl: images[0] ?? null,
    productUrl: null,
    originalCategory: category.original,
    wpId: Number(get(row, 'wpId')) || null,
  })
})

await writeFile(OUT_PATH, `${JSON.stringify(items, null, 2)}\n`)

const byCategory = items.reduce((acc, item) => {
  acc[item.categoryId] = (acc[item.categoryId] ?? 0) + 1
  return acc
}, {})

console.log(`Импортировано позиций: ${items.length}`)
Object.entries(byCategory)
  .sort((a, b) => b[1] - a[1])
  .forEach(([id, count]) => console.log(`  ${String(count).padStart(4)}  ${id}`))

if (skipped.noCategory.length > 0) {
  console.log(`\nПропущено без известного раздела: ${skipped.noCategory.length}`)
  skipped.noCategory.slice(0, 15).forEach((entry) => console.log(`  - ${entry}`))
  console.log('  Добавьте название категории в CATEGORY_BY_NAME, если раздел нужен.')
}
if (skipped.notPublished.length > 0) {
  console.log(`\nПропущено черновиков: ${skipped.notPublished.length}`)
}
if (skipped.variation.length > 0) {
  console.log(`\nПропущено вариаций товара: ${skipped.variation.length}`)
}
console.log('\nДальше: npm run catalog:build')
