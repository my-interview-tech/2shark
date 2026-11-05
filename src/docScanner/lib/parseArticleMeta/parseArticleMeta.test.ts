import { DEFAULT_CHAPTER, parseContext, parseKind, parseLevel, resolveChapter } from './parseArticleMeta';
import { DESCRIBE_CASES } from '../../../helpers/test';
import { ChapterMapping } from '../../../types';

const CHAPTERS: ChapterMapping = {
  'Подготовка к собеседованию': { title: 'Вопросы с собеседований', anchor: 'questions', order: 1, kind: 'question' },
  Задачи: { title: 'Задачи', anchor: 'tasks', order: 2, kind: 'task' },
};

describe('Unit/lib/function/parseArticleMeta', () => {
  describe(DESCRIBE_CASES.SUCCESS, () => {
    it('Принимает тип материала из списка', () => {
      expect(parseKind('task')).toBe('task');
    });

    it('Принимает уровень 1..3', () => {
      expect(parseLevel(2)).toBe(2);
    });

    it('Собирает контекст без пустых полей', () => {
      expect(parseContext({ caption: ' Основы ', interview: '', result: ['Объяснить', '', 1] })).toEqual({
        caption: 'Основы',
        result: ['Объяснить'],
      });
    });

    it('Берёт секцию из chapters.yaml', () => {
      expect(resolveChapter({ chapter: 'Задачи', chapterMapping: CHAPTERS })).toEqual(CHAPTERS['Задачи']);
    });

    it('Переопределение технологии важнее общего маппинга', () => {
      const technologyChapters: ChapterMapping = { Задачи: { title: 'Практика', anchor: 'practice', order: 5 } };

      expect(resolveChapter({ chapter: 'Задачи', technologyChapters, chapterMapping: CHAPTERS })).toEqual(
        technologyChapters['Задачи'],
      );
    });
  });

  describe(DESCRIBE_CASES.EDGE, () => {
    it('Неизвестный chapter становится секцией в конце списка', () => {
      expect(resolveChapter({ chapter: 'Хуки', chapterMapping: CHAPTERS })).toEqual({
        title: 'Хуки',
        anchor: 'huki',
        order: DEFAULT_CHAPTER.order,
      });
    });

    it('Пустой chapter попадает в «Материалы»', () => {
      expect(resolveChapter({ chapter: '  ', chapterMapping: CHAPTERS })).toEqual(DEFAULT_CHAPTER);
    });

    it('Контекст без значимых полей отбрасывается', () => {
      expect(parseContext({ caption: '' })).toBeNull();
    });
  });

  describe(DESCRIBE_CASES.ERROR, () => {
    it('Отклоняет неизвестный тип материала', () => {
      expect(parseKind('lesson')).toBeNull();
    });

    it.each([0, 4, 1.5, '2', null])('Отклоняет уровень %p', (value) => {
      expect(parseLevel(value)).toBeNull();
    });

    it('Отклоняет контекст не-объект', () => {
      expect(parseContext(['caption'])).toBeNull();
    });
  });
});
