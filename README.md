# Влад Севрюков — весільний ведучий

Односторінковий сайт, portовано з дизайн-прототипу Claude Design
(`Влад Севрюков - Весільний ведучий.dc.html`, проєкт
[claude.ai/design](https://claude.ai/design/p/1f0b52c8-0525-4074-8c05-b64b526b66a4)),
зібраний як звичайний Vite-проєкт: семантичний HTML, CSS на дизайн-токенах,
робоча форма заявки з бекендом на Telegram.

## Стек

- **[Vite](https://vitejs.dev)** — dev-сервер і збірка (бандлінг, мінізація, хешовані імена файлів)
- **Ванільні HTML/CSS/JS** — без фреймворку; сторінка достатньо проста, щоб React/Vue лише додали вагу
- **[@fontsource](https://fontsource.org)** — шрифти (Cormorant Garamond, Jost) самостійно захостені в білді, без запиту до Google Fonts у рантаймі
- **Vercel Serverless Function** (`api/send-telegram.js`) — приймає форму заявки і пересилає в Telegram

## Запуск локально

```bash
npm install
npm run dev       # http://localhost:5173, форма заявки тут поверне помилку —
                   # serverless-функція не піднімається plain `vite dev`,
                   # див. розділ нижче
npm run build      # прод-збірка в dist/
npm run preview    # локальний перегляд прод-збірки
```

Щоб протестувати форму локально разом із функцією:

```bash
npm install -g vercel   # один раз
cp .env.example .env    # і впишіть туди свої TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID
vercel dev               # піднімає і статику, і /api/send-telegram.js
```

## Структура проєкту

```
index.html                 розмітка сторінки (Vite-точка входу)
src/
  main.js                  імпортує шрифти/стилі, ініціалізує nav.js + contact-form.js
  nav.js                   мобільне меню (гамбургер)
  contact-form.js          відправка форми, стани завантаження/помилки/успіху
  styles/
    tokens.css              кольори, шрифти, відступи — єдине джерело правди
    base.css                скидання стилів, типографіка, keyframes, focus-visible
    layout.css               header/nav/мобільне меню, сітка секцій, footer
    components.css          кнопки, картки, форма, кожна секція сторінки
api/
  send-telegram.js          serverless-функція: форма → Telegram
public/
  favicon.svg, site.webmanifest, robots.txt, sitemap.xml
```

## Контактна форма → Telegram

### 1. Створіть бота

1. Напишіть [@BotFather](https://t.me/BotFather) в Telegram → `/newbot` → дайте імʼя.
2. BotFather видасть токен виду `123456789:ABCdef...` — це `TELEGRAM_BOT_TOKEN`.
3. Напишіть новому боту будь-яке повідомлення (наприклад «привіт») — боти не можуть
   писати першими, тож без цього кроку не отримаєте `chat_id`.
4. Відкрийте в браузері:
   `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
   і знайдіть у відповіді `"chat":{"id":123456789,...}` — це `TELEGRAM_CHAT_ID`.

### 2. Додайте змінні середовища у Vercel

Project Settings → Environment Variables:

| Name | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | токен з кроку 1 |
| `TELEGRAM_CHAT_ID` | ваш chat id з кроку 1 |

Токен ніде не потрапляє в клієнтський код — його читає лише
`api/send-telegram.js` на сервері.

### 3. Як це працює

- `src/contact-form.js` шле `POST /api/send-telegram` з полями форми.
- Прихована поле-пастка (`name="company"`) відсіює найпростіших ботів —
  реальний відвідувач його не бачить.
- `api/send-telegram.js` перевіряє обовʼязкові поля, форматує повідомлення
  й відправляє через `sendMessage` Telegram Bot API.
- Є примітивний ліміт запитів на інстанс функції (5/хв на IP) — це не
  повноцінний rate-limiting (serverless-інстанси ефемерні), лише
  запобіжник від випадкового дабл-кліку/скрипта. Якщо форма колись стане
  ціллю справжнього спаму, поставте перед нею Vercel WAF/Cloudflare.
- Немає токена — форма коректно показує користувачу повідомлення про
  помилку замість падіння з 500.

## Instagram-стрічка

`index.html` містить порожній контейнер `<div id="instagram-embed">` з коментарем
поруч — саме туди вставляється embed-код без бекенду й без токенів Meta API:

1. Зареєструйтесь на [snapwidget.com](https://snapwidget.com) або
   [behold.so](https://behold.so) (обидва мають безкоштовний тариф),
   привʼяжіть `@vlad.sevriukov`.
2. Скопіюйте виданий `<iframe>`/`<script>` embed-код.
3. Вставте його всередину `<div id="instagram-embed">…</div>` замість
   поточної підказки.

Нижче embed-коду досі є статична сітка-заглушка (`.instagram-grid`,
`aria-hidden`) — приберіть її, коли підключите живий фід.

## Медіа-заглушки

Портрет, промо-відео та кадри портфоліо позначені підписами на кшталт
`portrait.jpg`, `reel-01.mp4` — реальних фото/відео в проєкті не було
(лише бриф і один референс у `uploads/` дизайн-проєкту). Кожен такий блок
— елемент `.placeholder` в `index.html`; замініть його на `<img>`/`<video>`
з `loading="lazy"` / `poster`, коли зʼявляться матеріали.

## Продакшн-чекліст

- [ ] Замінити `https://vlad-sevriukov.example/` на реальний домен у
      `index.html` (`<link rel="canonical">`), `public/robots.txt`,
      `public/sitemap.xml`, JSON-LD
- [ ] Підключити Telegram-бота (див. вище) і встановити env vars у Vercel
- [ ] Підключити Instagram embed-віджет
- [ ] Замінити медіа-заглушки на реальні фото/відео
- [ ] Додати реальне OG-зображення (1200×630, з фото) і повернути
      `<meta property="og:image">` в `<head>` — навмисно прибрано, поки
      немає фото, щоб посилання не шарились з поламаною плашкою
- [ ] (опційно) згенерувати растрові іконки (apple-touch-icon,
      192/512px PNG для manifest) з `public/favicon.svg` — зараз є лише
      SVG-іконка, якої достатньо для більшості сучасних браузерів

## Деплой (Vercel)

```bash
npm install -g vercel   # якщо ще не встановлено
vercel                  # перший деплой, запитає прив'язку проєкту
vercel --prod            # продакшн-деплой
```

Або підключіть репозиторій на [vercel.com/new](https://vercel.com/new) —
Vite-проєкти визначаються автоматично (`npm run build`, вихід у `dist/`),
`api/*.js` стають serverless-функціями без додаткової конфігурації.
