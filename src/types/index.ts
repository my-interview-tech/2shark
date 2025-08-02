/**
 * Маппинг технологий в специальности
 *
 * Определяет как технологии (например, React, TypeScript)
 * соотносятся с основными специальностями (Frontend, Backend).
 *
 * @example
 * ```typescript
 * const mapping: CategoryMapping = {
 *   React: {
 *     technology: 'Frontend',
 *     priority: 5,
 *     description: 'Основы React'
 *   },
 *   TypeScript: {
 *     technology: 'Frontend',
 *     priority: 6,
 *     description: 'Типизированный JavaScript'
 *   },
 *   Git: {
 *     technology: ['Frontend', 'Backend'], // может быть в нескольких категориях
 *     priority: 1,
 *     description: 'Система контроля версий'
 *   }
 * };
 * ```
 */
export interface CategoryMapping {
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
 *   docsPath: './my-docs',
 *   configPath: './my-config.yaml',
 *   databaseUrl: 'postgresql://user:pass@localhost:5432/db',
 *   clearBeforeScan: true
 * };
 *
 * const items = await parseDatabase(options);
 * ```
 */
export interface ScanOptions {
  /** Путь к директории с документацией (по умолчанию: './docs') */
  docsPath?: string;

  /** Путь к файлу конфигурации категорий (по умолчанию: './config/technology-mapping.yaml') */
  configPath?: string;

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
