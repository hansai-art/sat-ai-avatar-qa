import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import safety from './scripts/remark-safety.mjs';
import {normalizeBase} from './src/lib/paths.mjs';
export default defineConfig({
  output:'static', site:process.env.SITE_URL || 'http://localhost:4321',
  base:normalizeBase(process.env.BASE_PATH || '/'),trailingSlash:'always',
  markdown:{processor:unified({remarkPlugins:[safety]})},
  devToolbar:{enabled:false},
});
