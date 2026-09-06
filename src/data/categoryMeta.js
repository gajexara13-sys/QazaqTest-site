/**
 * Разделы каталога со счётчиками и подразделами — для шапки сайта.
 *
 * Ни `content.js`, ни `categorySummary.json` не тянут catalog.json: шапка
 * есть на каждой странице, и раздувать её 422 КБ описаний ради счётчика
 * «43» рядом с названием раздела незачем. Сам каталог (полные карточки
 * товаров) подключает только siteData.js — туда идут страницы каталога,
 * которым эти данные действительно нужны.
 */
import { categories } from './content'
import categorySummary from './categorySummary.json'

export { categories }

export function getCategoryById(categoryId) {
  return categories.find((category) => category.id === categoryId)
}

export const categoryCounts = Object.fromEntries(
  categories.map((category) => [category.id, categorySummary[category.id]?.count ?? 0]),
)

export function getCategoryGroups(categoryId) {
  return categorySummary[categoryId]?.groups ?? []
}
