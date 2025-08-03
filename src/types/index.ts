export type YAMLContent = SpecialtyMapping | TechnologyMapping;

/**
 * Маппинг специальностей
 *
 * Определяет основные специальности в системе с их приоритетами
 * и описаниями.
 *
 * @example
 * ```typescript
 * const specialties: SpecialtyMapping = {
 *   Frontend: {
 *     priority: 1,
 *     description: 'Веб-разработка, UI/UX, браузерные технологии'
 *   },
 *   Backend: {
 *     priority: 2,
 *     description: 'Серверная разработка, API, базы данных'
 *   }
 * };
 * ```
 */
export interface SpecialtyMapping {
  [specialty: string]: {
    /** Приоритет для сортировки (меньше = выше) */
    priority: number;
    /** Описание специальности */
    description: string;
  };
}

/**
 * Маппинг технологий в специальности
 *
 * Определяет как технологии (например, React, Java)
 * соотносятся с основными специальностями (Frontend, Backend).
 *
 * @example
 * ```typescript
 * const mapping: TechnologyMapping = {
 *   React: {
 *     specialty: 'Frontend',
 *     priority: 5,
 *     description: 'Основы React'
 *   },
 *   Java: {
 *     specialty: 'Backend',
 *     priority: 6,
 *     description: 'Серверный язык программирования'
 *   },
 *   Git: {
 *     specialty: ['Frontend', 'Backend'], // может быть в нескольких специальностях
 *     priority: 1,
 *     description: 'Система контроля версий'
 *   }
 * };
 * ```
 */
export interface TechnologyMapping {
  [subcategory: string]: {
    /** Специальность или массив специальностей */
    specialty: string | string[];

    /** Приоритет для сортировки (меньше = выше) */
    priority: number;

    /** Описание технологии */
    description: string;
  };
}

/**
 * Представляет обработанный документ из Markdown файла
 *
 * Содержит всю информацию о документе, включая метаданные,
 * контент и связи с категориями.
 *
 * @example
 * ```typescript
 * const docItem: DocItem = {
 *   id: 'react-hooks',
 *   title: 'React Hooks Guide',
 *   content: '# React Hooks\n\nОсновы хуков в React...',
 *   specialty: 'Frontend',
 *   technology: 'React',
 *   priority: 5,
 *   description: 'Руководство по хукам React',
 *   tags: ['react', 'hooks', 'frontend'],
 *   created_at: new Date('2024-01-01'),
 *   updated_at: new Date('2024-01-15')
 * };
 * ```
 */
export interface DocItem {
  /** Уникальный идентификатор документа (slug) */
  id: string;
  /** Заголовок документа */
  title: string;
  /** Содержимое Markdown файла */
  content: string;
  /** Основная специальность документа */
  specialty: string;
  /** Технология документа */
  technology: string;
  /** Приоритет для сортировки (меньше = выше) */
  priority: number;
  /** Описание документа */
  description: string;
  /** Массив тегов документа */
  tags: string[];
  /** Массив валидированных ссылок из info */
  info: string[];
  /** Хеш содержимого файла для отслеживания изменений */
  file_hash: string;
  /** Дата создания документа */
  created_at: Date;
  /** Дата последнего обновления документа */
  updated_at: Date;
}

/**
 * Опции для настройки сканирования документации
 *
 * Позволяет настроить пути к файлам, конфигурацию
 * и поведение сканера.
 *
 * @example
 * ```typescript
 * const options: ScanOptions = {
 *   docsPath: './docs',
 *   configPath: {
 *     technologyPath: './config/technology-mapping.yaml',
 *     specialtiesPath: './config/specialties.yaml'
 *   },
 *   databaseUrl: 'postgresql://user:pass@localhost:5432/db',
 *   clearBeforeScan: false
 * };
 *
 * const items = await parseDatabase(options);
 * ```
 */
export interface ScanOptions {
  /** Путь к директории с документацией (по умолчанию: './docs') */
  docsPath?: string;

  /** Пути к файлам конфигурации */
  configPath: {
    /** Путь к файлу маппинга технологий (по умолчанию: './config/category-mapping.yaml') */
    technologyPath: string;
    /** Путь к файлу специальностей (по умолчанию: './config/specialties.yaml') */
    specialtiesPath: string;
  };

  /** URL подключения к базе данных */
  databaseUrl?: string;

  /** Очистить базу данных перед сканированием */
  clearBeforeScan?: boolean;
}

/**
 * Конфигурация подключения к PostgreSQL
 *
 * Определяет параметры для подключения к базе данных.
 * Если не указаны, используются переменные окружения
 * или значения по умолчанию.
 *
 * @example
 * ```typescript
 * const config: DatabaseConfig = {
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'docs_db',
 *   user: 'postgres',
 *   password: 'secure_password'
 * };
 *
 * await initDatabase(config);
 * ```
 *
 * @example
 * ```bash
 * # Переменные окружения
 * DB_HOST=localhost
 * DB_PORT=5432
 * DB_NAME=docs_db
 * DB_USER=postgres
 * DB_PASSWORD=password
 * ```
 */
export interface DatabaseConfig {
  /** Хост базы данных (по умолчанию: 'localhost') */
  host: string;
  /** Порт базы данных (по умолчанию: 5432) */
  port: number;
  /** Имя базы данных (по умолчанию: 'postgres') */
  database: string;
  /** Пользователь базы данных (по умолчанию: 'postgres') */
  user: string;
  /** Пароль пользователя (по умолчанию: 'password') */
  password: string;
}

export interface ParseDbOptions {
  path: string;
  config: string;
  clear: boolean;
  checkOnly: boolean;
  configDir?: string;
}

export interface CheckUpdatesOptions {
  path: string;
  config: string;
  configDir?: string;
}

export interface UpdateArticlesOptions {
  path: string;
  config: string;
  force: boolean;
  configDir?: string;
}
