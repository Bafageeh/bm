const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let content = fs.readFileSync(appPath, 'utf8');
let applied = 0;

const replacement = `function ManagerRegistrationScreen({ onBack, onLogin }) {
  const [step, setStep] = useState('form');
  const [registrationId, setRegistrationId] = useState(null);
  const [form, setForm] = useState({ name: '', building_name: '', unit_count: '', annual_cycle_starts_on: todayDate(), national_id: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const requestOtp = async () => {
    if (!form.name.trim()) return Alert.alert('تنبيه', 'أدخل الاسم');
    if (!form.building_name.trim()) return Alert.alert('تنبيه', 'أدخل اسم المبنى');
    if (!form.unit_count || Number(form.unit_count) < 1) return Alert.alert('تنبيه', 'أدخل عدد الوحدات');
    if (!form.annual_cycle_starts_on) return Alert.alert('تنبيه', 'أدخل بداية تاريخ الدورة');
    if (!form.national_id.trim()) return Alert.alert('تنبيه', 'أدخل رقم الهوية');
    if (!form.phone.trim()) return Alert.alert('تنبيه', 'أدخل رقم جوال الواتساب');
    try {
      setLoading(true);
      const data = await request('/manager-registration/request-otp', { method: 'POST', body: JSON.stringify({ ...form, unit_count: Number(form.unit_count), annual_cycle_starts_on: normalizeDateForApi(form.annual_cycle_starts_on) }) });
      setRegistrationId(data.registration_id);
      setStep('otp');
      Alert.alert('رمز التحقق', data.message || 'تم إرسال رمز التحقق على الواتساب.');
    } catch (e) {
      Alert.alert('تعذر بدء التسجيل', e.message);
    } finally {
      setLoading(false);
    }
  };
  const verifyOtp = async () => {
    const cleanOtp = String(otp || '').replace(/\D/g, '');
    if (cleanOtp.length !== 6) return Alert.alert('تنبيه', 'أدخل رمز التحقق المكون من 6 أرقام');
    try {
      setLoading(true);
      const data = await request('/manager-registration/verify', { method: 'POST', body: JSON.stringify({ registration_id: registrationId, otp: cleanOtp }) });
      await SecureStore.setItemAsync('bm_token', data.token);
      Alert.alert('تم التسجيل', data.default_password ? 'تم التسجيل بنجاح. كلمة المرور الافتراضية: 123456' : 'تم التسجيل بنجاح.');
      onLogin(data.token, data.user);
    } catch (e) {
      Alert.alert('رمز غير صحيح', e.message || 'رمز التحقق غير صحيح، قم بإدخاله مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };
  if (step === 'otp') {
    return <SafeAreaView style={styles.loginContainer}><StatusBar style="dark" /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginContent}><ScreenCode code="#S-001" /><Text style={styles.appName}>التحقق عبر الواتساب</Text><Text style={styles.subtitle}>أدخل الرقم العشوائي الذي تم إرساله على الواتساب</Text><View style={styles.loginCard}><Field label="رمز التحقق OTP" value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))} placeholder="000000" keyboardType="numeric" /><PrimaryButton title="تحقق وسجل" icon="checkmark-circle-outline" onPress={verifyOtp} loading={loading} /><PrimaryButton title="رجوع للبيانات" icon="arrow-forward-outline" onPress={() => setStep('form')} variant="light" /></View></KeyboardAvoidingView></SafeAreaView>;
  }
  return <SafeAreaView style={styles.loginContainer}><StatusBar style="dark" /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginContent}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}><ScreenCode code="#S-001" /><Text style={styles.appName}>تسجيل مدير اتحاد ملاك</Text><Text style={styles.subtitle}>أدخل بيانات المدير والمبنى ثم سيتم إرسال رمز تحقق على الواتساب</Text><View style={styles.loginCard}><Field label="الاسم" value={form.name} onChangeText={(v) => setField('name', v)} placeholder="اسم المدير" /><Field label="اسم المبنى" value={form.building_name} onChangeText={(v) => setField('building_name', v)} placeholder="مثال: عمارة الصفا" /><Field label="عدد الوحدات" value={form.unit_count} onChangeText={(v) => setField('unit_count', v.replace(/\D/g, ''))} placeholder="مثال: 12" keyboardType="numeric" /><DatePickerField label="بداية تاريخ الدورة" value={form.annual_cycle_starts_on} onChange={(v) => setField('annual_cycle_starts_on', v)} /><Field label="رقم الهوية" value={form.national_id} onChangeText={(v) => setField('national_id', v.replace(/\D/g, ''))} placeholder="رقم الهوية" keyboardType="numeric" /><Field label="رقم جوال الواتساب" value={form.phone} onChangeText={(v) => setField('phone', v.replace(/[^0-9+]/g, ''))} placeholder="05xxxxxxxx" keyboardType="phone-pad" /><PrimaryButton title="سجل" icon="person-add-outline" onPress={requestOtp} loading={loading} /><PrimaryButton title="رجوع لتسجيل الدخول" icon="arrow-forward-outline" onPress={onBack} variant="light" /></View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

function LoginScreen({ onLogin }) {
  const [screen, setScreen] = useState('login');
  const [login, setLogin] = useState('manager');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const submit = async () => { try { setLoading(true); const data = await request('/login', { method: 'POST', body: JSON.stringify({ login, password }) }); await SecureStore.setItemAsync('bm_token', data.token); onLogin(data.token, data.user); } catch (e) { Alert.alert('تعذر تسجيل الدخول', e.message); } finally { setLoading(false); } };
  if (screen === 'register') return <ManagerRegistrationScreen onBack={() => setScreen('login')} onLogin={onLogin} />;
  return <SafeAreaView style={styles.loginContainer}><StatusBar style="dark" /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginContent}><ScreenCode code="#S-001" /><View style={styles.logoCircle}><MaterialCommunityIcons name="office-building-cog" size={54} color="#0f766e" /></View><Text style={styles.appName}>إدارة اتحاد الملاك</Text><Text style={styles.subtitle}>مصروفات المبنى، دفعات الملاك، والرصيد في شاشة سهلة وواضحة</Text><View style={styles.loginCard}><Field label="اسم المستخدم أو الجوال" value={login} onChangeText={setLogin} placeholder="مثال: manager" /><Field label="كلمة المرور" value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry /><PrimaryButton title="دخول" icon="log-in-outline" onPress={submit} loading={loading} /><PrimaryButton title="تسجيل مدير اتحاد ملاك" icon="person-add-outline" onPress={() => setScreen('register')} variant="light" /></View></KeyboardAvoidingView></SafeAreaView>;
}
function BuildingPicker`;

content = content.replace(/function LoginScreen\(\{ onLogin \}\) \{[\s\S]*?\}\nfunction BuildingPicker/, replacement);
applied += 1;

fs.writeFileSync(appPath, content);
console.log(`Manager registration UI patch applied: ${applied}`);
