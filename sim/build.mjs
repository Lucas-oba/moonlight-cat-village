import { build } from 'esbuild';
import path from 'path';
const S = path.resolve('sim/stubs');
await build({
  entryPoints: ['sim/sim.ts'], bundle: true, platform: 'node', format: 'esm', outfile: 'sim/out/sim.mjs', logLevel: 'warning', banner: { js: "globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }; globalThis.document = { addEventListener() {}, querySelector: () => null };" },
  plugins: [{ name: 'stubs', setup(b) {
    b.onResolve({ filter: /^phaser$/ }, () => ({ path: S + '/phaser.ts' }));
    b.onResolve({ filter: /\/ui\/ui$/ }, () => ({ path: S + '/ui.ts' }));
    b.onResolve({ filter: /core\/(sfx|music)$|^\.\/(sfx|music)$/ }, () => ({ path: S + '/audio.ts' }));
  } }],
});
