/**
 * Характеристики двумя колонками «параметр — значение». В выгрузке они
 * лежали одной строкой («Мощность (kW): 0.5»), из-за чего читались как
 * список заметок, а не как паспорт прибора.
 */
export default function ProductSpecs({ specs, columns = 1 }) {
  if (!specs || specs.length === 0) {
    return null
  }

  return (
    <dl
      className={`overflow-hidden border border-[#78AEAD]/25 ${
        columns === 2 ? 'md:grid md:grid-cols-2 md:gap-x-px md:bg-[#78AEAD]/25' : ''
      }`}
    >
      {specs.map((spec, index) => (
        <div
          key={`${spec.label}-${index}`}
          className={`flex flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:gap-4 ${
            index === 0 ? '' : 'border-t border-[#78AEAD]/20'
          } ${columns === 2 && index === 1 ? 'md:border-t-0' : ''}`}
        >
          <dt className="shrink-0 leading-relaxed text-[var(--muted-text)] sm:w-[46%]">{spec.label}</dt>
          <dd className="min-w-0 flex-1 font-semibold leading-relaxed text-[var(--ink)]">
            {spec.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
