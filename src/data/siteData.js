import catalog from './catalog.json'

export { categories, getCategoryById, categoryCounts, getCategoryGroups } from './categoryMeta'
export { benefits, brands, COMPANY_DETAILS } from './content'

export const catalogItems = catalog

export function getCategoryItems(categoryId) {
  return catalogItems.filter((item) => item.categoryId === categoryId)
}

export function getProductBySlug(categoryId, slug) {
  return catalogItems.find((item) => item.categoryId === categoryId && item.slug === slug)
}

/**
 * Цена карточки в тенге.
 *
 * Число берётся из каталога как есть — никакого пересчёта по курсу здесь нет:
 * компания держит постоянные цены, и они не должны меняться от того, что
 * кто-то поправил коэффициент. Цена задаётся в catalog.overrides.json
 * (`priceKzt`), там же её и менять.
 *
 * Позиции без цены продаются по запросу — возвращаем null.
 */
export function formatPrice(priceKzt) {
  if (!priceKzt) {
    return null
  }
  return `${priceKzt.toLocaleString('ru-RU')} ₸`
}
