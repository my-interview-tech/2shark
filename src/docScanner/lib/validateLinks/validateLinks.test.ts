import { validateLinks } from './validateLinks';
import { DESCRIBE_CASES } from '../../../helpers';

describe('Unit/lib/function/validateLinks', () => {
  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Возвращает валидные HTTP и HTTPS ссылки', () => {
      const links = [
        'https://habr.com/ru/post/461401/',
        'http://example.com/article',
        'https://github.com/user/repo',
        'http://localhost:3000',
      ];

      const result = validateLinks(links);

      expect(result).toEqual([
        'https://habr.com/ru/post/461401/',
        'http://example.com/article',
        'https://github.com/user/repo',
        'http://localhost:3000',
      ]);
    });

    it('Возвращает только валидные ссылки, фильтруя невалидные', () => {
      const links = [
        'https://habr.com/ru/post/461401/',
        '[[062 Событийный цикл. Микрозадачи и макрозадачи|Событийный цикл? Микрозадачи и макрозадачи]]',
        'https://github.com/user/repo',
        '[[071 Объяснение работы EventLoop в JavaScript|Объяснение работы EventLoop в JavaScript]]',
        'ftp://example.com/file',
        'mailto:user@example.com',
      ];

      const result = validateLinks(links);

      expect(result).toEqual(['https://habr.com/ru/post/461401/', 'https://github.com/user/repo']);
    });

    it('Возвращает ссылки с пробелами, обрезая их', () => {
      const links = ['https://habr.com/ru/post/461401/', 'http://example.com/article', '  [[internal link]]  '];

      const result = validateLinks(links);

      expect(result).toEqual(['https://habr.com/ru/post/461401/', 'http://example.com/article']);
    });

    it('Возвращает ссылки с параметрами и якорями', () => {
      const links = [
        'https://example.com/article?id=123&type=guide',
        'https://github.com/user/repo#readme',
        'http://localhost:3000/api/v1/users?page=1&limit=10',
      ];

      const result = validateLinks(links);

      expect(result).toEqual([
        'https://example.com/article?id=123&type=guide',
        'https://github.com/user/repo#readme',
        'http://localhost:3000/api/v1/users?page=1&limit=10',
      ]);
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Возвращает пустой массив для пустого массива', () => {
      const result = validateLinks([]);

      expect(result).toEqual([]);
    });

    it('Возвращает пустой массив для не массива', () => {
      const result = validateLinks('not an array' as any);

      expect(result).toEqual([]);
    });

    it('Возвращает ссылки с Unicode символами', () => {
      const links = [
        'https://example.com/статья-на-русском',
        'http://example.com/文章-中文',
        'https://github.com/user/репозиторий',
      ];

      const result = validateLinks(links);

      expect(result).toEqual([
        'https://example.com/статья-на-русском',
        'http://example.com/文章-中文',
        'https://github.com/user/репозиторий',
      ]);
    });

    it('Возвращает очень длинные ссылки', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000);
      const links = [longUrl];

      const result = validateLinks(links);

      expect(result).toEqual([longUrl]);
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('Возвращает пустой массив для undefined', () => {
      const result = validateLinks(undefined);

      expect(result).toEqual([]);
    });

    it('Возвращает пустой массив для null', () => {
      const result = validateLinks(null as any);

      expect(result).toEqual([]);
    });

    it('Возвращает пустой массив для невалидных URL', () => {
      const links = ['not-a-url', 'https://', 'http://', '://example.com', 'example.com', 'www.example.com'];

      const result = validateLinks(links);

      expect(result).toEqual([]);
    });

    it('Возвращает ссылки с экранированными символами', () => {
      const links = [
        'https://example.com/path%20with%20spaces',
        'http://example.com/path%2Fwith%2Fslashes',
        'https://example.com/path%3Fwith%3Dparams',
      ];

      const result = validateLinks(links);

      expect(result).toEqual([
        'https://example.com/path%20with%20spaces',
        'http://example.com/path%2Fwith%2Fslashes',
        'https://example.com/path%3Fwith%3Dparams',
      ]);
    });
  });
});
