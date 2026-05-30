---
"2shark": major
---

- Реализован `db-0002`: добавлен единый orchestration-слой `runImport` с pipeline `scan -> validate -> normalize -> diff -> save` и структурированным результатом (`total/changed/skipped/saved`).

- В CLI добавлен production entrypoint `2shark import`, унифицировано чтение `--config`/`configDir`, а legacy-команды `parse-db`, `check-updates`, `update-articles` переведены на общий import-контур.

- Parser и модель документа приведены к frontmatter-контракту: используются `uid`, `created_at`, `updated_at`, `access`, `tools`, `order`, добавлен fail-fast на невалидные обязательные поля и сохранено правило `draft: true` => skip.

- Схема и persistence расширены под target read-model (`uid`, `access`, `tools`, `article_order`, upsert статьи), обновлена логика инкрементального diff по `file_hash`, добавлены/обновлены unit и integration тесты для новых сценариев.
