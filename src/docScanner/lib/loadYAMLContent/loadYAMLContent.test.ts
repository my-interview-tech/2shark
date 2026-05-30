import { loadYAMLContent } from './loadYAMLContent';
import { TechnologyMapping } from '../../../types';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

jest.mock('js-yaml', () => ({
  load: jest.fn(),
}));

const mockFs = jest.mocked(require('fs'));
const mockYaml = jest.mocked(require('js-yaml'));

const mockCategoryMapping: TechnologyMapping = {
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

describe('Unit/utility/function/loadYAMLContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.readFileSync.mockReturnValue('mock yaml content');
    mockYaml.load.mockReturnValue(mockCategoryMapping);
  });

  describe('SUCCESS_CASES', () => {
    it('должен загрузить конфигурацию с дефолтным путем', () => {
      const defaultPath = '/test/config/category-mapping.yaml';
      const result = loadYAMLContent(defaultPath);

      expect(mockFs.readFileSync).toHaveBeenCalledWith(defaultPath, 'utf8');
      expect(mockYaml.load).toHaveBeenCalledWith('mock yaml content');

      expect(result).toEqual(mockCategoryMapping);
    });

    it('должен загрузить конфигурацию с кастомным путем', () => {
      const customPath = '/custom/technology-config.yaml';
      const result = loadYAMLContent(customPath);

      expect(mockFs.readFileSync).toHaveBeenCalledWith(customPath, 'utf8');
      expect(mockYaml.load).toHaveBeenCalledWith('mock yaml content');

      expect(result).toEqual(mockCategoryMapping);
    });

    it('должен загрузить конфигурацию с путем как строкой', () => {
      const customPath = '/custom/path/config.yaml';
      const result = loadYAMLContent(customPath);

      expect(mockFs.readFileSync).toHaveBeenCalledWith(customPath, 'utf8');
      expect(mockYaml.load).toHaveBeenCalledWith('mock yaml content');

      expect(result).toEqual(mockCategoryMapping);
    });

    it('должен обработать пустую конфигурацию', () => {
      mockYaml.load.mockReturnValue({});
      const path = '/test/config/category-mapping.yaml';

      const result = loadYAMLContent(path);

      expect(result).toEqual({});
    });

    it('должен обработать конфигурацию с массивом специальностей', () => {
      const mappingWithArray: TechnologyMapping = {
        git: {
          specialty: ['Frontend', 'Backend'],
          priority: 1,
          description: 'Version control',
        },
      };

      mockYaml.load.mockReturnValue(mappingWithArray);
      const path = '/test/config/category-mapping.yaml';
      const result = loadYAMLContent(path);

      expect(result).toEqual(mappingWithArray);
    });
  });

  describe('EDGE_CASES', () => {
    it('должен обработать пустую строку пути', () => {
      const result = loadYAMLContent('');

      expect(mockFs.readFileSync).toHaveBeenCalledWith('', 'utf8');
      expect(result).toEqual(mockCategoryMapping);
    });

    it('должен обработать относительный путь', () => {
      const relativePath = './config/category-mapping.yaml';
      const result = loadYAMLContent(relativePath);

      expect(mockFs.readFileSync).toHaveBeenCalledWith(relativePath, 'utf8');
      expect(result).toEqual(mockCategoryMapping);
    });

    it('должен обработать абсолютный путь', () => {
      const absolutePath = '/absolute/path/to/config.yaml';
      const result = loadYAMLContent(absolutePath);

      expect(mockFs.readFileSync).toHaveBeenCalledWith(absolutePath, 'utf8');
      expect(result).toEqual(mockCategoryMapping);
    });
  });

  describe('ERROR_CASES', () => {
    it('должен вернуть пустой объект при ошибке чтения файла', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const path = '/test/config/category-mapping.yaml';
      const result = loadYAMLContent(path);

      expect(consoleSpy).toHaveBeenCalledWith('Конфигурационный файл не найден, используем пустой объект');
      expect(result).toEqual({});
      expect(mockYaml.load).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('должен вернуть пустой объект при ошибке парсинга YAML', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockYaml.load.mockImplementation(() => {
        throw new Error('Invalid YAML');
      });

      const path = '/test/config/category-mapping.yaml';
      const result = loadYAMLContent(path);

      expect(consoleSpy).toHaveBeenCalledWith('Конфигурационный файл не найден, используем пустой объект');
      expect(result).toEqual({});

      consoleSpy.mockRestore();
    });

    it('должен обработать ошибку доступа к файлу', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      const path = '/test/config/category-mapping.yaml';
      const result = loadYAMLContent(path);

      expect(consoleSpy).toHaveBeenCalledWith('Конфигурационный файл не найден, используем пустой объект');
      expect(result).toEqual({});

      consoleSpy.mockRestore();
    });
  });

  describe('INTEGRATION_TESTS', () => {
    it('должен корректно обработать полный workflow с кастомным путем', () => {
      const customPath = '/test/path/technology-config.yaml';

      const result = loadYAMLContent(customPath);

      expect(mockFs.readFileSync).toHaveBeenCalledWith(customPath, 'utf8');
      expect(mockYaml.load).toHaveBeenCalledWith('mock yaml content');
      expect(result).toEqual(mockCategoryMapping);
    });

    it('должен корректно обработать workflow с путем как строкой', () => {
      const path = '/test/path/config.yaml';
      const result = loadYAMLContent(path);

      expect(mockFs.readFileSync).toHaveBeenCalledWith(path, 'utf8');
      expect(mockYaml.load).toHaveBeenCalledWith('mock yaml content');
      expect(result).toEqual(mockCategoryMapping);
    });
  });
});
