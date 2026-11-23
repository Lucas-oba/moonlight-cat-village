import { existsSync } from 'node:fs';
import { defineConfig } from 'vite';

const finaleFallbacks = {
  'denbg.jpg': 'echobg.jpg',
  'mossantler_boss.png': 'mossantler_map.png',
  'sighvine_boss.png': 'thornling.png',
  'mossantler_calm.png': 'mossantler_map.png',
  'c2_thorn.png': 'c2_vine.png',
  'c2_seed.png': 'c2_sleepflower.png',
  'c2_birdhouse.png': 'house.png',
  'c2_cake.png': 'cabbage.png',
  'c2_ending.jpg': 'forestbg.jpg',
  'bgm_boss2.mp3': 'bgm_boss.mp3',
  'bgm_feast.mp3': 'bgm_roots.mp3',
};

export default defineConfig({
  define: {
    __HERO_BADGES__: JSON.stringify(Array.from({ length: 5 }, (_, tier) => existsSync(`public/assets/badge_t${tier}.png`))),
    __FINALE_FALLBACKS__: JSON.stringify(Object.fromEntries(Object.entries(finaleFallbacks)
      .filter(([file]) => !existsSync(`public/assets/${file}`)))),
  },
  base: './',
  server: { host: true },
  build: { chunkSizeWarningLimit: 2000 },
});
