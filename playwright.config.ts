import {defineConfig,devices} from '@playwright/test';
const base=(process.env.BASE_PATH||'/').replace(/\/?$/,'/');
const remote=process.env.VERIFY_URL;
const baseURL=remote?remote.replace(/\/?$/,'/'):`http://127.0.0.1:4321${base}`;
export default defineConfig({
  testDir:'./tests/browser',fullyParallel:true,retries:process.env.CI?1:0,
  use:{baseURL,trace:'retain-on-failure'},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{viewport:{width:360,height:800}}}],
  webServer:remote?undefined:{command:'npm run preview -- --ignore-lock --host 127.0.0.1 --port 4321',url:baseURL,reuseExistingServer:!process.env.CI},
});
