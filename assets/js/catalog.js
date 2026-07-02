/* Страница каталога: фильтрация по категориям и поиск */

(function () {
  'use strict';

  const grid = document.getElementById('catalog-grid');
  const chips = document.getElementById('catalog-chips');
  const search = document.getElementById('catalog-search');
  const count = document.getElementById('catalog-count');
  const empty = document.getElementById('catalog-empty');
  if (!grid || typeof PRODUCTS === 'undefined') return;

  let activeCat = 'all';
  let query = '';

  function plural(n) {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'позиция';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'позиции';
    return 'позиций';
  }

  function render() {
    const q = query.trim().toLowerCase();
    const items = PRODUCTS.filter((p) => {
      const byCat = activeCat === 'all' || p.cat === activeCat;
      const byQuery = !q || (p.name + ' ' + p.desc + ' ' + CATEGORIES[p.cat]).toLowerCase().includes(q);
      return byCat && byQuery;
    });

    grid.innerHTML = items.map(productCardHTML).join('');
    count.textContent = items.length ? `Найдено: ${items.length} ${plural(items.length)}` : '';
    empty.hidden = items.length > 0;
  }

  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    activeCat = chip.dataset.cat;
    chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c === chip));
    const url = new URL(window.location);
    if (activeCat === 'all') url.searchParams.delete('cat');
    else url.searchParams.set('cat', activeCat);
    history.replaceState(null, '', url);
    render();
  });

  search.addEventListener('input', () => {
    query = search.value;
    render();
  });

  /* Категория из URL (?cat=analytics) — для ссылок с главной и футера */
  const initialCat = new URLSearchParams(window.location.search).get('cat');
  if (initialCat && CATEGORIES[initialCat]) {
    activeCat = initialCat;
    chips.querySelectorAll('.chip').forEach((c) =>
      c.classList.toggle('is-active', c.dataset.cat === initialCat)
    );
  }

  render();
})();
