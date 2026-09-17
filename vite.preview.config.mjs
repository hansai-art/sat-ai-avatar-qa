import {defineConfig} from 'vite';
import {readFileSync} from 'node:fs';
const info=JSON.parse(readFileSync(new URL('./dist/build-info.json',import.meta.url),'utf8'));
export default defineConfig({root:'dist',base:info.base,server:{host:'0.0.0.0',allowedHosts:['terminal.local']}});
