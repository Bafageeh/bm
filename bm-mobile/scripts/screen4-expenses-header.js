const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let code = fs.readFileSync(appPath, 'utf8');

const target = `<Header title={tab === 'owners' ? 'إدارة الملاك' : selectedBuilding?.name || 'المبنى'} subtitle="إدارة اتحاد الملاك" onLogout={onLogout} onBack={() => setSelectedBuilding(null)} />`;
const replacement = `<Header title={tab === 'owners' ? 'إدارة الملاك' : tab === 'expenses' ? 'المصروفات' : selectedBuilding?.name || 'المبنى'} subtitle={tab === 'expenses' ? selectedBuilding?.name || 'المبنى' : 'إدارة اتحاد الملاك'} onLogout={onLogout} onBack={() => setSelectedBuilding(null)} />`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(appPath, code);
  console.log('Screen 4 expenses header title patched.');
} else if (code.includes(replacement)) {
  console.log('Screen 4 expenses header title already patched.');
} else {
  throw new Error('Could not find AppShell Header pattern for screen 4 expenses header patch.');
}
