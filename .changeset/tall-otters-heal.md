---
"2shark": major
---

- Реализован `db-0005` контракт production sync automation: в `2shark import` добавлен явный CI-режим `--production-sync` для канонического вызова из `my-interview.tech`.

- В production sync режиме добавлена branch policy: импорт разрешён только при `branch=main`; для non-main запускается fail-fast с понятной ошибкой.

- Сохранена безопасность запуска: destructive путь (`--clear`) запрещён для revision-based production sync, а ошибки остаются CI-friendly и пригодны для диагностики.

- Обновлены тесты automation-сценариев и документация runbook для внешнего workflow (`my-interview.tech`) с требованиями к `commitSha`, secrets и поведению при failed import.
