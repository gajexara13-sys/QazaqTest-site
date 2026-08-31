import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const root = document.documentElement
    const prevHtml = root.style.scrollBehavior
    const prevBody = document.body.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    document.body.style.scrollBehavior = 'auto'

    window.scrollTo(0, 0)
    root.scrollTop = 0
    document.body.scrollTop = 0

    root.style.scrollBehavior = prevHtml
    document.body.style.scrollBehavior = prevBody
  }, [pathname])

  return null
}
