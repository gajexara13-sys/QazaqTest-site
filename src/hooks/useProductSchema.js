import { useEffect } from 'react'
import { SITE_ORIGIN } from '../constants'

/**
 * Разметка Product/Offer поверх карточки товара — тех же полей, что уже
 * выведены на экран. Цена идёт в разметку, только если она есть в
 * catalog.json: у позиций «по запросу» priceKzt нет, и придумывать offers
 * для них нельзя — это создаст в поиске цену, которой не существует.
 */
export default function useProductSchema(item, canonicalUrl) {
  useEffect(() => {
    if (!item) {
      return undefined
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: item.title,
      description: item.summary,
      url: canonicalUrl,
      ...(item.image ? { image: `${SITE_ORIGIN}${item.image}` } : {}),
      ...(item.brand ? { brand: { '@type': 'Brand', name: item.brand } } : {}),
      ...(item.model ? { model: item.model } : {}),
      ...(item.priceKzt
        ? {
            offers: {
              '@type': 'Offer',
              url: canonicalUrl,
              priceCurrency: 'KZT',
              price: item.priceKzt,
            },
          }
        : {}),
    }

    const node = document.createElement('script')
    node.type = 'application/ld+json'
    node.text = JSON.stringify(schema)
    document.head.appendChild(node)

    return () => node.remove()
  }, [item, canonicalUrl])
}
