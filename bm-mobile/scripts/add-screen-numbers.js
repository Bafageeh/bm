const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let code = fs.readFileSync(appPath, 'utf8');

function replaceOnce(search, replacement, label) {
  if (code.includes(replacement)) {
    console.log(`${label}: already patched.`);
    return;
  }
  if (!code.includes(search)) {
    throw new Error(`${label}: pattern not found.`);
  }
  code = code.replace(search, replacement);
  console.log(`${label}: patched.`);
}

replaceOnce(
  '<ScreenCode code="#S-001" />{(owners || []).length === 0 ?',
  '<ScreenCode code="#S-002" />{(owners || []).length === 0 ?',
  'Owners screen number'
);

replaceOnce(
  '<Text style={styles.screenCodeText}>#S-004</Text><Text style={styles.floatingFormTitle}>{title}</Text>',
  '<Text style={styles.screenCodeText}>{title === \'إضافة مصروف\' ? \'#S-010\' : \'#S-011\'}</Text><Text style={styles.floatingFormTitle}>{title}</Text>',
  'Expense modal screen numbers'
);

replaceOnce(
  "<Text style={styles.screenCodeText}>{editingOwner ? '#S-006' : '#S-005'}</Text><Text style={styles.floatingFormTitle}>{editingOwner ? 'تعديل بيانات المالك' : 'إضافة مالك'}</Text>",
  "<Text style={styles.screenCodeText}>{editingOwner ? '#S-009' : '#S-008'}</Text><Text style={styles.floatingFormTitle}>{editingOwner ? 'تعديل بيانات المالك' : 'إضافة مالك'}</Text>",
  'Owner form modal screen numbers'
);

replaceOnce(
  '<ScreenCode code="#S-009" /><Dashboard dashboard={{ building: profile.building, stats: {}, owners: [profile.summary] }} />',
  '<ScreenCode code="#S-012" /><Dashboard dashboard={{ building: profile.building, stats: {}, owners: [profile.summary] }} />',
  'Owner account screen number'
);

const used = [...code.matchAll(/#S-\d{3}/g)].map((match) => match[0]);
const duplicated = [...new Set(used.filter((value, index) => used.indexOf(value) !== index))];

if (duplicated.length) {
  throw new Error(`Duplicate screen numbers found: ${duplicated.join(', ')}`);
}

fs.writeFileSync(appPath, code);
console.log(`Screen numbering verified. ${used.length} unique screen numbers: ${used.join(', ')}`);
