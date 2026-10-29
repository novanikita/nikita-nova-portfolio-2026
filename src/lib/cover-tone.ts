import sharp from 'sharp';

/** Цвет низа обложки и подходящий к нему цвет текста подписи */
export interface CoverTone {
  /** Средний цвет нижней трети обложки, на нём лежит подпись карточки */
  color: string;
  /** На этом цвете лучше читается светлый текст */
  dark: boolean;
}

const cache = new Map<string, Promise<CoverTone>>();

/** Считается при сборке по исходному файлу обложки, один раз на картинку */
export function coverTone(image: ImageMetadata): Promise<CoverTone> {
  const path = (image as ImageMetadata & { fsPath?: string }).fsPath;
  if (!path) return Promise.resolve({ color: 'transparent', dark: false });
  if (!cache.has(path)) cache.set(path, measure(path));
  return cache.get(path)!;
}

async function measure(path: string): Promise<CoverTone> {
  const { width = 1, height = 1 } = await sharp(path).metadata();
  const top = Math.floor(height * 0.65);
  const { channels } = await sharp(path)
    .extract({ left: 0, top, width, height: height - top })
    .stats();
  const [r, g, b] = channels.map((c) => Math.round(c.mean));

  // Белый или чёрный текст — у кого контраст с этим цветом выше (формула WCAG)
  const L = luminance(r, g, b);
  const withWhite = 1.05 / (L + 0.05);
  const withBlack = (L + 0.05) / 0.05;
  return { color: `rgb(${r} ${g} ${b})`, dark: withWhite > withBlack };
}

function luminance(r: number, g: number, b: number): number {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
