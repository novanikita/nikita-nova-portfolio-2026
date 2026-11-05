/** Ширина к высоте у обложки на карточке. То же значение стоит в .project-card__cover в site.css */
const CARD_RATIO = 3 / 4;

/** Astro не делает файлы шире исходника: вместо лишних ширин он добавит ширину самого файла */
export const COVER_WIDTHS = [400, 800, 1200, 1600, 2000];

/**
 * Значение sizes для обложки на карточке.
 * Горизонтальная обложка заполняет карточку по высоте и становится шире неё, а лишнее обрезается.
 * Браузер должен знать настоящую ширину картинки, иначе он возьмёт файл поменьше и она будет мыльной.
 */
export function coverSizes({ width, height }: ImageMetadata): string {
  const scale = Math.max(1, width / height / CARD_RATIO);
  const vw = (cardWidth: number) => `${Math.ceil(cardWidth * scale)}vw`;
  return `(width < 768px) ${vw(100)}, ${vw(34)}`;
}
