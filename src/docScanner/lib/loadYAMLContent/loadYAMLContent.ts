import fsSync from 'fs';
import yaml from 'js-yaml';
import { SpecialtyMapping, TechnologyMapping } from '../../../types';

type TYAMLContent = SpecialtyMapping | TechnologyMapping;

/**
 * Загружает конфигурацию из YAML файла
 *
 * @param path - Путь к YAML файлу
 * @returns Объект конфигурации или пустой объект если файл не найден
 */
export function loadYAMLContent<T extends TYAMLContent>(path: string): T {
  try {
    const configContent = fsSync.readFileSync(path, 'utf8');

    return yaml.load(configContent) as T;
  } catch (error) {
    console.log('Конфигурационный файл не найден, используем пустой объект');

    return {} as T;
  }
}
