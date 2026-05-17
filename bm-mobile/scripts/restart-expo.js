const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const isServer = cwd.includes('/home/pmsa/apps/bm/bm-mobile') || cwd.includes('/mnt/home-storage/home/pmsa/apps/bm/bm-mobile');

if (!isServer || process.env.BM_SKIP_EXPO_RESTART === '1') {
  process.exit(0);
}

const logPath = '/home/pmsa/apps/bm-expo-8084.log';
const cacheDir = '/home/pmsa/apps/.cache';
const tmpDir = '/home/pmsa/apps/.tmp';

for (const dir of [cacheDir, tmpDir]) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
}

try {
  execSync("lsof -tiTCP:8084 -sTCP:LISTEN | xargs -r kill -9", { stdio: 'ignore', shell: '/bin/bash' });
} catch (_) {}

const out = fs.openSync(logPath, 'a');
const env = {
  ...process.env,
  BROWSER: 'none',
  EXPO_NO_TELEMETRY: '1',
  REACT_NATIVE_PACKAGER_HOSTNAME: 'bm.pm.sa',
  XDG_CACHE_HOME: cacheDir,
  TMPDIR: tmpDir,
  TMP: tmpDir,
  TEMP: tmpDir,
};

const child = spawn('npx', ['expo', 'start', '--clear', '--go', '--host', 'lan', '--port', '8084'], {
  cwd,
  env,
  detached: true,
  stdio: ['ignore', out, out],
});

child.unref();
console.log('BM Expo restart requested on port 8084');
