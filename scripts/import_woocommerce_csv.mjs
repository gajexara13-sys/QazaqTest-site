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

/**
 * Разделы сайта: название категории в WooCommerce → id раздела витрины.
 *
 * В выгрузке категории лежат деревом «Раздел > Подраздел», причём разделом
 * служит верхний уровень («Асфальтобетон > Уплотнители»), а подраздел идёт в
 * `group` на витрине. Поэтому здесь перечислены имена уровня раздела в том
 * виде, как они заведены в магазине, плюс синонимы из прежних выгрузок.
 */
const CATEGORY_BY_NAME = {
  'асфальтобетон': 'asphalt',
  'асфальтобетоны': 'asphalt',
  'битумные вяжущие': 'bitumen',
  'минеральные заполнители': 'aggregates',
  'каменные заполнители': 'aggregates',
  'минеральные порошки': 'min-powder',
  'бетон': 'concrete',
  'бетоны и растворы': 'concrete',
  'минеральные вяжущие': 'cement',
  'цементные вяжущие': 'cement',
  'укрепленные грунты': 'stabilized-soil',
  'укреплённые грунты': 'stabilized-soil',
  'грунты': 'soil',
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
  brand: ['brands', 'бренды', 'бренд'],
}

/** «Китай» стоит в колонке брендов вместо страны и производителем не является */
const NOT_A_BRAND = /^(?:китай|china|нет|—|-)$/i

/**
 * Колонки атрибутов: магазин держит в них список синонимов названия
 * («Брукфильд, Brookfield, вискозиметр Брукфильда»). Для витрины это готовые
 * поисковые теги — по ним карточка находится, даже если спросили иначе.
 */
const ATTRIBUTE_VALUE_COLUMN = /^(?:значения атрибутов \d+|attribute \d+ value\(s\))$/i

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
  const index = { attributeValues: [] }
  normalized.forEach((name, position) => {
    if (ATTRIBUTE_VALUE_COLUMN.test(name)) {
      index.attributeValues.push(position)
    }
  })
  for (const [field, names] of Object.entries(COLUMNS)) {
    const found = normalized.findIndex((name) => names.includes(name))
    if (found !== -1) {
      index[field] = found
    }
  }
  return index
}

/**
 * Раздел витрины по полю «Категории».
 *
 * Поле — список путей через запятую, каждый путь вида «Раздел > Подраздел».
 * Разбираем каждый уровень от листа к корню: у товара может быть указан один
 * лишь подраздел, но чаще раздел стоит наверху. Возвращаем полный путь — из
 * него нормализатор берёт подраздел в `group`.
 */
function resolveCategory(raw) {
  const paths = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  // Пути с подразделом конкретнее — «Асфальтобетон > Уплотнители» даст и
  // раздел, и группу, тогда как голое «Прочее» не даст ничего
  const ordered = [...paths].sort(
    (a, b) => b.split('>').length - a.split('>').length,
  )

  for (const pathName of ordered) {
    const levels = pathName.split('>').map((level) => level.trim().toLowerCase())
    for (let i = levels.length - 1; i >= 0; i -= 1) {
      const id = CATEGORY_BY_NAME[levels[i]]
      if (id) {
        return { id, original: pathName }
      }
    }
  }

  return null
}

const decodeEntities = (value) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')

const htmlToText = (value) =>
  decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|li|h\d|tr|div)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

/**
 * Разделы внутри описания товара.
 *
 * Карточки в магазине сверстаны единообразно: жирный подзаголовок, под ним
 * список. Это те же данные, что в старой выгрузке из Excel лежали отдельными
 * колонками, поэтому разбираем их здесь — нормализатор дальше работает с
 * привычными полями `specs` и `features`, а не гадает по сплошному тексту.
 */
const SECTIONS = [
  { kind: 'specs', test: /^(?:характеристик|основные технические параметр|технические характеристик|технические параметр|параметр)/i },
  { kind: 'features', test: /^(?:главная особенност|основные особенност|особенност|преимуществ|ключевые возможност)/i },
  { kind: 'prose', test: /^(?:описание|принцип работы|назначение|область применения|комплектаци|комплект поставки)/i },
]

const sectionKind = (heading) => SECTIONS.find((section) => section.test.test(heading))?.kind ?? null

/** Непустые строки куска разметки — для карточек, где список набран абзацами */
const textLines = (html) =>
  htmlToText(html)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

/** Пункты списка внутри куска разметки */
const listItems = (html) =>
  [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => htmlToText(match[1]))
    .filter(Boolean)

/** «<strong>Мощность</strong>: 7 кВт» и «Мощность: 7 кВт» — в пару меток и значений */
function toSpec(text) {
  const separator = text.search(/[::]/)
  if (separator < 1) {
    return null
  }
  const label = text.slice(0, separator).trim().replace(/^[•\d]+[.)]?\s*/, '')
  const value = text.slice(separator + 1).trim()
  if (!label || !value || label.length > 60) {
    return null
  }
  return `${label}: ${value}`
}

/** Двухколоночные таблицы характеристик встречаются в части карточек */
function tableSpecs(html) {
  const specs = []
  for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
      htmlToText(cell[1]),
    )
    if (cells.length >= 2 && cells[0] && cells[1] && cells[0].length <= 60) {
      specs.push(`${cells[0]}: ${cells[1]}`)
    }
  }
  return specs
}

/** Описание товара → проза, особенности и характеристики по отдельности */
function parseDescription(rawHtml) {
  // В выгрузке переводы строк экранированы как «\n» — вернём их на место,
  // иначе абзацы слипаются в одну строку.
  const html = rawHtml.replace(/\\r\\n|\\n|\\r/g, '\n')

  const headings = [...html.matchAll(/<(?:strong|b)>\s*([^<]{3,60}?)\s*<\/(?:strong|b)>/gi)]
    .map((match) => ({
      index: match.index,
      length: match[0].length,
      kind: sectionKind(decodeEntities(match[1]).trim()),
    }))
    .filter((heading) => heading.kind !== null)

  const blocks = []
  if (headings.length === 0 || headings[0].index > 0) {
    blocks.push({ kind: 'prose', html: html.slice(0, headings[0]?.index ?? html.length) })
  }
  headings.forEach((heading, position) => {
    const from = heading.index + heading.length
    const to = headings[position + 1]?.index ?? html.length
    blocks.push({ kind: heading.kind, html: html.slice(from, to) })
  })

  const paragraphs = []
  const features = []
  const specs = [...tableSpecs(html)]

  for (const block of blocks) {
    const items = listItems(block.html)

    if (block.kind === 'specs') {
      // Характеристики перечислены то списком, то просто строками абзацев —
      // строки разбираем только если они действительно похожи на пары
      // «параметр — значение», иначе это проза с подзаголовком.
      const lines = items.length > 0 ? items : textLines(block.html)
      const parsed = lines.map(toSpec)
      const hits = parsed.filter(Boolean).length
      if (hits >= 2 && hits * 2 >= lines.length) {
        lines.forEach((line, position) => {
          if (parsed[position]) {
            specs.push(parsed[position])
          } else {
            paragraphs.push(line)
          }
        })
        continue
      }
    }

    if (block.kind === 'features' && items.length > 0) {
      features.push(...items)
      continue
    }

    const text = htmlToText(block.html.replace(/<table[\s\S]*?<\/table>/gi, ''))
    if (text) {
      paragraphs.push(text)
    }
  }

  return {
    description: paragraphs.join('\n\n'),
    features,
    specs,
  }
}

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const inputPath = args.find((arg) => !arg.startsWith('--'))
if (!inputPath) {
  console.error('Укажите файл экспорта: node scripts/import_woocommerce_csv.mjs data/wc-products.csv [--dry-run]')
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

  // Позицию без сопоставленного раздела не выбрасываем: раздел ей может
  // назначить override по wpId. Витрину без раздела она всё равно не увидит —
  // нормализатор отсеет её уже после применения правок, тоже с сообщением.
  const category = resolveCategory(get(row, 'categories'))
  if (!category) {
    skipped.noCategory.push(`${title} — «${get(row, 'categories')}»`)
  }

  const parsed = parseDescription(get(row, 'description'))

  // «Модель: HLY-E» в конце названия — код модели по версии магазина, он точнее
  // догадок по буквенно-цифровым обрывкам. Двоеточие ставят не всегда, но без
  // него на шаблон налезают названия вроде «Модель рециклера асфальта», поэтому
  // бесколоночный вариант принимаем, только если дальше действительно код.
  const titleModel = title.match(/(?:^|[\s(])модел[ьи]\s*([:：])?\s*(.+)$/i)
  const modelInTitle =
    titleModel && (titleModel[1] || /^[A-ZА-ЯЁ0-9][A-ZА-ЯЁ0-9\-–—/.() ]{1,23}$/.test(titleModel[2].trim()))
      ? titleModel[2].trim()
      : null

  // В значениях атрибутов запятая экранирована обратным слэшем
  const synonyms = (columns.attributeValues ?? [])
    .flatMap((position) => (row[position] ?? '').split(/(?<!\\),/))
    .map((value) => value.replace(/\\,/g, ',').trim())
    .filter((value) => value && value.length <= 60)

  const brand = get(row, 'brand')
    .split(',')
    .map((value) => value.trim())
    .find((value) => value && !NOT_A_BRAND.test(value))

  // Пустая цена выгружается нулём. Ноль — это «цена по запросу», а не 0 ₽:
  // подставлять цифру, которой в магазине нет, нельзя.
  const priceValue = Number(get(row, 'price').replace(/\s/g, '').replace(',', '.'))
  const price = Number.isFinite(priceValue) && priceValue > 0 ? String(priceValue) : ''
  const images = get(row, 'images').split(',').map((url) => url.trim()).filter(Boolean)

  items.push({
    id: `qzt-${items.length + 1}`,
    categoryId: category?.id ?? null,
    title,
    summary: htmlToText(get(row, 'summary').replace(/\\r\\n|\\n|\\r/g, '\n')),
    tags: [
      ...new Set([...get(row, 'tags').split(',').map((tag) => tag.trim()), ...synonyms]),
    ].filter(Boolean),
    imageLabel: title,
    description: parsed.description,
    features: parsed.features,
    specs: parsed.specs,
    model: modelInTitle,
    sku: get(row, 'sku') || null,
    brand: brand ?? null,
    priceLabel: price ? `${price} ₽` : 'по запросу',
    imageUrl: images[0] ?? null,
    productUrl: null,
    originalCategory: category?.original ?? null,
    wpId: Number(get(row, 'wpId')) || null,
  })
})

if (!isDryRun) {
  await writeFile(OUT_PATH, `${JSON.stringify(items, null, 2)}\n`)
}

const byCategory = items.reduce((acc, item) => {
  acc[item.categoryId] = (acc[item.categoryId] ?? 0) + 1
  return acc
}, {})

console.log(
  isDryRun
    ? `Разобрано позиций: ${items.length} (--dry-run, файл не переписан)`
    : `Импортировано позиций: ${items.length}`,
)
Object.entries(byCategory)
  .sort((a, b) => b[1] - a[1])
  .forEach(([id, count]) => console.log(`  ${String(count).padStart(4)}  ${id}`))

if (skipped.noCategory.length > 0) {
  console.log(`\nБез раздела витрины: ${skipped.noCategory.length}`)
  skipped.noCategory.forEach((entry) => console.log(`  - ${entry}`))
  console.log('  Добавьте категорию в CATEGORY_BY_NAME или раздел в overrides по wpId,')
  console.log('  иначе npm run catalog:build отсеет эти позиции.')
}
if (skipped.notPublished.length > 0) {
  console.log(`\nПропущено черновиков: ${skipped.notPublished.length}`)
}
if (skipped.variation.length > 0) {
  console.log(`\nПропущено вариаций товара: ${skipped.variation.length}`)
}
console.log(isDryRun ? '\nПовторите без --dry-run, чтобы записать файл.' : '\nДальше: npm run catalog:build')
