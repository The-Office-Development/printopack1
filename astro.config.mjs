import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.printopack.com.sa',
  // Static output — ships plain HTML/CSS/JS. No server, no maintenance for the client.
  integrations: [sitemap({ filter: (page) => !page.includes('/admin') })],
});
