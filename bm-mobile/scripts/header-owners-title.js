const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'App.js');
let s = fs.readFileSync(file, 'utf8');
let changed = false;
const oldHeader = "<Header title={selectedBuilding?.name || 'المبنى'} subtitle=\"إدارة اتحاد الملاك\" onLogout={onLogout} onBack={() => setSelectedBuilding(null)} />";
const newHeader = "<Header title={tab === 'owners' ? 'إدارة الملاك' : selectedBuilding?.name || 'المبنى'} subtitle=\"إدارة اتحاد الملاك\" onLogout={onLogout} onBack={() => setSelectedBuilding(null)} />";
if (s.includes(oldHeader)) {
  s = s.replace(oldHeader, newHeader);
  changed = true;
}
const internalTitle = "<ScreenCode code=\"#S-001\" /><SectionTitle icon=\"settings-outline\" title=\"إدارة الملاك\" />";
const noInternalTitle = "<ScreenCode code=\"#S-001\" />";
if (s.includes(internalTitle)) {
  s = s.replace(internalTitle, noInternalTitle);
  changed = true;
}
if (changed) fs.writeFileSync(file, s);
console.log(changed ? 'screen 001 header title patched' : 'no changes');
