---
"2shark": major
---

- Реализован `db-0003`: добавлен revision-based import для `2shark import` с обязательными `--branch` и `--commit-sha`, а также поддержкой `--repo-path` для чтения markdown из конкретной git-ревизии.

- Добавлен `git-source` слой, который валидирует commit в ветке, читает дерево markdown по `commitSha` и передаёт в pipeline метаданные источника (`sourceBranch`, `sourceCommitSha`, `sourcePath`, `importedAt`).

- Persistence и schema обновлены под upsert по `uid` как primary identity: в `articles` добавлены source metadata поля, upsert переведён на `ON CONFLICT (uid)`, а поведение rename/move теперь обновляет metadata без создания новой статьи.

- Инкрементальный diff адаптирован под `uid + revision`: сравнение учитывает `file_hash` и `source_commit_sha`, повторный запуск одного `commitSha` остаётся идемпотентным, а destructive clear запрещён для revision import.
