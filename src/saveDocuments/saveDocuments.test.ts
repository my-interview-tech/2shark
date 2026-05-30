import { Pool } from 'pg';
import { saveDocuments } from './saveDocuments';
import { DB_CONFIG } from '../config';
import { SCHEMA } from '../schema';
import { DESCRIBE_CASES } from '../helpers/test';
import { DatabaseConfig, DocItem, SpecialtyMapping } from '../types';

jest.mock('../config', () => ({
  DB_CONFIG: {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'password',
  },
}));

jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

jest.mock('../schema', () => ({
  SCHEMA: {
    UPSERT_SPECIALTY_QUERY:
      'INSERT INTO specialties (name, slug, priority) VALUES ($1, $2, $3) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, priority = EXCLUDED.priority RETURNING id',
    UPSERT_TECHNOLOGY_QUERY:
      'INSERT INTO technologies (name, slug, priority) VALUES ($1, $2, $3) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, priority = EXCLUDED.priority RETURNING id',
    UPSERT_SPECIALTY_TECHNOLOGY_QUERY:
      'INSERT INTO specialty_technology (specialty_id, technology_id, name) VALUES ($1, $2, $3) ON CONFLICT (specialty_id, technology_id) DO UPDATE SET name = EXCLUDED.name RETURNING id',
    INSERT_ARTICLE_QUERY:
      'INSERT INTO articles (uid, title, slug, content, specialty_id, technology_id, access, tools, article_order, priority, description, file_hash, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id',
    INSERT_TAG_QUERY:
      'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
    INSERT_ARTICLE_TAG_QUERY:
      'INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT (article_id, tag_id) DO NOTHING RETURNING id',
    INSERT_ARTICLE_LINK_QUERY:
      'INSERT INTO article_links (article_id, url) VALUES ($1, $2) ON CONFLICT (article_id, url) DO NOTHING RETURNING id',
  },
}));

describe('Unit/helpers/function/saveDocuments', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  const mockPoolInstance = {
    connect: jest.fn(),
    end: jest.fn(),
  };

  const mockDocuments: DocItem[] = [
    {
      id: 'react-hooks',
      uid: 'react-hooks',
      title: 'React Hooks Guide',
      content: '# React Hooks\n\nОсновы хуков в React...',
      specialty: 'Frontend',
      technology: 'React',
      access: 'public',
      tools: ['React'],
      order: 1,
      priority: 5,
      description: 'Руководство по хукам React',
      tags: ['react', 'hooks', 'frontend'],
      info: ['https://react.dev/hooks'],
      file_hash: 'abc123hash1',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-15'),
    },
    {
      id: 'typescript-basics',
      uid: 'typescript-basics',
      title: 'TypeScript Basics',
      content: '# TypeScript\n\nОсновы TypeScript...',
      specialty: 'Frontend',
      technology: 'TypeScript',
      access: 'public',
      tools: ['TypeScript'],
      order: 2,
      priority: 3,
      description: 'Основы TypeScript',
      tags: ['typescript', 'frontend'],
      info: ['https://typescript.org'],
      file_hash: 'def456hash2',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-15'),
    },
  ];

  const mockTechnologyMapping = {
    React: {
      specialty: 'Frontend',
      priority: 5,
      description: 'React framework',
    },
    TypeScript: {
      specialty: 'Frontend',
      priority: 3,
      description: 'TypeScript language',
    },
  };

  const mockSpecialtyMapping: SpecialtyMapping = {
    Frontend: {
      priority: 1,
      description: 'Веб-разработка, UI/UX, браузерные технологии',
    },
    Backend: {
      priority: 2,
      description: 'Серверная разработка, API, базы данных',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
    mockClient.release.mockReset();
    mockPoolInstance.connect.mockResolvedValue(mockClient);
    mockPoolInstance.end.mockResolvedValue(undefined);
    (Pool as jest.MockedClass<typeof Pool>).mockImplementation(() => mockPoolInstance as any);
  });

  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Должна успешно сохранить документы с дефолтными настройками', async () => {
      // Мокаем ответы базы данных
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPSERT_SPECIALTY_QUERY для Frontend
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPSERT_TECHNOLOGY_QUERY для React
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // UPSERT_TECHNOLOGY_QUERY для TypeScript
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_QUERY для первой статьи
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY для react
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY для hooks
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY для frontend
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_LINK_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT_ARTICLE_QUERY для второй статьи
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY для typescript
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY для frontend
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_LINK_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // COMMIT

      await saveDocuments({ documents: mockDocuments, technologyMapping: mockTechnologyMapping });

      expect(Pool).toHaveBeenCalledWith(DB_CONFIG);
      expect(mockPoolInstance.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockPoolInstance.end).toHaveBeenCalled();
    });

    it('Должна использовать кастомную конфигурацию базы данных', async () => {
      const customConfig: DatabaseConfig = {
        host: 'custom-host',
        port: 5433,
        database: 'custom-db',
        user: 'custom-user',
        password: 'custom-password',
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPSERT_SPECIALTY_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPSERT_TECHNOLOGY_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_LINK_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // COMMIT

      await saveDocuments({ documents: mockDocuments, config: customConfig });

      expect(Pool).toHaveBeenCalledWith(customConfig);
    });

    it('Должна обрабатывать пустой массив документов', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // COMMIT

      await saveDocuments({ documents: [] });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('Должна обрабатывать specialtyMapping', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPSERT_SPECIALTY_QUERY для Frontend
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // UPSERT_SPECIALTY_QUERY для Backend
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPSERT_TECHNOLOGY_QUERY для React
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // UPSERT_TECHNOLOGY_QUERY для TypeScript
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_QUERY для первой статьи
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY для react
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY для hooks
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY для frontend
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_LINK_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT_ARTICLE_QUERY для второй статьи
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY для typescript
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY для frontend
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_LINK_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // COMMIT

      await saveDocuments({ documents: mockDocuments, specialtyMapping: mockSpecialtyMapping });

      expect(mockClient.query).toHaveBeenCalledWith(SCHEMA.UPSERT_SPECIALTY_QUERY, ['Frontend', 'frontend', 1]);
      expect(mockClient.query).toHaveBeenCalledWith(SCHEMA.UPSERT_SPECIALTY_QUERY, ['Backend', 'backend', 2]);
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Должна обрабатывать документы без тегов и ссылок', async () => {
      const documentsWithoutTagsAndLinks = [
        {
          ...mockDocuments[0],
          tags: [],
          info: [],
        },
      ];

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPSERT_SPECIALTY_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPSERT_TECHNOLOGY_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // COMMIT

      await saveDocuments({ documents: documentsWithoutTagsAndLinks });

      // Проверяем что не вызываются запросы для тегов и ссылок
      expect(mockClient.query).not.toHaveBeenCalledWith(SCHEMA.INSERT_TAG_QUERY, expect.anything());
      expect(mockClient.query).not.toHaveBeenCalledWith(SCHEMA.INSERT_ARTICLE_TAG_QUERY, expect.anything());
      expect(mockClient.query).not.toHaveBeenCalledWith(SCHEMA.INSERT_ARTICLE_LINK_QUERY, expect.anything());
    });

    it('Должна обрабатывать technologyMapping без specialty', async () => {
      const technologyMappingWithoutSpecialty = {
        React: {
          specialty: undefined as any,
          priority: 5,
          description: 'React framework',
        },
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPSERT_TECHNOLOGY_QUERY для React
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // UPSERT_TECHNOLOGY_QUERY для TypeScript
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_LINK_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT_ARTICLE_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_LINK_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // COMMIT

      await saveDocuments({ documents: mockDocuments, technologyMapping: technologyMappingWithoutSpecialty });

      // Проверяем что не создаются связи между технологиями и специальностями
      expect(mockClient.query).not.toHaveBeenCalledWith(SCHEMA.UPSERT_SPECIALTY_TECHNOLOGY_QUERY, expect.anything());
    });

    it('Должна обрабатывать technologyMapping с null/undefined specialty', async () => {
      const technologyMappingWithNullSpecialty = {
        React: {
          specialty: null as any,
          priority: 5,
          description: 'React framework',
        },
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPSERT_TECHNOLOGY_QUERY для React
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // UPSERT_TECHNOLOGY_QUERY для TypeScript
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_LINK_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT_ARTICLE_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_LINK_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // COMMIT

      await saveDocuments({ documents: mockDocuments, technologyMapping: technologyMappingWithNullSpecialty });

      // Проверяем что не создаются связи между технологиями и специальностями
      expect(mockClient.query).not.toHaveBeenCalledWith(SCHEMA.UPSERT_SPECIALTY_TECHNOLOGY_QUERY, expect.anything());
    });

    it('Должна пропускать статьи с несуществующими технологиями', async () => {
      const documentsWithInvalidTechnology = [
        {
          ...mockDocuments[0],
          technology: 'NonExistentTech',
        },
      ];

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPSERT_SPECIALTY_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPSERT_TECHNOLOGY_QUERY для TypeScript
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_QUERY для второй статьи
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_TAG_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT_ARTICLE_LINK_QUERY
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // COMMIT

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await saveDocuments({ documents: documentsWithInvalidTechnology });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Пропускаем статью React Hooks Guide для specialty Frontend: не найдена specialty',
      );

      consoleWarnSpy.mockRestore();
    });

    it('Должна пропускать статьи с несуществующими специальностями', async () => {
      const documentsWithInvalidSpecialty = [
        {
          ...mockDocuments[0],
          specialty: 'NonExistentSpecialty',
        },
      ];

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPSERT_TECHNOLOGY_QUERY для React
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // COMMIT

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await saveDocuments({ documents: documentsWithInvalidSpecialty });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Пропускаем статью React Hooks Guide для specialty NonExistentSpecialty: не найдена specialty',
      );

      consoleWarnSpy.mockRestore();
    });

    it('Должна освобождать ресурсы при ошибке', async () => {
      const queryError = new Error('Database error');
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // BEGIN
        .mockRejectedValueOnce(queryError); // Ошибка при UPSERT_SPECIALTY_QUERY

      await expect(saveDocuments({ documents: mockDocuments })).rejects.toThrow('Database error');

      expect(mockClient.release).toHaveBeenCalled();
      expect(mockPoolInstance.end).toHaveBeenCalled();
    });

    it('Должна обрабатывать ошибку подключения к базе данных', async () => {
      const connectionError = new Error('Connection failed');
      mockPoolInstance.connect.mockRejectedValue(connectionError);

      await expect(saveDocuments({ documents: mockDocuments })).rejects.toThrow('Connection failed');

      expect(mockClient.query).not.toHaveBeenCalled();
    });
  });
});
