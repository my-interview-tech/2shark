# @my-interview-tech/2shark

## 3.0.0

### Major Changes

- 1d387d5: - Реализован `db-0004`: добавлена observability-модель `import_jobs` с lifecycle-статусами `pending -> running -> success|failed`, хранением ревизии (`branch`, `commit_sha`) и таймстемпов выполнения.

  - `runImport` интегрирован с import job lifecycle: на каждый запуск создаётся job, при успехе сохраняется `result`, при ошибке сохраняется `error`, а исходная ошибка импорта не маскируется ошибкой сохранения job.

  - В schema и database-конфигах добавлена таблица `import_jobs` и SQL-операции для create/update lifecycle, а также очистка таблицы в clear/init сценариях.

  - Добавлен jobs-слой (`src/import/jobs`) и обновлены unit/integration тесты для success/failed сценариев observability и revision import.

- e5f875e: - Реализован `db-0002`: добавлен единый orchestration-слой `runImport` с pipeline `scan -> validate -> normalize -> diff -> save` и структурированным результатом (`total/changed/skipped/saved`).

  - В CLI добавлен production entrypoint `2shark import`, унифицировано чтение `--config`/`configDir`, а legacy-команды `parse-db`, `check-updates`, `update-articles` переведены на общий import-контур.

  - Parser и модель документа приведены к frontmatter-контракту: используются `uid`, `created_at`, `updated_at`, `access`, `tools`, `order`, добавлен fail-fast на невалидные обязательные поля и сохранено правило `draft: true` => skip.

  - Схема и persistence расширены под target read-model (`uid`, `access`, `tools`, `article_order`, upsert статьи), обновлена логика инкрементального diff по `file_hash`, добавлены/обновлены unit и integration тесты для новых сценариев.

- a9c9943: - Добавлена логика обновления изменённых статей: CLI получил сценарии проверки и обновления только изменившихся документов, а сохранение в БД стало опираться на хеши файлов и конфигурации технологий/специальностей.

  - Добавлены конфиги `category-mapping.yaml` и `specialties.yaml`, обновлена тестовая настройка Jest для моков `pg` и расширено покрытие сценариев сканирования, фильтрации и сохранения документов.

- e03f0b5: - Реализован `db-0003`: добавлен revision-based import для `2shark import` с обязательными `--branch` и `--commit-sha`, а также поддержкой `--repo-path` для чтения markdown из конкретной git-ревизии.

  - Добавлен `git-source` слой, который валидирует commit в ветке, читает дерево markdown по `commitSha` и передаёт в pipeline метаданные источника (`sourceBranch`, `sourceCommitSha`, `sourcePath`, `importedAt`).

  - Persistence и schema обновлены под upsert по `uid` как primary identity: в `articles` добавлены source metadata поля, upsert переведён на `ON CONFLICT (uid)`, а поведение rename/move теперь обновляет metadata без создания новой статьи.

  - Инкрементальный diff адаптирован под `uid + revision`: сравнение учитывает `file_hash` и `source_commit_sha`, повторный запуск одного `commitSha` остаётся идемпотентным, а destructive clear запрещён для revision import.

- 90cadb6: - Реализован `db-0005` контракт production sync automation: в `2shark import` добавлен явный CI-режим `--production-sync` для канонического вызова из `my-interview.tech`.

  - В production sync режиме добавлена branch policy: импорт разрешён только при `branch=main`; для non-main запускается fail-fast с понятной ошибкой.

  - Сохранена безопасность запуска: destructive путь (`--clear`) запрещён для revision-based production sync, а ошибки остаются CI-friendly и пригодны для диагностики.

  - Обновлены тесты automation-сценариев и документация runbook для внешнего workflow (`my-interview.tech`) с требованиями к `commitSha`, secrets и поведению при failed import.

- ab5c610: Реализован `db-0006` для archived/deleted reconcile в production read model:

  - Добавлены archive-поля в `articles`: `is_deleted`, `archived_at`, `archived_by_import_job_id`, `last_seen_commit_sha`.
  - Добавлен reconcile-этап после успешного production sync импорта: отсутствующие в новой published revision `uid` помечаются архивными без physical delete.
  - Добавлено автоматическое восстановление статьи в active состояние при повторном появлении того же `uid`.
  - В `import_jobs.result` добавлен обязательный счётчик `archived` для observability CI-импортов.

## 2.0.1

### Patch Changes

- 2eb29a8: - Обновлен README.md

## 2.0.0

### Major Changes

- df3ee92: # Рефакторинг и настройка CI/CD

  ## Основные изменения

  ### 🔄 Основной функционал

  #### Сканирование документации

  - Рекурсивное сканирование директорий с Markdown файлами
  - Извлечение метаданных из frontmatter (заголовки, теги, описания)
  - Автоматическая категоризация по структуре папок
  - Поддержка конфигурационного файла для маппинга технологий

  #### Работа с базой данных

  - Инициализация PostgreSQL схемы (таблицы: specialties, technologies, articles, tags)
  - Очистка данных перед новым сканированием
  - Поддержка переменных окружения для конфигурации БД

  #### CLI интерфейс

  - Команда parse-db для сканирования документации
  - Команда init-db для инициализации БД
  - Команда clear-db для очистки БД
  - Поддержка кастомных путей и конфигурации

  ### 🧪 Тестирование

  - Добавлены unit тесты для всех модулей
  - Настроено покрытие кода (coverage)
  - Структурированы тесты по SUCCESS/EDGE/ERROR/INTEGRATION cases

  ### 🚀 CI/CD Pipeline

  - Настроены GitHub Actions workflows
  - Добавлены Git hooks (Husky) для проверок
  - Настроена ручная публикация в npm с ограничением по пользователям
  - Добавлена проверка changeset перед коммитом

  ### 📦 Сборка и публикация

  - Настроен esbuild для быстрой сборки
  - Добавлена проверка линтинга TypeScript
  - Настроена автоматическая проверка изменений
  - Добавлено управление версиями через changesets

  ### 🔧 Конфигурация

  - Обновлена структура конфигурационных файлов
  - Добавлена валидация настроек
  - Улучшена обработка ошибок
  - Добавлена поддержка переменных окружения

### Patch Changes

- 57e470c: - Обновлен README.md
- 1b7d44e: - Обновлен workflow для автоматического управления версиями через `changesets`
