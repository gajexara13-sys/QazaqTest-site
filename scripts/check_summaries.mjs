/**
 * Линтер аннотаций каталога — проход 3 из docs/catalog-copy-audit.md.
 *
 * Аннотацию нельзя сгенерировать формулой: стандарт указан у 17 позиций из 127,
 * а 94 названия — это просто тип прибора, из которого назначение не выводится.
 * Зато можно автоматически находить аннотации, которые нарушают редполитику,
 * и не пускать их на сайт незамеченными.
 *
 * Запуск:  npm run catalog:lint
 * Выход:   0 — нарушений нет; 1 — есть.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG_PATH = path.join(root, 'src/data/catalog.json')

const MIN_LENGTH = 100
const MAX_LENGTH = 220

/** Оценки вместо фактов — редполитика запрещает их в аннотации */
const MARKETING = [
  ['высококачественн', 'оценка вместо факта'],
  ['надежн', 'оценка вместо факта'],
  ['надёжн', 'оценка вместо факта'],
  ['широко (используется|применяется)', 'оценка вместо факта'],
  ['идеальн', 'оценка вместо факта'],
  ['передов(ой|ая|ое)', 'оценка вместо факта'],
  ['отличн(ый|ая|ое)', 'оценка вместо факта'],
  ['превосходн', 'оценка вместо факта'],
]

/** Кальки машинного перевода */
const TRANSLATIONESE = [
  ['данн(ый|ое|ая) (прибор|устройство|аппарат|машина)', 'калька перевода'],
  ['настоящ(ий|ее) издели', 'калька перевода'],
  ['\\bиздели', 'вместо «прибор»'],
  ['\\bхост\\b', 'вместо «главный блок»'],
  ['тестировщик', 'вместо «оператор»'],
  ['пользовател', 'вместо «оператор»'],
  ['в то же время', 'калька перевода'],
  ['наш(а|ей) компани', 'речь от первого лица'],
]

/** Единицы не по ГОСТ 8.417 */
const UNITS = [
  ['℃', 'символ-лигатура вместо °C'],
  ['°\\s*С', 'кириллическая «С» в градусе'],
  ['\\bAC\\s?\\d{3}\\s?V', 'питание латиницей'],
  ['\\d\\s?[хx]\\s?\\d', 'кириллическая «х» вместо ×'],
]

/**
 * Аннотация-огрызок списка: выгрузка складывала маркированные пункты в прозу,
 * и получалась фраза, грамматически продолжающая отсутствующую вводную.
 */
const LIST_FRAGMENT = /;\s+[а-яё]/

function checkItem(item) {
  const problems = []
  const summary = item.summary ?? ''
  const add = (code, detail) => problems.push({ code, detail })

  if (!summary.trim()) {
    add('пусто', 'аннотации нет')
    return problems
  }

  // Многоточие в конце или после буквы — обрыв; между числами это диапазон
  if (/(…|\.\.\.)\s*$/.test(summary) || /[а-яёa-z](…|\.\.\.)/i.test(summary)) {
    add('обрыв', 'аннотация обрывается многоточием')
  }
  if (summary.length < MIN_LENGTH) {
    add('коротко', `${summary.length} знаков, нужно от ${MIN_LENGTH}`)
  }
  if (summary.length > MAX_LENGTH) {
    add('длинно', `${summary.length} знаков, нужно до ${MAX_LENGTH}`)
  }
  if (LIST_FRAGMENT.test(summary)) {
    add('список', 'аннотация склеена из пунктов списка')
  }
  if (!/^[А-ЯЁA-Z]/.test(summary.trim())) {
    add('регистр', 'начинается не с заглавной буквы')
  }

  const firstParagraph = item.paragraphs?.[0] ?? ''
  // Дублирование мешает при любой длине: на карточке аннотация стоит
  // прямо над описанием, и читатель видит один и тот же текст дважды.
  if (firstParagraph && firstParagraph.startsWith(summary.slice(0, 60))) {
    add('дубль', 'аннотация дословно повторяет начало описания')
  }

  for (const [pattern, reason] of [...MARKETING, ...TRANSLATIONESE, ...UNITS]) {
    const match = new RegExp(pattern, 'i').exec(summary)
    if (match) {
      add('редполитика', `«${match[0]}» — ${reason}`)
    }
  }

  return problems
}

const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf8'))
const report = catalog
  .map((item) => ({ item, problems: checkItem(item) }))
  .filter((entry) => entry.problems.length > 0)

const byCode = new Map()
report.forEach(({ problems }) => {
  problems.forEach(({ code }) => byCode.set(code, (byCode.get(code) ?? 0) + 1))
})

const verbose = process.argv.includes('--verbose')

console.log(`Проверено позиций: ${catalog.length}`)
console.log(`С нарушениями: ${report.length}`)
console.log('')
;[...byCode.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([code, count]) => console.log(`  ${String(count).padStart(3)}  ${code}`))

if (verbose) {
  console.log('')
  report.forEach(({ item, problems }) => {
    console.log(`— ${item.id}  ${item.title}`)
    problems.forEach(({ code, detail }) => console.log(`    [${code}] ${detail}`))
    console.log(`    «${(item.summary ?? '').slice(0, 150)}»`)
  })
}

/**
 * Режим `--facts`: компактная выжимка по позициям с нарушениями — то, из чего
 * пишется аннотация. Формула не выберет ключевой параметр за редактора
 * («Скорость шпинделя: 1400 об/мин» в аннотацию не годится), поэтому скрипт
 * не пишет текст, а раскладывает факты и честно показывает пропуски.
 */
const STANDARD_REF = /(?:ГОСТ(?:\s+Р)?|СТ\s?РК|ISO|EN|ASTM|AASHTO|JTG)\s?\d[\d.\-/]*/g

/** Параметры по убыванию значимости для аннотации */
const KEY_SPEC_ORDER = [
  /^(диапазон|пределы)\s+(измерени|определени|температур)/i,
  /^максимальн(ая|ое)\s+(нагрузка|усилие|давление|номинальная)/i,
  /^(температура|диапазон температур)/i,
  /^(вместимость|емкость|ёмкость|объ[её]м)/i,
  /^(производительность|число|количество)/i,
  /^(точность|погрешность|дискретность)/i,
]

/** Заведомо непригодные для аннотации: обслуживающие параметры */
const SPEC_NOISE = /^(габариты|масса|питание|напряжение|частота|потребляемая|мощность двигателя|скорость (двигателя|шпинделя|вращения))/i

function pickKeySpecs(item) {
  const specs = (item.specs ?? []).filter((spec) => !SPEC_NOISE.test(spec.label))
  const picked = []
  for (const pattern of KEY_SPEC_ORDER) {
    const found = specs.find((spec) => pattern.test(spec.label) && !picked.includes(spec))
    if (found) {
      picked.push(found)
    }
    if (picked.length >= 3) {
      break
    }
  }
  return picked.length > 0 ? picked : specs.slice(0, 2)
}

if (process.argv.includes('--facts')) {
  console.log('')
  report.forEach(({ item, problems }) => {
    const text = [...(item.paragraphs ?? []), ...(item.features ?? [])].join(' ')
    const standards = [...new Set(text.match(STANDARD_REF) ?? [])]
    const keySpecs = pickKeySpecs(item)
    const purpose = (item.paragraphs?.[0] ?? '').slice(0, 200)

    console.log(`### ${item.id} | ${item.title}`)
    console.log(`    раздел: ${item.categoryId} / ${item.group ?? '—'} | модель: ${item.model ?? '—'} | бренд: ${item.brand ?? '—'}`)
    console.log(`    нарушения: ${problems.map((p) => p.code).join(', ')}`)
    console.log(`    стандарты: ${standards.length ? standards.join(', ') : 'НЕТ'}`)
    keySpecs.forEach((spec) => console.log(`    параметр: ${spec.label} — ${spec.value}`))
    console.log(`    проза: ${purpose || 'НЕТ'}`)
    console.log('')
  })
}

process.exit(report.length > 0 ? 1 : 0)
