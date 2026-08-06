import { useEffect } from 'react'

const SITE_NAME = 'QAZAQTEST'
const DEFAULT_TITLE = `${SITE_NAME} — лабораторное оборудование для дорожных и строительных лабораторий`

/**
 * Заголовок вкладки и описание под конкретную страницу. Сайт на HashRouter,
 * поэтому меняем их вручную: иначе в истории браузера и в закладках все
 * карточки каталога называются одинаково.
 */
export default function useDocumentTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE

    const meta = document.querySelector('meta[name="description"]')
    const previous = meta?.getAttribute('content')
    if (meta && description) {
      meta.setAttribute('content', description)
    }

    return () => {
      document.title = DEFAULT_TITLE
      if (meta && previous) {
        meta.setAttribute('content', previous)
      }
    }
  }, [title, description])
}
