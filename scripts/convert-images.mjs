// Переводит картинки кейса из inbox/<адрес>/ в AVIF и кладёт в src/content/projects/<адрес>/.
// Имена файлов и настройки описаны в «Правила кейса.md».
//
//   npm run images              все папки из inbox/
//   npm run images -- commo     только один кейс
//
// Если в именах ошибка, кейс не трогается: скрипт перечислит все ошибки и ничего не запишет.
// Готовые файлы с теми же именами перезаписываются.

import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readdir, rename, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import sharp from 'sharp';

/**
 * Настройки кодирования.
 * effort 4: на 6 и 9 файл не становится меньше, а кодирование идёт в 3–10 раз дольше.
 * 4:4:4: цвет не теряет чёткость на тонких линиях и цветном тексте.
 */
const AVIF = { quality: 80, effort: 4, chromaSubsampling: '4:4:4', bitdepth: 8 };

/** Минимальная ширина исходника: меньше можно, но скрипт предупредит */
const MIN_WIDTH = { big: 2800, half: 2000, third: 1400, fourth: 1400 };

/** Читает sharp */
const SHARP_FORMATS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff', '.gif']);
/** sharp их не читает, поэтому сначала их переводит в PNG системная утилита macOS */
const SIPS_FORMATS = new Set(['.heic', '.heif', '.psd', '.bmp', '.jp2']);

const SIZES = Object.keys(MIN_WIDTH).join('|');
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const INBOX = join(ROOT, 'inbox');
const OUTPUT = join(ROOT, 'src/content/projects');

/** Разбирает папку кейса: что конвертировать и какие ошибки в именах */
async function plan(slug) {
  const errors = [];
  const images = [];
  const videos = new Map();
  const numbers = new Map();
  const posters = new Map();
  const covers = [];

  const addNumber = (number, file) => {
    const key = Number(number);
    numbers.set(key, [...(numbers.get(key) ?? []), file]);
  };

  if (!/^[a-z0-9-]+$/.test(slug)) errors.push(`адрес «${slug}» должен быть латиницей: строчные буквы, цифры и дефис`);

  const image = new RegExp(`^${slug}-(\\d+)-(${SIZES})(-poster)?$`);

  for (const entry of await readdir(join(INBOX, slug), { withFileTypes: true })) {
    const file = entry.name;
    if (file.startsWith('.')) continue;
    if (!entry.isFile()) {
      errors.push(`${file}: вложенные папки не поддерживаются`);
      continue;
    }

    const ext = extname(file).toLowerCase();
    const stem = file.slice(0, -ext.length || undefined);
    if (ext === '.md') continue;

    const match = stem.match(image);

    if (ext === '.mp4') {
      if (match && !match[3]) {
        addNumber(match[1], file);
        videos.set(`${Number(match[1])}-${match[2]}`, file);
      } else {
        errors.push(`${file}: имя не подходит, нужно ${slug}-<номер>-<размер>.mp4`);
      }
      continue;
    }

    if (ext !== '.avif' && !SHARP_FORMATS.has(ext) && !SIPS_FORMATS.has(ext)) {
      errors.push(`${file}: формат ${ext || 'без расширения'} не поддерживается`);
      continue;
    }

    if (stem === `${slug}-cover`) {
      covers.push(file);
      images.push({ file, stem, ext });
    } else if (match) {
      images.push({ file, stem, ext, minWidth: MIN_WIDTH[match[2]] });
      if (match[3]) {
        const key = `${Number(match[1])}-${match[2]}`;
        posters.set(key, [...(posters.get(key) ?? []), file]);
      } else {
        addNumber(match[1], file);
      }
    } else {
      errors.push(`${file}: имя не подходит, нужно ${slug}-<номер>-<размер> или ${slug}-cover`);
    }
  }

  if (covers.length === 0) errors.push(`нет обложки ${slug}-cover`);
  if (covers.length > 1) errors.push(`обложка должна быть одна: ${covers.join(', ')}`);
  for (const files of numbers.values()) if (files.length > 1) errors.push(`повторяется номер: ${files.join(', ')}`);
  for (const [key, video] of videos) if (!posters.has(key)) errors.push(`${video}: нет постера`);
  for (const [key, files] of posters) {
    if (!videos.has(key)) errors.push(`${files.join(', ')}: постер без видео`);
    if (files.length > 1) errors.push(`постер должен быть один: ${files.join(', ')}`);
  }

  return { images, errors };
}

/** Записывает AVIF во временный файл: прерванный запуск не оставит битую картинку под настоящим именем */
async function convert({ file, ext }, source, target) {
  if (ext === '.avif') {
    const { format, compression } = await sharp(source).metadata();
    if (format !== 'heif' || compression !== 'av1') throw new Error('расширение .avif, но внутри другой формат');
    await copyFile(source, target);
    return { pages: 1 };
  }

  let input = source;
  let sipsDir;
  if (SIPS_FORMATS.has(ext)) {
    sipsDir = await mkdtemp(join(tmpdir(), 'convert-images-'));
    input = join(sipsDir, `${file}.png`);
    await promisify(execFile)('sips', ['-s', 'format', 'png', source, '--out', input]);
  }

  try {
    // sharp сам переводит цвет в sRGB и убирает метаданные, поворот по EXIF надо применить явно
    const { pages = 1 } = await sharp(input).metadata();
    await sharp(input).autoOrient().avif(AVIF).toFile(target);
    return { pages };
  } finally {
    if (sipsDir) await rm(sipsDir, { recursive: true, force: true });
  }
}

/** Обрабатывает один кейс и возвращает true, если всё прошло без ошибок */
async function processCase(slug) {
  console.log(`\n${slug}`);

  const { images, errors } = await plan(slug);
  if (errors.length) {
    for (const error of errors) console.error(`  ✗ ${error}`);
    console.error('  Кейс не обработан, ничего не записано.');
    return false;
  }

  const outDir = join(OUTPUT, slug);
  await mkdir(outDir, { recursive: true });

  const warnings = [];
  let failed = false;

  for (const item of images) {
    const name = `${item.stem}.avif`;
    const target = join(outDir, name);
    const temp = `${target}.tmp`;
    try {
      const { pages } = await convert(item, join(INBOX, slug, item.file), temp);
      const { width } = await sharp(temp).metadata();
      const { size } = await stat(temp);
      await rename(temp, target);

      const action = item.ext === '.avif' ? 'скопирован' : `→ ${name}`;
      console.log(`  ${item.file} ${action}, ${Math.round(size / 1024)} КБ`);

      if (item.minWidth && width < item.minWidth) {
        warnings.push(`${item.file}: ширина ${width} px, нужно от ${item.minWidth} px`);
      }
      if (pages > 1) warnings.push(`${item.file}: анимация не сохранилась, взят первый кадр`);
    } catch (error) {
      failed = true;
      await rm(temp, { force: true });
      console.error(`  ✗ ${item.file}: ${error.message.trim()}`);
    }
  }

  for (const warning of warnings) console.warn(`  ! ${warning}`);
  return !failed;
}

async function main() {
  const slugs = process.argv.slice(2);

  let folders;
  try {
    folders = (await readdir(INBOX, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    folders = [];
  }

  const missing = slugs.filter((slug) => !folders.includes(slug));
  if (missing.length) {
    console.error(`Нет папки: ${missing.map((slug) => `inbox/${slug}/`).join(', ')}`);
    return false;
  }

  const queue = slugs.length ? slugs : folders;
  if (!queue.length) {
    console.error('В inbox/ нет ни одного кейса.');
    return false;
  }

  let ok = true;
  for (const slug of queue) ok = (await processCase(slug)) && ok;
  return ok;
}

process.exitCode = (await main()) ? 0 : 1;
