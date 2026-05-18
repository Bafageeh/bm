const fs = require('fs');
const path = require('path');
const appPath = path.join(__dirname, '..', 'App.js');
let s = fs.readFileSync(appPath, 'utf8');
let changed = false;
const apply = (from, to) => {
  if (s.includes(to)) return;
  if (!s.includes(from)) return console.warn('missing patch target');
  s = s.replace(from, to);
  changed = true;
};

apply(
  'function OwnersScreen({ token, buildingId, owners, reload }) {',
  'function OwnersScreen({ token, buildingId, owners, reload, setTab, setInitialPaymentOwnerId }) {'
);
apply(
  'const [form, setForm] = useState(emptyOwnerForm); const [editingOwner, setEditingOwner] = useState(null); const [loading, setLoading] = useState(false); const [deletingId, setDeletingId] = useState(null); const [ownerFormVisible, setOwnerFormVisible] = useState(false);',
  'const [form, setForm] = useState(emptyOwnerForm); const [editingOwner, setEditingOwner] = useState(null); const [loading, setLoading] = useState(false); const [deletingId, setDeletingId] = useState(null); const [ownerFormVisible, setOwnerFormVisible] = useState(false); const [openOwnerMenuId, setOpenOwnerMenuId] = useState(null);'
);
apply(
  "const resetForm = () => { setForm(emptyOwnerForm); setEditingOwner(null); setOwnerFormVisible(false); };",
  "const resetForm = () => { setForm(emptyOwnerForm); setEditingOwner(null); setOwnerFormVisible(false); setOpenOwnerMenuId(null); };"
);
apply(
  "const startEdit = (owner) => { setEditingOwner(owner);",
  "const startEdit = (owner) => { setOpenOwnerMenuId(null); setEditingOwner(owner);"
);
apply(
  "const remove = async (owner) => { try { setDeletingId(owner.id);",
  "const remove = async (owner) => { try { setOpenOwnerMenuId(null); setDeletingId(owner.id);"
);
apply(
  "const remove = async (owner) => { try { setOpenOwnerMenuId(null); setDeletingId(owner.id); await request(`/buildings/${buildingId}/owners/${owner.id}`, { method: 'DELETE' }, token); await reload(); } catch (e) { Alert.alert('تعذر حذف المالك', e.message); } finally { setDeletingId(null); } };",
  "const remove = async (owner) => { try { setOpenOwnerMenuId(null); setDeletingId(owner.id); await request(`/buildings/${buildingId}/owners/${owner.id}`, { method: 'DELETE' }, token); await reload(); } catch (e) { Alert.alert('تعذر حذف المالك', e.message); } finally { setDeletingId(null); } }; const openOwnerPayments = (owner) => { setOpenOwnerMenuId(null); setInitialPaymentOwnerId?.(owner.id); setTab?.('payments'); };"
);

const oldCards = /\{\(owners \|\| \[\]\)\.map\(\(owner\) => <View key=\{owner\.id\} style=\{styles\.manageOwnerCard\}><OwnerCard owner=\{owner\} \/><View style=\{styles\.ownerMetaRow\}>[\s\S]*?<\/View><\/View>\)\}/;
const newCards = "{(owners || []).map((owner) => <View key={owner.id} style={[styles.manageOwnerCard, styles.manageOwnerCardWithMenu]}><Pressable onPress={() => setOpenOwnerMenuId(openOwnerMenuId === owner.id ? null : owner.id)} style={({ pressed }) => [styles.ownerCardMenuButton, pressed && styles.pressed]}><Ionicons name=\"ellipsis-vertical\" size={20} color=\"#0f172a\" /></Pressable>{openOwnerMenuId === owner.id ? <View style={styles.ownerCardMenu}><Pressable style={({ pressed }) => [styles.ownerCardMenuItem, pressed && styles.pressed]} onPress={() => startEdit(owner)}><Ionicons name=\"create-outline\" size={18} color=\"#0f766e\" /><Text style={styles.ownerCardMenuText}>تعديل</Text></Pressable><Pressable style={({ pressed }) => [styles.ownerCardMenuItem, pressed && styles.pressed]} onPress={() => Alert.alert('حذف المالك', `هل تريد حذف ${owner.name}؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => remove(owner) }])} disabled={deletingId === owner.id}>{deletingId === owner.id ? <ActivityIndicator size=\"small\" color=\"#ef4444\" /> : <Ionicons name=\"trash-outline\" size={18} color=\"#ef4444\" />}<Text style={[styles.ownerCardMenuText, styles.deleteText]}>حذف</Text></Pressable><Pressable style={({ pressed }) => [styles.ownerCardMenuItem, pressed && styles.pressed]} onPress={() => openOwnerPayments(owner)}><Ionicons name=\"wallet-outline\" size={18} color=\"#0f766e\" /><Text style={styles.ownerCardMenuText}>الدفعات</Text></Pressable></View> : null}<OwnerCard owner={owner} /><View style={styles.ownerMetaRow}><Text style={styles.ownerMeta}>الدخول: {owner.login || owner.national_id || owner.phone || '-'}</Text><Text style={styles.ownerMeta}>الجوال: {owner.phone || '-'}</Text></View></View>)}";
if (!s.includes('ownerCardMenuButton') && oldCards.test(s)) { s = s.replace(oldCards, newCards); changed = true; }

apply(
  'function PaymentsScreen({ token, buildingId, owners, payments, reload }) {',
  'function PaymentsScreen({ token, buildingId, owners, payments, reload, initialOwnerId }) {'
);
apply(
  "useEffect(() => { if (!ownerId && owners?.[0]?.id) setOwnerId(owners[0].id); }, [owners, ownerId]);",
  "useEffect(() => { if (initialOwnerId && owners?.some((owner) => owner.id === initialOwnerId)) { setOwnerId(initialOwnerId); return; } if (!ownerId && owners?.[0]?.id) setOwnerId(owners[0].id); }, [owners, ownerId, initialOwnerId]);"
);
apply(
  "function AppShell({ token, user, selectedBuilding, setSelectedBuilding, onLogout }) { const [tab, setTab] = useState('dashboard'); const [dashboard, setDashboard] = useState(null);",
  "function AppShell({ token, user, selectedBuilding, setSelectedBuilding, onLogout }) { const [tab, setTab] = useState('dashboard'); const [initialPaymentOwnerId, setInitialPaymentOwnerId] = useState(null); const [dashboard, setDashboard] = useState(null);"
);
apply(
  "{tab === 'owners' && <OwnersScreen token={token} buildingId={selectedBuilding.id} owners={owners} reload={reload} />}",
  "{tab === 'owners' && <OwnersScreen token={token} buildingId={selectedBuilding.id} owners={owners} reload={reload} setTab={setTab} setInitialPaymentOwnerId={setInitialPaymentOwnerId} />}",
);
apply(
  "{tab === 'payments' && <PaymentsScreen token={token} buildingId={selectedBuilding.id} owners={owners} payments={payments} reload={reload} />}",
  "{tab === 'payments' && <PaymentsScreen token={token} buildingId={selectedBuilding.id} owners={owners} payments={payments} reload={reload} initialOwnerId={initialPaymentOwnerId} />}",
);
apply(
  "manageOwnerCard: { marginBottom: 12, backgroundColor: '#fff', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' },",
  "manageOwnerCard: { marginBottom: 12, backgroundColor: '#fff', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' }, manageOwnerCardWithMenu: { position: 'relative', overflow: 'visible' }, ownerCardMenuButton: { position: 'absolute', top: 12, left: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', zIndex: 20 }, ownerCardMenu: { position: 'absolute', top: 54, left: 12, width: 132, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 6, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOpacity: 0.14, shadowRadius: 14, elevation: 8, zIndex: 30 }, ownerCardMenuItem: { minHeight: 40, paddingHorizontal: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', gap: 8 }, ownerCardMenuText: { color: '#0f172a', fontWeight: '900', fontSize: 13, textAlign: 'right' },"
);

if (changed) fs.writeFileSync(appPath, s);
console.log(changed ? 'owner actions menu patched' : 'owner actions menu already patched');
