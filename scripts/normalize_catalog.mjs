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
  value.replace(/(\d)\s*[*xXхХ]\s*(?=\d)/g, '$1×').replace(/\s*×\s*/g, '×')

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
      .replace(/(\d)\s*kW(?![A-Za-z0-9])/g, '$1 кВт')
      .replace(/(\d)\s*W(?![A-Za-z0-9])/g, '$1 Вт')
      // «-50 °C~30 °C» — тильда значит диапазон. В текстах китайского
      // происхождения она полноширинная (～) и волнистая (〜), не только ASCII.
      .replace(/\s*[~～〜]\s*(?=[-+]?\d)/g, ' – ')
      .replace(/(\d)\.(\d)/g, '$1,$2')
      .replace(/(\d)\s*°C/g, '$1 °C')
      // «1,2Х20» → «1,2×20»: кириллическая «х/Х» вместо знака умножения —
      // применяем и вне разбора характеристик, в описаниях и особенностях.
      .replace(/(\d)\s*[хХ]\s*(?=\d)/g, '$1×').replace(/\s*×\s*/g, '×')
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
    // «Масса всей машины», «Масса нетто прибора» — уточнение про сам прибор
    // ничего не добавляет: в карточке и так его характеристики.
    .replace(/^(масса(?:\s+нетто|\s+брутто)?)\s+(?:всей\s+)?(?:машины|прибора|устройства|установки|инструмента)$/i, '$1')
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
      // Точка перед «Модель» остаётся висеть в названии: «…истираемости. DM-II»
      .replace(/[.,]?\s*Модель:\s*-?\s*/gi, ' ')
      // «…(низкотемпературный) Модель CF-CA» — двоеточие ставят не всегда.
      // Само слово в названии лишнее: код модели выводится отдельным полем.
      .replace(/[.,]?\s*Модел[ьи]\s+(?=[A-ZА-ЯЁ0-9][A-ZА-ЯЁ0-9\-–—/.]*\s*$)/gi, ' ')
      // Пробел перед дефисом внутри кода модели: «HYJB -30».
      .replace(/\b([A-ZА-Я]{2,6})\s+-(\d)/g, '$1-$2')
      .replace(/\s*,\s*$/, ''),
  )
}

const matchModelCodes = (value) => value.match(MODEL_PATTERN) ?? []

/** «- 4630М» → «4630М»: в выгрузке код модели иногда идёт с дефисом-мусором. */
// Хвостовое пояснение в скобках — часть названия, а не кода: «ОГЦ-1 (с
// дополнительным грузом 170 г)». Отличаем его от вариантов исполнения вроде
// «LYY-7G (1.5)» или «ВИТ-1 (0...+25)» по строчной кириллице внутри скобок.
const cleanModel = (value) =>
  collapseSpaces(value)
    .replace(/\s*\([^()]*[а-яё][^()]*\)\s*$/, '')
    .replace(/^[-–—\s]+/, '')
    .replace(/[;.,]+$/, '')

function detectModel(item, title) {
  if (item.model) {
    return cleanModel(item.model) || null
  }

  // Характеристика «Модель» бывает шапкой таблицы всего модельного ряда: у
  // весов CAS ED-15H там стоит ED-3-H. Берём её, только если код действительно
  // встречается в названии, — иначе название вернее.
  const fromSpec = item.specs?.find((spec) => /^Модель\s*:/i.test(spec))
  if (fromSpec) {
    const code = cleanModel(fromSpec.replace(/^Модель\s*:/i, ''))
    const flatten = (value) => value.toLowerCase().replace(/[\s-–—]/g, '')
    if (code && flatten(title).includes(flatten(code))) {
      return code
    }
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
/**
 * Курс, по которому рублёвая цена источника переводится в тенге ОДИН РАЗ —
 * при сборке каталога. Дальше цена живёт в витрине как число и от курса не
 * зависит: компания держит постоянные цены, а не пересчитывает их ежедневно.
 *
 * Значение действует только для позиций, у которых своей цены в тенге ещё нет.
 * Проставленная цена лежит в catalog.overrides.json под ключом `priceKzt` и
 * пересборкой не затирается — менять её нужно там.
 */
const RUB_TO_KZT_SEED = 6.13

const seedPriceKzt = (priceRub) =>
  priceRub ? Math.round((priceRub * RUB_TO_KZT_SEED) / 1000) * 1000 : null

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
// Подраздел карточки — лист дерева категорий магазина: «Асфальтобетон >
// Уплотнители» даёт группу «Уплотнители». Когда путь состоит из одного уровня,
// лист совпадает с самим разделом и группой быть не может.
function detectGroup(item) {
  const raw = item.originalCategory ?? ''
  const levels = raw.split('>').map((level) => level.trim()).filter(Boolean)
  if (levels.length < 2) {
    return null
  }
  const leaf = levels[levels.length - 1]
  return /^проч(ее|ие)$/i.test(leaf) ? null : leaf
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
}

const SLUG_MAX = 70

/** Обрезка по границе слова, а не посреди него */
function clipSlug(value, limit) {
  if (value.length <= limit) {
    return value
  }
  const cut = value.slice(0, limit)
  const boundary = cut.lastIndexOf('-')
  return (boundary >= limit / 2 ? cut.slice(0, boundary) : cut).replace(/-+$/, '')
}

/**
 * Адрес карточки — название плюс код модели. Код при обрезке не жертвуем: по
 * нему карточку и ищут, а «…-asfaltobetona-k» вместо «…-kwn-05a» не находится
 * ничем. И не дублируем его, если он уже вошёл в название («Барометр БАММ-1»).
 */
function buildSlug(title, model, fallback) {
  const tail = model ? slugify(model) : ''
  const head = slugify(title)
  if (!tail || head === tail || head.endsWith(`-${tail}`)) {
    return clipSlug(head, SLUG_MAX) || fallback
  }
  const room = SLUG_MAX - tail.length - 1
  const clipped = room > 0 ? clipSlug(head, room) : ''
  return [clipped, tail].filter(Boolean).join('-') || fallback
}

/**
 * «Особенности» — это конструктивные решения и автоматизация. Всё остальное
 * из списка вычищается правилами (docs/catalog-copy-audit.md, проход 4):
 * характеристики уже стоят в specs, оценки и превосходные степени непроверяемы,
 * а длинный пункт — это абзац, случайно попавший в список.
 */
const FEATURE_MAX_LENGTH = 100
const FEATURE_LIMIT = 5

/** Непроверяемые утверждения: для карточки поставщика это риск, а не польза */
const FEATURE_NOISE =
  /(?:^|[^а-яёa-z])(сам(ый|ая|ое|ые|ым|ых|ого)|единственн(ый|ые|ая|ое)|лучш(ий|ие|ая|ее)|№\s?1|издели|хост(?![а-яё])|высококачествен|надежн|надёжн|широко (использ|примен)|идеальн|передов(ой|ая|ое)|превосходн|тестировщик|пользовател|наш(а|ей) компани)|в то же время/i

/** Пункт вида «Высота падения: 457 мм», уже стоящий в таблице характеристик */
function isSpecInDisguise(feature, specLabels) {
  const pair = /^([^:]{2,40}):\s*\S/.exec(feature)
  return Boolean(pair) && specLabels.has(pair[1].trim().toLowerCase())
}

/**
 * Длинный пункт ужимаем до первого предложения: в списке уместно одно
 * утверждение. Если и оно длинное, пункт выбрасываем — обрезать на полуслове
 * хуже, чем не показывать вовсе.
 */
function shortenFeature(feature) {
  if (feature.length <= FEATURE_MAX_LENGTH) {
    return feature
  }
  const firstSentence = /^[^.!?]+[.!?]/.exec(feature)?.[0]?.trim()
  if (firstSentence && firstSentence.length >= 30 && firstSentence.length <= FEATURE_MAX_LENGTH) {
    return firstSentence
  }
  return null
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
    // Строка «Асфальтоанализатор (метод выжигания) Модель: LHRS-6» — это шапка
    // карточки, попавшая в список характеристик, а не параметр прибора.
    if (key.length > 24 && baseTitle.toLowerCase().includes(key.slice(0, 24))) {
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

  const title = stripTrailingModel(baseTitle, model)
  const paragraphs = fromDescription.paragraphs.map(tidyText)
  const summary = tidyText(buildSummary(paragraphs, features, title))

  // Если аннотацию пришлось собрать из пункта «особенностей», этот пункт
  // из списка убираем: иначе одна и та же фраза стоит в карточке дважды.
  const specLabels = new Set(specs.map((spec) => spec.label.trim().toLowerCase()))
  const visibleFeatures = features
    .map(tidyText)
    .filter((feature) => paragraphs.length > 0 || !summary.startsWith(feature.slice(0, 40)))
    .filter((feature) => !FEATURE_NOISE.test(feature))
    .filter((feature) => !isSpecInDisguise(feature, specLabels))
    .filter((feature) => !paragraphs.some((paragraph) => paragraph.includes(feature.slice(0, 50))))
    .map(shortenFeature)
    .filter(Boolean)

  // Код модели и бренд выводятся в карточке отдельными полями — в облаке
  // тегов они только шумят.
  const tags = [...new Set(item.tags ?? [])].filter(
    (tag) => tag && tag !== model && tag !== brand,
  )

  return {
    id: item.id,
    // Идентификатор записи в WooCommerce: он стабилен между выгрузками,
    // в отличие от порядкового id, поэтому по нему привязаны overrides.
    wpId: item.wpId ?? null,
    slug: buildSlug(title, model, item.id),
    categoryId: item.categoryId,
    group: detectGroup(item),
    title,
    model,
    brand,
    summary,
    paragraphs,
    features: visibleFeatures.slice(0, FEATURE_LIMIT),
    specs: specs.map((spec) => ({ label: tidyText(spec.label), value: tidyText(spec.value) })).slice(0, 24),
    tags: [...new Set(tags)].filter(Boolean),
    priceRub: parsePriceRub(item.priceLabel),
    // Цена витрины. Ставится здесь как отправная точка, а окончательное
    // значение задаётся правкой priceKzt — её пересборка не трогает.
    priceKzt: seedPriceKzt(parsePriceRub(item.priceLabel)),
    image: null,
    imageSource: item.imageUrl ?? null,
  }
}

/**
 * В выгрузке девять «Тестеров стабильности Маршалла» и пять сушильных
 * шкафов с одинаковыми названиями — в сетке это выглядит как дубли.
 * Модификации различает код модели, поэтому дописываем его в название.
 */
// Код модели выводится в карточке отдельным полем, поэтому с конца названия
// его снимаем: «Адгезионный тестер SYD-0754» → «Адгезионный тестер». Туда, где
// без кода названия станут неразличимы, его вернёт disambiguateTitles.
function stripTrailingModel(title, model) {
  if (!model) {
    return title
  }
  const escaped = model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const stripped = collapseSpaces(title.replace(new RegExp(`[.,]?\\s*${escaped}\\s*$`), ''))
  return stripped.length >= 12 ? stripped : title
}

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

  const usedOverrideKeys = new Set()
  const merged = source.map(normalizeItem).map((item) => {
    const wpKey = item.wpId == null ? null : `wp-${item.wpId}`
    const key = wpKey != null && overrides[wpKey] ? wpKey : item.id
    if (overrides[key]) {
      usedOverrideKeys.add(key)
    }
    const patched = { ...item, ...(overrides[key] ?? {}) }
    // Заголовок мог прийти из правки — тогда слаг, посчитанный по названию из
    // выгрузки, ему больше не соответствует. Свой слаг в правке уважаем.
    if (!overrides[key]?.slug) {
      patched.slug = buildSlug(patched.title, patched.model, patched.id)
    }
    return patched
  })

  // Развести одинаковые названия можно только после правок: заголовок из
  // overrides может совпасть с чужим, а до применения правок этого не видно.
  const items = disambiguateTitles(merged)

  // Скрытая позиция остаётся в выгрузке и в правках, но на витрину не идёт:
  // так убирают дубли магазина, не трогая сам магазин. Снять — убрать
  // `"hidden": true` из catalog.overrides.json.
  const hidden = items.filter((item) => item.hidden)
  if (hidden.length > 0) {
    console.log(`\nСкрыто правкой hidden: ${hidden.length}`)
    hidden.forEach((item) => console.log(`  wp-${item.wpId}  ${item.title}`))
  }
  const visible = items.filter((item) => !item.hidden)

  // Позиция без раздела на витрину не попадёт: у неё нет ни адреса, ни места в
  // навигации. Импортёр такие не выбрасывает, чтобы раздел можно было назначить
  // правкой по wpId, — отсеиваем здесь, уже после применения overrides.
  const homeless = visible.filter((item) => !item.categoryId)
  if (homeless.length > 0) {
    console.warn(`\nБез раздела — не попали на витрину: ${homeless.length}`)
    homeless.forEach((item) => console.warn(`  ${item.wpId ? `wp-${item.wpId}` : item.id}  ${item.title}`))
    console.warn('  Назначьте раздел в catalog.overrides.json или категорию в импортёре.')
  }
  const placed = visible.filter((item) => item.categoryId)

  const orphanKeys = Object.keys(overrides).filter((key) => !usedOverrideKeys.has(key))
  if (orphanKeys.length > 0) {
    console.warn(`\nВ overrides ${orphanKeys.length} ключей ни с чем не совпали — эти правки не применились:`)
    orphanKeys.slice(0, 20).forEach((key) => console.warn(`  ${key}`))
    if (orphanKeys.length > 20) {
      console.warn(`  … и ещё ${orphanKeys.length - 20}`)
    }
  }

  // Слаги участвуют в адресах карточек — коллизии недопустимы.
  const slugs = new Map()
  for (const item of placed) {
    const taken = slugs.get(item.slug)
    if (taken) {
      item.slug = `${item.slug}-${item.id}`
    }
    slugs.set(item.slug, item.id)
  }

  await writeFile(OUTPUT_PATH, `${JSON.stringify(placed, null, 2)}\n`, 'utf8')

  const report = {
    'позиций': placed.length,
    'с ценой': placed.filter((item) => item.priceKzt !== null).length,
    'с моделью': placed.filter((item) => item.model).length,
    'с брендом': placed.filter((item) => item.brand).length,
    'с характеристиками': placed.filter((item) => item.specs.length > 0).length,
    'с особенностями': placed.filter((item) => item.features.length > 0).length,
    'с фото': placed.filter((item) => item.image).length,
    'обрезанных текстов': placed.filter(
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
