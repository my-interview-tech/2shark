import { TArticleKind } from '../types';

/** Сегмент адреса материала на сайте по его типу. */
export const KIND_PATH: Record<TArticleKind, string> = {
  article: 'articles',
  question: 'articles',
  task: 'tasks',
  quiz: 'quizzes',
};

export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif'] as const;

/** Подпись хвостовой навигационной ссылки Obsidian, которая на сайте не нужна. */
export const BACK_LINK_LABEL = 'Назад';

/** Метка в токенах marked, на которой markdown делится на превью и закрытую часть. */
export const PAYWALL_SENTINEL = '<!--2shark:paywall-->';

/** Якоря, которые бекенд добавляет в оглавление сам. */
export const RESERVED_ANCHORS = ['resources'] as const;

export const SEE_ALSO_LABEL = 'См. также';

/** Сколько предупреждений сохранить в `import_jobs.result`, остальные — только счётчиком. */
export const MAX_STORED_WARNINGS = 200;
