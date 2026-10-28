import type { Lang } from '../i18n/ui';

/** Категории проектов. У каждого проекта ровно одна категория. */
export const categories = [
  { slug: 'branding', label: { ru: 'Брендинг', en: 'Branding' } },
  { slug: 'advertising', label: { ru: 'Реклама', en: 'Advertising' } },
  { slug: 'websites', label: { ru: 'Сайты', en: 'Websites' } },
  { slug: 'apps', label: { ru: 'Приложения', en: 'Apps' } },
  { slug: 'illustration', label: { ru: 'Иллюстрации', en: 'Illustration' } },
  { slug: 'merch', label: { ru: 'Мерч', en: 'Merch' } },
  { slug: 'packaging', label: { ru: 'Упаковка', en: 'Packaging' } },
  { slug: 'books', label: { ru: 'Книги', en: 'Books' } },
] as const;

export type CategorySlug = (typeof categories)[number]['slug'];

export function categoryLabel(slug: CategorySlug, lang: Lang): string {
  return categories.find((c) => c.slug === slug)?.label[lang] ?? slug;
}
