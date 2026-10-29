import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categories } from './data/categories';

const categorySlugs = categories.map((c) => c.slug) as [string, ...string[]];

/**
 * Одна запись = одна папка: src/content/<коллекция>/<адрес>/index.md (русский) + en.md (английский)
 * + картинки рядом. Имя папки — адрес страницы: commo/ → /projects/commo/ и /en/projects/commo/
 */
const byFolder = (collection: string) =>
  glob({
    pattern: '*/index.{md,mdx}',
    base: `./src/content/${collection}`,
    generateId: ({ entry }) => entry.split('/')[0],
  });

/** Элемент галереи: картинка из папки кейса или видео из public/ */
const figure = ({ image }: SchemaContext) =>
  z.union([
    z.object({
      image: image(),
      alt: z.string().optional(),
      size: z.enum(['M', 'XL']).default('M'),
    }),
    z.object({
      /** Видео лежит в public/video/, адрес вида "/video/commo-1.mp4" */
      video: z.string(),
      poster: image().optional(),
      size: z.enum(['M', 'XL']).default('M'),
    }),
  ]);

const projects = defineCollection({
  loader: byFolder('projects'),
  schema: (ctx) =>
    z.object({
      title: z.string(),
      /** Ровно одна категория из src/data/categories.ts */
      category: z.enum(categorySlugs),
      year: z.number().int(),
      client: z.string().optional(),
      /** Что сделано, коротко: «айдентика, упаковка, сайт» */
      scope: z.string().optional(),
      /** Ссылка на живой проект */
      link: z.url().optional(),
      /** Порядок в списке: меньше — выше. Шаг 10 оставляет место для новых. */
      order: z.number(),
      cover: ctx.image(),
      coverAlt: z.string().optional(),
      /** Показывать на главной */
      featured: z.boolean().default(false),
      /** Убрать с сайта: страница открывается по ссылке, но карточки нет */
      hidden: z.boolean().default(false),
      /** Группы картинок, между группами большой отступ */
      galleries: z.array(z.array(figure(ctx))).default([]),
      /** Для поисковиков и превью ссылок; по умолчанию берётся из текста */
      description: z.string().optional(),
    }),
});

const articles = defineCollection({
  loader: byFolder('articles'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Название в списке, если отличается от заголовка */
      listTitle: z.string().optional(),
      date: z.coerce.date(),
      /** Обложка карточки в общей сетке. Без неё на карточке название на сером фоне */
      cover: image().optional(),
      coverAlt: z.string().optional(),
      hidden: z.boolean().default(false),
      description: z.string().optional(),
    }),
});

/**
 * Английские тексты: en.md рядом с index.md. Переводится только текст и заголовок,
 * картинки, порядок и категория берутся из index.md. Без en.md английская страница
 * показывает русский текст.
 */
const translations = defineCollection({
  loader: glob({
    pattern: '*/*/en.{md,mdx}',
    base: './src/content',
    generateId: ({ entry }) => entry.split('/').slice(0, 2).join('/'),
  }),
  schema: z.object({
    title: z.string(),
    listTitle: z.string().optional(),
    client: z.string().optional(),
    scope: z.string().optional(),
    coverAlt: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { projects, articles, translations };
