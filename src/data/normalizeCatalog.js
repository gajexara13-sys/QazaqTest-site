/**
 * Механическая чистка текстов каталога — проходы 1–2 из docs/catalog-copy-audit.md.
 *
 * Выгрузка `catalog.generated.json` пересобирается генератором из Excel, поэтому
 * правки нельзя вносить в неё саму: они исчезнут при следующей выгрузке. Здесь
 * лежат правила, которые применяются к выгрузке один раз при загрузке модуля —
 * то же место, где строится поисковый индекс.
 *
 * Правила механические: они не пишут текст, а приводят к одному виду то, что уже
 * есть. Редактура описаний и аннотаций (проходы 3–5) делается вручную и хранится
 * отдельно, в слое overrides.
 *
 * Про регулярные выражения: `\b` в JS считает словами только ASCII, поэтому
 * `/^вес\b/` не совпадёт с «Вес брутто». Границы слов задаются через
 * lookahead `(?![а-яё])`.
 */

/**
 * Обозначения стандартов: в номере точка — разделитель разделов, а не
 * десятичная запятая. На время замен они прячутся за плейсхолдер из области
 * частного использования Unicode — такого символа в выгрузке быть не может.
 */
const STANDARD_REF = /(?:ГОСТ(?:\s+Р)?|СТ\s?РК|ISO|EN|ASTM|AASHTO|JTG|JT\/T|МИ|ТУ)\s?\d[\d.\-/]*/g

function maskStandards(text) {
  const found = []
  const masked = text.replace(STANDARD_REF, (match) => {
    found.push(match)
    return `\uE000${found.length - 1}\uE000`
  })
  return { masked, found }
}

function unmaskStandards(text, found) {
  return text.replace(/\uE000(\d+)\uE000/g, (_, index) => found[Number(index)])
}

/** ℃ и °С кириллицей → °C по ГОСТ 8.417 */
function normalizeUnits(rawText) {
  const { masked, found } = maskStandards(rawText)
  const text = masked
  return unmaskStandards(
    text
      .replace(/_x000d_/gi, ' ')
      .replace(/[\u00A0\u2000-\u200B\u202F\uFEFF]/g, ' ')
      // Символ-лигатура и кириллическая «С» в обозначении градуса
      .replace(/℃/g, '°C')
      .replace(/°\s*С/g, '°C')
      // Знак умножения в габаритах: 400х275х280 → 400 × 275 × 280
      .replace(/(\d)\s*[хx*]\s*(\d)/g, '$1 × $2')
      .replace(/(мм|см|м)\s*\*\s*(\d)/g, '$1 × $2')
      .replace(/(\d)\s*×\s*(\d)/g, '$1 × $2')
      // AC220V50Hz → 220 В, 50 Гц
      .replace(/\bAC\s*(\d{3})\s*V\s*(\d{2})\s*Hz/gi, '$1 В, $2 Гц')
      .replace(/\bAC\s*(\d{3})\s*V(?![A-Za-z0-9])/gi, '$1 В')
      .replace(/(\d{3})\s*V(?![A-Za-z0-9])/g, '$1 В')
      .replace(/(\d{2})\s*Hz(?![A-Za-z0-9])/gi, '$1 Гц')
      // Десятичная точка → запятая
      .replace(/(\d)\.(\d)/g, '$1,$2')
      // Пробел между числом и единицей измерения
      .replace(/(\d)(л|кг|г|мм|см|м|кВт|Вт|кН|Н|МПа|кПа|Гц|В)(?![а-яА-Яa-zA-Z])/g, '$1 $2')
      // Латинские единицы в скобках, оставшиеся от источника
      .replace(/\(kW\)/g, '(кВт)')
      .replace(/\(mm\)/g, '(мм)')
      .replace(/\(kg\)/g, '(кг)')
      // Код модели, разорванный выгрузкой: «HYJB -30» → «HYJB-30»
      .replace(/([A-ZА-Я]{2,})\s+-\s*(\d)/g, '$1-$2')
      // Пробел перед знаком градуса и перед единицей после скобки
      .replace(/(\d)\s*°C/g, '$1 °C')
      .replace(/\)\s*(В|Гц|кг|мм|кВт|А)(?![а-яёa-z])/g, ') $1')
      .replace(/\s+([,;:.])/g, '$1')
      .replace(/,(?=[а-яёa-z])/gi, ', ')
      .replace(/[ \t]{2,}/g, ' ')
      .trim(),
    found,
  )
}

/** Строка-врезка из выгрузки: служебный заголовок вместо содержания */
const BOILERPLATE_LINE = /^\s*(описание товара|характеристики|технические характеристики)\s*:?\s*$/i

/** Тот же заголовок, приклеенный к началу строки вместе с текстом */
const BOILERPLATE_PREFIX = /^\s*(описание товара|технические характеристики|характеристики)\s*:?\s*/i

function stripBullet(line) {
  return line.replace(/^\s*[•·*‣]\s*/, '').trim()
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Склейка пункта, разорванного выгрузкой посреди фразы: строка кончается словом
 * без знака препинания, а следующая начинается со строчной буквы или цифры.
 * Применяется только к описанию — в характеристиках каждая строка самостоятельна.
 */
function joinBrokenLines(lines) {
  const result = []
  for (const line of lines) {
    const prev = result[result.length - 1]
    const prevIsOpen = prev && !/[.;:!?)»]$/.test(prev)
    if (prev && prevIsOpen && /^[a-zа-я0-9]/.test(line)) {
      result[result.length - 1] = `${prev} ${line}`
      continue
    }
    result.push(line)
  }
  return result
}

function cleanDescription(description) {
  if (!description) {
    return ''
  }
  const lines = normalizeUnits(description)
    .split(/\n+/)
    .map((line) => stripBullet(line))
    .filter((line) => line.length > 0 && !BOILERPLATE_LINE.test(line))

  const joined = joinBrokenLines(lines)
  return joined.map((line, index) => (index === 0 ? capitalize(line) : line)).join('\n')
}

/**
 * Словарь имён параметров: «Вес» → «Масса», «Размеры» → «Габариты».
 *
 * «Размеры» переименовываются только когда речь о самом приборе: сразу за
 * именем идёт значение или слово «устройства/прибора». «Размеры рабочей
 * пластинки» — это размер образца, а не габариты установки, и остаются как есть.
 */
function normalizeParamName(name) {
  return name
    .replace(/^вес(?![а-яё])/i, 'Масса')
    .replace(/^габаритные\s+размеры/i, 'Габариты')
    .replace(/^размеры(?=\s*[:,]?\s*(\d|\(|$))/i, 'Габариты')
    .replace(/^размеры?\s+(устройства|прибора|машины|установки)/i, 'Габариты')
    .replace(/^потребляемая\s+мощность/i, 'Потребляемая мощность')
}

/** Имена параметров, после которых в строке без двоеточия сразу идёт значение */
const KNOWN_PARAM_HEAD = /^(Масса|Габариты|Мощность|Напряжение|Частота|Точность|Диапазон)\s+(?=[\d(])/

/**
 * Выгрузка иногда разрывает пару: имя параметра в одной строке, значение — в
 * следующей («Габаритные размеры» / «564 × 320 × 360 мм»). Строка без цифр и
 * двоеточия склеивается со следующей, если та начинается со значения.
 */
function joinSplitSpecPairs(lines) {
  const result = []
  for (const line of lines) {
    const prev = result[result.length - 1]
    const prevIsBareName = prev && !prev.includes(':') && !/\d/.test(prev) && prev.length < 70
    if (prevIsBareName && /^[\d(]/.test(line)) {
      result[result.length - 1] = `${prev}: ${line}`
      continue
    }
    result.push(line)
  }
  return result
}

/**
 * Имена параметров, которые в выгрузке слиты в одну строку со значением
 * предыдущего: «Датчик давления: 100 кН, точность: 0,5%».
 */
const SECONDARY_PARAMS =
  /[\s,;]+(точность|погрешность|разрешение|дискретность|диапазон|ширина|высота|длина|масса|вес|мощность|напряжение|частота|скорость)\s*:\s*/i

/**
 * Разбор строки характеристики в пары «параметр — значение». Слитые пары
 * отделяются по второму имени параметра внутри значения — с заглавной буквы
 * или из списка выше. Разделение повторяется, пока пары находятся.
 */
function splitSpecLine(line) {
  const head = /^([^:]{2,60}):\s*(.*)$/.exec(line)
  if (!head) {
    return [{ name: null, value: line }]
  }

  const pairs = [{ name: head[1].trim(), value: head[2].trim() }]

  for (let guard = 0; guard < 4; guard += 1) {
    const last = pairs[pairs.length - 1]
    const byCase = /\s([А-ЯЁA-Z][^:]{2,40}):\s*(.+)$/.exec(last.value)
    const byWord = SECONDARY_PARAMS.exec(last.value)

    // Берём то разделение, которое встречается раньше
    const pick =
      byCase && byWord ? (byCase.index <= byWord.index ? byCase : byWord) : byCase ?? byWord
    if (!pick) {
      break
    }

    const rest = pick === byWord ? last.value.slice(pick.index + pick[0].length) : pick[2]
    if (!rest?.trim()) {
      break
    }
    last.value = last.value.slice(0, pick.index).replace(/[\s,;]+$/, '').trim()
    pairs.push({ name: pick[1].trim(), value: rest.trim() })
  }

  return pairs.filter((pair) => pair.value.length > 0)
}

/**
 * Диапазон в значении характеристики: «5-31 об/мин», «0 мм ~ 10 мм» → «5 – 31».
 * Применяется только когда значение целиком является диапазоном, поэтому
 * «ГОСТ 11506-73» и коды моделей «101-2A» не затрагиваются.
 */
const RANGE_VALUE = /^(-?\d+(?:,\d+)?)\s*[-–~]\s*(-?\d+(?:,\d+)?)(\s*[^\d].*)?$/

function normalizeRange(value) {
  const match = RANGE_VALUE.exec(value.trim())
  if (!match) {
    return value
  }
  return `${match[1]} – ${match[2]}${match[3] ?? ''}`
}

function cleanSpecs(specs) {
  if (!specs?.length) {
    return []
  }

  const lines = joinSplitSpecPairs(
    specs
      .flatMap((spec) => normalizeUnits(spec).split(/\n+/))
      .map((spec) => stripBullet(spec).replace(/[;.]+$/, '').trim())
      .filter(Boolean),
  )

  const result = []
  for (const line of lines) {
    // Ярлык группы без значения («Параметры питания:») удаляется: вложенные
    // пункты ниже сами называют свой параметр. Строка с цифрами — это уже
    // содержание (ссылка на ГОСТ, значение), её оставляем без двоеточия.
    if (/^[^:]+:$/.test(line)) {
      const isGroupLabel = !/\d/.test(line) && line.split(/\s+/).length <= 4
      if (isGroupLabel) {
        continue
      }
      result.push(capitalize(line.replace(/:$/, '').trim()))
      continue
    }

    for (const pair of splitSpecLine(line)) {
      const value = normalizeRange(pair.value)
      const text = pair.name
        ? `${capitalize(normalizeParamName(pair.name))}: ${value}`
        // Строка без двоеточия («Вес 75 кг») — имя параметра стоит в начале
        : capitalize(normalizeParamName(value)).replace(KNOWN_PARAM_HEAD, '$1: ')
      if (text.trim().length > 1) {
        result.push(text.trim())
      }
    }
  }

  return [...new Set(result)]
}

/** Обрезка длинной фразы по границе оборота, а не посреди слова */
function cutAtClause(text, limit) {
  const window = text.slice(0, limit)
  const lastClause = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '))
  if (lastClause > limit * 0.5) {
    return `${window.slice(0, lastClause)}…`
  }
  return `${window.replace(/\s+\S*$/, '')}…`
}

/**
 * Аннотация из целых предложений вместо обрезки по 240 символов: набираем
 * предложения, пока не наберётся 120 знаков, и останавливаемся до 220.
 */
function buildSummary(description) {
  if (!description) {
    return ''
  }
  const flat = description.replace(/\n+/g, ' ').replace(/[ \t]{2,}/g, ' ').trim()
  const sentences = flat.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [flat]

  let summary = ''
  for (const raw of sentences) {
    const sentence = raw.trim()
    if (!sentence || summary.length >= 120) {
      break
    }
    const candidate = summary ? `${summary} ${sentence}` : sentence
    if (candidate.length > 220 && summary.length > 0) {
      break
    }
    summary = candidate
  }

  if (!summary) {
    summary = sentences[0]?.trim() ?? ''
  }

  return summary.length > 240 ? cutAtClause(summary, 220) : summary
}

/** Обрезанный на «…» хвост — до последнего целого предложения */
function trimToSentence(text) {
  if (!/…|\.\.\.$/.test(text)) {
    return text
  }
  const withoutTail = text.replace(/\s*(…|\.\.\.)\s*$/, '')
  const lastStop = Math.max(
    withoutTail.lastIndexOf('. '),
    withoutTail.lastIndexOf('! '),
    withoutTail.lastIndexOf('? '),
  )
  if (lastStop > 40) {
    return withoutTail.slice(0, lastStop + 1).trim()
  }
  return withoutTail.replace(/\s+\S*$/, '').trim()
}

/** Ключ для сравнения текстов без учёта регистра и знаков */
function comparisonKey(text) {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, ' ')
    .trim()
}

/**
 * «Особенности» в выгрузке — обрезанная копия начала описания. Такие пункты
 * удаляются: пустое поле честнее дубля (аудит, проход 4).
 */
function cleanFeatures(features, description) {
  if (!features?.length) {
    return []
  }
  const descriptionKey = comparisonKey(description)

  const cleaned = features
    .map((feature) => trimToSentence(normalizeUnits(stripBullet(feature))))
    // Служебный заголовок выгрузки, приклеенный к началу пункта
    .map((feature) => feature.replace(BOILERPLATE_PREFIX, '').trim())
    .filter((feature) => feature.length > 20)
    .filter((feature) => {
      const key = comparisonKey(feature)
      return !descriptionKey.includes(key.slice(0, 60))
    })
    .map(capitalize)

  return [...new Set(cleaned)]
}

/** «Смеситель HYJB -30» → «Смеситель HYJB-30» */
function cleanTitle(title) {
  return title
    .replace(/([A-ZА-Я]{2,})\s+-\s*(\d)/g, '$1-$2')
    .replace(/\s*-\s*(\d)/g, '-$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

/**
 * Неразличимые названия: девять прессов «Тестер стабильности Маршалла» и
 * двенадцать сушильных шкафов. У всех таких позиций есть код модели — он и
 * дописывается к названию.
 */
function disambiguateTitles(items) {
  const counts = new Map()
  items.forEach((item) => {
    counts.set(item.title, (counts.get(item.title) ?? 0) + 1)
  })

  return items.map((item) => {
    const isDuplicate = (counts.get(item.title) ?? 0) > 1
    if (!isDuplicate || !item.model || item.title.includes(item.model)) {
      return item
    }
    return { ...item, title: `${item.title} ${item.model}` }
  })
}

export function normalizeCatalogItems(rawItems) {
  const withCleanTitles = rawItems.map((item) => ({ ...item, title: cleanTitle(item.title) }))

  return disambiguateTitles(withCleanTitles).map((item) => {
    const description = cleanDescription(item.description)
    return {
      ...item,
      description,
      summary: buildSummary(description) || normalizeUnits(item.summary ?? ''),
      features: cleanFeatures(item.features, description),
      specs: cleanSpecs(item.specs),
      imageLabel: cleanTitle(item.imageLabel ?? item.title),
    }
  })
}
