/**
 * Карта сайта из витрины каталога. Запускается перед сборкой, чтобы
 * sitemap.xml всегда соответствовал текущему составу каталога:
 * добавили позицию — она сама попала в карту.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = 'https://qazaqtest.kz'

/** Статические разделы: приоритет отражает, что важнее для покупателя */
const STATIC_ROUTES = [
  ['/', '1.0', 'weekly'],
  ['/catalog', '0.9', 'weekly'],
  ['/services', '0.6', 'monthly'],
  ['/service', '0.6', 'monthly'],
  ['/guides', '0.5', 'monthly'],
  ['/about', '0.5', 'monthly'],
  ['/contact', '0.7', 'monthly'],
  ['/privacy', '0.3', 'yearly'],
]

const catalog = JSON.parse(await readFile(path.join(root, 'src/data/catalog.json'), 'utf8'))
const siteData = await readFile(path.join(root, 'src/data/siteData.js'), 'utf8')

// Разделы читаем из siteData, а не дублируем списком: иначе карта разъедется
// с меню при первом же изменении каталога.
const categoryIds = [...siteData.matchAll(/^\s{4}id: '([a-z-]+)',$/gm)].map((match) => match[1])

const today = new Date().toISOString().slice(0, 10)
const urls = [
  ...STATIC_ROUTES.map(([loc, priority, changefreq]) => ({ loc, priority, changefreq })),
  ...categoryIds.map((id) => ({ loc: `/catalog/${id}`, priority: '0.8', changefreq: 'weekly' })),
  ...catalog.map((item) => ({
    loc: `/catalog/${item.categoryId}/${item.slug}`,
    priority: '0.7',
    changefreq: 'monthly',
  })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, priority, changefreq }) =>
      `  <url>\n    <loc>${ORIGIN}${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`

await writeFile(path.join(root, 'public/sitemap.xml'), xml)

const robots = `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`
await writeFile(path.join(root, 'public/robots.txt'), robots)

console.log(`sitemap.xml: ${urls.length} адресов (${categoryIds.length} разделов, ${catalog.length} карточек)`)
console.log('robots.txt: записан')
