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
import { runImport, initDatabase, clearDatabase } from '2shark';

// Импорт документации из git-ревизии
const result = await runImport({
  docsPath: './docs',
  configDir: './config',
  repoPath: '../my-interview.tech',
  branch: 'main',
  commitSha: '<sha>',
  isProductionSync: true,
});

console.log(`Сохранено ${result.saved} документов`);

// Инициализация базы данных
await initDatabase();

// Очистка базы данных
await clearDatabase();
```

### Использование как CLI

```bash
# Production import entrypoint
2shark import --branch main --commit-sha <sha> --production-sync

# Сканировать с кастомными путями
2shark import -p ./docs -c ./config --repo-path ../my-interview.tech --branch main --commit-sha <sha> --production-sync

# Проверить изменения без записи
2shark import --check-only --branch main --commit-sha <sha> --production-sync

# Импортировать все файлы без diff
2shark import --force --branch main --commit-sha <sha> --production-sync

# Инициализировать базу данных
2shark init-db

# Очистить базу данных
2shark clear-db

```

Для production sync automation ожидается `branch=main`; флаг `--clear` для такого сценария запрещён.

### Import observability

Каждый запуск `2shark import` теперь фиксируется в таблице `import_jobs` со статусами lifecycle:

- `pending`
- `running`
- `success`
- `failed`

В `import_jobs` сохраняются `branch`, `commit_sha`, `started_at`, `finished_at`, а также `result` или `error`.
Это позволяет быстро определить:

- последний успешный импорт;
- последнюю ошибку импорта и ревизию, на которой она произошла;
- summary по обработанным документам (`total/created/updated/skipped/archived`).

### Soft delete / archive reconcile

Начиная с `db-0006`, production sync использует reconcile по `uid`:

- статьи, отсутствующие в новой published revision, помечаются как архивные (`is_deleted=true`);
- physical delete для production read model не используется;
- если статья возвращается в следующей revision с тем же `uid`, она автоматически восстанавливается в active состояние;
- archive-операция фиксируется в `import_jobs.result.archived`.

Базовый SQL-фильтр для runtime read model:

```sql
SELECT *
FROM articles
WHERE is_deleted = false;
```

### Production sync from my-interview.tech

Канонический сценарий `db-0005`: workflow запускается в репозитории `my-interview.tech` на `push` в `main`.

```yaml
name: production-sync

on:
  push:
    branches:
      - main

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install 2shark
        run: npm install -g 2shark

      - name: Run production sync
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          2shark import \
            --path ./docs \
            --config ./scripts/frontmatter/config \
            --repo-path . \
            --branch main \
            --commit-sha ${{ github.sha }} \
            --production-sync
```

Требования к интеграции:

- передавать фактический `${{ github.sha }}` опубликованной ревизии;
- хранить `DATABASE_URL` (или `DB_*`) только в secrets;
- не печатать secrets в logs;
- при failed import workflow должен завершаться с ошибкой (exit code != 0).

Smoke-checklist после интеграции:

- merge/push в `main` запускает workflow;
- запуск из feature branch не пишет в production DB;
- успешный запуск создаёт `import_job` со статусом `success`;
- ошибочный запуск создаёт `import_job` со статусом `failed`;
- rerun того же `commitSha` не создаёт дубли в read model.

## Разработка

### Сборка

Проект использует **esbuild** для быстрой сборки:

```bash
npm run build
```

### Структура документации

```text
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

- Импорте документации (`2shark import`)
- Инициализации базы данных (`2shark init-db`)
- Обновлении существующих записей

### Примеры использования

```bash
# Импорт с кастомной конфигурацией
2shark import -c ./my-config.yaml --branch main --commit-sha <sha>

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

```text
src/
├── cli/                    # CLI интерфейс
│   ├── index.ts           # Точка входа CLI
│   └── cli.ts             # Основная логика CLI
├── config/                 # Конфигурация
│   └── index.ts           # Настройки БД
├── database/              # Работа с базой данных
│   ├── class/             # Классы для работы с БД
│   └── lib/               # Утилиты для БД
├── docScanner/            # Парсинг markdown и frontmatter
├── types/                 # TypeScript типы
│   └── index.ts           # Основные типы
└── index.ts               # Главный экспорт
```
