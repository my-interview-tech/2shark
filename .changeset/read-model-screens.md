---
"2shark": major
---

Read model для экранов статьи и технологии.

- Миграция db-0007 (`ADD COLUMN IF NOT EXISTS`): `technologies.public_slug/title/meta`, `articles.kind/chapter/chapter_anchor/chapter_order/complexity/importance/content_md/preview_md/toc/context`, `article_links.title/image/position`. Применяется в `init-db`, перед каждым `import` и командой `migrate-db`.
- Нормализация markdown на импорте: wikilinks и embeds разрешаются по всему vault, картинки получают адрес Quartz от `ASSETS_BASE_URL`, H2 и H3 — якоря `{#id}`, оглавление строится из H2, превью режется по `%% paywall %%` или по первому абзацу.
- Предупреждения нормализации (битые ссылки, embeds, base64-картинки) пишутся в `import_jobs.result.warnings` и `warningsTotal`.
- Новый `chapters.yaml` и поля технологии в `category-mapping.yaml`: `slug`, `title`, `icon`, `kind`, `prerequisites`, `subscribe`, `context`, `resources`, `chapters`.

Ломающие изменения: технология без `slug` в YAML получает `public_slug = null` и не попадает в ссылки сайта; теги и ссылки статьи пересобираются на каждом сохранении. После обновления нужен прогон `import --force`, чтобы заполнить новые колонки у неизменённых файлов.
