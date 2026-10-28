import { defineConfig } from 'astro/config';

// Боевой адрес — nikitanova.com. Для предпросмотра на GitHub Pages
// workflow передаёт SITE и BASE через переменные окружения.
const site = process.env.SITE ?? 'https://nikitanova.com';
const base = process.env.BASE ?? '/';

export default defineConfig({
  site,
  base,
  i18n: {
    defaultLocale: 'ru',
    locales: ['ru', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
