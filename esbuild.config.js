const esbuild = require('esbuild');
const fs = require('fs');

async function build() {
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true });
  }

  fs.mkdirSync('./dist', { recursive: true });

  if (fs.existsSync('./config')) {
    fs.cpSync('./config', './dist/config', { recursive: true });
  }

  try {
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node16',
      format: 'cjs',
      outfile: 'dist/index.js',
      sourcemap: true,
      external: ['pg', 'gray-matter', 'marked', 'js-yaml', 'commander'],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      minify: false,
      keepNames: true
    });
    console.log('✓ Основной пакет собран');

    await esbuild.build({
      entryPoints: ['src/cli/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node16',
      format: 'cjs',
      outfile: 'dist/cli.js',
      sourcemap: true,
      external: ['pg', 'gray-matter', 'marked', 'js-yaml', 'commander'],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      minify: false,
      keepNames: true
    });

    fs.chmodSync('dist/cli.js', '755');
    console.log('✓ CLI собран');

    const { execSync } = require('child_process');
    try {
      execSync('npx tsc --emitDeclarationOnly --declaration --outDir dist', { stdio: 'inherit' });
      console.log('✓ Типы сгенерированы');
    } catch (error) {
      console.log('⚠️ Ошибка генерации типов:', error.message);
    }

    console.log('✓ Сборка завершена успешно!');
  } catch (error) {
    console.error('✗ Ошибка сборки:', error);
    process.exit(1);
  }
}

build(); 