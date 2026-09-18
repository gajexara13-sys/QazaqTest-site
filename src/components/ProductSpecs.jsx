/**
 * Характеристики двумя колонками «параметр — значение». В выгрузке они
 * лежали одной строкой («Мощность (kW): 0.5»), из-за чего читались как
 * список заметок, а не как паспорт прибора.
 *
 * Таблица без рамки и заливки: только горизонтальные линии, строки заподлицо
 * с заголовком блока. Коробка вокруг паспорта прибора добавляла третью
 * границу подряд — рамка секции, рамка таблицы, линии строк — и данные
 * из-за неё читались как врезка, а не как основной текст колонки.
 */
export default function ProductSpecs({ specs, columns = 1 }) {
  if (!specs || specs.length === 0) {
    return null
  }

  return (
    <dl
      className={`border-t border-[var(--ink)]/12 ${
        columns === 2 ? 'md:grid md:grid-cols-2 md:gap-x-10' : ''
      }`}
    >
      {specs.map((spec, index) => (
        <div
          key={`${spec.label}-${index}`}
          className="flex flex-col gap-1 border-b border-[var(--ink)]/12 py-3.5 text-sm sm:flex-row sm:gap-4"
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
