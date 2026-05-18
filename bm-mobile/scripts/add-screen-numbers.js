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
];

for (const [from, to] of replacements) {
  replaceFragment(from, to);
}

fs.writeFileSync(appPath, content);
console.log(`Compact card spacing applied without reducing fonts: ${applied} replacement(s)`);
