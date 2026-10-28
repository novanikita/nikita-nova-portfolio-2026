# Как добавить проект

1. Папка `src/content/projects/<адрес>/`, латиницей: `commo`, `dodo-dubai-package`.
   Имя папки станет адресом страницы: `/projects/commo/` и `/en/projects/commo/`.
2. В папку — картинки в полном размере (AVIF, JPG или PNG). Уменьшенные версии сделаются сами при сборке.
3. Файл `index.md` с русским текстом:

```md
---
title: "Название проекта"
category: branding        # branding, advertising, websites, apps, illustration, merch, packaging, books
year: 2025
client: "Клиент"          # необязательно
scope: "айдентика, упаковка"   # необязательно
link: "https://example.com"    # необязательно
order: 10                 # меньше — выше в списке, шаг 10
cover: ./cover.avif
featured: true            # показывать на главной
galleries:
  - - image: ./1.avif
      size: XL            # на всю ширину
    - image: ./2.avif
    - image: ./3.avif
  - - video: /video/commo-1.mp4   # видео лежит в public/video/
      poster: ./4.avif
---

Текст кейса в Markdown.
```

4. Файл `en.md` рядом — английский текст:

```md
---
title: "Project name"
client: "Client"
scope: "identity, packaging"
---

Case text in English.
```

Без `en.md` английская страница покажет русский текст.
Если в поле опечатка или нет картинки, сборка остановится и скажет, где ошибка.
