import { defineConfig } from 'tsup'

// One config for all three entries: tsup preserves each source file's
// 'use client' directive in its own output.
export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    client: 'src/client.tsx',
    frontend: 'src/frontend.tsx',
    index: 'src/index.ts',
  },
  format: ['esm'],
  sourcemap: true,
})
