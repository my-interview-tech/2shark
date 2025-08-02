import fsSync from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { CategoryMapping, ScanOptions } from '../../../types';

/**
 * Загружает конфигурацию маппинга категорий из YAML файла
 *
 * @param options - Опции конфигурации сканера
 * @returns Объект маппинга категорий или пустой объект если файл не найден
 */
export function loadCategoryMapping(options: ScanOptions = {}): CategoryMapping {
  try {
    const configPath = options.configPath || path.join(process.cwd(), 'config', 'category-mapping.yaml');
    const configContent = fsSync.readFileSync(configPath, 'utf8');

    return yaml.load(configContent) as CategoryMapping;
  } catch (error) {
    console.log('Конфигурационный файл не найден, используем автоматическое определение');
    return {};
  }
}
