import { catalogItems, getCategoryById } from '../data/siteData'

/** Ссылка на страницу поиска с готовым запросом */
export function buildSearchUrl(query) {
  return `/search?q=${encodeURIComponent(query.trim())}`
}

/**
 * Нормализация строки под поиск: нижний регистр, ё → е,
 * любые разделители и знаки — в пробел. «HYJB-30» и «hyjb 30» совпадут.
 */
export function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim()
}

export function tokenize(query) {
  const normalized = normalize(query)
  return normalized.length === 0 ? [] : normalized.split(' ')
}

/** Окончания, отсекаемые при грубом стемминге — от длинных к коротким */
const RU_ENDINGS = [
  'ого', 'ему', 'ому', 'ыми', 'ими', 'ами', 'ями', 'ах', 'ях', 'ов', 'ев',
  'ая', 'яя', 'ое', 'ее', 'ой', 'ый', 'ий', 'ые', 'ие', 'ам', 'ям', 'ею',
  'ью', 'ия', 'ии', 'ей', 'ем', 'ом', 'у', 'ю', 'а', 'я', 'ы', 'и', 'е',
  'о', 'ь', 'й', 'х',
]

/**
 * Грубый стемминг под русскую морфологию: «ситовой» → «ситов».
 * Точность не нужна — основа используется только как запасной вариант
 * поиска по началу слова с пониженным весом.
 */
export function stem(token) {
  if (token.length < 5) {
    return token
  }
  for (const ending of RU_ENDINGS) {
    if (token.endsWith(ending) && token.length - ending.length >= 4) {
      return token.slice(0, -ending.length)
    }
  }
  return token
}

/** Основа встречается в начале какого-либо слова текста */
function hasWordPrefix(text, prefix) {
  return text.startsWith(prefix) || text.includes(` ${prefix}`)
}

/**
 * Короткое слово ищем только с начала слова: иначе «печи» находится
 * внутри «обеспечивает», а «вес» — внутри «навески».
 */
function matchesText(text, token) {
  return token.length >= 5 ? text.includes(token) : hasWordPrefix(text, token)
}

/** Предлоги и союзы не должны сужать выдачу по И */
const STOP_WORDS = new Set([
  'и', 'в', 'на', 'с', 'со', 'для', 'по', 'из', 'к', 'от', 'до', 'при', 'о', 'об', 'а',
])

/** Разбор запроса: токены без стоп-слов (если остались значимые) */
export function queryTokens(query) {
  const tokens = tokenize(query)
  const meaningful = tokens.filter((token) => !STOP_WORDS.has(token))
  return meaningful.length > 0 ? meaningful : tokens
}

/**
 * Веса полей: попадание в название важнее попадания в описание.
 * Витрина хранит характеристики парами, а прозу — массивом абзацев,
 * поэтому текст поля собирается из структуры, а не берётся строкой.
 */
const FIELD_WEIGHTS = [
  { key: 'title', weight: 10 },
  { key: 'model', weight: 8 },
  { key: 'brand', weight: 5 },
  { key: 'group', weight: 4 },
  { key: 'tags', weight: 4 },
  { key: 'summary', weight: 2 },
  { key: 'paragraphs', weight: 1 },
  { key: 'specs', weight: 1 },
  { key: 'features', weight: 1 },
]

function fieldText(item, key) {
  const value = item[key]
  if (!value) {
    return ''
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry : `${entry.label} ${entry.value}`))
      .join(' ')
  }
  return String(value)
}

/** Индекс строится один раз на модуль по всем позициям витрины */
const searchIndex = catalogItems.map((item) => {
  const fields = {}
  FIELD_WEIGHTS.forEach(({ key }) => {
    fields[key] = normalize(fieldText(item, key))
  })
  fields.categoryTitle = normalize(getCategoryById(item.categoryId)?.title ?? '')
  return { item, fields }
})

/**
 * Совпадение одного токена в одной записи. Точное слово ценится выше,
 * чем совпадение по началу слова, чтобы «пресс» не проигрывал «прессформе».
 */
function scoreToken(fields, token) {
  let score = 0
  const tokenStem = stem(token)

  FIELD_WEIGHTS.forEach(({ key, weight }) => {
    const text = fields[key]
    if (!text) {
      return
    }
    if (text === token || text.includes(` ${token} `) || text.startsWith(`${token} `) || text.endsWith(` ${token}`)) {
      score += weight * 2
      return
    }
    if (matchesText(text, token)) {
      score += weight
      return
    }
    // Запасной вариант для словоформ: «ситовой» находит «ситового»
    if (tokenStem !== token && hasWordPrefix(text, tokenStem)) {
      score += weight * 0.5
    }
  })

  if (fields.categoryTitle.includes(token)) {
    score += 3
  }

  return score
}

/**
 * Глобальный поиск по каталогу. Токены объединяются по И: позиция
 * попадает в выдачу, только если найден каждый токен запроса.
 */
export function searchCatalog(query, { limit } = {}) {
  const tokens = queryTokens(query)
  if (tokens.length === 0) {
    return []
  }

  const results = []
  searchIndex.forEach(({ item, fields }) => {
    let total = 0
    for (const token of tokens) {
      const tokenScore = scoreToken(fields, token)
      if (tokenScore === 0) {
        return
      }
      total += tokenScore
    }
    results.push({ item, score: total })
  })

  results.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, 'ru'))

  const items = results.map((result) => result.item)
  return typeof limit === 'number' ? items.slice(0, limit) : items
}

/** Фильтрация внутри категории: по подразделу и подстроке, без ранжирования */
export function getFilteredItems(items, activeCategoryId, searchQuery, activeGroup = 'all') {
  const tokens = queryTokens(searchQuery)

  return items.filter((item) => {
    if (activeCategoryId !== 'all' && item.categoryId !== activeCategoryId) {
      return false
    }
    if (activeGroup !== 'all' && item.group !== activeGroup) {
      return false
    }
    if (tokens.length === 0) {
      return true
    }
    const blob = normalize(
      FIELD_WEIGHTS.map(({ key }) => fieldText(item, key))
        .filter(Boolean)
        .join(' '),
    )
    return tokens.every((token) => {
      if (matchesText(blob, token)) {
        return true
      }
      const tokenStem = stem(token)
      return tokenStem !== token && hasWordPrefix(blob, tokenStem)
    })
  })
}

export const SORT_OPTIONS = [
  { id: 'default', label: 'По умолчанию' },
  { id: 'price-asc', label: 'Сначала дешевле' },
  { id: 'price-desc', label: 'Сначала дороже' },
  { id: 'title', label: 'По названию' },
]

export function sortItems(items, sortId) {
  const sorted = [...items]

  switch (sortId) {
    case 'price-asc':
    case 'price-desc': {
      const direction = sortId === 'price-asc' ? 1 : -1
      // Позиции «по запросу» всегда в конце списка, независимо от направления.
      return sorted.sort((a, b) => {
        if (!a.priceKzt || !b.priceKzt) {
          return (a.priceKzt ? 0 : 1) - (b.priceKzt ? 0 : 1)
        }
        return (a.priceKzt - b.priceKzt) * direction
      })
    }
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
    default:
      return sorted
  }
}

/** Бренды в наборе с числом позиций — фасеты страницы поиска */
export function getBrandFacets(items) {
  const counts = new Map()
  items.forEach((item) => {
    if (!item.brand) {
      return
    }
    counts.set(item.brand, (counts.get(item.brand) ?? 0) + 1)
  })
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ru'))
}

/** Категории, встречающиеся в наборе, с числом позиций */
export function getCategoryFacets(items) {
  const counts = new Map()
  items.forEach((item) => {
    counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1)
  })
  return [...counts.entries()]
    .map(([id, count]) => ({ id, title: getCategoryById(id)?.title ?? id, count }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'ru'))
}
