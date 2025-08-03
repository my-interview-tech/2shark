#!/usr/bin/env node

import { Command } from 'commander';
import { initDatabase, clearDatabase } from '../database';
import { parseDatabase, filterChangedFiles, loadYAMLContent } from '../docScanner';
import { saveDocuments } from '../helpers';
import { CheckUpdatesOptions, ParseDbOptions, ScanOptions, TechnologyMapping, UpdateArticlesOptions } from '../types';
import {
  CHECK_UPDATES,
  CLEAR_DB,
  COMMAND_DESCRIPTION,
  COMMAND_NAME,
  COMMAND_VERSION,
  CONFIG_PATH,
  DOCS_PATH,
  flagsCheckOnly,
  flagsClear,
  flagsConfig,
  flagsForce,
  flagsPath,
  INIT_DB,
  PARSE_DB,
  UPDATE_ARTICLES,
} from '../constants';
import packageJson from '../../package.json';

async function main() {
  const program = new Command();

  program
    .name(packageJson?.name || COMMAND_NAME)
    .description(packageJson?.description || COMMAND_DESCRIPTION)
    .version(packageJson?.version || COMMAND_VERSION);

  program.on('command:*', (command: string) => {
    console.error(`Unknown command: ${command}`);
    program.help();
  });

  program
    .command(INIT_DB)
    .description('Инициализировать базу данных')
    .action(async () => {
      try {
        console.log('Инициализация базы данных...');
        await initDatabase();
        console.log('База данных инициализирована успешно');
      } catch (error) {
        console.error('Ошибка при инициализации базы данных:', error);
        process.exit(1);
      }
    });

  program
    .command(CLEAR_DB)
    .description('Очистить базу данных')
    .action(async () => {
      try {
        console.log('Очистка базы данных...');
        await clearDatabase();
        console.log('База данных очищена успешно');
      } catch (error) {
        console.error('Ошибка при очистке базы данных:', error);
        process.exit(1);
      }
    });

  // todo: обновить скрипт
  program
    .command(PARSE_DB)
    .description('Парсить документацию и сохранить в базу данных')
    .option(flagsPath, 'Путь к документации', DOCS_PATH)
    .option(flagsConfig, 'Путь к конфигурационным файлам', CONFIG_PATH)
    .option(flagsClear, 'Очистить базу данных перед парсингом') // todo: так делать кажется не надо, лучше идти через флоу очистки БД вручную, а если существует уже БД предложить другие кейсы
    .option(flagsCheckOnly, 'Проверить обновления без сохранения') // todo: тоже не надо, так как этот скрипт предназначен для заполнения таблицы данными
    .action(async (options: ParseDbOptions) => {
      try {
        if (options.checkOnly) {
          console.log('🔍 Проверка обновлений...');

          const configDir = options.configDir || CONFIG_PATH;

          const scanOptions: ScanOptions = {
            docsPath: options.path,
            configPath: {
              technologyPath: `${configDir}/category-mapping.yaml`,
              specialtiesPath: `${configDir}/specialties.yaml`,
            },
          };

          const documents = await parseDatabase(scanOptions);
          const changedFiles = await filterChangedFiles(documents);

          console.log(`\n📊 Статистика:`);
          console.log(`   Всего файлов: ${documents.length}`);
          console.log(`   Требуют обновления: ${changedFiles.length}`);
          console.log(`   Неизмененных: ${documents.length - changedFiles.length}`);

          if (changedFiles.length === 0) {
            console.log('\n✅ Нет файлов для обновления');
          } else {
            console.log(`\n🔄 Найдено ${changedFiles.length} файлов для обновления`);
          }
          return;
        }

        console.log('🔄 Парсинг документации...');

        if (options.clear) {
          console.log('🗑️ Очистка базы данных...');
          await clearDatabase();
        }

        const configDir = options.configDir || CONFIG_PATH;
        const technologyMapping = await loadYAMLContent(options.config);
        const specialtyMapping = await loadYAMLContent(`${configDir}/specialties.yaml`);
        const scanOptions: ScanOptions = {
          docsPath: options.path,
          configPath: {
            technologyPath: options.config,
            specialtiesPath: `${configDir}/specialties.yaml`,
          },
        };

        const documents = await parseDatabase(scanOptions);
        console.log(`\n📊 Найдено ${documents.length} документов`);

        console.log('💾 Сохранение в базу данных...');
        try {
          await saveDocuments(documents, undefined, technologyMapping as TechnologyMapping, specialtyMapping);
          console.log('✅ Парсинг завершен успешно');
        } catch (error) {
          console.error('\n❌ Ошибки при сохранении статей:');
          if (error instanceof Error) {
            console.error(`   ${error.message}`);
          } else {
            console.error(`   Неизвестная ошибка: ${error}`);
          }
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Ошибка при парсинге:', error);
        process.exit(1);
      }
    });

  // todo: обновить скрипт
  program
    .command(CHECK_UPDATES)
    .description('Проверить какие файлы требуют обновления')
    .option(flagsPath, 'Путь к документации', DOCS_PATH)
    .option(flagsConfig, 'Путь к конфигурационным файлам', CONFIG_PATH)
    .option(flagsCheckOnly, 'Проверить обновления без сохранения')
    .action(async (options: CheckUpdatesOptions) => {
      try {
        try {
          console.log('🔍 Проверка обновлений...');
          const configDir = options.configDir || CONFIG_PATH;

          const scanOptions: ScanOptions = {
            docsPath: options.path,
            configPath: {
              technologyPath: `${configDir}/category-mapping.yaml`,
              specialtiesPath: `${configDir}/specialties.yaml`,
            },
          };

          const documents = await parseDatabase(scanOptions);
          const changedFiles = await filterChangedFiles(documents);

          console.log(`\n📊 Статистика:`);
          console.log(`   Всего файлов: ${documents.length}`);
          console.log(`   Требуют обновления: ${changedFiles.length}`);
          console.log(`   Неизмененных: ${documents.length - changedFiles.length}`);

          if (changedFiles.length === 0) {
            console.log('\n✅ Нет файлов для обновления');
          } else {
            console.log(`\n🔄 Найдено ${changedFiles.length} файлов для обновления`);
          }
        } catch (error) {
          console.error('❌ Ошибка при проверке обновлений:', error);
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Ошибка при проверке обновлений:', error);
        process.exit(1);
      }
    });

  // todo: обновить скрипт
  program
    .command(UPDATE_ARTICLES)
    .description('Обновить измененные статьи в базе данных')
    .option(flagsPath, 'Путь к документации', DOCS_PATH)
    .option(flagsConfig, 'Путь к конфигурационным файлам', CONFIG_PATH)
    .option(flagsForce, 'Обновить измененные статьи') // todo: проверить, что обновляются только измененные статьи
    .action(async (options: UpdateArticlesOptions) => {
      try {
        console.log('🔄 Обновление статей...');

        const configDir = options.configDir || CONFIG_PATH;

        const scanOptions: ScanOptions = {
          docsPath: options.path,
          configPath: {
            technologyPath: `${configDir}/category-mapping.yaml`,
            specialtiesPath: `${configDir}/specialties.yaml`,
          },
        };

        const documents = await parseDatabase(scanOptions);
        let filesToUpdate = documents;

        if (!options.force) {
          // Получаем только измененные файлы
          filesToUpdate = await filterChangedFiles(documents);
        }

        if (filesToUpdate.length === 0) {
          console.log('\n✅ Нет файлов для обновления');
          return;
        }

        console.log(`\n📊 Статистика обновления:`);
        console.log(`   Всего файлов: ${documents.length}`);
        console.log(`   Будет обновлено: ${filesToUpdate.length}`);
        console.log(`   Неизмененных: ${documents.length - filesToUpdate.length}`);

        if (!options.force) {
          console.log(`\n🔄 Найдено ${filesToUpdate.length} файлов для обновления:`);
          console.log('='.repeat(50));

          filesToUpdate.forEach((file, index) => {
            console.log(`${index + 1}. ${file.title}`);
            console.log(`   ID: ${file.id}`);
            console.log(`   Специальность: ${file.specialty}`);
            console.log(`   Технология: ${file.technology}`);
            console.log('');
          });
        }

        // Сохраняем документы в базу данных
        console.log('\n💾 Сохранение в базу данных...');
        try {
          await saveDocuments(filesToUpdate);
          console.log(`\n✅ Успешно обновлено ${filesToUpdate.length} статей`);
        } catch (error) {
          console.error('\n❌ Ошибки при сохранении статей:');
          if (error instanceof Error) {
            console.error(`   ${error.message}`);
          } else {
            console.error(`   Неизвестная ошибка: ${error}`);
          }
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Ошибка при обновлении статей:', error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

main().catch((error) => {
  console.error('Critical error:', error);
  process.exit(1);
});
