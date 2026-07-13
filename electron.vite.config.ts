import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { createReadStream } from 'node:fs';
import { cp, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, normalize, relative } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

const require = createRequire(import.meta.url);
const pdfjsRoot = dirname(require.resolve('pdfjs-dist/package.json'));
const pdfjsAssetDirectories = ['cmaps', 'standard_fonts', 'wasm'] as const;

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [react(), pdfjsAssetsPlugin()],
  },
});

function pdfjsAssetsPlugin(): Plugin {
  let resolvedConfig: ResolvedConfig;

  return {
    name: 'exam-zh-gui-pdfjs-assets',
    configResolved(config) {
      resolvedConfig = config;
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestPath = new URL(request.url ?? '/', 'http://localhost').pathname;

        if (!requestPath.startsWith('/pdfjs/')) {
          next();
          return;
        }

        const relativeAssetPath = decodeURIComponent(requestPath.replace(/^\/pdfjs\//, ''));
        const filePath = resolvePdfjsAssetPath(relativeAssetPath);

        if (!filePath) {
          response.statusCode = 404;
          response.end('Not found');
          return;
        }

        try {
          const fileInfo = await stat(filePath);

          if (!fileInfo.isFile()) {
            response.statusCode = 404;
            response.end('Not found');
            return;
          }

          response.setHeader('Content-Type', contentTypeFor(filePath));
          createReadStream(filePath).pipe(response);
        } catch {
          response.statusCode = 404;
          response.end('Not found');
        }
      });
    },
    async writeBundle() {
      const outDir = resolvedConfig.build.outDir;

      await Promise.all(
        pdfjsAssetDirectories.map((directory) =>
          cp(join(pdfjsRoot, directory), join(outDir, 'pdfjs', directory), {
            recursive: true,
          }),
        ),
      );
    },
  };
}

function resolvePdfjsAssetPath(relativeAssetPath: string): string | null {
  const normalizedPath = normalize(relativeAssetPath);
  const [directory] = normalizedPath.split('/');

  if (!pdfjsAssetDirectories.includes(directory as (typeof pdfjsAssetDirectories)[number])) {
    return null;
  }

  const filePath = join(pdfjsRoot, normalizedPath);

  if (relative(pdfjsRoot, filePath).startsWith('..')) {
    return null;
  }

  return filePath;
}

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith('.wasm')) {
    return 'application/wasm';
  }

  if (filePath.endsWith('.ttf')) {
    return 'font/ttf';
  }

  return 'application/octet-stream';
}
