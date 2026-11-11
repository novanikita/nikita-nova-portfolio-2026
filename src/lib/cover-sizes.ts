/** Размер карточки в сетке: S занимает один блок из четырёх, M два */
export type CardSize = 'S' | 'M';

/** Ширина к высоте у обложки на карточке. То же значение стоит в .project-card__cover в site.css */
const CARD_RATIO = 3 / 4;

/** Доля ширины экрана и пропорция обложки на компьютере. M вдвое шире при той же высоте */
const DESKTOP: Record<CardSize, { width: number; ratio: number }> = {
  S: { width: 25, ratio: CARD_RATIO },
  M: { width: 50, ratio: CARD_RATIO * 2 },
};

/** Astro не делает файлы шире исходника: вместо лишних ширин он добавит ширину самого файла */
export const COVER_WIDTHS = [400, 800, 1200, 1600, 2000];

/**
 * Значение sizes для обложки на карточке.
 * Обложка шире карточки заполняет её по высоте и становится шире неё, а лишнее обрезается.
 * Браузер должен знать настоящую ширину картинки, иначе он возьмёт файл поменьше и она будет мыльной.
 * На телефоне любая карточка во всю ширину и вертикальная.
 */
export function coverSizes({ width, height }: ImageMetadata, card: CardSize = 'S'): string {
  const vw = (cardWidth: number, cardRatio: number) =>
    `${Math.ceil(cardWidth * Math.max(1, width / height / cardRatio))}vw`;
  const desktop = DESKTOP[card];
  return `(width < 768px) ${vw(100, CARD_RATIO)}, ${vw(desktop.width, desktop.ratio)}`;
}
