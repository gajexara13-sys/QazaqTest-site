/**
 * Счётчики и подразделы по каждому разделу каталога — то немногое, что
 * нужно шапке сайта (мегаменю, счётчики у пунктов) на любой странице.
 *
 * Раньше эти числа считались на лету из catalogItems, а значит любая
 * страница, которой они нужны, тянула за собой весь catalog.json — 422 КБ
 * полных описаний всех 135 позиций, хотя из них требовались только
 * «сколько штук» и «какие подразделы». Здесь это считается один раз на
 * сборке и сохраняется отдельным маленьким файлом, который шапка и
 * подключает вместо всего каталога.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const catalog = JSON.parse(await readFile(path.join(root, 'src/data/catalog.json'), 'utf8'))
const content = await readFile(path.join(root, 'src/data/content.js'), 'utf8')

// Разделы читаем из content.js, а не дублируем списком — тем же приёмом,
// что уже применён в generate_sitemap.mjs, чтобы список не разъезжался.
const categoryIds = [...content.matchAll(/^\s{4}id: '([a-z-]+)',$/gm)].map((match) => match[1])

const summary = {}
for (const id of categoryIds) {
  const items = catalog.filter((item) => item.categoryId === id && !item.hidden)

  const groupCounts = new Map()
  for (const item of items) {
    if (item.group) {
      groupCounts.set(item.group, (groupCounts.get(item.group) ?? 0) + 1)
    }
  }
  const groups = [...groupCounts.entries()]
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'ru'))

  summary[id] = { count: items.length, groups }
}

await writeFile(
  path.join(root, 'src/data/categorySummary.json'),
  JSON.stringify(summary, null, 2) + '\n',
)

console.log(`categorySummary.json: ${categoryIds.length} разделов`)
