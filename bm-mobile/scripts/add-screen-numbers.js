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
  [`screenContent: { padding: 16, paddingBottom: 110 }`, `screenContent: { padding: 12, paddingBottom: 96 }`],
  [`ownersScreenContent: { paddingTop: 58 }`, `ownersScreenContent: { paddingTop: 46 }`],
  [`sectionTitle: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginTop: 18, marginBottom: 10 }`, `sectionTitle: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginTop: 12, marginBottom: 7 }`],
  [`ownerCard: { backgroundColor: '#fff', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' }`, `ownerCard: { backgroundColor: '#fff', borderRadius: 18, padding: 9, borderWidth: 1, borderColor: '#e2e8f0' }`],
  [`ownerTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }`, `ownerTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }`],
  [`ownerAvatar: { width: 42, height: 42, borderRadius: 16, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }`, `ownerAvatar: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }`],
  [`badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }`, `badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }`],
  [`ownerAmounts: { flexDirection: 'row-reverse', gap: 8, marginTop: 12, flexWrap: 'wrap' }`, `ownerAmounts: { flexDirection: 'row-reverse', gap: 6, marginTop: 8, flexWrap: 'wrap' }`],
  [`smallAmount: { flexGrow: 1, minWidth: '45%', backgroundColor: '#f8fafc', borderRadius: 16, padding: 10 }`, `smallAmount: { flexGrow: 1, minWidth: '45%', backgroundColor: '#f8fafc', borderRadius: 13, paddingHorizontal: 8, paddingVertical: 7 }`],
  [`manageOwnerCard: { marginBottom: 12, backgroundColor: '#fff', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' }`, `manageOwnerCard: { marginBottom: 8, backgroundColor: '#fff', borderRadius: 19, padding: 6, borderWidth: 1, borderColor: '#e2e8f0' }`],
  [`ownerMetaRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap', paddingHorizontal: 4, paddingTop: 8 }`, `ownerMetaRow: { flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap', paddingHorizontal: 2, paddingTop: 5 }`],
  [`actionsRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 10 }`, `actionsRow: { flexDirection: 'row-reverse', gap: 6, marginTop: 7 }`],
  [`actionBtn: { flex: 1, height: 42, borderRadius: 14, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 6 }`, `actionBtn: { flex: 1, height: 38, borderRadius: 12, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 6 }`],
  [`<ScreenCode code="#S-004" /><SectionTitle icon="receipt-outline" title="إجمالي المصروفات حسب التصنيف" />{groupedExpenses.length === 0 ?`, `<ScreenCode code="#S-004" />{groupedExpenses.length === 0 ?`],
  [`<Header title={tab === 'owners' ? 'إدارة الملاك' : selectedBuilding?.name || 'المبنى'} subtitle="إدارة اتحاد الملاك" onLogout={onLogout} onBack={() => setSelectedBuilding(null)} />`, `<Header title={tab === 'owners' ? 'إدارة الملاك' : tab === 'expenses' ? 'المصروفات' : selectedBuilding?.name || 'المبنى'} subtitle="إدارة اتحاد الملاك" onLogout={onLogout} onBack={() => setSelectedBuilding(null)} />`],
];

for (const [from, to] of replacements) replaceFragment(from, to);

const ownerOnlyReplacement = `function OwnerExpensesContent({ profile }) { const [selectedGroup, setSelectedGroup] = useState(null); const groupedExpenses = useMemo(() => Object.values((profile?.expenses || []).reduce((groups, item) => { const key = item.category || 'أخرى'; if (!groups[key]) groups[key] = { category: key, total: 0, count: 0, items: [] }; const share = Number(item.owner_share || item.amount || 0); groups[key].total += share; groups[key].count += 1; groups[key].items.push({ ...item, amount: share }); return groups; }, {})).sort((a, b) => b.total - a.total), [profile]); return <View style={styles.screenWrapper}><ScrollView contentContainerStyle={styles.screenContent}><ScreenCode code="#S-012" />{groupedExpenses.length === 0 ? <EmptyState icon="receipt-outline" title="لا توجد مصروفات" text="لا توجد مصروفات مسجلة على حسابك حتى الآن." /> : null}{groupedExpenses.map((group) => <Pressable key={group.category} onPress={() => setSelectedGroup(group)} style={({ pressed }) => [styles.rowCard, pressed && styles.pressed]}><View style={styles.rowIcon}><Ionicons name="folder-open-outline" size={20} color="#f97316" /></View><View style={styles.flex1}><Text style={styles.cardTitle}>{group.category}</Text><Text style={styles.cardSub}>عدد العمليات: {group.count} - اضغط لعرض التفاصيل</Text></View><Text style={styles.amountText}>{money(group.total)}</Text></Pressable>)}</ScrollView><Modal visible={!!selectedGroup} transparent animationType="fade" onRequestClose={() => setSelectedGroup(null)}><View style={styles.modalRoot}><Pressable style={styles.modalBackdrop} onPress={() => setSelectedGroup(null)} /><View style={styles.floatingFormCard}><View style={styles.floatingFormHeader}><Pressable onPress={() => setSelectedGroup(null)} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable><View style={styles.flex1}><Text style={styles.floatingFormTitle}>{selectedGroup?.category || 'تفاصيل التصنيف'}</Text><Text style={styles.ownerMeta}>الإجمالي: {money(selectedGroup?.total)} - عدد العمليات: {selectedGroup?.count || 0}</Text></View></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}>{(selectedGroup?.items || []).map((item) => <ExpenseRow key={item.id} item={item} />)}</ScrollView></View></View></Modal></View>; }
function OwnerSettingsContent({ user, onLogout }) { return <ScrollView contentContainerStyle={styles.screenContent}><ScreenCode code="#S-013" /><SectionTitle icon="settings-outline" title="إعدادات" /><View style={styles.settingsLink}><View style={styles.settingsIcon}><Ionicons name="person-circle-outline" size={24} color="#0f766e" /></View><View style={styles.flex1}><Text style={styles.settingsTitle}>{user?.name || 'حساب المالك'}</Text><Text style={styles.settingsText}>حساب مالك - عرض فقط</Text></View></View><PrimaryButton title="خروج" icon="log-out-outline" onPress={onLogout} variant="light" /></ScrollView>; }
function OwnerOnlyScreen({ token, user, onLogout }) { const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [tab, setTab] = useState('stats'); useEffect(() => { request('/owner/dashboard', {}, token).then(setData).catch((e) => Alert.alert('خطأ', e.message)).finally(() => setLoading(false)); }, [token]); const headerTitle = tab === 'expenses' ? 'المصروفات' : tab === 'settings' ? 'إعدادات' : 'احصائيات'; if (loading) return <SafeAreaView style={styles.container}><Header title={headerTitle} subtitle={user?.name} onLogout={onLogout} /><LoadingScreen /></SafeAreaView>; const profile = data?.owners?.[0]; if (!profile) return <SafeAreaView style={styles.container}><Header title={headerTitle} subtitle={user?.name} onLogout={onLogout} /><EmptyState icon="home-outline" title="لا توجد بيانات" text="لم يتم ربط حسابك بمالك بعد." /></SafeAreaView>; return <SafeAreaView style={styles.container}><Header title={headerTitle} subtitle={user?.name} onLogout={onLogout} />{tab === 'stats' ? <Dashboard dashboard={{ building: profile.building, stats: {}, owners: [profile.summary] }} /> : null}{tab === 'expenses' ? <OwnerExpensesContent profile={profile} /> : null}{tab === 'settings' ? <OwnerSettingsContent user={user} onLogout={onLogout} /> : null}<View style={styles.tabs}><TabButton active={tab === 'stats'} icon="stats-chart-outline" title="احصائيات" onPress={() => setTab('stats')} /><TabButton active={tab === 'expenses'} icon="receipt-outline" title="المصروفات" onPress={() => setTab('expenses')} /><TabButton active={tab === 'settings'} icon="settings-outline" title="إعدادات" onPress={() => setTab('settings')} /></View></SafeAreaView>; }
`;

replaceRegex(/function OwnerOnlyScreen\(\{ token(?:, user, onLogout)? \}\) \{[\s\S]*?\}\nfunction LoadingScreen/, `${ownerOnlyReplacement}function LoadingScreen`);
replaceFragment(
  `if (user?.role === 'owner') return <SafeAreaView style={styles.container}><Header title="حسابي" subtitle={user.name} onLogout={onLogout} /><OwnerOnlyScreen token={token} /></SafeAreaView>;`,
  `if (user?.role === 'owner') return <OwnerOnlyScreen token={token} user={user} onLogout={onLogout} />;`
);
replaceFragment(
  `if (user?.role === 'owner') return <SafeAreaView style={styles.container}><Header title="المصروفات" subtitle={user.name} onLogout={onLogout} /><OwnerOnlyScreen token={token} /></SafeAreaView>;`,
  `if (user?.role === 'owner') return <OwnerOnlyScreen token={token} user={user} onLogout={onLogout} />;`
);
replaceFragment(
  `if (user?.role === 'owner') return <SafeAreaView style={styles.container}><Header title="حسابي" subtitle={user.name} onLogout={onLogout} /><OwnerOnlyScreen token={token} user={user} onLogout={onLogout} /></SafeAreaView>;`,
  `if (user?.role === 'owner') return <OwnerOnlyScreen token={token} user={user} onLogout={onLogout} />;`
);

// Keep screen #S-013 logout button stable even if a previous generated version already exists.
replaceRegex(/function OwnerSettingsContent\(\{ user \}\) \{[\s\S]*?\}\nfunction OwnerOnlyScreen/, `function OwnerSettingsContent({ user, onLogout }) { return <ScrollView contentContainerStyle={styles.screenContent}><ScreenCode code="#S-013" /><SectionTitle icon="settings-outline" title="إعدادات" /><View style={styles.settingsLink}><View style={styles.settingsIcon}><Ionicons name="person-circle-outline" size={24} color="#0f766e" /></View><View style={styles.flex1}><Text style={styles.settingsTitle}>{user?.name || 'حساب المالك'}</Text><Text style={styles.settingsText}>حساب مالك - عرض فقط</Text></View></View><PrimaryButton title="خروج" icon="log-out-outline" onPress={onLogout} variant="light" /></ScrollView>; }\nfunction OwnerOnlyScreen`);
replaceFragment(`<OwnerSettingsContent user={user} />`, `<OwnerSettingsContent user={user} onLogout={onLogout} />`);

fs.writeFileSync(appPath, content);
console.log(`BM mobile post-deploy UI patches applied: ${applied} replacement(s)`);
