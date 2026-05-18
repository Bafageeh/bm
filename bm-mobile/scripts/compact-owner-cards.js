const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'App.js');
let s = fs.readFileSync(file, 'utf8');
let changed = false;
function r(a, b) {
  if (s.includes(a)) {
    s = s.replace(a, b);
    changed = true;
  }
}
r("ownersScreenContent: { paddingTop: 58 }", "ownersScreenContent: { paddingTop: 44 }");
r("ownerCard: { backgroundColor: '#fff', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' }", "ownerCard: { backgroundColor: '#fff', borderRadius: 17, padding: 9, borderWidth: 1, borderColor: '#e2e8f0' }");
r("ownerTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }", "ownerTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 }");
r("ownerAvatar: { width: 42, height: 42, borderRadius: 16, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }", "ownerAvatar: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }");
r("badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }", "badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }");
r("badgeText: { color: '#0f172a', fontWeight: '800', fontSize: 11 }", "badgeText: { color: '#0f172a', fontWeight: '800', fontSize: 10 }");
r("badgeSurplus: { backgroundColor: '#dcfce7' }", "badgeSurplus: { backgroundColor: '#dcfce7', transform: [{ translateX: 50 }] }");
r("badgeSurplus: { backgroundColor: '#dcfce7', transform: [{ translateX: 50 }] }", "badgeSurplus: { backgroundColor: '#dcfce7', transform: [{ translateX: 50 }] }");
r("ownerAmounts: { flexDirection: 'row-reverse', gap: 8, marginTop: 12, flexWrap: 'wrap' }", "ownerAmounts: { flexDirection: 'row-reverse', gap: 6, marginTop: 7, flexWrap: 'wrap' }");
r("smallAmount: { flexGrow: 1, minWidth: '45%', backgroundColor: '#f8fafc', borderRadius: 16, padding: 10 }", "smallAmount: { flexGrow: 1, minWidth: '45%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 6 }");
r("smallTitle: { fontSize: 11, color: '#64748b', textAlign: 'right' }", "smallTitle: { fontSize: 10, color: '#64748b', textAlign: 'right' }");
r("smallValue: { fontSize: 13, color: '#0f172a', fontWeight: '900', textAlign: 'right', marginTop: 4 }", "smallValue: { fontSize: 12, color: '#0f172a', fontWeight: '900', textAlign: 'right', marginTop: 2 }");
r("manageOwnerCard: { marginBottom: 12, backgroundColor: '#fff', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' }", "manageOwnerCard: { marginBottom: 7, backgroundColor: '#fff', borderRadius: 18, padding: 6, borderWidth: 1, borderColor: '#e2e8f0' }");
r("ownerMetaRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap', paddingHorizontal: 4, paddingTop: 8 }", "ownerMetaRow: { flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap', paddingHorizontal: 3, paddingTop: 4 }");
r("ownerMeta: { fontSize: 11, color: '#64748b', textAlign: 'right' }", "ownerMeta: { fontSize: 10, color: '#64748b', textAlign: 'right' }");
r("actionsRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 10 }", "actionsRow: { flexDirection: 'row-reverse', gap: 6, marginTop: 6 }");
r("actionBtn: { flex: 1, height: 42, borderRadius: 14, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 6 }", "actionBtn: { flex: 1, height: 33, borderRadius: 11, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 5 }");
r("actionText: { color: '#0f766e', fontWeight: '900', fontSize: 13 }", "actionText: { color: '#0f766e', fontWeight: '900', fontSize: 12 }");
r("ownerFloatingAdd: { position: 'absolute', top: 10, left: 16, width: 54, height: 54, borderRadius: 27, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.18, shadowRadius: 14, elevation: 8, zIndex: 10 }", "ownerFloatingAdd: { position: 'absolute', top: 8, left: 16, width: 46, height: 46, borderRadius: 23, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.18, shadowRadius: 11, elevation: 8, zIndex: 10 }");
if (changed) fs.writeFileSync(file, s);
console.log(changed ? 'compact cards and surplus badge position applied' : 'no changes');
