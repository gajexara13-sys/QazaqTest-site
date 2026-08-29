import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE_NAME, SITE_ORIGIN } from '../constants'

const DEFAULT_TITLE = `${SITE_NAME} — лабораторное оборудование для дорожных и строительных лабораторий`

/** Пишем в существующий тег, а если его нет — заводим свой и убираем за собой */
function setMeta(selector, create, value) {
  const existing = document.head.querySelector(selector)
  const node = existing ?? create()
  if (!existing) {
    document.head.appendChild(node)
  }
  const attribute = node.tagName === 'LINK' ? 'href' : 'content'
  const previous = node.getAttribute(attribute)
  node.setAttribute(attribute, value)

  return () => {
    if (existing) {
      node.setAttribute(attribute, previous)
    } else {
      node.remove()
    }
  }
}

/**
 * Заголовок, описание и канонический адрес под конкретную страницу.
 *
 * Раньше canonical и og:url были прописаны в index.html один раз и указывали
 * на главную со всех 127 карточек — поисковик считал их копиями главной и
 * выбрасывал из индекса. Теперь адрес страницы совпадает с её содержимым.
 */
export default function usePageMeta(title, description, { noindex = false } = {}) {
  const { pathname, search } = useLocation()

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
    // Параметры поиска в канонический адрес не идут: /search?q=пресс и
    // /search?q=печь — это одна страница с точки зрения индексации.
    const canonical = `${SITE_ORIGIN}${pathname === '/' ? '/' : pathname}`

    document.title = fullTitle

    const restore = [
      setMeta('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), canonical),
      setMeta('meta[property="og:url"]', () => Object.assign(document.createElement('meta'), { property: 'og:url' }), canonical),
      setMeta('meta[property="og:title"]', () => Object.assign(document.createElement('meta'), { property: 'og:title' }), fullTitle),
    ]

    // Страница 404 и результаты поиска в индексе не нужны: у первой нет
    // содержания, у второй оно повторяет карточки каталога.
    if (noindex) {
      restore.push(
        setMeta('meta[name="robots"]', () => Object.assign(document.createElement('meta'), { name: 'robots' }), 'noindex, follow'),
      )
    }

    if (description) {
      restore.push(
        setMeta('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' }), description),
        setMeta('meta[property="og:description"]', () => Object.assign(document.createElement('meta'), { property: 'og:description' }), description),
      )
    }

    return () => {
      document.title = DEFAULT_TITLE
      restore.forEach((undo) => undo())
    }
  }, [title, description, noindex, pathname, search])
}
