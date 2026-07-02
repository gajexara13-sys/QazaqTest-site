/* Каталог товаров QazaqTest.
   Цены и позиции — примерные, заменить на актуальные. */

const CATEGORIES = {
  analytics:   'Аналитическое оборудование',
  general:     'Общелабораторное',
  measuring:   'Измерительные приборы',
  furniture:   'Лабораторная мебель',
  consumables: 'Посуда и расходники',
  reagents:    'Реактивы и стандарты',
};

/* Иконки-заглушки по категориям (пока нет фото товаров) */
const CATEGORY_ICONS = {
  analytics: `<svg viewBox="0 0 84 84" fill="none"><rect x="10" y="18" width="64" height="42" rx="6" stroke="#0C7FB8" stroke-width="3.5"/><path d="M22 48l9-13 8 8 11-16 8 12" stroke="#00AFCA" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 68h24m-12-8v8" stroke="#0C7FB8" stroke-width="3.5" stroke-linecap="round"/></svg>`,
  general: `<svg viewBox="0 0 84 84" fill="none"><circle cx="42" cy="42" r="26" stroke="#0C7FB8" stroke-width="3.5"/><circle cx="42" cy="42" r="8" stroke="#00AFCA" stroke-width="3.5"/><path d="M42 16v-6m0 64v-6M16 42h-6m64 0h-6" stroke="#0C7FB8" stroke-width="3.5" stroke-linecap="round"/><path d="M42 42l12-12" stroke="#FEC50C" stroke-width="3.5" stroke-linecap="round"/></svg>`,
  measuring: `<svg viewBox="0 0 84 84" fill="none"><path d="M42 12c-9 14-18 24-18 34a18 18 0 0 0 36 0c0-10-9-20-18-34Z" stroke="#0C7FB8" stroke-width="3.5" stroke-linejoin="round"/><path d="M34 48a8 8 0 0 0 8 8" stroke="#00AFCA" stroke-width="3.5" stroke-linecap="round"/><path d="M20 72h44" stroke="#0C7FB8" stroke-width="3.5" stroke-linecap="round"/></svg>`,
  furniture: `<svg viewBox="0 0 84 84" fill="none"><path d="M12 32h60M16 32v38m52-38v38M32 32V19a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v13" stroke="#0C7FB8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 50h28m-28 10h28" stroke="#00AFCA" stroke-width="3.5" stroke-linecap="round"/></svg>`,
  consumables: `<svg viewBox="0 0 84 84" fill="none"><path d="M32 12v22l-15 30a7 7 0 0 0 6.3 10h37.4A7 7 0 0 0 67 64L52 34V12" stroke="#0C7FB8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 12h30" stroke="#0C7FB8" stroke-width="3.5" stroke-linecap="round"/><path d="M25 52h34" stroke="#00AFCA" stroke-width="3.5" stroke-linecap="round"/><circle cx="38" cy="60" r="3.5" fill="#00AFCA"/><circle cx="48" cy="65" r="2.8" fill="#FEC50C"/></svg>`,
  reagents: `<svg viewBox="0 0 84 84" fill="none"><rect x="24" y="26" width="36" height="46" rx="6" stroke="#0C7FB8" stroke-width="3.5"/><path d="M31 26v-8a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v8" stroke="#0C7FB8" stroke-width="3.5"/><path d="M24 46h36" stroke="#00AFCA" stroke-width="3.5"/><path d="M33 58h18m-18 8h12" stroke="#00AFCA" stroke-width="3.5" stroke-linecap="round"/></svg>`,
};

const PRODUCTS = [
  {
    id: 'spectro-uv1800',
    cat: 'analytics',
    name: 'Спектрофотометр УФ/Вид, 190–1100 нм',
    desc: 'Двухлучевой сканирующий спектрофотометр для аналитических лабораторий. ПО на русском языке.',
    price: 'от 2 850 000 ₸',
    featured: true,
  },
  {
    id: 'hplc-system',
    cat: 'analytics',
    name: 'Система ВЭЖХ с UV-детектором',
    desc: 'Комплектная система высокоэффективной жидкостной хроматографии с автосамплером.',
    price: 'по запросу',
  },
  {
    id: 'aas-flame',
    cat: 'analytics',
    name: 'Атомно-абсорбционный спектрометр',
    desc: 'Пламенный ААС для определения тяжёлых металлов в воде, почвах и продуктах питания.',
    price: 'по запросу',
  },
  {
    id: 'centrifuge-lc04',
    cat: 'general',
    name: 'Центрифуга лабораторная, 4000 об/мин',
    desc: 'Настольная центрифуга с ротором на 12 пробирок 15 мл. Таймер, плавный разгон.',
    price: 'от 480 000 ₸',
    featured: true,
  },
  {
    id: 'autoclave-50l',
    cat: 'general',
    name: 'Автоклав вертикальный, 50 л',
    desc: 'Паровой стерилизатор с автоматическим циклом, для микробиологических лабораторий.',
    price: 'от 1 950 000 ₸',
  },
  {
    id: 'thermostat-ts80',
    cat: 'general',
    name: 'Термостат суховоздушный, 80 л',
    desc: 'Диапазон +5…+60 °C, точность ±0,1 °C. Для инкубации проб и микробиологии.',
    price: 'от 620 000 ₸',
  },
  {
    id: 'shaker-orbital',
    cat: 'general',
    name: 'Шейкер орбитальный с платформой',
    desc: 'Регулируемая скорость 50–300 об/мин, таймер, платформа с зажимами для колб.',
    price: 'от 390 000 ₸',
  },
  {
    id: 'balance-analytical',
    cat: 'measuring',
    name: 'Весы аналитические, 220 г / 0,1 мг',
    desc: 'Внутренняя калибровка, ветрозащитный бокс, интерфейс RS-232. Внесены в реестр СИ РК.',
    price: 'от 850 000 ₸',
    featured: true,
  },
  {
    id: 'ph-meter-lab',
    cat: 'measuring',
    name: 'pH-метр лабораторный с электродом',
    desc: 'Диапазон 0–14 pH, автоматическая термокомпенсация, калибровка по 3 точкам.',
    price: 'от 185 000 ₸',
  },
  {
    id: 'refractometer-abbe',
    cat: 'measuring',
    name: 'Рефрактометр Аббе',
    desc: 'Измерение показателя преломления и концентрации растворов. Термостатируемый.',
    price: 'от 420 000 ₸',
  },
  {
    id: 'fume-hood-1500',
    cat: 'furniture',
    name: 'Шкаф вытяжной, 1500 мм',
    desc: 'Керамическая столешница, подвод воды и электрики, взрывозащищённый вентилятор.',
    price: 'от 980 000 ₸',
    featured: true,
  },
  {
    id: 'lab-bench-1200',
    cat: 'furniture',
    name: 'Стол лабораторный пристенный, 1200 мм',
    desc: 'Химически стойкая столешница, металлический каркас, регулируемые опоры.',
    price: 'от 260 000 ₸',
  },
  {
    id: 'glassware-set',
    cat: 'consumables',
    name: 'Набор лабораторного стекла',
    desc: 'Колбы, стаканы, цилиндры, пипетки из боросиликатного стекла. Комплектация под заказ.',
    price: 'от 95 000 ₸',
  },
  {
    id: 'pipette-tips',
    cat: 'consumables',
    name: 'Наконечники для дозаторов, 1000 шт',
    desc: 'Универсальные наконечники 100–1000 мкл, стерильные и нестерильные варианты.',
    price: 'от 18 000 ₸',
  },
  {
    id: 'filters-membrane',
    cat: 'consumables',
    name: 'Фильтры мембранные, 0,45 мкм',
    desc: 'Мембранные фильтры для пробоподготовки и микробиологического анализа воды.',
    price: 'от 32 000 ₸',
  },
  {
    id: 'gso-standards',
    cat: 'reagents',
    name: 'ГСО состава растворов металлов',
    desc: 'Государственные стандартные образцы для градуировки приборов. Паспорт и сертификат.',
    price: 'от 25 000 ₸',
  },
  {
    id: 'reagents-pure',
    cat: 'reagents',
    name: 'Реактивы квалификации ХЧ / ОСЧ',
    desc: 'Кислоты, щёлочи, соли и растворители. Поставка партиями со свежими сроками годности.',
    price: 'по запросу',
  },
  {
    id: 'nutrient-media',
    cat: 'reagents',
    name: 'Питательные среды для микробиологии',
    desc: 'Сухие питательные среды для санитарного и пищевого микробиологического контроля.',
    price: 'от 45 000 ₸',
  },
];

/* Рендер карточки товара */
function productCardHTML(p) {
  return `
    <article class="product-card">
      <div class="product-card__media" aria-hidden="true">${CATEGORY_ICONS[p.cat]}</div>
      <div class="product-card__body">
        <span class="product-card__cat">${CATEGORIES[p.cat]}</span>
        <h3 class="product-card__title">${p.name}</h3>
        <p class="product-card__desc">${p.desc}</p>
        <div class="product-card__footer">
          <span class="product-card__price"><small>Цена</small>${p.price}</span>
          <button class="btn btn--primary btn--sm" data-modal-open data-product="${p.name}">Запросить</button>
        </div>
      </div>
    </article>`;
}
