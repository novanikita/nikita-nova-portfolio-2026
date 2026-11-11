import { defineConfig, passthroughImageService } from 'astro/config';

// В деве картинки не пересжимаются: сервер отдаёт исходные AVIF как есть.
// Иначе каждая картинка кодируется на лету по полсекунды, запросы встают в очередь
// и переход на кейс ждёт, пока браузер освободит соединения.
// В сборке Astro по-прежнему готовит все размеры.
const isDev = process.argv.includes('dev');

// Боевой адрес — nikitanova.com. Для предпросмотра на GitHub Pages
// workflow передаёт SITE и BASE через переменные окружения.
const site = process.env.SITE ?? 'https://nikitanova.com';
const base = process.env.BASE ?? '/';

export default defineConfig({
  site,
  base,
  ...(isDev && { image: { service: passthroughImageService() } }),
  i18n: {
    defaultLocale: 'ru',
    locales: ['ru', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
