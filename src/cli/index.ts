#!/usr/bin/env node

import { Command } from 'commander';
import { initDatabase, clearDatabase } from '../database';
import { runImport } from '../import';
import { TRunImportOptions } from '../types';
import {
  COMMAND_DESCRIPTION,
  COMMAND_NAME,
  COMMAND_VERSION,
  CONFIG_PATH,
  DOCS_PATH,
  IMPORT,
  INIT_DB,
  CLEAR_DB,
  flagsCheckOnly,
  flagsClear,
  flagsConfig,
  flagsForce,
  flagsPath,
  flagsRepoPath,
  flagsBranch,
  flagsCommitSha,
  flagsProductionSync,
} from '../constants';
import packageJson from '../../package.json';

type TImportCliOptions = {
  path: string;
  config?: string;
  configDir?: string;
  repoPath?: string;
  branch?: string;
  commitSha?: string;
  productionSync?: boolean;
  clear?: boolean;
  checkOnly?: boolean;
  force?: boolean;
};

/**
 * Возвращает директорию конфигурации для import pipeline.
 *
 * @param options - CLI-опции с возможными алиасами пути к конфигу.
 * @returns Путь к директории конфигурации или дефолтный `CONFIG_PATH`.
 */
function resolveConfigDir(options: { config?: string; configDir?: string }): string {
  return options.config || options.configDir || CONFIG_PATH;
}

/**
 * Преобразует CLI-опции Commander в контракт `runImport`.
 *
 * @param options - Опции команды `2shark import`.
 * @returns Нормализованные опции production import pipeline.
 */
function toImportOptions(options: TImportCliOptions): TRunImportOptions {
  return {
    docsPath: options.path || DOCS_PATH,
    configDir: resolveConfigDir(options),
    repoPath: options.repoPath,
    branch: options.branch,
    commitSha: options.commitSha,
    isProductionSync: Boolean(options.productionSync),
    shouldCheckOnly: Boolean(options.checkOnly),
    shouldForce: Boolean(options.force),
    shouldClearBeforeImport: Boolean(options.clear),
  };
}

/**
 * Проверяет наличие обязательной git-ревизии для production import.
 *
 * @param options - Опции команды `2shark import`.
 * @throws Если не передан `--branch` или `--commit-sha`.
 */
function assertRevisionOptions(options: TImportCliOptions): void {
  if (!options.branch) {
    throw new Error('Для production import обязательно передать --branch');
  }

  if (!options.commitSha) {
    throw new Error('Для production import обязательно передать --commit-sha');
  }
}

/**
 * Печатает краткую статистику выполнения import pipeline.
 *
 * @param result - Summary результата импорта.
 */
function printImportSummary(result: { total: number; changed: number; skipped: number; saved: number }): void {
  console.log('Статистика:');
  console.log(`Всего файлов: ${result.total}`);
  console.log(`Изменено: ${result.changed}`);
  console.log(`Пропущено: ${result.skipped}`);
  console.log(`Сохранено: ${result.saved}`);
}

/**
 * Регистрирует CLI-команды и запускает парсинг аргументов процесса.
 *
 * @returns Promise, который завершается после обработки команды Commander.
 */
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
    .command(IMPORT)
    .description('Production import entrypoint')
    .option(flagsPath, 'Путь к документации', DOCS_PATH)
    .option(flagsConfig, 'Путь к конфигурационным файлам', CONFIG_PATH)
    .option(flagsRepoPath, 'Путь к git-репозиторию с контентом', process.cwd())
    .requiredOption(flagsBranch, 'Git branch для import')
    .requiredOption(flagsCommitSha, 'Git commit SHA для import')
    .option(flagsProductionSync, 'Запуск в production sync режиме (только branch=main)')
    .option(flagsClear, 'Очистить базу данных перед импортом')
    .option(flagsCheckOnly, 'Проверить обновления без сохранения')
    .option(flagsForce, 'Сохранить все документы без diff')
    .action(async (options: TImportCliOptions) => {
      try {
        assertRevisionOptions(options);
        const result = await runImport(toImportOptions(options));
        printImportSummary(result);
      } catch (error) {
        console.error('Ошибка при импорте:', error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

main().catch((error) => {
  console.error('Critical error:', error);
  process.exit(1);
});
