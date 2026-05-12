// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
  output: 'server', // Passer en mode serveur pour corriger les problèmes de routage sur Vercel
  build: {
    format: 'directory'
  }
});