/**
 * Нормализация каталога: catalog.generated.json (сырой выгруз из Excel)
 * → src/data/catalog.json (витрина, которую импортирует сайт).
 *
 * Сырой файл трогать нельзя — он перегенерируется из xlsx. Все правки
 * карточек делаются правилами здесь либо точечно в overrides.json,
 * поэтому повторный запуск всегда даёт один и тот же результат.
 *
 * Запуск:  npm run catalog:build
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_PATH = path.join(root, 'src/data/catalog.generated.json')
const OVERRIDES_PATH = path.join(root, 'src/data/catalog.overrides.json')
const OUTPUT_PATH = path.join(root, 'src/data/catalog.json')

/** Признак обрезанного текста из выгрузки: многоточие в конце строки. */
const TRUNCATION_MARK = /[…]|\.\.\.$/

/** Служебные заголовки внутри описаний — на карточке они не нужны. */
const BOILERPLATE_HEADINGS = [
  'описание товара',
  'описание',
  'главная особенность',
  'главные особенности',
  'основные особенности',
  'особенности',
  'преимущества',
  'практичные преимущества',
  'технические характеристики',
  'основные технические характеристики',
  'основные характеристики',
  'характеристики',
  'параметры',
  'основные параметры',
  'технические параметры',
  'основные технические параметры',
  'наименование параметра',
  'значение параметра',
  'комплектация',
  'назначение',
  'применение',
]

/** Бренды, которые надёжно опознаются по подстроке в названии. */
const BRAND_SIGNATURES = [
  [/\bDION\b/i, 'DION'],
  [/\bSHINKO\s+VIBRA\b|\bVIBRA\b/i, 'SHINKO VIBRA'],
  [/\bCAS\b/, 'CAS'],
  [/\btesto\b/i, 'Testo'],
  [/ЭКРОС/i, 'ЭКРОС'],
  [/ЛинтеЛ/i, 'ЛинтеЛ'],
  [/Lithostek|LS-[A-Z]/i, 'Lithostek'],
  [/Грин-?Тех/i, 'Грин-Тех'],
  [/ТЕХКОМ|Техком/i, 'Техком'],
  [/СоюздорНИИ/i, 'СоюздорНИИ'],
]

/**
 * Каталожные коды моделей: LWD-3A, HYJB-30, 101-0A, ТЦ3-МГ4.01.
 * Цифра обязательна — иначе в модели оказываются «ЖК-дисплей» и подобное.
 */
const MODEL_PATTERN = /\b([A-ZА-Я0-9]{1,6}-[A-ZА-Я0-9]+(?:[./][A-ZА-Я0-9]+)*)\b/g

const collapseSpaces = (value) => value.replace(/[ \t ]+/g, ' ').trim()

const isTruncated = (value) => TRUNCATION_MARK.test(value)

/** Маркеры и нумерация в начале строки: «• », «➖ », «1. », «- ». */
const stripBullet = (line) =>
  collapseSpaces(line.replace(/^[•·▪●○◦➖✔✅*\-–—]+\s*/, '').replace(/^\d+[.)]\s+/, ''))

const isBoilerplateHeading = (line) => {
  const normalized = stripBullet(line).toLowerCase().replace(/[:.\s]+$/, '').trim()
  return BOILERPLATE_HEADINGS.includes(normalized)
}

const isBulletLine = (line) =>
  /^[•·▪●○◦➖✔✅]\s*/.test(line) || /^[-–—*]\s+/.test(line) || /^\d+[.)]\s+\p{Lu}/u.test(line)

/**
 * Строка-заголовок без содержания: короткая надпись капслоком вроде
 * «РЕАЛИЗУЕТ МЕТОД ФРААСА». В аннотацию карточки такое пускать нельзя.
 */
const isSectionHeading = (line) =>
  line.length <= 45 && line === line.toUpperCase() && /\p{L}/u.test(line)

/** «250*250*250» → «250×250×250»: типографика вместо ASCII-звёздочек. */
const prettifyDimensions = (value) =>
  value.replace(/(\d)\s*[*xX]\s*(?=\d)/g, '$1×').replace(/\s*×\s*/g, '×')

/**
 * Обозначения стандартов прячем на время замен: точка в номере
 * (ГОСТ Р 58401.13-2019) — разделитель разделов, а не десятичная запятая,
 * и правило «точка → запятая» без маскировки его портило. Плейсхолдер берём
 * из области частного использования Unicode — такого символа в выгрузке нет.
 */
const STANDARD_REF = /(?:ГОСТ(?:\s+Р)?|СТ\s?РК|ISO|EN|ASTM|AASHTO|JTG|JT\/T|МИ|ТУ)\s?\d[\d.\-/]*/g

function withStandardsMasked(text, transform) {
  const found = []
  const masked = text.replace(STANDARD_REF, (match) => {
    found.push(match)
    return `\uE000${found.length - 1}\uE000`
  })
  return transform(masked).replace(/\uE000(\d+)\uE000/g, (_, index) => found[Number(index)])
}

/**
 * Единицы измерения к одному виду по ГОСТ 8.417: градус только с латинской
 * «C», питание словами, десятичная запятая, пробел между числом и единицей.
 * В выгрузке встречались все четыре написания градуса сразу.
 */
const normalizeUnits = (value) =>
  withStandardsMasked(value, (text) =>
    text
      .replace(/℃/g, '°C')
      .replace(/°\s*С/g, '°C')
      .replace(/\bAC\s*(\d{3})\s*V\s*(\d{2})\s*Hz/gi, '$1 В, $2 Гц')
      .replace(/\bAC\s*(\d{3})\s*V(?![A-Za-z0-9])/gi, '$1 В')
      .replace(/(\d{3})\s*V(?![A-Za-z0-9])/g, '$1 В')
      .replace(/(\d{2})\s*Hz(?![A-Za-z0-9])/gi, '$1 Гц')
      .replace(/(\d)\.(\d)/g, '$1,$2')
      .replace(/(\d)\s*°C/g, '$1 °C')
      .replace(/(\d)(л|кг|г|мм|см|кВт|Вт|кН|Н|МПа|кПа|Гц|В)(?![а-яА-Яa-zA-Z])/g, '$1 $2')
      .replace(/\)\s*(В|Гц|кг|мм|кВт|А)(?![а-яёa-z])/g, ') $1'),
  )

/**
 * Словарь имён параметров: по ГОСТ 8.417 масса измеряется в килограммах,
 * а «вес» — это сила в ньютонах. «Размеры» переименовываются только когда
 * речь о самом приборе: «Размеры рабочей пластинки» — это размер образца.
 */
const normalizeSpecLabel = (label) =>
  label
    .replace(/^вес(?![а-яё])/i, 'Масса')
    .replace(/^габаритные\s+размеры/i, 'Габариты')
    .replace(/^размеры(?=\s*$)/i, 'Габариты')
    .replace(/^размер(ы)?\s+(устройства|прибора|машины|установки)/i, 'Габариты')

/** Диапазон значения: «5-31 об/мин», «0 ~ 10 мм» → «5 – 31 об/мин» */
const RANGE_VALUE = /^(-?\d+(?:,\d+)?)\s*[-–~]\s*(-?\d+(?:,\d+)?)(\s*[^\d].*)?$/

const normalizeRange = (value) => {
  const match = RANGE_VALUE.exec(value.trim())
  return match ? `${match[1]} – ${match[2]}${match[3] ?? ''}` : value
}

/**
 * Опечатки выгрузки, которые видны в готовой карточке: разорванный код
 * модели («HYJB -30»), пробел перед знаком препинания, двойные кавычки.
 */
const tidyText = (value) =>
  collapseSpaces(
    normalizeUnits(value)
      .replace(/\b([A-ZА-Я]{2,6})\s+-(\d)/g, '$1-$2')
      .replace(/\s+([,.;:!?])/g, '$1')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')'),
  )

/**
 * Разбор строки характеристики «Мощность (kW): 0.5» → { label, value }.
 * Строки без двоеточия или с обрезанным текстом отбраковываются.
 */
function parseSpec(rawLine) {
  const line = prettifyDimensions(normalizeUnits(stripBullet(rawLine)).replace(/[;.]+$/, ''))
  if (!line || isTruncated(line)) {
    return null
  }

  const separator = line.indexOf(':')
  if (separator < 1) {
    return null
  }

  const label = normalizeSpecLabel(collapseSpaces(line.slice(0, separator)))
  const value = normalizeRange(
    collapseSpaces(line.slice(separator + 1)).replace(/[;.,]+$/, ''),
  )

  // Слишком длинная «метка» — это проза с двоеточием, а не характеристика.
  if (!value || label.length > 60 || value.length > 160) {
    return null
  }

  // Модель и бренд показываются в шапке карточки отдельными полями.
  if (/^(модель|бренд|производитель|марка)$/i.test(label)) {
    return null
  }

  return { label, value }
}

/**
 * В выгрузке две характеристики нередко склеены в одну строку:
 * «Максимальное давление: 50 кН Точность: 1%». Разрезаем по второй метке.
 */
function splitCompoundSpec(spec) {
  const match = /^(.*?)\s+([А-ЯA-Z][^:]{2,40}):\s*(.+)$/.exec(spec.value)
  if (!match) {
    return [spec]
  }
  return [
    { label: spec.label, value: collapseSpaces(match[1]) },
    { label: collapseSpaces(match[2]), value: collapseSpaces(match[3]) },
  ].filter((part) => part.value)
}

/**
 * Описание из выгрузки — это склейка абзацев, маркированных списков и
 * характеристик. Раскладываем его на три потока, каждый со своим местом
 * в карточке.
 */
function splitDescription(description, title) {
  const paragraphs = []
  const bullets = []
  const specs = []
  const titleKey = title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

  // Строка-заголовок, повторяющая название товара, — не абзац описания.
  const isTitleEcho = (line) =>
    line.length <= title.length + 40 &&
    line.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '').startsWith(titleKey)

  const lines = description
    .split('\n')
    .map(collapseSpaces)
    .filter((line) => line && !isBoilerplateHeading(line) && !isTitleEcho(line))

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]

    if (isBulletLine(line)) {
      const bullet = stripBullet(line)
      const spec = parseSpec(bullet)
      if (spec) {
        specs.push(spec)
      } else if (bullet && !isTruncated(bullet)) {
        bullets.push(bullet)
      }
      continue
    }

    const spec = parseSpec(line)
    // Короткая строка «Метка: значение» — характеристика, длинная — абзац.
    if (spec && line.length <= 120) {
      specs.push(spec)
      continue
    }

    // Таблица характеристик, развёрнутая построчно: метка с двоеточием,
    // а значение — следующей строкой («Ход каретки, мм:» / «450»).
    const next = lines[index + 1]
    if (
      !spec &&
      line.endsWith(':') &&
      line.length <= 70 &&
      next &&
      next.length <= 90 &&
      !next.endsWith(':') &&
      !isBulletLine(next)
    ) {
      const pair = parseSpec(`${line} ${next}`)
      if (pair) {
        specs.push(pair)
        index += 1
        continue
      }
    }

    if (!isTruncated(line) && !isSectionHeading(line)) {
      paragraphs.push(line)
    }
  }

  return { paragraphs, bullets, specs }
}

/**
 * Аннотация для карточки в сетке: целые предложения до ~190 символов,
 * без обрыва на полуслове и без многоточия из выгрузки.
 */
function buildSummary(paragraphs, features, fallback) {
  // Часть позиций описана только списком особенностей. Тогда берём самый
  // содержательный пункт: короткие вроде «Защита от перегрузки» в роли
  // аннотации выглядят обрывком, а не описанием товара.
  const source =
    paragraphs[0] ??
    features.find((feature) => feature.length >= 80) ??
    features[0]
  if (!source) {
    return fallback
  }

  const sentences = source.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [source]
  let summary = ''

  for (const sentence of sentences) {
    const candidate = collapseSpaces(`${summary} ${sentence}`)
    if (summary && candidate.length > 190) {
      break
    }
    summary = candidate
    // Двоеточие в конце — это анонс списка, который в аннотацию не влезет;
    // добираем следующее предложение, чтобы мысль была законченной.
    if (summary.length >= 120 && !/[:;]$/.test(summary)) {
      break
    }
  }

  return collapseSpaces(summary).replace(/[:;,]$/, '.') || fallback
}

/** «Гигрометр Модель: ВИТ-1» → «Гигрометр ВИТ-1», «HYJB -30» → «HYJB-30». */
function cleanTitle(title) {
  return collapseSpaces(
    title
      .replace(/\s*Модель:\s*-?\s*/gi, ' ')
      // Пробел перед дефисом внутри кода модели: «HYJB -30».
      .replace(/\b([A-ZА-Я]{2,6})\s+-(\d)/g, '$1-$2')
      .replace(/\s*,\s*$/, ''),
  )
}

const matchModelCodes = (value) => value.match(MODEL_PATTERN) ?? []

/** «- 4630М» → «4630М»: в выгрузке код модели иногда идёт с дефисом-мусором. */
const cleanModel = (value) => collapseSpaces(value).replace(/^[-–—\s]+/, '').replace(/[;.,]+$/, '')

function detectModel(item, title) {
  if (item.model) {
    return cleanModel(item.model) || null
  }

  const fromSpec = item.specs?.find((spec) => /^Модель\s*:/i.test(spec))
  if (fromSpec) {
    return cleanModel(fromSpec.replace(/^Модель\s*:/i, '')) || null
  }

  // Теги выгрузки часто содержат ровно код модели отдельным элементом.
  const fromTag = item.tags?.find(
    (tag) => tag.length <= 24 && matchModelCodes(tag).includes(tag) && title.includes(tag),
  )
  if (fromTag) {
    return collapseSpaces(fromTag)
  }

  // Иначе код модели ищем в самом названии: «…(гиратор) KYS-08A».
  const fromTitle = matchModelCodes(title).find((code) => /\d/.test(code) && code.length <= 24)
  return fromTitle ?? null
}

/**
 * В выгрузке код модели бывает урезан («4630» при названии «…4630М»).
 * Если в названии есть более полный вариант того же кода — берём его.
 */
function refineModel(model, title) {
  if (!model) {
    return null
  }
  const fuller = title
    .split(/\s+/)
    .map((token) => token.replace(/[(),;]/g, ''))
    .find((token) => token !== model && token.startsWith(model) && token.length <= model.length + 3)
  return fuller ?? model
}

function detectBrand(item, title) {
  if (item.brand && item.brand !== 'Китай') {
    return collapseSpaces(item.brand)
  }

  const haystack = `${title} ${item.tags?.join(' ') ?? ''}`
  for (const [pattern, brand] of BRAND_SIGNATURES) {
    if (pattern.test(haystack)) {
      return brand
    }
  }

  return null
}

/** «1329446.25 ₽» → 1329446; «по запросу» → null. */
function parsePriceRub(priceLabel) {
  if (!priceLabel) {
    return null
  }
  const match = /^([\d\s]+(?:[.,]\d+)?)\s*₽/.exec(priceLabel.trim())
  if (!match) {
    return null
  }
  const amount = Number(match[1].replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(amount) ? Math.round(amount) : null
}

/** Подраздел каталога — последний сегмент рубрики источника. */
function detectGroup(item) {
  const raw = item.originalCategory ?? ''
  const leaf = raw.split('>').pop()?.trim()
  if (!leaf || /^проч(ее|ие)$/i.test(leaf)) {
    return null
  }
  return leaf
}

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y',
  ь: '', э: 'e', ю: 'yu', я: 'ya',
}

function slugify(value) {
  return value
    .toLowerCase()
    .split('')
    .map((char) => TRANSLIT[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
}

function normalizeItem(item) {
  const baseTitle = cleanTitle(item.title)
  const model = refineModel(detectModel(item, baseTitle), baseTitle)
  const brand = detectBrand(item, baseTitle)

  const fromDescription = splitDescription(item.description ?? '', baseTitle)

  // Характеристики из отдельной колонки выгрузки идут первыми: они точнее,
  // чем то, что удалось выцарапать из описания.
  const specs = []
  const seenLabels = new Set()
  const specCandidates = [...(item.specs ?? []).map(parseSpec), ...fromDescription.specs]
    .filter(Boolean)
    .flatMap(splitCompoundSpec)
  for (const spec of specCandidates) {
    if (!spec) {
      continue
    }
    const key = spec.label.toLowerCase()
    if (seenLabels.has(key)) {
      continue
    }
    seenLabels.add(key)
    specs.push(spec)
  }

  // «Особенности» в выгрузке — обрезанная копия описания. Берём только
  // настоящие маркированные пункты и выкидываем то, что повторяет абзацы.
  const paragraphKeys = new Set(fromDescription.paragraphs.map((p) => p.slice(0, 60)))
  const features = []
  const seenFeatures = new Set()
  for (const candidate of [...(item.features ?? []).map(stripBullet), ...fromDescription.bullets]) {
    const feature = collapseSpaces(candidate)
    const key = feature.slice(0, 60)
    if (!feature || isTruncated(feature) || feature.length > 260) {
      continue
    }
    if (paragraphKeys.has(key) || seenFeatures.has(key)) {
      continue
    }
    seenFeatures.add(key)
    features.push(feature)
  }

  const paragraphs = fromDescription.paragraphs.map(tidyText)
  const summary = tidyText(buildSummary(paragraphs, features, baseTitle))

  // Если аннотацию пришлось собрать из пункта «особенностей», этот пункт
  // из списка убираем: иначе одна и та же фраза стоит в карточке дважды.
  const visibleFeatures = features
    .map(tidyText)
    .filter((feature) => paragraphs.length > 0 || !summary.startsWith(feature.slice(0, 40)))

  // Код модели и бренд выводятся в карточке отдельными полями — в облаке
  // тегов они только шумят.
  const tags = [...new Set(item.tags ?? [])].filter(
    (tag) => tag && tag !== model && tag !== brand,
  )

  return {
    id: item.id,
    slug: slugify(`${baseTitle}${model ? ` ${model}` : ''}`) || item.id,
    categoryId: item.categoryId,
    group: detectGroup(item),
    title: baseTitle,
    model,
    brand,
    summary,
    paragraphs,
    features: visibleFeatures.slice(0, 8),
    specs: specs.map((spec) => ({ label: tidyText(spec.label), value: tidyText(spec.value) })).slice(0, 24),
    tags: [...new Set(tags)].filter(Boolean),
    priceRub: parsePriceRub(item.priceLabel),
    image: null,
    imageSource: item.imageUrl ?? null,
  }
}

/**
 * В выгрузке девять «Тестеров стабильности Маршалла» и пять сушильных
 * шкафов с одинаковыми названиями — в сетке это выглядит как дубли.
 * Модификации различает код модели, поэтому дописываем его в название.
 */
function disambiguateTitles(items) {
  const counts = new Map()
  for (const item of items) {
    counts.set(item.title, (counts.get(item.title) ?? 0) + 1)
  }

  for (const item of items) {
    if (counts.get(item.title) > 1 && item.model && !item.title.includes(item.model)) {
      item.title = `${item.title} ${item.model}`
    }
  }

  return items
}

/** Ручные правки поверх правил: { "qzt-12": { "title": "…" } }. */
async function readOverrides() {
  try {
    return JSON.parse(await readFile(OVERRIDES_PATH, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {}
    }
    throw error
  }
}

async function main() {
  // Мусор из Excel (маркер возврата каретки, неразрывные пробелы) снимаем
  // сразу на входе — иначе он всплывает в описаниях и характеристиках.
  const raw = (await readFile(SOURCE_PATH, 'utf8'))
    .replace(/_x000[dD]_/g, ' ')
    .replace(/ /g, ' ')
  const source = JSON.parse(raw)
  const overrides = await readOverrides()

  const items = disambiguateTitles(source.map(normalizeItem)).map((item) => ({
    ...item,
    ...(overrides[item.id] ?? {}),
  }))

  // Слаги участвуют в адресах карточек — коллизии недопустимы.
  const slugs = new Map()
  for (const item of items) {
    const taken = slugs.get(item.slug)
    if (taken) {
      item.slug = `${item.slug}-${item.id}`
    }
    slugs.set(item.slug, item.id)
  }

  await writeFile(OUTPUT_PATH, `${JSON.stringify(items, null, 2)}\n`, 'utf8')

  const report = {
    'позиций': items.length,
    'с ценой': items.filter((item) => item.priceRub !== null).length,
    'с моделью': items.filter((item) => item.model).length,
    'с брендом': items.filter((item) => item.brand).length,
    'с характеристиками': items.filter((item) => item.specs.length > 0).length,
    'с особенностями': items.filter((item) => item.features.length > 0).length,
    'с фото': items.filter((item) => item.image).length,
    'обрезанных текстов': items.filter(
      (item) =>
        isTruncated(item.summary) ||
        item.paragraphs.some(isTruncated) ||
        item.features.some(isTruncated),
    ).length,
  }

  console.log(`Каталог собран: ${path.relative(root, OUTPUT_PATH)}`)
  for (const [label, value] of Object.entries(report)) {
    console.log(`  ${label}: ${value}`)
  }
}

await main()
