export default function EmptyCatalogState({ categoryTitle, onOpenModal }) {
  if (onOpenModal) {
    return (
      <div className="border border-dashed border-[#78AEAD]/35 bg-white px-6 py-14 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
          Раздел наполняется
        </p>
        <h3 className="mt-4 text-2xl font-bold tracking-tight text-[var(--ink)] md:text-3xl">
          Позиции этого раздела скоро появятся на сайте
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
          Оборудование по направлению «{categoryTitle}» мы уже поставляем — оставьте заявку, и
          инженер подберёт комплектацию под вашу задачу.
        </p>
        <button
          type="button"
          onClick={() => onOpenModal(categoryTitle)}
          className="mt-8 inline-flex h-12 items-center justify-center bg-[var(--accent)] px-8 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:brightness-95"
        >
          Запросить подбор
        </button>
      </div>
    )
  }

  return (
    <div className="border border-dashed border-[#78AEAD]/35 bg-white px-6 py-14 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Ничего не найдено</p>
      <h3 className="mt-4 text-2xl font-bold tracking-tight text-[var(--ink)] md:text-3xl">
        Фильтр ничего не нашёл
      </h3>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
        Попробуйте другой запрос или откройте соседнюю категорию из панели выше.
      </p>
    </div>
  )
}
