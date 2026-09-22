import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@exifguard/seed-profiles': path.resolve(__dirname, '../../packages/seed-profiles/src/index.ts'),
      '@exifguard/coherency-engine': path.resolve(__dirname, '../../packages/coherency-engine/src/index.ts'),
      '@exifguard/wasm-exif': path.resolve(__dirname, '../../packages/wasm-exif/src/index.ts'),
      '@exifguard/database-schema': path.resolve(__dirname, '../../packages/database-schema/src/index.ts')
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
