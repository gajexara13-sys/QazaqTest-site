import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { brands } from '../data/content'

/** Логотипы, которые визуально мельче остальных — чуть крупнее в карусели */
const BRAND_LOGO_UPSCALE = new Set(['Техком', 'Lithostek', 'Грин-Тех'])

/** Доп. коэффициент к --brands-logo-boost (1 = как базовый boost) */
const BRAND_LOGO_EXTRA_SCALE = {
  Техком: 0.5,
  'Грин-Тех': 0.5,
  Lithostek: 0.7,
}

/** Множитель базовой высоты логотипа (1 = по умолчанию) */
const BRAND_LOGO_HEIGHT_MUL = {
  СТМ: 0.9,
}

const BRANDS_MARQUEE_PERIOD_MS = 32_000

function BrandMarqueeLogo({ brand, decorative }) {
  const [isLogoAvailable, setLogoAvailable] = useState(true)
  const upscaleLogo = BRAND_LOGO_UPSCALE.has(brand.name)

  if (!isLogoAvailable) {
    return (
      <span className="max-w-[11rem] text-center text-sm font-bold leading-tight tracking-tight text-[var(--ink)]/80 md:text-base">
        {brand.name}
      </span>
    )
  }

  return (
    <div className={upscaleLogo ? 'brands-marquee-img-wrap brands-marquee-img-wrap--boost' : 'brands-marquee-img-wrap'}>
      <img
        src={brand.logo}
        alt={decorative ? '' : brand.name}
        loading="eager"
        decoding="sync"
        aria-hidden={decorative}
        onError={() => setLogoAvailable(false)}
        className="brands-marquee-img"
      />
    </div>
  )
}

export default function BrandsMarquee() {
  const firstSegRef = useRef(null)
  const secondSegRef = useRef(null)
  const trackRef = useRef(null)
  const [marqueeShiftPx, setMarqueeShiftPx] = useState(null)
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const slotClass = 'brands-marquee-slot min-h-0 min-w-0'

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      setReducedMotion(mq.matches)
    }
    onChange()
    mq.addEventListener('change', onChange)
    return () => {
      mq.removeEventListener('change', onChange)
    }
  }, [])

  useEffect(() => {
    brands.forEach((b) => {
      const img = new Image()
      img.src = b.logo
    })
  }, [])

  useLayoutEffect(() => {
    const seg1 = firstSegRef.current
    if (!seg1) {
      return undefined
    }

    const MIN_SEG_WIDTH = 120
    let debounceId = null
    let ro = null
    let locked = false

    const commitWidth = () => {
      const s1 = firstSegRef.current
      const s2 = secondSegRef.current
      const track = trackRef.current
      if (!s1 || !s2 || !track) {
        return
      }

      const prevTransform = track.style.transform
      track.style.transform = 'translate3d(0px,0px,0px)'
      void track.offsetHeight

      const r1 = s1.getBoundingClientRect()
      const r2 = s2.getBoundingClientRect()
      const raw = r2.left - r1.left

      track.style.transform = prevTransform

      if (!Number.isFinite(raw) || raw < MIN_SEG_WIDTH) {
        return
      }
      setMarqueeShiftPx((prev) =>
        prev != null && Math.abs(prev - raw) < 0.35 ? prev : raw,
      )
    }

    const schedule = () => {
      if (debounceId != null) {
        window.clearTimeout(debounceId)
      }
      debounceId = window.setTimeout(() => {
        debounceId = null
        commitWidth()
      }, 120)
    }

    ro = new ResizeObserver(() => {
      if (!locked) {
        schedule()
      }
    })
    ro.observe(seg1)
    const s2 = secondSegRef.current
    if (s2) {
      ro.observe(s2)
    }
    schedule()

    const imgs = [
      ...seg1.querySelectorAll('img'),
      ...(secondSegRef.current?.querySelectorAll('img') ?? []),
    ]
    const onImg = () => {
      if (!locked) {
        schedule()
      }
    }
    imgs.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', onImg)
      }
    })

    const onWinResize = () => {
      locked = false
      if (!ro) {
        ro = new ResizeObserver(() => {
          if (!locked) {
            schedule()
          }
        })
        ro.observe(seg1)
        const dup = secondSegRef.current
        if (dup) {
          ro.observe(dup)
        }
      }
      schedule()
    }
    window.addEventListener('resize', onWinResize)

    const lockTimer = window.setTimeout(() => {
      locked = true
      ro?.disconnect()
      ro = null
    }, 2000)

    return () => {
      window.clearTimeout(lockTimer)
      ro?.disconnect()
      window.removeEventListener('resize', onWinResize)
      if (debounceId != null) {
        window.clearTimeout(debounceId)
      }
      imgs.forEach((img) => {
        img.removeEventListener('load', onImg)
      })
    }
  }, [])

  useEffect(() => {
    const track = trackRef.current
    const shift = marqueeShiftPx

    if (!track || shift == null || shift <= 0) {
      return undefined
    }

    if (reducedMotion) {
      return undefined
    }

    const period = shift
    let pos = 0
    let last = performance.now()
    const pxPerMs = period / BRANDS_MARQUEE_PERIOD_MS

    let rafId = 0
    const tick = (now) => {
      const dt = Math.min(80, now - last)
      last = now
      pos += pxPerMs * dt
      while (pos >= period) {
        pos -= period
      }
      track.style.transform = `translate3d(${-pos}px,0,0)`
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      track.style.removeProperty('transform')
    }
  }, [marqueeShiftPx, reducedMotion])

  const slotPropsForBrand = (brand) => {
    const heightMul = BRAND_LOGO_HEIGHT_MUL[brand.name] ?? 1
    const style = {}
    if (heightMul !== 1) {
      style['--brands-logo-mul'] = String(heightMul)
    }
    if (BRAND_LOGO_UPSCALE.has(brand.name)) {
      style['--brands-brand-extra'] = String(BRAND_LOGO_EXTRA_SCALE[brand.name] ?? 1)
      return {
        className: `${slotClass} brands-marquee-slot--boost`,
        style,
      }
    }
    if (heightMul !== 1) {
      return { className: slotClass, style }
    }
    return { className: slotClass }
  }

  const useRafDriver =
    marqueeShiftPx != null && marqueeShiftPx > 0 && !reducedMotion

  const trackClassName = useRafDriver
    ? 'brands-marquee-track brands-marquee-track--raf'
    : 'brands-marquee-track'

  return (
    <div className="brands-marquee overflow-hidden py-4 md:py-5">
      <div ref={trackRef} className={trackClassName}>
        <div ref={firstSegRef} className="brands-marquee-seg">
          {brands.map((brand) => {
            const p = slotPropsForBrand(brand)
            return (
              <div key={`${brand.name}-a`} className={p.className} style={p.style}>
                <BrandMarqueeLogo brand={brand} decorative={false} />
              </div>
            )
          })}
        </div>
        <div
          ref={secondSegRef}
          className="brands-marquee-seg brands-marquee-seg--dup"
          aria-hidden="true"
        >
          {brands.map((brand) => {
            const p = slotPropsForBrand(brand)
            return (
              <div key={`${brand.name}-b`} className={p.className} style={p.style}>
                <BrandMarqueeLogo brand={brand} decorative />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
