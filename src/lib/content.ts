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
  coverAlt: string;
  description?: string;
  url: string;
}

export interface LocalizedArticle {
  entry: Article;
  translation?: Translation;
  title: string;
  listTitle: string;
  coverAlt: string;
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
    coverAlt: t?.coverAlt ?? entry.data.coverAlt ?? title,
    description: t?.description ?? entry.data.description,
    url: localePath(lang, `articles/${entry.id}`),
  };
}

/** Черновики видны только в деве, в сборку они не попадают */
const published = (p: Project) => import.meta.env.DEV || !p.data.draft;

/** Все видимые проекты: от новых к старым, при одинаковой дате по order */
export async function getProjects(lang: Lang): Promise<LocalizedProject[]> {
  const [projects, tr] = await Promise.all([
    getCollection('projects', (p) => !p.data.hidden && published(p)),
    translationsMap(),
  ]);
  return projects
    .sort((a, b) => b.data.date.localeCompare(a.data.date) || a.data.order - b.data.order)
    .map((p) => localizeProject(p, lang, tr.get(`projects/${p.id}`)));
}

export async function localizeProjectEntry(entry: Project, lang: Lang): Promise<LocalizedProject> {
  const tr = await translationsMap();
  return localizeProject(entry, lang, tr.get(`projects/${entry.id}`));
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

/** Блоки текста кейса на нужном языке, разделённые в Markdown комментарием <!-- text --> */
export function projectTextBlocks(project: LocalizedProject): string[] {
  const html = (project.translation ?? project.entry).rendered?.html ?? '';
  return html.split(/<!--\s*text\s*-->/).map((block) => block.trim());
}

/** Начало текста для превью ссылки: целые предложения, примерно до 160 знаков */
export function textExcerpt(html: string, limit = 160): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, '\u00a0')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#x3C;|&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/[ \n]+/g, ' ')
    .trim();
  if (text.length <= limit) return text;
  let result = '';
  for (const sentence of text.match(/[^.!?…]+[.!?…]+(\s|$)|[^.!?…]+$/g) ?? []) {
    if ((result + sentence).trim().length > limit) break;
    result += sentence;
  }
  if (result) return result.trim();
  return `${text.slice(0, limit).replace(/[\s\u00a0]+\S*$/, '')}…`;
}

export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Пути для getStaticPaths страниц кейсов (включая скрытые — они открываются по ссылке, но без черновиков) */
export async function projectPaths() {
  const projects = await getCollection('projects', published);
  return projects.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}

export async function articlePaths() {
  const articles = await getCollection('articles');
  return articles.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}
