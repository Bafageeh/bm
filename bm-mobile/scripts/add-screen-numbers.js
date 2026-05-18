const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let content = fs.readFileSync(appPath, 'utf8');
let applied = 0;

function replaceFragment(from, to) {
  if (content.includes(from)) {
    content = content.split(from).join(to);
    applied += 1;
  }
}

function replaceRegex(pattern, to) {
  if (pattern.test(content)) {
    content = content.replace(pattern, to);
    applied += 1;
  }
}

const replacements = [
  [
    `screenContent: { padding: 16, paddingBottom: 110 }`,
    `screenContent: { padding: 12, paddingBottom: 96 }`,
  ],
  [
    `ownersScreenContent: { paddingTop: 58 }`,
    `ownersScreenContent: { paddingTop: 46 }`,
  ],
  [
    `sectionTitle: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginTop: 18, marginBottom: 10 }`,
    `sectionTitle: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginTop: 12, marginBottom: 7 }`,
  ],
  [
    `ownerCard: { backgroundColor: '#fff', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' }`,
    `ownerCard: { backgroundColor: '#fff', borderRadius: 18, padding: 9, borderWidth: 1, borderColor: '#e2e8f0' }`,
  ],
  [
    `ownerTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }`,
    `ownerTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }`,
  ],
  [
    `ownerAvatar: { width: 42, height: 42, borderRadius: 16, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }`,
    `ownerAvatar: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }`,
  ],
  [
    `badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }`,
    `badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }`,
  ],
  [
    `ownerAmounts: { flexDirection: 'row-reverse', gap: 8, marginTop: 12, flexWrap: 'wrap' }`,
    `ownerAmounts: { flexDirection: 'row-reverse', gap: 6, marginTop: 8, flexWrap: 'wrap' }`,
  ],
  [
    `smallAmount: { flexGrow: 1, minWidth: '45%', backgroundColor: '#f8fafc', borderRadius: 16, padding: 10 }`,
    `smallAmount: { flexGrow: 1, minWidth: '45%', backgroundColor: '#f8fafc', borderRadius: 13, paddingHorizontal: 8, paddingVertical: 7 }`,
  ],
  [
    `manageOwnerCard: { marginBottom: 12, backgroundColor: '#fff', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' }`,
    `manageOwnerCard: { marginBottom: 8, backgroundColor: '#fff', borderRadius: 19, padding: 6, borderWidth: 1, borderColor: '#e2e8f0' }`,
  ],
  [
    `ownerMetaRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap', paddingHorizontal: 4, paddingTop: 8 }`,
    `ownerMetaRow: { flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap', paddingHorizontal: 2, paddingTop: 5 }`,
  ],
  [
    `actionsRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 10 }`,
    `actionsRow: { flexDirection: 'row-reverse', gap: 6, marginTop: 7 }`,
  ],
  [
    `actionBtn: { flex: 1, height: 42, borderRadius: 14, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 6 }`,
    `actionBtn: { flex: 1, height: 38, borderRadius: 12, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 6 }`,
  ],
  [
    `<ScreenCode code="#S-004" /><SectionTitle icon="receipt-outline" title="إجمالي المصروفات حسب التصنيف" />{groupedExpenses.length === 0 ?`,
    `<ScreenCode code="#S-004" />{groupedExpenses.length === 0 ?`,
  ],
  [
    `<Header title={tab === 'owners' ? 'إدارة الملاك' : selectedBuilding?.name || 'المبنى'} subtitle="إدارة اتحاد الملاك" onLogout={onLogout} onBack={() => setSelectedBuilding(null)} />`,
    `<Header title={tab === 'owners' ? 'إدارة الملاك' : tab === 'expenses' ? 'المصروفات' : selectedBuilding?.name || 'المبنى'} subtitle="إدارة اتحاد الملاك" onLogout={onLogout} onBack={() => setSelectedBuilding(null)} />`,
  ],
  [
    `<Header title="حسابي" subtitle={user.name} onLogout={onLogout} />`,
    `<Header title="المصروفات" subtitle={user.name} onLogout={onLogout} />`,
  ],
  [
    `<ScreenCode code="#S-009" /><Dashboard dashboard={{ building: profile.building, stats: {}, owners: [profile.summary] }} /><SectionTitle icon="receipt-outline" title="تفصيل نصيبك من المصروفات" />`,
    `<ScreenCode code="#S-012" /><Dashboard dashboard={{ building: profile.building, stats: {}, owners: [profile.summary] }} />`,
  ],
];

for (const [from, to] of replacements) {
  replaceFragment(from, to);
}

// Extra resilient patches for the owner-account expenses screen if the file was reformatted.
replaceRegex(/<Header title="حسابي" subtitle=\{user\.name\} onLogout=\{onLogout\} \/>/g, `<Header title="المصروفات" subtitle={user.name} onLogout={onLogout} />`);
replaceRegex(/<ScreenCode code="#S-009" \/>/g, `<ScreenCode code="#S-012" />`);
replaceRegex(/<SectionTitle icon="receipt-outline" title="تفصيل نصيبك من المصروفات" \/>/g, ``);

fs.writeFileSync(appPath, content);
console.log(`BM mobile post-deploy UI patches applied: ${applied} replacement(s)`);
