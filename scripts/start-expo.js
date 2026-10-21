const { networkInterfaces } = require('os');
const { spawn } = require('child_process');
const path = require('path');

function pickLanIp() {
  const nets = networkInterfaces();
  const preferred = [];
  const fallback = [];

  for (const [name, entries] of Object.entries(nets)) {
    for (const net of entries || []) {
      const family = net.family === 'IPv4' || net.family === 4;
      if (!family || net.internal) {
        continue;
      }
      const lower = name.toLowerCase();
      const row = { name, address: net.address };
      if (
        lower.includes('wi-fi') ||
        lower.includes('wifi') ||
        lower.includes('wlan') ||
        lower.includes('ethernet') ||
        lower.includes('en0') ||
        lower.includes('en1')
      ) {
        preferred.push(row);
      } else if (!net.address.startsWith('172.')) {
        fallback.push(row);
      }
    }
  }

  return preferred[0]?.address || fallback[0]?.address || '127.0.0.1';
}

const mode = process.argv[2] === 'tunnel' ? 'tunnel' : 'lan';
const extra = process.argv.slice(mode === 'tunnel' ? 3 : 2);
const env = { ...process.env };
const host = pickLanIp();

if (mode === 'lan') {
  env.REACT_NATIVE_PACKAGER_HOSTNAME = host;
}

console.log('');
console.log('Enfield Royal Clinics · local Expo Go');
console.log('--------------------------------');
if (mode === 'lan') {
  console.log(`LAN URL: exp://${host}:8081`);
  console.log('');
  console.log('Each developer uses THEIR OWN PC + THEIR OWN phone.');
  console.log('Phone and this PC must be on the SAME Wi‑Fi.');
  console.log('');
  console.log('Android: Expo Go → scan QR. No Expo account needed.');
  console.log('');
  console.log('iPhone:  your Expo Go account must MATCH this PC account.');
  console.log('         1) Free account: https://expo.dev/signup');
  console.log('         2) This PC: npm run login');
  console.log('         3) iPhone Expo Go: sign in with YOUR same account');
  console.log('         4) Scan the QR (Camera or Expo Go)');
  console.log('');
  console.log('You do not need a teammate password. Use your own Expo login.');
} else {
  console.log('Prefer LAN for team work: npm start');
}
console.log('--------------------------------');
console.log('');

const args = ['expo', 'start', '--host', mode, ...extra];
const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: true,
  env,
  cwd: path.join(__dirname, '..'),
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
