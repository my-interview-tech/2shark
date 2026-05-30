---
"2shark": major
---

Реализован `db-0006` для archived/deleted reconcile в production read model:

- Добавлены archive-поля в `articles`: `is_deleted`, `archived_at`, `archived_by_import_job_id`, `last_seen_commit_sha`.
- Добавлен reconcile-этап после успешного production sync импорта: отсутствующие в новой published revision `uid` помечаются архивными без physical delete.
- Добавлено автоматическое восстановление статьи в active состояние при повторном появлении того же `uid`.
- В `import_jobs.result` добавлен обязательный счётчик `archived` для observability CI-импортов.
