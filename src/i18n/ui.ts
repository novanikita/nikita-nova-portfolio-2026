export const languages = {
  ru: 'Ру',
  en: 'En',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'ru';

export const ui = {
  ru: {
    'site.name': 'Никита Нова',
    'site.role': 'дизайнер',
    'site.title': 'Никита Нова — дизайнер',
    'site.description':
      'Портфолио мультидисциплинарного дизайнера: брендинг, реклама, сайты, приложения, иллюстрации, мерч, упаковка, книги.',
    'nav.projects': 'Проекты',
    'nav.articles': 'Статьи',
    'nav.contact': 'Написать',
    'hero.title': 'Мультидисциплинарный дизайнер',
    'hero.text': 'Брендинг, реклама, сайты, приложения, иллюстрации, мерч, упаковка, книги. С 2019 года.',
    'filter.label': 'Фильтр проектов',
    'filter.all': 'Все',
    'projects.heading': 'Проекты',
    'projects.placeholder': 'Проект',
    'nav.allProjects': 'Все проекты',
    'nav.allArticles': 'Все статьи',
    'projects.empty': 'Проекты скоро появятся',
    'project.client': 'Клиент',
    'project.scope': 'Что сделано',
    'project.year': 'Год',
    'project.category': 'Категория',
    'project.link': 'Смотреть проект',
    'project.next': 'Следующий проект',
    'articles.heading': 'Статьи',
    'articles.empty': 'Статей пока нет',
    'theme.toggle': 'Тёмная тема',
    'footer.copyright': '© 2019–2026 Никита Нова',
    'footer.socials': 'Соцсети',
  },
  en: {
    'site.name': 'Nikita Nova',
    'site.role': 'designer',
    'site.title': 'Nikita Nova — designer',
    'site.description':
      'Portfolio of a multidisciplinary designer: branding, advertising, websites, apps, illustration, merch, packaging, books.',
    'nav.projects': 'Projects',
    'nav.articles': 'Articles',
    'nav.contact': 'Contact',
    'hero.title': 'Multidisciplinary designer',
    'hero.text': 'Branding, advertising, websites, apps, illustration, merch, packaging, books. Since 2019.',
    'filter.label': 'Project filter',
    'filter.all': 'All',
    'projects.heading': 'Projects',
    'projects.placeholder': 'Project',
    'nav.allProjects': 'All projects',
    'nav.allArticles': 'All articles',
    'projects.empty': 'Projects are coming soon',
    'project.client': 'Client',
    'project.scope': 'Scope',
    'project.year': 'Year',
    'project.category': 'Category',
    'project.link': 'View project',
    'project.next': 'Next project',
    'articles.heading': 'Articles',
    'articles.empty': 'No articles yet',
    'theme.toggle': 'Dark theme',
    'footer.copyright': '© 2019–2026 Nikita Nova',
    'footer.socials': 'Social',
  },
} as const;

export type UiKey = keyof (typeof ui)['ru'];
