import { getCollection, render, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';
import { localePath } from '../i18n/utils';

type Project = CollectionEntry<'projects'>;
type Article = CollectionEntry<'articles'>;
type Translation = CollectionEntry<'translations'>;

/** Проект с текстами на нужном языке */
export interface LocalizedProject {
  entry: Project;
  translation?: Translation;
  title: string;
  client?: string;
  scope?: string;
  coverAlt: string;
  description?: string;
  url: string;
}

export interface LocalizedArticle {
  entry: Article;
  translation?: Translation;
  title: string;
  listTitle: string;
  description?: string;
  url: string;
}

async function translationsMap(): Promise<Map<string, Translation>> {
  const all = await getCollection('translations');
  return new Map(all.map((t) => [t.id, t]));
}

function localizeProject(entry: Project, lang: Lang, tr?: Translation): LocalizedProject {
  const t = lang === 'en' ? tr?.data : undefined;
  const title = t?.title ?? entry.data.title;
  return {
    entry,
    translation: lang === 'en' ? tr : undefined,
    title,
    client: t?.client ?? entry.data.client,
    scope: t?.scope ?? entry.data.scope,
    coverAlt: t?.coverAlt ?? entry.data.coverAlt ?? title,
    description: t?.description ?? entry.data.description,
    url: localePath(lang, `projects/${entry.id}`),
  };
}

function localizeArticle(entry: Article, lang: Lang, tr?: Translation): LocalizedArticle {
  const t = lang === 'en' ? tr?.data : undefined;
  const title = t?.title ?? entry.data.title;
  return {
    entry,
    translation: lang === 'en' ? tr : undefined,
    title,
    listTitle: t?.listTitle ?? (t ? t.title : entry.data.listTitle ?? entry.data.title),
    description: t?.description ?? entry.data.description,
    url: localePath(lang, `articles/${entry.id}`),
  };
}

/** Все видимые проекты по порядку */
export async function getProjects(lang: Lang): Promise<LocalizedProject[]> {
  const [projects, tr] = await Promise.all([
    getCollection('projects', (p) => !p.data.hidden),
    translationsMap(),
  ]);
  return projects
    .sort((a, b) => a.data.order - b.data.order)
    .map((p) => localizeProject(p, lang, tr.get(`projects/${p.id}`)));
}

/** Проекты для главной: отмеченные featured, а если таких нет — все */
export async function getFeaturedProjects(lang: Lang): Promise<LocalizedProject[]> {
  const all = await getProjects(lang);
  const featured = all.filter((p) => p.entry.data.featured);
  return featured.length ? featured : all;
}

export async function localizeProjectEntry(entry: Project, lang: Lang): Promise<LocalizedProject> {
  const tr = await translationsMap();
  return localizeProject(entry, lang, tr.get(`projects/${entry.id}`));
}

/** Следующий проект по порядку, по кругу. Скрытые пропускаются. */
export async function getNextProject(current: Project, lang: Lang): Promise<LocalizedProject | undefined> {
  const all = await getProjects(lang);
  if (all.length < 2) return undefined;
  const i = all.findIndex((p) => p.entry.id === current.id);
  return all[(i + 1) % all.length];
}

export async function getArticles(lang: Lang): Promise<LocalizedArticle[]> {
  const [articles, tr] = await Promise.all([
    getCollection('articles', (a) => !a.data.hidden),
    translationsMap(),
  ]);
  return articles
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((a) => localizeArticle(a, lang, tr.get(`articles/${a.id}`)));
}

export async function localizeArticleEntry(entry: Article, lang: Lang): Promise<LocalizedArticle> {
  const tr = await translationsMap();
  return localizeArticle(entry, lang, tr.get(`articles/${entry.id}`));
}

/** Текст записи на нужном языке: en.md, если есть, иначе index.md */
export async function renderLocalized(item: { entry: Project | Article; translation?: Translation }) {
  return render(item.translation ?? item.entry);
}

export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Пути для getStaticPaths страниц кейсов (включая скрытые — они открываются по ссылке) */
export async function projectPaths() {
  const projects = await getCollection('projects');
  return projects.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}

export async function articlePaths() {
  const articles = await getCollection('articles');
  return articles.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}
