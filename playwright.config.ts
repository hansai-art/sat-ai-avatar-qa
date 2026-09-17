import {defineConfig,devices} from '@playwright/test';
const base=(process.env.BASE_PATH||'/').replace(/\/?$/,'/');
export default defineConfig({
  testDir:'./tests/browser',fullyParallel:true,retries:process.env.CI?1:0,
  use:{baseURL:`http://localhost:4321${base}`,trace:'retain-on-failure'},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{viewport:{width:360,height:800}}}],
  webServer:{command:'npm run preview -- --host 127.0.0.1 --port 4321',url:`http://localhost:4321${base}`,reuseExistingServer:!process.env.CI},
});
