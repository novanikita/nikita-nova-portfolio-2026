import { categories, type CategorySlug } from './categories';

/** Временные заглушки для сетки на главной. Исчезнут, когда появятся реальные кейсы. */
export interface PlaceholderProject {
  id: string;
  number: string;
  year: number;
  category: CategorySlug;
}

export const placeholderProjects: PlaceholderProject[] = Array.from({ length: 16 }, (_, i) => ({
  id: `placeholder-${i + 1}`,
  number: String(i + 1).padStart(2, '0'),
  year: 2026 - (i % 8),
  category: categories[i % categories.length].slug,
}));
