---
"2shark": major
---

- Реализован `db-0004`: добавлена observability-модель `import_jobs` с lifecycle-статусами `pending -> running -> success|failed`, хранением ревизии (`branch`, `commit_sha`) и таймстемпов выполнения.

- `runImport` интегрирован с import job lifecycle: на каждый запуск создаётся job, при успехе сохраняется `result`, при ошибке сохраняется `error`, а исходная ошибка импорта не маскируется ошибкой сохранения job.

- В schema и database-конфигах добавлена таблица `import_jobs` и SQL-операции для create/update lifecycle, а также очистка таблицы в clear/init сценариях.

- Добавлен jobs-слой (`src/import/jobs`) и обновлены unit/integration тесты для success/failed сценариев observability и revision import.
