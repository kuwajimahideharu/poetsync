import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian'],
  format: 'cjs',
  outfile: 'dist/main.js',
  platform: 'node',
}).catch(() => process.exit(1));
