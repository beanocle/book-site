// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import vue from '@astrojs/vue';

// 三语平行站点：/ja/ 为主版（日文版图书），/en/、/zh/ 平行。
// 根路径 / 不重定向，直接渲染日文首页（见 src/pages/index.astro）。
export default defineConfig({
  site: 'https://book-site.example', // 书名定后换成正式域名
  adapter: cloudflare(),
  integrations: [vue()],
  i18n: {
    locales: ['ja', 'en', 'zh'],
    defaultLocale: 'ja',
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
});
