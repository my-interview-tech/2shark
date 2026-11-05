import { DatabaseConfig } from '../types';

/**
 * Конфигурация базы данных по умолчанию
 */
export const DB_CONFIG: DatabaseConfig = {
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432'),
  database: process.env['DB_NAME'] || 'postgres',
  user: process.env['DB_USER'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'password',
};

/**
 * Адрес, с которого сайт базы знаний раздаёт картинки vault.
 * Путь картинки строится по правилам Quartz: `img/Pasted image 1.png` → `<base>/img/Pasted-image-1.png`.
 */
export const ASSETS_BASE_URL = (process.env['ASSETS_BASE_URL'] || 'https://my-interview.tech').replace(/\/+$/, '');
