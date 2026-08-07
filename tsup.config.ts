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
    // Client components: tsup strips directives during bundling, so the
    // banner puts 'use client' back at the top of each output file.
    banner: { js: "'use client'" },
    dts: true,
    entry: { client: 'src/client.tsx', frontend: 'src/frontend.tsx' },
    format: ['esm'],
    sourcemap: true,
  },
])
