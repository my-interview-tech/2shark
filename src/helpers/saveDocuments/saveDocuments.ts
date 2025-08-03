import { Pool } from 'pg';
import { DocItem, DatabaseConfig, SpecialtyMapping } from '../../types';
import { DB_CONFIG } from '../../config';
import { SCHEMA } from '../../schema';

/**
 * Сохраняет документы в базу данных
 *
 * Создает записи в таблицах:
 * - specialties: специальности
 * - technologies: технологии
 * - articles: статьи документации
 * - tags: теги
 * - article_tags: связь статей и тегов
 *
 * @param documents - Массив документов для сохранения
 * @param config - Конфигурация подключения к PostgreSQL (опционально)
 * @param technologyMapping - Маппинг категорий (опционально)
 * @param specialtyMapping - Маппинг специальностей (опционально)
 * @returns Promise который разрешается после сохранения
 *
 * @throws {Error} При ошибках подключения к базе данных или сохранения
 */
export async function saveDocuments(
  documents: DocItem[],
  config?: DatabaseConfig,
  technologyMapping?: Record<string, { specialty: string | string[]; priority?: number; description?: string }>,
  specialtyMapping?: SpecialtyMapping,
): Promise<void> {
  const dbConfig = config || DB_CONFIG;
  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const specialties = new Map<string, { name: string; slug: string; priority: number }>();
    const technologies = new Map<string, { name: string; slug: string; priority: number }>();

    // Сначала создаем специальности из specialtyMapping
    if (specialtyMapping) {
      console.log('🔍 Обрабатываем specialtyMapping для создания специальностей...');
      for (const [specialtyName, specialtyConfig] of Object.entries(specialtyMapping)) {
        console.log(`  Специальность: ${specialtyName}, Конфиг:`, specialtyConfig);

        specialties.set(specialtyName, {
          name: specialtyName,
          slug: specialtyName.toLowerCase().replace(/\s+/g, '-'),
          priority: specialtyConfig.priority || 0,
        });
        console.log(`  ✅ Добавлена специальность: ${specialtyName}`);
      }
    }

    // Затем создаем специальности из technologyMapping (для обратной совместимости)
    if (technologyMapping) {
      console.log('🔍 Обрабатываем technologyMapping для создания специальностей...');
      for (const [techName, techMapping] of Object.entries(technologyMapping)) {
        console.log(`  Технология: ${techName}, Маппинг:`, techMapping);
        if (techMapping && techMapping.specialty) {
          let specialtiesList: string[];

          if (Array.isArray(techMapping.specialty)) {
            specialtiesList = techMapping.specialty;
          } else if (typeof techMapping.specialty === 'string' && techMapping.specialty.includes(',')) {
            specialtiesList = techMapping.specialty.split(',').map((s: string) => s.trim());
          } else {
            specialtiesList = [techMapping.specialty];
          }

          console.log(`  Специальности для ${techName}:`, specialtiesList);

          for (const specialty of specialtiesList) {
            if (!specialties.has(specialty)) {
              specialties.set(specialty, {
                name: specialty,
                slug: specialty.toLowerCase().replace(/\s+/g, '-'),
                priority: techMapping.priority || 0,
              });
              console.log(`  ✅ Добавлена специальность: ${specialty}`);
            }
          }
        }
      }
    }

    // Затем создаем технологии из документов
    for (const doc of documents) {
      if (!technologies.has(doc.technology)) {
        technologies.set(doc.technology, {
          name: doc.technology,
          slug: doc.technology.toLowerCase().replace(/\s+/g, '-'),
          priority: doc.priority,
        });
      }
    }

    console.log(`📊 Найдено специальностей: ${specialties.size}`);
    console.log(`📊 Найдено технологий: ${technologies.size}`);

    // Сохраняем специальности в базу данных
    const specialtyIds = new Map<string, number>();
    for (const [key, specialty] of specialties) {
      console.log(`💾 Сохраняем специальность: ${specialty.name}`);

      const result = await client.query(SCHEMA.UPSERT_SPECIALTY_QUERY, [
        specialty.name,
        specialty.slug,
        specialty.priority,
      ]);

      specialtyIds.set(key, result.rows[0].id);
      console.log(`  ✅ Специальность ${specialty.name} сохранена с ID: ${result.rows[0].id}`);
    }

    // Сохраняем технологии в базу данных
    const technologyIds = new Map<string, number>();
    for (const [key, technology] of technologies) {
      console.log(`💾 Сохраняем технологию: ${technology.name}`);
      const result = await client.query(SCHEMA.UPSERT_TECHNOLOGY_QUERY, [
        technology.name,
        technology.slug,
        technology.priority,
      ]);
      technologyIds.set(key, result.rows[0].id);
      console.log(`  ✅ Технология ${technology.name} сохранена с ID: ${result.rows[0].id}`);
    }

    // Создаем связи между технологиями и специальностями
    console.log('🔗 Создаем связи между технологиями и специальностями...');
    for (const [techName, techMapping] of Object.entries(technologyMapping || {})) {
      // Создаем технологию, если её нет в документах
      if (!technologies.has(techName)) {
        technologies.set(techName, {
          name: techName,
          slug: techName.toLowerCase().replace(/\s+/g, '-'),
          priority: techMapping.priority || 0,
        });
        console.log(`  ➕ Добавлена технология из конфига: ${techName}`);
      }

      const technologyId = technologyIds.get(techName);
      if (!technologyId) {
        console.log(`  ⚠️ Технология ${techName} не найдена в документах`);
        continue;
      }

      if (techMapping && techMapping.specialty) {
        let specialtiesList: string[];

        if (Array.isArray(techMapping.specialty)) {
          specialtiesList = techMapping.specialty;
        } else if (typeof techMapping.specialty === 'string' && techMapping.specialty.includes(',')) {
          specialtiesList = techMapping.specialty.split(',').map((s: string) => s.trim());
        } else {
          specialtiesList = [techMapping.specialty];
        }

        for (const specialty of specialtiesList) {
          const specialtyId = specialtyIds.get(specialty);
          if (specialtyId) {
            console.log(`  🔗 Связываем ${techName} с ${specialty}`);
            await client.query(SCHEMA.UPSERT_SPECIALTY_TECHNOLOGY_QUERY, [specialtyId, technologyId, techName]);
          }
        }
      }
    }

    // Сохраняем статьи
    for (const doc of documents) {
      const technologyId = technologyIds.get(doc.technology);

      if (!technologyId) {
        console.warn(`Пропускаем статью ${doc.title}: не найдена technology`);
        continue;
      }

      const mapping = technologyMapping?.[doc.technology];
      let specialties: string[];

      if (mapping) {
        if (Array.isArray(mapping.specialty)) {
          specialties = mapping.specialty;
        } else if (typeof mapping.specialty === 'string' && mapping.specialty.includes(',')) {
          specialties = mapping.specialty.split(',').map((s: string) => s.trim());
        } else {
          specialties = [mapping.specialty];
        }
      } else {
        specialties = [doc.specialty];
      }

      for (const specialty of specialties) {
        const specialtyId = specialtyIds.get(specialty);

        if (!specialtyId) {
          console.warn(`Пропускаем статью ${doc.title} для specialty ${specialty}: не найдена specialty`);
          continue;
        }

        const uniqueSlug = `${doc.id}-${specialty.toLowerCase().replace(/\s+/g, '-')}`;

        const articleResult = await client.query(SCHEMA.INSERT_ARTICLE_QUERY, [
          doc.title,
          uniqueSlug,
          doc.content,
          specialtyId,
          technologyId,
          doc.priority,
          doc.description,
          doc.file_hash,
        ]);

        const articleId = articleResult.rows[0].id;

        for (const tagName of doc.tags) {
          const tagResult = await client.query(SCHEMA.INSERT_TAG_QUERY, [tagName]);
          const tagId = tagResult.rows[0].id;

          await client.query(SCHEMA.INSERT_ARTICLE_TAG_QUERY, [articleId, tagId]);
        }

        for (const url of doc.info) {
          await client.query(SCHEMA.INSERT_ARTICLE_LINK_QUERY, [articleId, url]);
        }
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Сохранено ${documents.length} документов в базу данных`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
