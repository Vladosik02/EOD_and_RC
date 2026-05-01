# EOD & RC — корпоративний сайт

> Сертифікований оператор гуманітарного розмінування в Україні.
> Нетехнічне та технічне обстеження, ручне розмінування, очищення районів бойових дій, рекультивація земель.

Це статичний сайт без сборки — всі сторінки пишуться руками як HTML, з інлайн-стилями та підключеним спільним `assets/styles.css` та `assets/scripts.js`.

---

## Структура

```
.
├── index.html                          # Редирект на eod-rc-prototype.html
├── eod-rc-prototype.html               # Головна (Hero, послуги, операції, команда, контакти)
├── eod-rc-operations.html              # Карта операцій (Leaflet + MarkerCluster)
├── eod-rc-team.html                    # Команда (7 членів + Person JSON-LD)
├── eod-rc-partners.html                # Партнерам (співпраця, реквізити)
├── eod-rc-service-nts.html             # Послуга: Нетехнічне обстеження
├── eod-rc-service-ts.html              # Послуга: Технічне обстеження
├── eod-rc-service-manual.html          # Послуга: Ручне розмінування
├── eod-rc-service-clearance.html       # Послуга: Очищення районів БД
├── eod-rc-service-recultivation.html   # Послуга: Рекультивація
│
├── assets/
│   ├── styles.css                      # Спільні CSS (skip-link, picture, print, reduced-motion)
│   └── scripts.js                      # setLang, hamburger, scroll-reveal, SW registration
│
├── manifest.webmanifest                # PWA (icons, name, theme)
├── service-worker.js                   # Offline / cache-first для статики
├── browserconfig.xml                   # Windows tile налаштування
├── robots.txt
├── sitemap.xml                         # 10 URL з lastmod
│
├── apple-touch-icon.png                # 180×180 для iOS
├── icon-192.png  icon-512.png          # PWA іконки
├── og-image.jpg / .webp                # 1200×630 для соцшарингу
├── favicon-*.png  *.svg                # фавікони
│
├── photo_*.{jpg,png,webp}              # Фото команди (з WebP fallback)
├── photo-manual-demining.{jpg,webp}    # Фото операції
├── cert-08{0,1,2,3}.{jpg,webp}         # Сертифікати
└── *-logo-*.{png,svg}                  # Логотипи (горизонтальні / вертикальні / основні)
```

---

## Локальний запуск

Сайт повністю статичний — будь-який HTTP-сервер підійде.

```bash
# Найпростіше (Python, є майже всюди)
python3 -m http.server 8000

# Або через npm
npm run dev          # serve sources на http://localhost:8000
```

Відкрити http://localhost:8000/

> **Service Worker** працює тільки на `https://` або `localhost`. На `file://` він автоматично пропускається (див. `assets/scripts.js`).

## Build для продакшну

Опційно. Source files — самодостатні і працюють напряму. Build виключно
для оптимізації (мініфікація HTML/CSS/JS, ~17% економії на текстових
ресурсах).

```bash
npm install                # один раз — підтягнути devDependencies
npm run validate           # перевірити HTML/JSON-LD/посилання
npm run build              # збирає в ./dist/
npm run build:report       # те саме з докладним звітом економії
npm run preview            # serve dist на http://localhost:8001
```

`dist/` гнорується git'ом — це build artifact, не commitиться.
Деплоїти можна або source root, або `dist/` — обидва робочі.

---

## Технологічний стек

- **HTML5** з інлайн-CSS (для дрібних сторінок) + спільний `assets/styles.css`
- **JavaScript** — vanilla, без фреймворків
- **Leaflet 1.9.4** — карти на сторінці операцій (через CDN, з SRI integrity)
- **Leaflet MarkerCluster 1.5.3** — кластеризація маркерів
- **Google Fonts** — Barlow + Barlow Condensed
- **Pillow** — для оптимізації зображень (тільки для розробки, не у продакшні)
- **Node.js 20+** — опційно, для запуску `npm run build` (мініфікація)

Source files працюють напряму без жодного збору. Build pipeline — нашаровка.

---

## SEO та accessibility

Кожна сторінка має:

- ✅ Унікальний `<title>` та `meta description`
- ✅ Open Graph + Twitter Card теги (og-image.jpg 1200×630)
- ✅ JSON-LD: Organization, Service, FAQPage, BreadcrumbList, Person, WebSite, ContactPage
- ✅ `lang="en"` / `lang="uk"` на двомовних `<span>`
- ✅ Skip-to-content link, semantic landmarks
- ✅ aria-current, aria-label, aria-expanded на інтерактивних елементах
- ✅ SRI integrity на CDN-ресурсах
- ✅ `loading="lazy"` + `width`/`height` на всіх не-hero зображеннях
- ✅ `<picture>` обгортки з WebP source для важких зображень

---

## Двомовність

UA — основна, EN — alternate. Перемикач у nav зберігає вибір у `localStorage` і оновлює `document.documentElement.lang`.

Тексти існують поруч у HTML:

```html
<span lang="uk" class="inline-ua">Послуги</span>
<span lang="en" class="inline-en">Services</span>
```

CSS у `styles.css` ховає неактивний варіант через `body.en` клас.

---

## Контактна форма

Форма на головній використовує **Formspree**:

```html
<form id="contactForm" data-formspree-id="YOUR_FORMSPREE_ID">
```

Замінити `YOUR_FORMSPREE_ID` на реальний ID з https://formspree.io.
Поки placeholder активний, форма падає на `mailto:info@eod-rc.com` fallback.

---

## TODO для виходу в продакшн

1. Замінити placeholder `YOUR_FORMSPREE_ID` у `eod-rc-prototype.html`
2. Замінити placeholder домен `https://eod-rc.com/` у `sitemap.xml`, `manifest.webmanifest`, JSON-LD блоках
3. Додати реальні соціальні мережі у `Organization` JSON-LD `sameAs[]`
4. Налаштувати HTTPS (Service Worker та PWA не працюватимуть без нього)

---

## Ліцензія

Власність ТОВ «Центр знешкодження вибухонебезпечних предметів та рекультивації» (EOD & RC).
