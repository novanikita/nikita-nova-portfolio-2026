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
    'nav.label': 'Основная навигация',
    'nav.contact': 'Написать',
    'menu.does': 'делает',
    'menu.all': 'всё',
    'menu.articles': 'статьи',
    'menu.choose': 'Выбрать раздел',
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
    'footer.copyright': '© 2019–2026 Никита Нова',
    'footer.socials': 'Соцсети',
  },
  en: {
    'site.name': 'Nikita Nova',
    'site.role': 'designer',
    'site.title': 'Nikita Nova — designer',
    'site.description':
      'Portfolio of a multidisciplinary designer: branding, advertising, websites, apps, illustration, merch, packaging, books.',
    'nav.label': 'Main navigation',
    'nav.contact': 'Contact',
    'menu.does': 'makes',
    'menu.all': 'everything',
    'menu.articles': 'articles',
    'menu.choose': 'Choose a section',
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
    'footer.copyright': '© 2019–2026 Nikita Nova',
    'footer.socials': 'Social',
  },
} as const;

export type UiKey = keyof (typeof ui)['ru'];
