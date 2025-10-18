import { slugify } from './slugify';

describe('Unit/utility/function/slugify', () => {
  describe('SUCCESS_CASES', () => {
    it.each([
      ['Hello World', 'hello-world'],
      ['React Hooks & TypeScript!', 'react-hooks-typescript'],
      ['React 18 Features', 'react-18-features'],
      ['React   Hooks   Guide', 'react-hooks-guide'],
      ['React-Hooks-Guide', 'react-hooks-guide'],
      ['React_Hooks_Guide', 'react-hooks-guide'],
      ['my.file.name', 'my-file-name'],
      ['user_name_test', 'user-name-test'],
      ['a'.repeat(150), 'a'.repeat(100)],
    ])('должен преобразовать "%s" в "%s"', (input, expected) => {
      expect(slugify(input)).toBe(expected);
    });

    // Реальные примеры URL из документации
    it.each([
      // React документация
      ['Getting Started with React', 'getting-started-with-react'],
      ['React.Component', 'react-component'],
      ['useState Hook', 'usestate-hook'],
      ['Context API', 'context-api'],

      // TypeScript документация
      ['TypeScript Handbook', 'typescript-handbook'],
      ['Advanced Types', 'advanced-types'],
      ['Utility Types', 'utility-types'],
      ['Declaration Files', 'declaration-files'],

      // Node.js документация
      ['Node.js API Reference', 'node-js-api-reference'],
      ['File System Module', 'file-system-module'],
      ['HTTP Module', 'http-module'],
      ['Event Emitter', 'event-emitter'],

      // Vue.js документация
      ['Vue 3 Composition API', 'vue-3-composition-api'],
      ['Vue Router 4', 'vue-router-4'],
      ['Vuex State Management', 'vuex-state-management'],

      // Angular документация
      ['Angular Components', 'angular-components'],
      ['Angular Services', 'angular-services'],
      ['Angular Routing', 'angular-routing'],

      // Блог посты
      ['How to Build a REST API with Express.js', 'how-to-build-a-rest-api-with-express-js'],
      ['10 Tips for Better JavaScript Code', '10-tips-for-better-javascript-code'],
      ['Understanding Async/Await in JavaScript', 'understanding-async-await-in-javascript'],
      ['CSS Grid vs Flexbox: When to Use What?', 'css-grid-vs-flexbox-when-to-use-what'],

      // Технические статьи
      ['Microservices Architecture Patterns', 'microservices-architecture-patterns'],
      ['Docker Containerization Best Practices', 'docker-containerization-best-practices'],
      ['Kubernetes Deployment Strategies', 'kubernetes-deployment-strategies'],
      ['CI/CD Pipeline with GitHub Actions', 'ci-cd-pipeline-with-github-actions'],

      // Файлы и папки
      ['README', 'readme'],
      ['package.json', 'package-json'],
      ['tsconfig.json', 'tsconfig-json'],
      ['webpack.config.js', 'webpack-config-js'],
      ['src/components/Button.tsx', 'src-components-button-tsx'],
      ['docs/api/endpoints', 'docs-api-endpoints'],

      // Специальные символы
      ['C++ Programming', 'c-programming'],
      ['C# Development', 'c-development'],
      ['F# Functional Programming', 'f-functional-programming'],
      ['R Programming Language', 'r-programming-language'],

      // Числа и даты
      ['2024 JavaScript Trends', '2024-javascript-trends'],
      ['React 18 vs React 17', 'react-18-vs-react-17'],
      ['Node.js 20 Features', 'node-js-20-features'],
      ['TypeScript 5.0 Release Notes', 'typescript-5-0-release-notes'],
    ])('должен создать URL-friendly slug для "%s"', (input, expected) => {
      expect(slugify(input)).toBe(expected);
    });
  });

  describe('EDGE_CASES', () => {
    it.each([
      ['React Хуки', 'react'],
      ['React 🚀 Hooks', 'react-hooks'],
      ['-React-Hooks-', 'react-hooks'],
      ['React--Hooks--Guide', 'react-hooks-guide'],
    ])('должен обработать "%s" как "%s"', (input, expected) => {
      expect(slugify(input)).toBe(expected);
    });

    it('должен обработать строку с кастомным fallback', () => {
      expect(slugify('', 'custom-fallback')).toBe('custom-fallback');
    });

    it('должен обработать null как fallback', () => {
      expect(slugify(null as any)).toBe('default');
    });

    it('должен обработать undefined как fallback', () => {
      expect(slugify(undefined as any)).toBe('default');
    });

    it('должен обработать не-строку как fallback', () => {
      expect(slugify(123 as any)).toBe('default');
    });

    // Тесты для useId fallback
    it('должен генерировать уникальный ID с useId fallback', () => {
      const result1 = slugify('', 'useId');
      const result2 = slugify('', 'useId');

      expect(result1).toMatch(/^useId-[a-z0-9]{8}$/);
      expect(result2).toMatch(/^useId-[a-z0-9]{8}$/);
      expect(result1).not.toBe(result2); // Должны быть разные
    });

    it('должен генерировать уникальный ID для пустых строк с useId', () => {
      const result = slugify('   ', 'useId');
      expect(result).toMatch(/^useId-[a-z0-9]{8}$/);
    });

    it('должен генерировать уникальный ID для специальных символов с useId', () => {
      const result = slugify('!@#$%^&*()', 'useId');
      expect(result).toMatch(/^useId-[a-z0-9]{8}$/);
    });
  });

  describe('ERROR_CASES', () => {
    it.each([
      ['', 'default'],
      ['!@#$%^&*()', 'default'],
    ])('должен вернуть fallback для "%s"', (input, expected) => {
      expect(slugify(input)).toBe(expected);
    });
  });

  describe('REAL_WORLD_EXAMPLES', () => {
    it('должен обработать названия статей из Medium', () => {
      expect(slugify('Why I Switched from Angular to React')).toBe('why-i-switched-from-angular-to-react');
      expect(slugify('The Complete Guide to TypeScript')).toBe('the-complete-guide-to-typescript');
      expect(slugify('10 JavaScript Interview Questions')).toBe('10-javascript-interview-questions');
    });

    it('должен обработать названия документации MDN', () => {
      expect(slugify('JavaScript Reference')).toBe('javascript-reference');
      expect(slugify('CSS Grid Layout')).toBe('css-grid-layout');
      expect(slugify('Web APIs')).toBe('web-apis');
    });

    it('должен обработать названия курсов', () => {
      expect(slugify('React Fundamentals')).toBe('react-fundamentals');
      expect(slugify('Advanced JavaScript Concepts')).toBe('advanced-javascript-concepts');
      expect(slugify('Full-Stack Development')).toBe('full-stack-development');
    });

    it('должен обработать названия конференций', () => {
      expect(slugify('React Conf 2024')).toBe('react-conf-2024');
      expect(slugify('JSConf EU 2023')).toBe('jsconf-eu-2023');
      expect(slugify('Node.js Interactive')).toBe('node-js-interactive');
    });
  });

  describe('UNIQUENESS_TESTS', () => {
    it('должен генерировать уникальные хеши', () => {
      const hashes = new Set();
      for (let i = 0; i < 1000; i++) {
        const hash = slugify('', 'useId');
        expect(hash).toMatch(/^useId-[a-z0-9]{8}$/);
        hashes.add(hash);
      }
      // Все хеши должны быть уникальными
      expect(hashes.size).toBe(1000);
    });

    it('должен создавать уникальные slug с хешем', () => {
      const slug1 = slugify('React Hooks Guide', 'default', { addHash: true });
      const slug2 = slugify('React Hooks Guide', 'default', { addHash: true });

      expect(slug1).toMatch(/^react-hooks-guide-[a-z0-9]{8}$/);
      expect(slug2).toMatch(/^react-hooks-guide-[a-z0-9]{8}$/);
      expect(slug1).not.toBe(slug2); // Должны быть разные
    });

    it('должен обрабатывать коллизии с хешем', () => {
      const slug1 = slugify('React Hooks Guide', 'default', { addHash: true });
      const slug2 = slugify('React Hooks Guide!', 'default', { addHash: true });
      const slug3 = slugify('React Hooks Guide?', 'default', { addHash: true });

      // Без хеша все были бы одинаковыми
      expect(slug1).not.toBe(slug2);
      expect(slug2).not.toBe(slug3);
      expect(slug1).not.toBe(slug3);
    });

    it('должен поддерживать кастомную длину хеша', () => {
      const slug = slugify('Test', 'default', { addHash: true, hashLength: 4 });
      expect(slug).toMatch(/^test-[a-z0-9]{4}$/);
    });

    it('должен создавать уникальные ID для одинаковых путей', () => {
      // Симулируем разные файлы с одинаковыми именами
      const id1 = slugify('frontend-react-hooks', 'default', { addHash: true });
      const id2 = slugify('frontend-react-hooks', 'default', { addHash: true });

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^frontend-react-hooks-[a-z0-9]{8}$/);
      expect(id2).toMatch(/^frontend-react-hooks-[a-z0-9]{8}$/);
    });
  });
});
