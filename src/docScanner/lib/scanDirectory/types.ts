import { DocItem, TechnologyMapping, SpecialtyMapping } from '../../../types';

export type ScanDirectoryParams = {
  /** Путь к директории для сканирования */
  dirPath: string;
  /** Массив для накопления обработанных документов */
  items: DocItem[];
  /** Маппинг категорий для определения приоритетов */
  technologyMapping: TechnologyMapping;
  /** Маппинг специальностей */
  specialtyMapping: SpecialtyMapping;
};

export type ProcessFileResult = {
  /** Обработанный документ или null если произошла ошибка */
  item: DocItem | null;
  /** Путь к обработанному файлу */
  filePath: string;
};
