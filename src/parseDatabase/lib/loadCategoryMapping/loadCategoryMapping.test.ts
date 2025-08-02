import { loadCategoryMapping } from './loadCategoryMapping';
import { CategoryMapping, ScanOptions } from '../../../types';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

jest.mock('js-yaml', () => ({
  load: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn(),
}));

const mockFs = jest.mocked(require('fs'));
const mockYaml = jest.mocked(require('js-yaml'));
const mockPath = jest.mocked(require('path'));

const mockCategoryMapping: CategoryMapping = {
  react: {
    specialty: 'Frontend',
    priority: 1,
    description: 'React framework',
  },
  typescript: {
    specialty: 'Language',
    priority: 2,
    description: 'TypeScript language',
  },
};

describe('Unit/utility/function/loadCategoryMapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.join.mockReturnValue('/test/config/category-mapping.yaml');
    mockFs.readFileSync.mockReturnValue('mock yaml content');
    mockYaml.load.mockReturnValue(mockCategoryMapping);
  });

  describe('SUCCESS_CASES', () => {
    it('должен загрузить конфигурацию с дефолтным путем', () => {
      const result = loadCategoryMapping();

      expect(mockPath.join).toHaveBeenCalledWith(process.cwd(), 'config', 'category-mapping.yaml');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/test/config/category-mapping.yaml', 'utf8');
      expect(mockYaml.load).toHaveBeenCalledWith('mock yaml content');

      expect(result).toEqual(mockCategoryMapping);
    });

    it('должен загрузить конфигурацию с кастомным путем', () => {
      const options: ScanOptions = {
        configPath: '/custom/config.yaml',
      };

      const result = loadCategoryMapping(options);

      expect(mockPath.join).not.toHaveBeenCalled();
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/custom/config.yaml', 'utf8');
      expect(mockYaml.load).toHaveBeenCalledWith('mock yaml content');

      expect(result).toEqual(mockCategoryMapping);
    });

    it('должен обработать пустую конфигурацию', () => {
      mockYaml.load.mockReturnValue({});

      const result = loadCategoryMapping();

      expect(result).toEqual({});
    });

    it('должен обработать конфигурацию с массивом специальностей', () => {
      const mappingWithArray: CategoryMapping = {
        git: {
          specialty: ['Frontend', 'Backend'],
          priority: 1,
          description: 'Version control',
        },
      };

      mockYaml.load.mockReturnValue(mappingWithArray);
      const result = loadCategoryMapping();

      expect(result).toEqual(mappingWithArray);
    });
  });

  describe('EDGE_CASES', () => {
    it('должен обработать пустые опции', () => {
      const result = loadCategoryMapping({});

      expect(mockPath.join).toHaveBeenCalledWith(process.cwd(), 'config', 'category-mapping.yaml');
      expect(result).toEqual(mockCategoryMapping);
    });

    it('должен обработать undefined опции', () => {
      const result = loadCategoryMapping(undefined);

      expect(mockPath.join).toHaveBeenCalledWith(process.cwd(), 'config', 'category-mapping.yaml');
      expect(result).toEqual(mockCategoryMapping);
    });

    it('должен обработать опции с пустым configPath', () => {
      const options: ScanOptions = {
        configPath: '',
      };

      const result = loadCategoryMapping(options);

      expect(mockPath.join).toHaveBeenCalledWith(process.cwd(), 'config', 'category-mapping.yaml');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/test/config/category-mapping.yaml', 'utf8');
      expect(result).toEqual(mockCategoryMapping);
    });
  });

  describe('ERROR_CASES', () => {
    it('должен вернуть пустой объект при ошибке чтения файла', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const result = loadCategoryMapping();

      expect(consoleSpy).toHaveBeenCalledWith('Конфигурационный файл не найден, используем автоматическое определение');
      expect(result).toEqual({});
      expect(mockYaml.load).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('должен вернуть пустой объект при ошибке парсинга YAML', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockYaml.load.mockImplementation(() => {
        throw new Error('Invalid YAML');
      });

      const result = loadCategoryMapping();

      expect(consoleSpy).toHaveBeenCalledWith('Конфигурационный файл не найден, используем автоматическое определение');
      expect(result).toEqual({});

      consoleSpy.mockRestore();
    });

    it('должен обработать ошибку доступа к файлу', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      const result = loadCategoryMapping();

      expect(consoleSpy).toHaveBeenCalledWith('Конфигурационный файл не найден, используем автоматическое определение');
      expect(result).toEqual({});

      consoleSpy.mockRestore();
    });
  });

  describe('INTEGRATION_TESTS', () => {
    it('должен корректно обработать полный workflow', () => {
      const options: ScanOptions = {
        configPath: '/test/path/config.yaml',
        docsPath: '/test/docs',
      };

      const result = loadCategoryMapping(options);

      expect(mockFs.readFileSync).toHaveBeenCalledWith('/test/path/config.yaml', 'utf8');
      expect(mockYaml.load).toHaveBeenCalledWith('mock yaml content');
      expect(result).toEqual(mockCategoryMapping);
    });
  });
});
