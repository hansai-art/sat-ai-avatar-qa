import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url),args=process.argv.slice(2);
// 受管理的預覽使用 Vite 供應已建置產物，才能驗證真實 Pagefind；一般開發保留 Astro HMR。
const managed=args.includes('--strictPort');
const pkg=managed?'vite':'astro';
const location=require.resolve(pkg+'/package.json');
const meta=require(location);
const bin=typeof meta.bin==='string'?meta.bin:meta.bin[pkg];
const result=spawnSync(process.execPath,[path.join(path.dirname(location),bin),...(managed?['--config','vite.preview.config.mjs']:['dev']),...args],{stdio:'inherit',env:{...process.env,BUILD_MODE:process.env.BUILD_MODE||'demo'}});
process.exit(result.status||0);
