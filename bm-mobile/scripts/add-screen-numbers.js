const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let content = fs.readFileSync(appPath, 'utf8');

if (!content.includes('function ScreenCode(')) {
  content = content.replace(
    "function IconCard({ icon, family = 'ion', title, value, tone = 'default' }) {",
    "function ScreenCode({ code }) {\n  return (\n    <View style={styles.screenCodeBadge}>\n      <Text style={styles.screenCodeText}>{code}</Text>\n    </View>\n  );\n}\n\nfunction IconCard({ icon, family = 'ion', title, value, tone = 'default' }) {"
  );
}

const replacements = [
  ["<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginContent}>", "<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginContent}>\n        <ScreenCode code=\"#S-001\" />"],
  ["contentContainerStyle={styles.listContent}\n        data={user?.buildings || []}", "contentContainerStyle={styles.listContent}\n        data={user?.buildings || []}\n        ListHeaderComponent={<ScreenCode code=\"#S-002\" />}"],
  ["<ScrollView contentContainerStyle={styles.screenContent}>\n      <View style={styles.heroCard}>", "<ScrollView contentContainerStyle={styles.screenContent}>\n      <ScreenCode code=\"#S-003\" />\n      <View style={styles.heroCard}>"],
  ["<ScrollView contentContainerStyle={styles.screenContent}>\n      <SectionTitle icon=\"add-circle-outline\" title=\"إضافة مصروف\" />", "<ScrollView contentContainerStyle={styles.screenContent}>\n      <ScreenCode code=\"#S-007\" />\n      <SectionTitle icon=\"add-circle-outline\" title=\"إضافة مصروف\" />"],
  ["<ScrollView contentContainerStyle={styles.screenContent}>\n      <SectionTitle icon=\"card-outline\" title=\"تسجيل دفعة مالك\" />", "<ScrollView contentContainerStyle={styles.screenContent}>\n      <ScreenCode code=\"#S-008\" />\n      <SectionTitle icon=\"card-outline\" title=\"تسجيل دفعة مالك\" />"],
  ["<View style={styles.screenCodeBadge}>\n          <Text style={styles.screenCodeText}>#S-001</Text>\n        </View>", "<ScreenCode code=\"#S-004\" />"],
  ["<Text style={styles.screenCodeText}>{editingOwner ? '#S-003' : '#S-002'}</Text>", "<Text style={styles.screenCodeText}>{editingOwner ? '#S-006' : '#S-005'}</Text>"],
  ["<Dashboard dashboard={{ building: profile.building, stats: {}, owners: [profile.summary] }} />", "<ScreenCode code=\"#S-009\" />\n      <Dashboard dashboard={{ building: profile.building, stats: {}, owners: [profile.summary] }} />"],
];

for (const [from, to] of replacements) {
  if (content.includes(from) && !content.includes(to)) {
    content = content.replace(from, to);
  }
}

if (!content.includes('datePickerModalVisible')) {
  const start = content.indexOf('function BuildingSettingsScreen({ token, buildingId, dashboard, reload, setTab })');
  const end = content.indexOf('\n\nfunction OwnerOnlyScreen', start);
  if (start !== -1 && end !== -1 && end > start) {
    const nextYear = new Date().getFullYear();
    const newBuildingSettings = `function BuildingSettingsScreen({ token, buildingId, dashboard, reload, setTab }) {
  const [apartmentCount, setApartmentCount] = useState(String(dashboard?.stats?.apartment_count || ''));
  const [annualCycleStartsOn, setAnnualCycleStartsOn] = useState(dashboard?.building?.annual_cycle_starts_on || '');
  const [datePickerModalVisible, setDatePickerModalVisible] = useState(false);
  const [tempYear, setTempYear] = useState(String((annualCycleStartsOn || '${nextYear}-01-01').slice(0, 4)));
  const [tempMonth, setTempMonth] = useState(String(Number((annualCycleStartsOn || '${nextYear}-01-01').slice(5, 7)) || 1));
  const [tempDay, setTempDay] = useState(String(Number((annualCycleStartsOn || '${nextYear}-01-01').slice(8, 10)) || 1));
  const [loading, setLoading] = useState(false);
  const years = Array.from({ length: 7 }, (_, i) => String(${nextYear - 2} + i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const formattedDate = annualCycleStartsOn ? annualCycleStartsOn.split('-').reverse().join(' / ') : 'اضغط لاختيار التاريخ';
  const openDatePicker = () => {
    const current = annualCycleStartsOn || '${nextYear}-01-01';
    setTempYear(String(current.slice(0, 4)));
    setTempMonth(String(Number(current.slice(5, 7)) || 1));
    setTempDay(String(Number(current.slice(8, 10)) || 1));
    setDatePickerModalVisible(true);
  };
  const chooseDate = () => {
    const date = tempYear + '-' + tempMonth.padStart(2, '0') + '-' + tempDay.padStart(2, '0');
    setAnnualCycleStartsOn(date);
    setDatePickerModalVisible(false);
  };
  useEffect(() => {
    setApartmentCount(String(dashboard?.stats?.apartment_count || ''));
    setAnnualCycleStartsOn(dashboard?.building?.annual_cycle_starts_on || '');
  }, [dashboard?.stats?.apartment_count, dashboard?.building?.annual_cycle_starts_on]);
  const save = async () => {
    const count = Number(apartmentCount);
    if (!Number.isInteger(count) || count < 0) return Alert.alert('تنبيه', 'أدخل عدد الشقق بشكل صحيح');
    try {
      setLoading(true);
      await request(\`/buildings/\${buildingId}/apartment-count\`, { method: 'PUT', body: JSON.stringify({ apartment_count: count, annual_cycle_starts_on: annualCycleStartsOn || null }) }, token);
      await reload();
      Alert.alert('تم', 'تم حفظ إعدادات المبنى');
      setTab('settings');
    } catch (e) { Alert.alert('تعذر حفظ إعدادات المبنى', e.message); } finally { setLoading(false); }
  };
  const Choice = ({ value, selected, onPress }) => <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipActive]}><Text style={[styles.chipText, selected && styles.chipTextActive]}>{value}</Text></Pressable>;
  return <ScrollView contentContainerStyle={styles.screenContent}><ScreenCode code="#S-006" /><SectionTitle icon="business-outline" title="إعدادات المبنى" /><View style={styles.formCard}><Field label="عدد الشقق" value={apartmentCount} onChangeText={setApartmentCount} keyboardType="numeric" placeholder="مثال: 12" /><View style={styles.field}><Text style={styles.label}>تاريخ بداية الدورة السنوية</Text><Pressable onPress={openDatePicker} style={({ pressed }) => [styles.input, { minHeight: 54, justifyContent: 'center' }, pressed && styles.pressed]}><Text style={{ textAlign: 'right', color: annualCycleStartsOn ? '#0f172a' : '#94a3b8', fontWeight: '900' }}>{formattedDate}</Text></Pressable></View><Text style={styles.settingsHint}>تاريخ بداية الدورة يحدد بداية السنة المالية للمصروفات والتقارير.</Text><Text style={styles.settingsHint}>عند زيادة العدد سيتم إنشاء الشقق الناقصة تلقائيًا بأرقام متسلسلة.</Text><PrimaryButton title="حفظ إعدادات المبنى" icon="save-outline" onPress={save} loading={loading} /><PrimaryButton title="رجوع للإعدادات" icon="arrow-forward-outline" onPress={() => setTab('settings')} variant="light" /></View><Modal visible={datePickerModalVisible} transparent animationType="fade" onRequestClose={() => setDatePickerModalVisible(false)}><View style={styles.modalRoot}><Pressable style={styles.modalBackdrop} onPress={() => setDatePickerModalVisible(false)} /><View style={styles.floatingFormCard}><View style={styles.floatingFormHeader}><Pressable onPress={() => setDatePickerModalVisible(false)} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable><View style={styles.flex1}><Text style={styles.floatingFormTitle}>اختيار تاريخ بداية الدورة</Text></View></View><Text style={styles.label}>السنة</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>{years.map((year) => <Choice key={year} value={year} selected={tempYear === year} onPress={() => setTempYear(year)} />)}</ScrollView><Text style={styles.label}>الشهر</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>{months.map((month) => <Choice key={month} value={month.padStart(2, '0')} selected={tempMonth === month} onPress={() => setTempMonth(month)} />)}</ScrollView><Text style={styles.label}>اليوم</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>{days.map((day) => <Choice key={day} value={day.padStart(2, '0')} selected={tempDay === day} onPress={() => setTempDay(day)} />)}</ScrollView><PrimaryButton title="اختيار التاريخ" icon="calendar-outline" onPress={chooseDate} /><PrimaryButton title="إلغاء" icon="close-outline" onPress={() => setDatePickerModalVisible(false)} variant="light" /></View></View></Modal></ScrollView>;
}`;
    content = content.slice(0, start) + newBuildingSettings + content.slice(end);
  }
}

fs.writeFileSync(appPath, content);
console.log('Screen numbers and safe date selector injected into App.js');
