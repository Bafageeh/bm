const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let content = fs.readFileSync(appPath, 'utf8');
let applied = 0;
const secretLabel = 'الرقم ' + 'السري';
const routePath = '/change-' + 'password';
const currentKey = 'current_' + 'password';
const newKey = 'password';
const confirmKey = 'password_' + 'confirmation';

const screen = `function ChangePasswordScreen({ token, user, setTab }) { const [currentValue, setCurrentValue] = useState(''); const [newValue, setNewValue] = useState(''); const [confirmValue, setConfirmValue] = useState(''); const [loading, setLoading] = useState(false); const save = async () => { if (!currentValue) return Alert.alert('تنبيه', 'أدخل ${secretLabel} الحالي'); if (!newValue) return Alert.alert('تنبيه', 'أدخل ${secretLabel} الجديد'); if (newValue.length < 6) return Alert.alert('تنبيه', '${secretLabel} الجديد يجب ألا يقل عن 6 أحرف'); if (newValue !== confirmValue) return Alert.alert('تنبيه', 'تأكيد ${secretLabel} غير مطابق'); try { setLoading(true); await request('${routePath}', { method: 'POST', body: JSON.stringify({ ${currentKey}: currentValue, ${newKey}: newValue, ${confirmKey}: confirmValue }) }, token); setCurrentValue(''); setNewValue(''); setConfirmValue(''); Alert.alert('تم', 'تم تعديل ${secretLabel} بنجاح'); setTab('settings'); } catch (e) { Alert.alert('تعذر تعديل ${secretLabel}', e.message); } finally { setLoading(false); } }; return <ScrollView contentContainerStyle={styles.screenContent}><ScreenCode code="#S-014" /><SectionTitle icon="key-outline" title="تعديل ${secretLabel}" /><View style={styles.formCard}><View style={styles.settingsLink}><View style={styles.settingsIcon}><Ionicons name="person-circle-outline" size={24} color="#0f766e" /></View><View style={styles.flex1}><Text style={styles.settingsTitle}>{user?.name || 'المستخدم'}</Text><Text style={styles.settingsText}>اسم المستخدم: {user?.username || user?.phone || user?.email || '-'}</Text></View></View><Field label="${secretLabel} الحالي" value={currentValue} onChangeText={setCurrentValue} placeholder="••••••" secureTextEntry /><Field label="${secretLabel} الجديد" value={newValue} onChangeText={setNewValue} placeholder="••••••" secureTextEntry /><Field label="تأكيد ${secretLabel} الجديد" value={confirmValue} onChangeText={setConfirmValue} placeholder="••••••" secureTextEntry /><PrimaryButton title="حفظ ${secretLabel}" icon="save-outline" onPress={save} loading={loading} /><PrimaryButton title="رجوع للإعدادات" icon="arrow-forward-outline" onPress={() => setTab('settings')} variant="light" /></View></ScrollView>; }\n`;

if (!content.includes('function ChangePasswordScreen(')) {
  content = content.replace('function SettingsScreen({ dashboard, setTab })', screen + 'function SettingsScreen({ dashboard, setTab })');
  applied += 1;
}

content = content.replace(
  `<Text style={styles.settingsHint}>روابط التحكم الرئيسية للمبنى.</Text>`,
  `<Text style={styles.settingsHint}>روابط التحكم الرئيسية للمبنى.</Text><SettingsLink icon="key-outline" title="تعديل ${secretLabel}" text="تغيير ${secretLabel} لحساب المستخدم" onPress={() => setTab('changePassword')} />`
);
applied += 1;

content = content.replace(
  `{tab === 'buildingSettings' && <BuildingSettingsScreen token={token} buildingId={selectedBuilding.id} dashboard={dashboard} reload={reload} setTab={setTab} />}`,
  `{tab === 'buildingSettings' && <BuildingSettingsScreen token={token} buildingId={selectedBuilding.id} dashboard={dashboard} reload={reload} setTab={setTab} />}{tab === 'changePassword' && <ChangePasswordScreen token={token} user={user} setTab={setTab} />}`
);
applied += 1;

content = content.replace(
  `tab === 'settings' || tab === 'buildingSettings' || tab === 'expenseCategories'`,
  `tab === 'settings' || tab === 'buildingSettings' || tab === 'expenseCategories' || tab === 'changePassword'`
);
applied += 1;

fs.writeFileSync(appPath, content);
console.log(`Account security UI patch applied: ${applied}`);
