import type { Lang } from '../i18n/ui';

/**
 * Категории проектов. У каждого проекта ровно одна категория.
 * phrase — форма для плашки в шапке: «Никита Нова делает {phrase}».
 */
export const categories = [
  { slug: 'branding', label: { ru: 'Брендинг', en: 'Branding' }, phrase: { ru: 'брендинг', en: 'branding' } },
  { slug: 'advertising', label: { ru: 'Реклама', en: 'Advertising' }, phrase: { ru: 'рекламу', en: 'advertising' } },
  { slug: 'websites', label: { ru: 'Сайты', en: 'Websites' }, phrase: { ru: 'сайты', en: 'websites' } },
  { slug: 'apps', label: { ru: 'Приложения', en: 'Apps' }, phrase: { ru: 'приложения', en: 'apps' } },
  { slug: 'illustration', label: { ru: 'Иллюстрации', en: 'Illustration' }, phrase: { ru: 'иллюстрации', en: 'illustrations' } },
  { slug: 'merch', label: { ru: 'Мерч', en: 'Merch' }, phrase: { ru: 'мерч', en: 'merch' } },
  { slug: 'packaging', label: { ru: 'Упаковка', en: 'Packaging' }, phrase: { ru: 'упаковку', en: 'packaging' } },
  { slug: 'books', label: { ru: 'Книги', en: 'Books' }, phrase: { ru: 'книги', en: 'books' } },
] as const;

export type CategorySlug = (typeof categories)[number]['slug'];

export function categoryLabel(slug: CategorySlug, lang: Lang): string {
  return categories.find((c) => c.slug === slug)?.label[lang] ?? slug;
}
