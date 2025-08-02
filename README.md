# 2shark

2shark - это TypeScript библиотека и CLI инструмент для автоматического сканирования Markdown документации и формирования PostgreSQL базы данных.

## Установка

### Из GitHub Packages

```bash
npm install @my-interview-tech/2shark
```

### Настройка .npmrc для GitHub Packages

Создайте файл `.npmrc` в корне вашего проекта:

```
@my-interview-tech:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Для локальной разработки создайте Personal Access Token с правами `read:packages` и установите переменную окружения:

```bash
export GITHUB_TOKEN=your_github_token_here
```

## Использование как пакет

### Импорт и использование в коде

```typescript
import { parseDatabase, initDatabase, clearDatabase, ScanOptions } from '2shark';

// Сканирование документации
const options: ScanOptions = {
  docsPath: './docs',
  configPath: './config/category-mapping.yaml',
  clearBeforeScan: true,
};

const items = await parseDatabase(options);

console.log(`Найдено ${items.length} документов`);

// Инициализация базы данных
await initDatabase();

// Очистка базы данных
await clearDatabase();
```

### Переменные окружения

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=password
```

## Использование как CLI

### Глобальная установка

```bash
npm install -g @my-interview-tech/2shark
```

### Команды

```bash
# Сканировать документацию
2shark parse-db

# Сканировать с кастомными путями
2shark parse-db -p ./my-docs -c ./my-config.yaml

# Очистить базу данных перед сканированием
2shark parse-db --clear

# Инициализировать базу данных
2shark init-db

# Очистить базу данных
2shark clear-db
```

## Разработка

### Сборка

Проект использует **esbuild** для быстрой сборки:

```bash
npm run build
```

### Структура документации

```
docs/
├── Frontend/
│   ├── React/
│   │   ├── hooks.md
│   │   └── components.md
│   └── TypeScript/
│       └── types.md
└── Backend/
    ├── Node.js/
    │   └── api.md
    └── Database/
        └── postgresql.md
```

## Конфигурация специальностей

Создайте файл `config/category-mapping.yaml`:

```yaml
React:
  specialty: Frontend
  priority: 5
  description: Основы React

TypeScript:
  specialty: Frontend
  priority: 6
  description: Типизированный JavaScript

Node.js:
  specialty: Backend
  priority: 1
  description: JavaScript runtime для сервера
```

## Типы

```typescript
interface DocItem {
  id: string;
  title: string;
  content: string;
  specialty: string;
  technology: string;
  priority: number;
  description: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

interface ScanOptions {
  docsPath?: string;
  configPath?: string;
  databaseUrl?: string;
  clearBeforeScan?: boolean;
}
```

## Структура проекта

```
src/
├── cli/                    # CLI интерфейс
│   ├── index.ts           # Точка входа CLI
│   └── cli.ts             # Основная логика CLI
├── config/                 # Конфигурация
│   └── index.ts           # Настройки БД
├── database/              # Работа с базой данных
│   ├── class/             # Классы для работы с БД
│   └── lib/               # Утилиты для БД
├── parseDatabase/         # Сканирование документации
│   ├── class/             # Основные классы
│   └── lib/               # Утилиты для парсинга
├── types/                 # TypeScript типы
│   └── index.ts           # Основные типы
└── index.ts               # Главный экспорт
```
