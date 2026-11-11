import saved from '../data/cover-settings.json';

/**
 * Генератор обложек статей: вертикальная стопка цветных полос, которые перетекают друг в друга.
 * Один и тот же сид всегда даёт одну и ту же обложку: случайности здесь нет, все «случайные»
 * числа выводятся из текста сида. Тот же код работает при сборке (рисует обложку в покое)
 * и в браузере (оживляет её при наведении), поэтому картинка совпадает точка в точку.
 *
 * Обложка — это список полос. У каждой полосы цвет стоит дважды: в её начале и в конце.
 * Между ними цвет ровный (ширина пятна, flat), после конца идёт переход к следующей полосе (fade).
 *
 * Всё, что настраивается, лежит в src/data/cover-settings.json: цвета, состав обложки и движение.
 * Подобрать значения можно на странице /cover-generator, она же выдаёт готовое содержимое файла.
 */

/** Из чего собирается обложка: пачки тонких линий, светящиеся линии, длинные переливы, плотные полосы, поля */
type Kind = 'stripes' | 'glow' | 'dusk' | 'block' | 'field';
const KINDS: Kind[] = ['stripes', 'glow', 'dusk', 'block', 'field'];

/**
 * Движение при наведении. Сквозь обложку сверху вниз идёт «линза»: под ней полосы раздвигаются,
 * вокруг неё сжимаются, поэтому границы цветов заметно ездят. Следом идёт волна цвета:
 * полосы перекрашиваются в соседние цвета той же обложки и возвращаются обратно.
 */
export interface CoverMotion {
  /** Сила линзы: 0 — полосы стоят, 1 — под линзой они шире почти втрое */
  lens: number;
  /** За сколько секунд линза проходит обложку */
  lensPeriod: number;
  /** Сколько линз помещается на обложке одновременно */
  lensCount: number;
  /** Собственное дыхание каждой полосы поверх линзы */
  sway: number;
  /** Насколько полоса перекрашивается в другой цвет: 0 — цвета не меняются, 1 — полностью */
  tint: number;
  /** За сколько секунд волна цвета проходит обложку */
  tintPeriod: number;
  /** Разгон после наведения и возврат после ухода курсора: чем меньше, тем быстрее */
  rise: number;
  fall: number;
}

export interface CoverSettings {
  /** Все цвета. Генератор сам делит их по яркости на тёмные (фон), средние и светлые (блики) */
  palette: string[];
  /** Сколько ярких цветов на одной обложке, от и до */
  colors: [number, number];
  /** Доля обложек с тёмным фоном, остальные — на цвете средней яркости */
  darkBase: number;
  /** Сколько частей в обложке, от и до */
  parts: [number, number];
  /** Высота ровного пятна цвета, в процентах высоты обложки, от и до */
  band: [number, number];
  /** Длина перехода между цветами, в процентах высоты обложки, от и до */
  fade: [number, number];
  /** Сколько линий в одной пачке, от и до */
  lines: [number, number];
  /** Как часто между частями возвращается фон: 0 никогда, 1 всегда */
  calm: number;
  /** Как часто встречается каждая часть: 0 — не встречается совсем */
  mix: Record<Kind, number>;
  motion: CoverMotion;
}

/** Настройки, с которыми собран сайт */
export const savedSettings = saved as unknown as CoverSettings;

/** Цвет в OKLab: в нём цвета смешиваются ровно, без грязной середины */
type Lab = [number, number, number];

/** Отрезок обложки: ровное пятно цвета или переход между цветами. Вместе со своим «дыханием» */
interface Span {
  /** Доля высоты обложки в покое, в процентах */
  size: number;
  /** Насколько отрезок растягивается и сжимается при наведении */
  sway: number;
  /** Скорость дыхания, радиан в секунду */
  speed: number;
  phase: number;
}

interface Band {
  color: string;
  flat: Span;
  fade: Span;
  /** Середина полосы в покое, 0 сверху и 1 снизу: по ней через обложку идут линза и волна цвета */
  at: number;
  /** Свой цвет и цвет, в который полоса перекрашивается при наведении */
  lab: Lab;
  tint: Lab;
}

export interface Cover {
  bands: Band[];
  /** Цвет нижней полосы: на нём лежит подпись карточки, поэтому он всегда достаточно тёмный */
  tone: string;
  motion: CoverMotion;
}

/** Текст сида → число (FNV-1a) */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Предсказуемый генератор чисел от 0 до 1 (mulberry32) */
function random(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Яркость цвета по WCAG: 0 чёрный, 1 белый */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToLab(hex: string): Lab {
  const [r, g, b] = [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function labToCss([L, a, b]: Lab): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.round(Math.min(1, Math.max(0, toGamma(c))) * 255));
  return `rgb(${rgb.join(' ')})`;
}

/** Темнее этого — фон, светлее второго — блик */
const DARK = 0.05;
const LIGHT = 0.45;
/** Под белой подписью карточки цвет должен быть не светлее этого (контраст с белым от 4:1) */
const TONE = 0.2;

/** Сид приводится к одному виду, чтобы лишний пробел в конце не менял обложку */
export function normalizeSeed(seed: string): string {
  return seed.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/**
 * Размеры отрезков в процентах: в сумме ровно 100, каждый в своих границах [min, max].
 * Отрезок, который не помещается в границы, встаёт на границу, остальные делят оставшееся место.
 * Если границы несовместимы (например, полос много, а минимум большой), побеждает сумма в 100.
 */
function fit(sizes: number[], min: number[], max: number[]): number[] {
  const out = [...sizes];
  const free = new Set(sizes.map((_, i) => i));
  let room = 100;
  for (let pass = 0; pass < 12 && free.size; pass++) {
    let sum = 0;
    for (const i of free) sum += sizes[i];
    if (sum <= 0 || room <= 0) break;
    const k = room / sum;
    let moved = false;
    for (const i of [...free]) {
      const v = sizes[i] * k;
      const bound = v < min[i] ? min[i] : v > max[i] ? max[i] : undefined;
      if (bound === undefined) continue;
      out[i] = bound;
      room -= bound;
      free.delete(i);
      moved = true;
    }
    if (!moved) {
      for (const i of free) out[i] = sizes[i] * k;
      return out;
    }
  }
  const total = out.reduce((a, b) => a + b, 0) || 1;
  return out.map((v) => (v / total) * 100);
}

export function buildCover(seed: string, settings: CoverSettings = savedSettings): Cover {
  const { palette } = settings;
  const rnd = random(hash(normalizeSeed(seed)));
  const range = (a: number, b: number) => a + (b - a) * rnd();
  const int = (a: number, b: number) => Math.floor(range(a, b + 1));
  const chance = (p: number) => rnd() < p;
  const pick = <T,>(list: T[]): T => list[Math.floor(rnd() * list.length)];
  /** Несколько разных цветов из списка */
  const take = (list: string[], n: number) => {
    const rest = [...list];
    const out: string[] = [];
    while (out.length < n && rest.length) out.push(...rest.splice(Math.floor(rnd() * rest.length), 1));
    return out;
  };

  const byLight = [...palette].sort((a, b) => luminance(a) - luminance(b));
  const darks = byLight.filter((c) => luminance(c) < DARK);
  const lights = byLight.filter((c) => luminance(c) > LIGHT);
  const mids = byLight.filter((c) => !darks.includes(c) && !lights.includes(c));

  // Своя небольшая палитра обложки: фон, несколько ярких цветов поверх него и блик
  const base =
    darks.length && (chance(settings.darkBase) || !mids.length) ? pick(darks) : pick(mids.length ? mids : byLight);
  const others = byLight.filter((c) => c !== base);
  const accents = take(others.filter((c) => !darks.includes(c)), int(settings.colors[0], settings.colors[1]));
  if (!accents.length) accents.push(...take(others, 2), base);
  const glint = lights.length ? pick(lights) : byLight[byLight.length - 1];
  const shadow = darks.length ? pick(darks) : byLight[0];

  const bands: { color: string; flat: number; fade: number }[] = [];
  const add = (color: string, flat: number, fade: number) => bands.push({ color, flat, fade });

  /** Спокойное поле с мягкими краями */
  const field = (color: string) => add(color, range(4, 15), range(3, 13));
  /** Пачка тонких линий двух цветов */
  const stripes = () => {
    const [a, b] = take([base, shadow, ...accents], 2);
    const n = int(settings.lines[0], settings.lines[1]);
    for (let i = 0; i < n; i++) {
      const color = chance(0.12) ? glint : i % 2 ? b : a;
      add(color, range(0.25, 1) ** 2 * 2.2, range(0.05, 1.1));
    }
  };
  /** Светящаяся линия: блик в ореоле цвета */
  const glow = () => {
    const halo = pick(accents);
    add(halo, range(0.3, 1.4), range(1.2, 4.5));
    add(glint, range(0.4, 2.6), range(1.2, 4.5));
    add(halo, range(0.3, 1.4), range(3, 9));
  };
  /** Плотная полоса с резкими краями */
  const block = () => {
    const last = bands[bands.length - 1];
    if (last) last.fade = range(0, 0.25);
    add(pick(accents), range(1.5, 6), range(0, 0.25));
  };
  /** Закат: два-три цвета подряд, почти без ровных пятен, один длинный перелив */
  const dusk = () => {
    for (const color of take([...accents, glint, shadow], int(2, 3))) add(color, range(0.8, 3), range(7, 18));
  };

  field(chance(0.6) ? base : pick(accents));
  /** Следующая часть: по весам из настроек, одна и та же часть дважды подряд не идёт */
  const next = (previous?: Kind): Kind => {
    const weight = (k: Kind) => Math.max(0, settings.mix[k] ?? 0);
    let kinds = KINDS.filter((k) => k !== previous && weight(k) > 0);
    if (!kinds.length) kinds = KINDS.filter((k) => weight(k) > 0);
    let point = rnd() * kinds.reduce((sum, k) => sum + weight(k), 0);
    for (const k of kinds) {
      point -= weight(k);
      if (point < 0) return k;
    }
    return kinds[kinds.length - 1] ?? 'field';
  };

  const parts = int(settings.parts[0], settings.parts[1]);
  let previous: Kind | undefined;
  for (let i = 0; i < parts; i++) {
    const kind = next(previous);
    previous = kind;
    if (kind === 'stripes') stripes();
    else if (kind === 'glow') glow();
    else if (kind === 'block') block();
    else if (kind === 'dusk') dusk();
    else field(pick(accents));
    // Между частями обложка возвращается к фону, иначе цвета слипаются в кашу
    if (kind !== 'field' && chance(settings.calm)) field(chance(0.8) ? base : shadow);
  }

  // Низ обложки — под подписью карточки: поле цвета, на котором читается белый текст
  const calm = [base, ...accents, shadow].filter((c) => luminance(c) <= TONE);
  const tone = calm.length ? calm[0] : byLight[0];
  if (bands[bands.length - 1].color !== tone) add(tone, 0, 0);
  bands[bands.length - 1].flat = range(9, 16);
  bands[bands.length - 1].fade = 0;

  // Размеры — в проценты высоты, в границах из настроек. Последнего перехода нет: ниже него ничего
  const last = bands.length - 1;
  const fitted = fit(
    bands.flatMap((b) => [b.flat, b.fade]),
    bands.flatMap((_, i) => [settings.band[0], i === last ? 0 : settings.fade[0]]),
    bands.flatMap((_, i) => [settings.band[1], i === last ? 0 : settings.fade[1]]),
  );
  // Чем крупнее отрезок, тем сильнее он дышит
  const span = (size: number, raw: number): Span => ({
    size,
    sway: range(0.35, 0.6) + Math.min(0.5, raw / 24),
    speed: range(0.5, 1.5),
    phase: range(0, Math.PI * 2),
  });
  let y = 0;
  const spans = bands.map((b, i) => {
    const [flat, fade] = [fitted[i * 2], fitted[i * 2 + 1]];
    const at = (y + flat / 2) / 100;
    y += flat + fade;
    return { color: b.color, flat: span(flat, b.flat), fade: span(fade, b.fade), at };
  });

  // Во что перекрашиваются цвета при наведении: яркие цвета меняются по кругу между собой,
  // блик уходит в один из них, фон — в другой тёмный. Светлое остаётся светлым, тёмное тёмным
  const tints = new Map<string, string>();
  accents.forEach((c, i) => tints.set(c, accents[(i + 1) % accents.length]));
  if (!tints.has(glint)) tints.set(glint, pick(accents));
  const deep = darks.filter((c) => c !== base);
  if (!tints.has(base) && deep.length) tints.set(base, shadow !== base ? shadow : pick(deep));
  if (!tints.has(shadow)) tints.set(shadow, base);

  return {
    tone,
    motion: settings.motion,
    bands: spans.map((b, i) => {
      // Нижняя полоса лежит под подписью карточки и цвет не меняет
      const tint = i === spans.length - 1 ? b.color : tints.get(b.color) ?? b.color;
      return { ...b, lab: hexToLab(b.color), tint: hexToLab(tint) };
    }),
  };
}

/**
 * Точки градиента для CSS: «цвет начало%, цвет конец%, …» сверху вниз.
 * time — секунды с начала наведения, amount — сила движения: 0 покой, 1 полная.
 * При amount = 0 результат не зависит от времени, это и есть исходная обложка.
 */
export function coverStops(cover: Cover, time = 0, amount = 0): string {
  const { bands, motion } = cover;
  const sizes: number[] = [];
  const colors: string[] = [];
  let total = 0;
  for (const band of bands) {
    if (!amount) {
      sizes.push(band.flat.size, band.fade.size);
      total += band.flat.size + band.fade.size;
      colors.push(band.color);
      continue;
    }
    const lens = motion.lens * Math.sin(2 * Math.PI * (band.at * motion.lensCount - time / motion.lensPeriod));
    for (const s of [band.flat, band.fade]) {
      const own = motion.sway * s.sway * Math.sin(time * s.speed + s.phase);
      const size = s.size * Math.exp(amount * (lens + own));
      sizes.push(size);
      total += size;
    }
    // Волна цвета: от 0 (свой цвет) до 1 (чужой) и обратно, с плавным входом и выходом
    const wave = 0.5 - 0.5 * Math.cos(2 * Math.PI * (band.at * 0.6 - time / motion.tintPeriod));
    const mix = amount * motion.tint * wave * wave * (3 - 2 * wave);
    colors.push(labToCss(band.lab.map((v, i) => v + (band.tint[i] - v) * mix) as Lab));
  }
  const k = 100 / total;
  const stops: string[] = [];
  let y = 0;
  bands.forEach((_, i) => {
    const start = y;
    y += sizes[i * 2] * k;
    stops.push(`${colors[i]} ${start.toFixed(2)}%`, `${colors[i]} ${y.toFixed(2)}%`);
    y += sizes[i * 2 + 1] * k;
  });
  return stops.join(', ');
}
