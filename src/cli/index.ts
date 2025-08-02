#!/usr/bin/env node

import { Command } from 'commander';
import { parseDatabase } from '../parseDatabase';
import { initDatabase, clearDatabase } from '../database';
import { ScanOptions } from '../types';

interface ParseDbOptions {
  path: string;
  config: string;
  clear: boolean;
}

/**
 * CLI интерфейс для 2shark
 *
 * Предоставляет команды для:
 * - Сканирования документации
 * - Инициализации базы данных
 * - Очистки базы данных
 *
 * @example
 * ```bash
 * # Сканирование документации
 * 2shark parse-db
 *
 * # Сканирование с кастомными путями
 * 2shark parse-db -p ./my-docs -c ./my-config.yaml
 *
 * # Инициализация базы данных
 * 2shark init-db
 *
 * # Очистка базы данных
 * 2shark clear-db
 * ```
 */
const program = new Command();

program
  .name('2shark')
  .description('Скрипт для сканирования документации и формирования PostgreSQL базы данных')
  .version('1.0.0');

/**
 * Команда для сканирования документации
 *
 * Сканирует указанную директорию на наличие Markdown файлов,
 * обрабатывает их и может сохранить в базу данных.
 *
 * @example
 * ```bash
 * # Базовое сканирование
 * 2shark parse-db
 *
 * # Сканирование с кастомным путем
 * 2shark parse-db -p ./my-documentation
 *
 * # Сканирование с кастомной конфигурацией
 * 2shark parse-db -c ./my-category-mapping.yaml
 *
 * # Сканирование с очисткой базы данных
 * 2shark parse-db --clear
 *
 * # Полная настройка
 * 2shark parse-db -p ./docs -c ./config.yaml --clear
 * ```
 */
program
  .command('parse-db')
  .description('Сканировать документацию')
  .option('-p, --path <path>', 'Путь к документации', './docs')
  .option('-c, --config <path>', 'Путь к конфигурационному файлу', './config/category-mapping.yaml')
  .option('--clear', 'Очистить базу данных перед сканированием')
  .action(async (options: ParseDbOptions) => {
    try {
      // todo: clearBeforeScan, найти возможность искать существующие статьи и сравнивать произошло ли в них изменения, если произошли то перезатираем БД, если нет, оставляем дефолт
      const scanOptions: ScanOptions = {
        docsPath: options.path,
        configPath: options.config,
        clearBeforeScan: options.clear,
      };

      if (options.clear) {
        console.log('Очищаем базу данных...');
        await clearDatabase();
      }

      console.log('Сканируем документацию...');
      const items = await parseDatabase(scanOptions);
      console.log(`Найдено ${items.length} документов`);

      // Здесь можно добавить сохранение в базу данных
      console.log('Сканирование завершено');
    } catch (error) {
      console.error('Ошибка:', error);
      process.exit(1);
    }
  });

/**
 * Команда для инициализации базы данных
 *
 * Создает все необходимые таблицы в PostgreSQL:
 * - specialties: специальности
 * - technologies: технологии
 * - specialty_technology: связь специальности и технологии
 * - articles: статьи документации
 * - tags: теги
 * - article_tags: связь статей и тегов
 *
 * @example
 * ```bash
 * # Инициализация с дефолтными настройками
 * 2shark init-db
 *
 * # Инициализация с переменными окружения
 * DB_HOST=localhost DB_PORT=5432 DB_NAME=docs_db 2shark init-db
 * ```
 *
 * @requires PostgreSQL сервер должен быть запущен и доступен
 * @requires Переменные окружения или дефолтные настройки для подключения к БД
 */
program
  .command('init-db')
  .description('Инициализировать базу данных')
  .action(async () => {
    try {
      console.log('Инициализируем базу данных...');
      await initDatabase();
      console.log('✅ База данных инициализирована');
    } catch (error) {
      console.error('Ошибка:', error);
      process.exit(1);
    }
  });

/**
 * Команда для очистки базы данных
 *
 * Удаляет все данные из всех таблиц в правильном порядке
 * для соблюдения внешних ключей. Используется для полной
 * очистки базы данных перед новым сканированием.
 *
 * @example
 * ```bash
 * # Очистка с дефолтными настройками
 * 2shark clear-db
 *
 * # Очистка с кастомной конфигурацией
 * DB_HOST=my-host.com DB_NAME=my_db 2shark clear-db
 * ```
 *
 * @warning Удаляет ВСЕ данные из базы данных без возможности восстановления
 * @requires PostgreSQL сервер должен быть запущен и доступен
 */
program
  .command('clear-db')
  .description('Очистить базу данных')
  .action(async () => {
    try {
      console.log('Очищаем базу данных...');
      await clearDatabase();
      console.log('База данных очищена');
    } catch (error) {
      console.error('Ошибка:', error);
      process.exit(1);
    }
  });

/**
 * Запускает CLI интерфейс
 *
 * Парсит аргументы командной строки и выполняет
 * соответствующую команду или показывает справку.
 *
 * @example
 * ```bash
 * # Показать справку
 * 2shark --help
 *
 * # Показать справку по команде
 * 2shark scan --help
 *
 * # Показать версию
 * 2shark --version
 * ```
 */
program.parse();
