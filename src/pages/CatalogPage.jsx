import CategoriesBentoGrid from '../components/CategoriesBentoGrid'
import { StaticPageBreadcrumbs } from '../components/Breadcrumbs'

export default function CatalogPage() {
  return (
    <>
      <StaticPageBreadcrumbs currentTitle="Каталог" />

      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-20 md:px-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black tracking-tight text-[var(--ink)] md:text-6xl">Каталог</h1>
            <div className="mt-7 h-1 w-28 rounded-full bg-[var(--accent)]" />
            <p className="mt-8 text-lg leading-relaxed text-slate-600">
              Изучите линейку испытательного оборудования, отсортированную по материалам и задачам
              лаборатории.
            </p>
          </div>

          <div className="mt-16">
            <CategoriesBentoGrid />
          </div>
        </div>
      </section>
    </>
  )
}
