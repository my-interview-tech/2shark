#!/usr/bin/env node

import { Command } from 'commander';
import { execFileSync } from 'child_process';
import { initDatabase, clearDatabase } from '../database';
import { runImport } from '../import';
import { CheckUpdatesOptions, ParseDbOptions, TRunImportOptions, UpdateArticlesOptions } from '../types';
import {
  COMMAND_DESCRIPTION,
  COMMAND_NAME,
  COMMAND_VERSION,
  CONFIG_PATH,
  DOCS_PATH,
  IMPORT,
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

function resolveConfigDir(options: { config?: string; configDir?: string }): string {
  return options.config || options.configDir || CONFIG_PATH;
}

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

function resolveGitRevisionOrThrow(repoPath: string): { branch: string; commitSha: string } {
  try {
    const branch = execFileSync('git', ['branch', '--show-current'], {
      cwd: repoPath,
      encoding: 'utf-8',
    }).trim();
    const commitSha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repoPath,
      encoding: 'utf-8',
    }).trim();

    if (!branch || !commitSha) {
      throw new Error('Не удалось определить branch/commitSha');
    }

    return { branch, commitSha };
  } catch {
    throw new Error(
      'Не удалось определить git revision для legacy-команды. Используйте `2shark import --branch <name> --commit-sha <sha>`',
    );
  }
}

function assertRevisionOptions(options: TImportCliOptions): void {
  if (!options.branch) {
    throw new Error('Для production import обязательно передать --branch');
  }

  if (!options.commitSha) {
    throw new Error('Для production import обязательно передать --commit-sha');
  }
}

function printImportSummary(result: { total: number; changed: number; skipped: number; saved: number }): void {
  console.log('Статистика:');
  console.log(`Всего файлов: ${result.total}`);
  console.log(`Изменено: ${result.changed}`);
  console.log(`Пропущено: ${result.skipped}`);
  console.log(`Сохранено: ${result.saved}`);
}

function printDeprecatedCommandWarning(command: string): void {
  console.warn(`[DEPRECATED] Команда "${command}" является legacy. Используйте "2shark import".`);
}

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

  /** @deprecated Используйте команду `2shark import` */
  program
    .command(PARSE_DB)
    .description('Deprecated legacy: парсить документацию и сохранить в базу данных')
    .option(flagsPath, 'Путь к документации', DOCS_PATH)
    .option(flagsConfig, 'Путь к конфигурационным файлам', CONFIG_PATH)
    .option(flagsClear, 'Очистить базу данных перед парсингом')
    .option(flagsCheckOnly, 'Проверить обновления без сохранения')
    .action(async (options: ParseDbOptions) => {
      try {
        printDeprecatedCommandWarning(PARSE_DB);
        console.log('Запуск legacy команды parse-db через import pipeline...');
        const revision = resolveGitRevisionOrThrow(process.cwd());
        const result = await runImport({
          ...toImportOptions(options),
          repoPath: process.cwd(),
          branch: revision.branch,
          commitSha: revision.commitSha,
          shouldForce: !options.checkOnly,
        });

        printImportSummary(result);
      } catch (error) {
        console.error('Ошибка при парсинге:', error);
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

  /** @deprecated Используйте команду `2shark import --check-only` */
  program
    .command(CHECK_UPDATES)
    .description('Deprecated legacy: проверить какие файлы требуют обновления')
    .option(flagsPath, 'Путь к документации', DOCS_PATH)
    .option(flagsConfig, 'Путь к конфигурационным файлам', CONFIG_PATH)
    .option(flagsCheckOnly, 'Проверить обновления без сохранения')
    .action(async (options: CheckUpdatesOptions) => {
      try {
        printDeprecatedCommandWarning(CHECK_UPDATES);
        const revision = resolveGitRevisionOrThrow(process.cwd());
        const result = await runImport({
          ...toImportOptions(options),
          repoPath: process.cwd(),
          branch: revision.branch,
          commitSha: revision.commitSha,
          shouldCheckOnly: true,
          shouldForce: false,
        });
        printImportSummary(result);
      } catch (error) {
        console.error('Ошибка при проверке обновлений:', error);
        process.exit(1);
      }
    });

  /** @deprecated Используйте команду `2shark import` (или `--force`) */
  program
    .command(UPDATE_ARTICLES)
    .description('Deprecated legacy: обновить измененные статьи в базе данных')
    .option(flagsPath, 'Путь к документации', DOCS_PATH)
    .option(flagsConfig, 'Путь к конфигурационным файлам', CONFIG_PATH)
    .option(flagsForce, 'Сохранить все документы без diff')
    .action(async (options: UpdateArticlesOptions) => {
      try {
        printDeprecatedCommandWarning(UPDATE_ARTICLES);
        const revision = resolveGitRevisionOrThrow(process.cwd());
        const result = await runImport({
          ...toImportOptions(options),
          repoPath: process.cwd(),
          branch: revision.branch,
          commitSha: revision.commitSha,
          shouldForce: Boolean(options.force),
          shouldCheckOnly: false,
        });
        printImportSummary(result);
      } catch (error) {
        console.error('Ошибка при обновлении статей:', error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

main().catch((error) => {
  console.error('Critical error:', error);
  process.exit(1);
});
