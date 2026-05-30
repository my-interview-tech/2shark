# CLI

CLI `2shark` управляет production import pipeline: читает markdown из git-ревизии, валидирует frontmatter и синхронизирует PostgreSQL read model.

## Команды

```bash
2shark import --branch main --commit-sha <sha> --production-sync
2shark init-db
2shark clear-db
```

Пример первого запуска:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/docs"

2shark init-db

2shark import \
  --path ./docs \
  --config ./config \
  --repo-path . \
  --branch main \
  --commit-sha "$(git rev-parse HEAD)" \
  --production-sync
```

## `2shark import`

Основная команда синхронизации `git -> db`. Для production sync передавайте опубликованную ревизию `main`.

```bash
2shark import \
  --path ./docs \
  --config ./config \
  --repo-path . \
  --branch main \
  --commit-sha <sha> \
  --production-sync
```

### Обязательные флаги

| Флаг                 | Описание                                                                       |
| -------------------- | ------------------------------------------------------------------------------ |
| `--branch <name>`    | Git branch источника markdown. Для `--production-sync` разрешен только `main`. |
| `--commit-sha <sha>` | Git commit SHA, из которого читаются markdown-файлы.                           |

### Опциональные флаги

| Флаг                    | Значение по умолчанию | Описание                                                                          |
| ----------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `-p, --path <path>`     | `./docs`              | Путь к директории markdown-документов внутри git-репозитория.                     |
| `-c, --config <config>` | `./config`            | Путь к директории с `category-mapping.yaml` и `specialties.yaml`.                 |
| `--repo-path <path>`    | `process.cwd()`       | Путь к git-репозиторию с markdown-контентом.                                      |
| `--production-sync`     | `false`               | Включает production guard: импорт разрешен только из `branch=main`.               |
| `--clear`               | `false`               | Очистка перед импортом. Для revision import запрещена и завершит команду ошибкой. |
| `--check-only`          | `false`               | Проверяет изменения без записи документов в БД.                                   |
| `-f, --force`           | `false`               | Импортирует все документы без diff-фильтрации.                                    |

### Результат

После успешного импорта CLI печатает summary:

```text
Статистика:
Всего файлов: 10
Изменено: 2
Пропущено: 8
Сохранено: 2
```

Каждый запуск фиксируется в таблице `import_jobs` со статусами `pending`, `running`, `success` или `failed`.

## Production Sync

Канонический запуск из GitHub Actions:

```bash
2shark import \
  --path ./docs \
  --config ./scripts/frontmatter/config \
  --repo-path . \
  --branch main \
  --commit-sha "$GITHUB_SHA" \
  --production-sync
```

Для production окружения ожидается:

- workflow запускается только после merge/push в `main`;
- `--commit-sha` равен опубликованному commit SHA;
- подключение к БД передается через `DATABASE_URL` или `DB_*` переменные окружения;
- draft branches не запускают production import.

## `2shark init-db`

Создает или обновляет таблицы, необходимые для работы read model.

```bash
2shark init-db
```

При ошибке команда печатает причину и завершает процесс с exit code `1`.

## `2shark clear-db`

Очищает данные в БД через database cleanup pipeline.

```bash
2shark clear-db
```

Команда предназначена для локального окружения и ручного обслуживания. Для production revision import используйте `2shark import` без `--clear`.

## Ошибки

CLI завершает процесс с exit code `1`, если:

- не передан `--branch`;
- не передан `--commit-sha`;
- `--production-sync` запущен не с `branch=main`;
- передан `--clear` для revision import;
- import pipeline не смог прочитать git-ревизию, конфиг или записать результат в БД.
