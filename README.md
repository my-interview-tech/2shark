# 2shark

2shark - это TypeScript библиотека и CLI инструмент для автоматического сканирования Markdown документации и формирования PostgreSQL базы данных.

## Установка

```bash
npm install 2shark
```

или для использования CLI

```bash
npm install -g 2shark
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

### Использование как CLI

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

Файл `config/category-mapping.yaml` используется для настройки маппинга технологий к специальностям и определения приоритетов при сканировании документации.

### Назначение

- **Категоризация технологий** - связывает технологии с областями (Frontend, Backend, DevOps и т.д.)
- **Приоритизация контента** - определяет важность технологий для отображения
- **Автоматическая классификация** - помогает системе правильно категоризировать найденные документы

### Структура конфигурации

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

PostgreSQL:
  specialty: Database
  priority: 3
  description: Реляционная база данных

Docker:
  specialty: DevOps
  priority: 4
  description: Контейнеризация приложений
```

### Параметры конфигурации

| Параметр      | Тип    | Описание                          | Пример                          |
| ------------- | ------ | --------------------------------- | ------------------------------- |
| `specialty`   | string | Область специализации             | `Frontend`, `Backend`, `DevOps` |
| `priority`    | number | Приоритет (1-10, где 10 - высший) | `5`                             |
| `description` | string | Краткое описание технологии       | `"Основы React"`                |

### Управление конфигурацией

#### Добавление новой технологии

```yaml
Vue.js:
  specialty: Frontend
  priority: 4
  description: Прогрессивный JavaScript фреймворк
```

#### Изменение приоритета

```yaml
React:
  specialty: Frontend
  priority: 8 # Увеличен приоритет
  description: Основы React
```

#### Создание новой специальности

```yaml
Machine Learning:
  specialty: AI
  priority: 7
  description: Машинное обучение и ИИ
```

### Автоматическое применение

Конфигурация автоматически применяется при:

- Сканировании документации (`2shark parse-db`)
- Инициализации базы данных (`2shark init-db`)
- Обновлении существующих записей

### Примеры использования

```bash
# Сканирование с кастомной конфигурацией
2shark parse-db -c ./my-config.yaml

# Проверка конфигурации
cat config/category-mapping.yaml | yq eval '.'

# Валидация структуры
node -e "const yaml = require('js-yaml'); const fs = require('fs'); console.log(yaml.load(fs.readFileSync('config/category-mapping.yaml', 'utf8')));"
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
