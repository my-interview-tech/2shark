#!/usr/bin/env node

import { Command } from 'commander';
import { initDatabase, clearDatabase } from '../database';
import { parseDatabase, filterChangedFiles, loadYAMLContent } from '../docScanner';
import { saveDocuments } from '../saveDocuments';
import { CheckUpdatesOptions, ParseDbOptions, ScanOptions, TechnologyMapping, UpdateArticlesOptions } from '../types';
import {
  COMMAND_DESCRIPTION,
  COMMAND_NAME,
  COMMAND_VERSION,
  CONFIG_PATH,
  DOCS_PATH,
  INIT_DB,
  PARSE_DB,
  CHECK_UPDATES,
  UPDATE_ARTICLES,
  CLEAR_DB,
  flagsCheckOnly,
  flagsClear,
  flagsConfig,
  flagsForce,
  flagsPath,
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

  program
    .command(PARSE_DB)
    .description('Парсить документацию и сохранить в базу данных')
    .option(flagsPath, 'Путь к документации', DOCS_PATH)
    .option(flagsConfig, 'Путь к конфигурационным файлам', CONFIG_PATH)
    .option(flagsClear, 'Очистить базу данных перед парсингом')
    .option(flagsCheckOnly, 'Проверить обновления без сохранения')
    .action(async (options: ParseDbOptions) => {
      try {
        const configDir = options.configDir || CONFIG_PATH;
        const scanOptions: ScanOptions = {
          docsPath: options.path,
          configPath: {
            technologyPath: `${configDir}/category-mapping.yaml`,
            specialtiesPath: `${configDir}/specialties.yaml`,
          },
        };

        if (options.checkOnly) {
          console.log('Проверка обновлений...');

          const documents = await parseDatabase(scanOptions);
          const changedFiles = await filterChangedFiles(documents);

          console.log(`Статистика:`);
          console.log(`Всего файлов: ${documents.length}`);
          console.log(`Требуют обновления: ${changedFiles.length}`);
          console.log(`Неизмененных: ${documents.length - changedFiles.length}`);

          if (changedFiles.length === 0) {
            console.log('Нет файлов для обновления');
          } else {
            console.log(`Найдено ${changedFiles.length} файлов для обновления`);
          }

          return;
        }

        console.log('Парсинг документации...');

        if (options.clear) {
          console.log('Очистка базы данных...');

          await clearDatabase();
        }

        const technologyMapping = loadYAMLContent(`${configDir}/category-mapping.yaml`);
        const specialtyMapping = loadYAMLContent(`${configDir}/specialties.yaml`);

        const documents = await parseDatabase(scanOptions);

        console.log(`Найдено ${documents.length} документов`);
        console.log('Сохранение в базу данных...');

        try {
          await saveDocuments({
            documents,
            technologyMapping: technologyMapping as TechnologyMapping,
            specialtyMapping,
          });
          console.log('Парсинг завершен успешно');
        } catch (error) {
          console.error('Ошибки при сохранении статей:');

          if (error instanceof Error) {
            console.error(error.message);
          } else {
            console.error(`Неизвестная ошибка: ${error}`);
          }

          process.exit(1);
        }
      } catch (error) {
        console.error('Ошибка при парсинге:', error);
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
          await saveDocuments({ documents: filesToUpdate });
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
