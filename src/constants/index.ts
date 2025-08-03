// ============================================================================
// Константы для CLI
// ============================================================================

export const COMMAND_NAME = '2shark';
export const COMMAND_DESCRIPTION = 'CLI для работы с документацией 2shark';
export const COMMAND_VERSION = '2.0.1';

// ============================================================================
// Нейминг скриптов
// ============================================================================

/** Команда для проверки обновлений */
export const CHECK_UPDATES = 'check-updates';

/** Команда для обновления статей */
export const UPDATE_ARTICLES = 'update-articles';

/** Команда для парсинга базы данных */
export const PARSE_DB = 'parse-db';

/** Команда для инициализации базы данных */
export const INIT_DB = 'init-db';

/** Команда для очистки базы данных */
export const CLEAR_DB = 'clear-db';

// ============================================================================
// Флаги скриптов
// ============================================================================

export const flagsPath = '-p, --path <path>';
export const flagsConfig = '-c, --config <config>';
export const flagsClear = '--clear';
export const flagsCheckOnly = '--check-only';
export const flagsForce = '-f, --force';

// ============================================================================
// Константы для путей
// ============================================================================

export const CONFIG_PATH = './config';
export const DOCS_PATH = './docs';
