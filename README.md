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

Наразі це не живий фід, а вручну підібрані пости (`.instagram-grid` у
`index.html`, розділ `#instagram`) — `@vladik_sevryukov` (Business-акаунт)
ще не привʼязаний до Facebook-сторінки, а без цього офіційний Graph API
OAuth (потрібен для живих фідів на кшталт behold.so/SnapWidget) не
проходить. Instagram-подіум своїм embed-кодом теж не підійшов би: він
рендериться як cross-origin `<iframe>` з фіксованим білим оформленням,
яке неможливо перестилізувати під дизайн сайту.

Замість цього — власні тайли (стиль як у `.gallery-item` в портфоліо) з
реальними фото/відео, завантаженими локально в `public/instagram/`, і
власний lightbox (`src/instagram-lightbox.js`) при кліку.

### Як були отримані медіа (і як оновити добірку)

1. На потрібному пості в Instagram: **···** → **Embed** → скопіювати код
   (`<blockquote class="instagram-media" data-instgrm-permalink="...">`).
2. Відкрити цей embed-код у браузері (порожня HTML-сторінка з блоком +
   `<script src="https://www.instagram.com/embed.js">` достатньо) і
   зачекати, поки Instagram обробить його в `<iframe>`.
3. У цьому iframe реальне фото/відео — це найбільший `<img>` на сторінці
   (не avatar 100×100) або `<video poster>`/`currentSrc` для Reels.
   Завантажити цей URL і зберегти як `public/instagram/post-N.jpg` (і
   `post-N.mp4` для відео — `video.currentSrc`, окремий playable
   progressive-mp4, без потреби в DASH-плеєрі).
4. Для Reels додатково згенерувати легкий muted-прев'ю кліп для тайла
   (повний файл — 720p, 10–20 МБ, задовгий і завеликий для автовідтворення
   в сітці):
   ```bash
   ffmpeg -i post-N-full.mp4 -t 5 -vf "scale=480:-2" -an \
     -c:v libx264 -crf 30 -preset veryfast -movflags +faststart \
     -pix_fmt yuv420p post-N-preview.mp4
   ```
   (`ffmpeg-static` npm-пакет — простий спосіб отримати `ffmpeg.exe`
   без системної інсталяції, якщо його немає в PATH.)
5. Оновити відповідний тайл в `index.html`: `href` (посилання на
   реальний пост), `data-lightbox-src`/`data-lightbox-poster`,
   і `<img src>` або `<video poster>` + `<source data-src>`.

Тайли з Reels зациклено програють `post-N-preview.mp4` (беззвучно, ліниво
— нічого не завантажується, поки тайл не потрапить у viewport,
`src/instagram-video-preview.js`); клік відкриває lightbox з повним
`post-N-full.mp4` (зі звуком, `<video controls>`). Під
`prefers-reduced-motion: reduce` прев'ю не запускається — просто
статичний постер.

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
- [x] Підключити Telegram-бота і встановити env vars у Vercel
- [x] Instagram: підібрані пости з реальними фото/відео (не живий фід —
      див. розділ "Instagram-стрічка" щодо Facebook-сторінки для живого)
- [ ] Замінити інші медіа-заглушки (hero-відео, портрет, портфоліо) на
      реальні фото/відео
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
