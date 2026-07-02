# QAZAQTEST — сайт поставщика лабораторного оборудования

React + Vite + Tailwind CSS 4. Оборудование для дорожных, строительных и
материаловедческих лабораторий Казахстана: каталог на 127 позиций, мега-меню,
карусель брендов, форма заявки.

## Команды

```bash
npm install          # зависимости
npm run dev          # дев-сервер (http://localhost:5173)
npm run build        # прод-сборка в dist/
npm run preview      # предпросмотр прод-сборки
npm run lint         # ESLint
npm run images:download   # скачать фото товаров к себе (см. ниже)
```

## Фото товаров

`src/data/catalog.generated.json` сгенерирован из Excel
(`scripts/generate_catalog_from_xlsx.py`); поле `imageUrl` изначально указывает
на rutestin.com. Чтобы не зависеть от чужого хостинга:

```bash
npm run images:download
```

Скрипт скачает все изображения в `public/products/`, перепишет `imageUrl` на
локальные пути (исходный адрес останется в `imageSourceUrl`) и ничего не
сломает при повторном запуске. После запуска закоммитьте `public/products/` и
обновлённый JSON.

## Отправка заявок

Форма «Запрос на консультацию» отправляет JSON `{ name, phone, topic, page,
submittedAt }` на адрес из переменной окружения `VITE_LEAD_ENDPOINT`:

```bash
# .env.local
VITE_LEAD_ENDPOINT=https://formspree.io/f/XXXXXXXX   # или свой обработчик
```

Если переменная не задана, заявка не теряется: на экране подтверждения есть
кнопка «Продублировать в WhatsApp» (номер задаётся константой `WHATSAPP_PHONE`
в `src/App.jsx`) с предзаполненным сообщением.

## Что заменить перед запуском

- Реквизиты в подвале (`SiteFooter` в `src/App.jsx`): БИН и адрес офиса.
- Ссылки «Политика конфиденциальности» и «Договор оферты» — сейчас `href="#"`.
- Цены и наличие в `src/data/catalog.generated.json` (цены источника в ₽).

## Структура

```
src/App.jsx                     — все страницы и компоненты (роутинг HashRouter)
src/data/siteData.js            — категории, бренды, преимущества
src/data/catalog.generated.json — товары (генерируется из xlsx)
src/components/                 — CategoriesBentoGrid
src/index.css                   — палитра (CSS-переменные), Tailwind, карусель брендов
scripts/                        — генерация каталога, обработка логотипов, загрузка фото
```
