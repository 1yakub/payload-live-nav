import { defineConfig } from 'tsup'

export default defineConfig([
  {
    clean: true,
    dts: true,
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    sourcemap: true,
  },
  {
    // tsup preserves the 'use client' directives from the sources.
    dts: true,
    entry: { client: 'src/client.tsx', frontend: 'src/frontend.tsx' },
    format: ['esm'],
    sourcemap: true,
  },
])
