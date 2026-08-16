import { RUB_TO_KZT } from '../data/siteData'

/**
 * Разбирает ярлык цены источника: «1329446.25 ₽» → { amount, currency: 'RUB' }.
 * Нечисловые ярлыки («по запросу») возвращают null.
 */
function parsePriceLabel(label) {
  if (!label) {
    return null
  }
  const match = /^(\d+(?:\.\d+)?)\s*(.*)$/.exec(label.trim())
  if (!match) {
    return null
  }
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) {
    return null
  }
  return { amount, suffix: match[2] }
}

/**
 * Цена позиции в тенге числом — для сортировки и фильтров по цене.
 * Возвращает null, если цену из ярлыка вытащить нельзя.
 */
export function getPriceKzt(item) {
  const parsed = parsePriceLabel(item?.priceLabel)
  if (!parsed) {
    return null
  }
  if (parsed.suffix.includes('₽')) {
    return Math.round((parsed.amount * RUB_TO_KZT) / 1000) * 1000
  }
  return Math.round(parsed.amount)
}

/**
 * Цены источника в рублях пересчитываем в тенге по курсу RUB_TO_KZT
 * с округлением до 1000 ₸: «1329446.25 ₽» → «8 150 000 ₸».
 * Нечисловые ярлыки («по запросу») не трогаем.
 */
export function formatPriceLabel(label) {
  if (!label) {
    return label
  }
  const parsed = parsePriceLabel(label)
  if (!parsed) {
    return label
  }
  if (parsed.suffix.includes('₽')) {
    const kzt = Math.round((parsed.amount * RUB_TO_KZT) / 1000) * 1000
    return `${kzt.toLocaleString('ru-RU')} ₸`
  }
  return `${Math.round(parsed.amount).toLocaleString('ru-RU')}${
    parsed.suffix ? ` ${parsed.suffix}` : ''
  }`
}
