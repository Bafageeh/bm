import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  I18nManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

I18nManager.allowRTL(true);
I18nManager.forceRTL(false);

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://bm.pm.sa/api';
const money = (value) => `${Number(value || 0).toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ريال`;
const EXPENSE_CATEGORIES = ['حارس', 'كهرباء', 'مياه', 'نظافة', 'صيانة', 'مشتريات', 'مصعد', 'أخرى'];

async function request(path, options = {}, token) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) {
    data = { message: text || 'حدث خطأ غير متوقع' };
  }

  if (!response.ok) {
    const message = data?.message || Object.values(data?.errors || {})?.flat()?.[0] || 'حدث خطأ غير متوقع';
    throw new Error(message);
  }

  return data;
}

function IconCard({ icon, family = 'ion', title, value, tone = 'default' }) {
  const Icon = family === 'material' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.statCard, styles[`tone_${tone}`]]}>
      <View style={styles.statIconWrap}>
        <Icon name={icon} size={22} color="#0f766e" />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function PrimaryButton({ title, icon, onPress, loading, variant = 'primary' }) {
  return (
    <Pressable disabled={loading} onPress={onPress} style={({ pressed }) => [styles.button, styles[`button_${variant}`], pressed && styles.pressed]}>
      {loading ? <ActivityIndicator color={variant === 'light' ? '#0f766e' : '#fff'} /> : <Ionicons name={icon} size={20} color={variant === 'light' ? '#0f766e' : '#fff'} />}
      <Text style={[styles.buttonText, variant === 'light' && styles.buttonTextLight]}>{title}</Text>
    </Pressable>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, multiline = false }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        textAlign="right"
      />
    </View>
  );
}

function LoginScreen({ onLogin }) {
  const [login, setLogin] = useState('manager');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      const data = await request('/login', { method: 'POST', body: JSON.stringify({ login, password }) });
      await SecureStore.setItemAsync('bm_token', data.token);
      onLogin(data.token, data.user);
    } catch (error) {
      Alert.alert('تعذر تسجيل الدخول', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginContent}>
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="office-building-cog" size={54} color="#0f766e" />
        </View>
        <Text style={styles.appName}>إدارة اتحاد الملاك</Text>
        <Text style={styles.subtitle}>مصروفات المبنى، دفعات الملاك، والرصيد في شاشة سهلة وواضحة</Text>

        <View style={styles.loginCard}>
          <Field label="اسم المستخدم أو الجوال" value={login} onChangeText={setLogin} placeholder="مثال: manager" />
          <Field label="كلمة المرور" value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry />
          <PrimaryButton title="دخول" icon="log-in-outline" onPress={submit} loading={loading} />
        </View>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>بيانات التجربة</Text>
          <Text style={styles.demoText}>مدير التطبيق: admin / 123456</Text>
          <Text style={styles.demoText}>مدير المبنى: manager / 123456</Text>
          <Text style={styles.demoText}>المالك: owner / 123456</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ title, subtitle, onLogout, onBack }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerActions}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.circleBtn}>
            <Ionicons name="arrow-forward" size={20} color="#0f172a" />
          </Pressable>
        ) : null}
        {onLogout ? (
          <Pressable onPress={onLogout} style={styles.circleBtn}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.flex1}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function BuildingPicker({ user, onSelect, onLogout }) {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="اختر المبنى" subtitle={`مرحبًا ${user?.name || ''}`} onLogout={onLogout} />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={user?.buildings || []}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<EmptyState icon="business-outline" title="لا توجد مبانٍ" text="لم يتم ربط حسابك بأي مبنى بعد." />}
        renderItem={({ item }) => (
          <Pressable style={styles.buildingCard} onPress={() => onSelect(item)}>
            <View style={styles.buildingIcon}><Ionicons name="business" size={28} color="#0f766e" /></View>
            <View style={styles.flex1}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSub}>{[item.city, item.district].filter(Boolean).join(' - ') || 'بدون موقع'}</Text>
            </View>
            <Ionicons name="chevron-back" size={22} color="#64748b" />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={40} color="#94a3b8" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function Dashboard({ dashboard }) {
  const stats = dashboard?.stats || {};
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}><MaterialCommunityIcons name="home-city-outline" size={30} color="#fff" /></View>
        <View style={styles.flex1}>
          <Text style={styles.heroTitle}>{dashboard?.building?.name || 'المبنى'}</Text>
          <Text style={styles.heroSub}>كل مبنى مستقل ببياناته ومصروفاته وأرصدته</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <IconCard icon="cash-outline" title="إجمالي المدفوعات" value={money(stats.total_payments)} tone="green" />
        <IconCard icon="receipt-outline" title="إجمالي المصروفات" value={money(stats.total_expenses)} tone="orange" />
        <IconCard icon="wallet-outline" title="رصيد المبنى" value={money(stats.building_balance)} tone="blue" />
        <IconCard family="material" icon="door" title="نصيب الشقة" value={money(stats.share_per_apartment)} tone="default" />
      </View>

      <SectionTitle icon="people-outline" title="ملخص الملاك" />
      {(dashboard?.owners || []).map((owner) => <OwnerCard key={owner.id} owner={owner} />)}
    </ScrollView>
  );
}

function OwnerCard({ owner }) {
  const isDue = owner.status === 'due';
  const isSurplus = owner.status === 'surplus';
  return (
    <View style={styles.ownerCard}>
      <View style={styles.ownerTop}>
        <View style={styles.ownerAvatar}><Ionicons name="person" size={20} color="#0f766e" /></View>
        <View style={styles.flex1}>
          <Text style={styles.cardTitle}>{owner.name}</Text>
          <Text style={styles.cardSub}>الشقق: {owner.apartments?.join('، ') || '-'}</Text>
        </View>
        <View style={[styles.badge, isDue ? styles.badgeDue : isSurplus ? styles.badgeSurplus : styles.badgeBalanced]}>
          <Text style={styles.badgeText}>{isDue ? 'عليه مبلغ' : isSurplus ? 'له فائض' : 'متعادل'}</Text>
        </View>
      </View>
      <View style={styles.ownerAmounts}>
        <SmallAmount title="دفعاته" value={money(owner.total_payments)} />
        <SmallAmount title="نصيبه" value={money(owner.expense_share)} />
        <SmallAmount title="الرصيد" value={money(owner.balance)} />
      </View>
    </View>
  );
}

function SmallAmount({ title, value }) {
  return (
    <View style={styles.smallAmount}>
      <Text style={styles.smallTitle}>{title}</Text>
      <Text style={styles.smallValue}>{value}</Text>
    </View>
  );
}

function SectionTitle({ title, icon }) {
  return (
    <View style={styles.sectionTitle}>
      <Ionicons name={icon} size={20} color="#0f766e" />
      <Text style={styles.sectionText}>{title}</Text>
    </View>
  );
}

function ExpensesScreen({ token, buildingId, expenses, reload }) {
  const [category, setCategory] = useState('صيانة');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const add = async () => {
    if (!amount) return Alert.alert('تنبيه', 'أدخل مبلغ المصروف');
    try {
      setLoading(true);
      await request(`/buildings/${buildingId}/expenses`, {
        method: 'POST',
        body: JSON.stringify({ category, amount: Number(amount), expense_date: new Date().toISOString().slice(0, 10), description }),
      }, token);
      setAmount('');
      setDescription('');
      await reload();
    } catch (error) {
      Alert.alert('تعذر إضافة المصروف', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <SectionTitle icon="add-circle-outline" title="إضافة مصروف" />
      <View style={styles.formCard}>
        <Text style={styles.label}>التصنيف</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {EXPENSE_CATEGORIES.map((item) => (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}>
              <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Field label="المبلغ" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />
        <Field label="ملاحظة" value={description} onChangeText={setDescription} placeholder="وصف المصروف" multiline />
        <PrimaryButton title="حفظ المصروف" icon="save-outline" onPress={add} loading={loading} />
      </View>

      <SectionTitle icon="receipt-outline" title="المصروفات" />
      {(expenses || []).map((item) => (
        <View key={item.id} style={styles.rowCard}>
          <View style={styles.rowIcon}><Ionicons name="receipt" size={20} color="#f97316" /></View>
          <View style={styles.flex1}>
            <Text style={styles.cardTitle}>{item.category}</Text>
            <Text style={styles.cardSub}>{item.expense_date} - {item.description || 'بدون ملاحظة'}</Text>
          </View>
          <Text style={styles.amountText}>{money(item.amount)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function PaymentsScreen({ token, buildingId, owners, payments, reload }) {
  const [ownerId, setOwnerId] = useState(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ownerId && owners?.[0]?.id) setOwnerId(owners[0].id);
  }, [owners, ownerId]);

  const add = async () => {
    if (!ownerId) return Alert.alert('تنبيه', 'اختر المالك');
    if (!amount) return Alert.alert('تنبيه', 'أدخل مبلغ الدفعة');
    try {
      setLoading(true);
      await request(`/buildings/${buildingId}/payments`, {
        method: 'POST',
        body: JSON.stringify({ owner_id: ownerId, amount: Number(amount), payment_date: new Date().toISOString().slice(0, 10), method: 'تحويل', notes }),
      }, token);
      setAmount('');
      setNotes('');
      await reload();
    } catch (error) {
      Alert.alert('تعذر إضافة الدفعة', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <SectionTitle icon="card-outline" title="تسجيل دفعة مالك" />
      <View style={styles.formCard}>
        <Text style={styles.label}>المالك</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {(owners || []).map((owner) => (
            <Pressable key={owner.id} onPress={() => setOwnerId(owner.id)} style={[styles.chip, ownerId === owner.id && styles.chipActive]}>
              <Text style={[styles.chipText, ownerId === owner.id && styles.chipTextActive]}>{owner.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Field label="المبلغ" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />
        <Field label="ملاحظة" value={notes} onChangeText={setNotes} placeholder="ملاحظة اختيارية" multiline />
        <PrimaryButton title="حفظ الدفعة" icon="save-outline" onPress={add} loading={loading} />
      </View>

      <SectionTitle icon="wallet-outline" title="آخر الدفعات" />
      {(payments || []).map((item) => (
        <View key={item.id} style={styles.rowCard}>
          <View style={styles.rowIcon}><Ionicons name="wallet" size={20} color="#0f766e" /></View>
          <View style={styles.flex1}>
            <Text style={styles.cardTitle}>{item.owner?.name || 'مالك'}</Text>
            <Text style={styles.cardSub}>{item.payment_date} - {item.notes || item.method || 'دفعة'}</Text>
          </View>
          <Text style={styles.amountText}>{money(item.amount)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const emptyOwnerForm = { name: '', phone: '', national_id: '', email: '', apartmentsText: '', notes: '' };

function OwnersScreen({ token, buildingId, owners, reload }) {
  const [form, setForm] = useState(emptyOwnerForm);
  const [editingOwner, setEditingOwner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [ownerFormVisible, setOwnerFormVisible] = useState(false);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const resetForm = () => {
    setForm(emptyOwnerForm);
    setEditingOwner(null);
    setOwnerFormVisible(false);
  };

  const openAddOwnerForm = () => {
    setForm(emptyOwnerForm);
    setEditingOwner(null);
    setOwnerFormVisible(true);
  };

  const startEdit = (owner) => {
    setEditingOwner(owner);
    setForm({
      name: owner.name || '',
      phone: owner.phone || '',
      national_id: owner.national_id || owner.login || '',
      email: owner.email || '',
      apartmentsText: (owner.apartments || []).join('، '),
      notes: owner.notes || '',
    });
    setOwnerFormVisible(true);
  };

  const payload = () => ({
    name: form.name.trim(),
    phone: form.phone.trim(),
    national_id: form.national_id.trim(),
    email: form.email.trim(),
    notes: form.notes.trim(),
    apartments: form.apartmentsText
      .split(/[،,\n]+/)
      .map((number) => number.trim())
      .filter(Boolean)
      .map((number) => ({ number })),
  });

  const save = async () => {
    const data = payload();
    if (!data.name || data.apartments.length === 0) return Alert.alert('تنبيه', 'أدخل اسم المالك ورقم شقة واحد على الأقل');

    try {
      setLoading(true);
      await request(`/buildings/${buildingId}/owners${editingOwner ? `/${editingOwner.id}` : ''}`, {
        method: editingOwner ? 'PUT' : 'POST',
        body: JSON.stringify(data),
      }, token);
      resetForm();
      await reload();
      Alert.alert('تم', editingOwner ? 'تم تعديل بيانات المالك' : 'تم إضافة المالك');
    } catch (error) {
      Alert.alert(editingOwner ? 'تعذر تعديل المالك' : 'تعذر إضافة المالك', error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (owner) => {
    Alert.alert('حذف المالك', `هل تريد حذف ${owner.name} من هذا المبنى؟ سيتم فك ربط الشقق وحذف دفعاته.`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => remove(owner) },
    ]);
  };

  const remove = async (owner) => {
    try {
      setDeletingId(owner.id);
      await request(`/buildings/${buildingId}/owners/${owner.id}`, { method: 'DELETE' }, token);
      if (editingOwner?.id === owner.id) resetForm();
      await reload();
    } catch (error) {
      Alert.alert('تعذر حذف المالك', error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView contentContainerStyle={[styles.screenContent, styles.ownersScreenContent]}>
        <SectionTitle icon="settings-outline" title="إدارة الملاك" />
        {(owners || []).length === 0 ? <EmptyState icon="people-outline" title="لا يوجد ملاك" text="اضغط زر الإضافة العائم لإضافة أول مالك لهذا المبنى." /> : null}
        {(owners || []).map((owner) => (
          <View key={owner.id} style={styles.manageOwnerCard}>
            <OwnerCard owner={owner} />
            <View style={styles.ownerMetaRow}>
              <Text style={styles.ownerMeta}>الدخول: {owner.login || owner.national_id || owner.phone || '-'}</Text>
              <Text style={styles.ownerMeta}>الجوال: {owner.phone || '-'}</Text>
            </View>
            <View style={styles.actionsRow}>
              <Pressable style={styles.actionBtn} onPress={() => startEdit(owner)}>
                <Ionicons name="create-outline" size={18} color="#0f766e" />
                <Text style={styles.actionText}>تعديل</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => confirmDelete(owner)} disabled={deletingId === owner.id}>
                {deletingId === owner.id ? <ActivityIndicator size="small" color="#ef4444" /> : <Ionicons name="trash-outline" size={18} color="#ef4444" />}
                <Text style={[styles.actionText, styles.deleteText]}>حذف</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable onPress={openAddOwnerForm} style={({ pressed }) => [styles.ownerFloatingAdd, pressed && styles.pressed]}>
        <Ionicons name="person-add" size={24} color="#fff" />
      </Pressable>

      <Modal visible={ownerFormVisible} transparent animationType="fade" onRequestClose={resetForm}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={resetForm} />
          <View style={styles.floatingFormCard}>
            <View style={styles.floatingFormHeader}>
              <Pressable onPress={resetForm} style={styles.closeFloatingBtn}>
                <Ionicons name="close" size={22} color="#0f172a" />
              </Pressable>
              <View style={styles.flex1}>
                <Text style={styles.floatingFormTitle}>{editingOwner ? 'تعديل بيانات المالك' : 'إضافة مالك'}</Text>
                <Text style={styles.floatingFormSub}>{editingOwner ? `تعديل: ${editingOwner.name}` : 'أدخل بيانات المالك والشقق المرتبطة به'}</Text>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}>
              <Field label="اسم المالك" value={form.name} onChangeText={(value) => setField('name', value)} placeholder="اسم المالك" />
              <Field label="رقم الجوال" value={form.phone} onChangeText={(value) => setField('phone', value)} placeholder="05xxxxxxxx" keyboardType="phone-pad" />
              <Field label="رقم الهوية أو اسم الدخول" value={form.national_id} onChangeText={(value) => setField('national_id', value)} placeholder="اسم دخول المالك" />
              <Field label="البريد الإلكتروني" value={form.email} onChangeText={(value) => setField('email', value)} placeholder="اختياري" keyboardType="email-address" />
              <Field label="الشقق" value={form.apartmentsText} onChangeText={(value) => setField('apartmentsText', value)} placeholder="مثال: 1، 2، 3" />
              <Field label="ملاحظة" value={form.notes} onChangeText={(value) => setField('notes', value)} placeholder="ملاحظة اختيارية" multiline />
              <PrimaryButton title={editingOwner ? 'حفظ التعديل' : 'حفظ المالك'} icon="save-outline" onPress={save} loading={loading} />
              <PrimaryButton title="إلغاء" icon="close-outline" onPress={resetForm} variant="light" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function OwnerOnlyScreen({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request('/owner/dashboard', {}, token).then(setData).catch((e) => Alert.alert('خطأ', e.message)).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingScreen />;
  const profile = data?.owners?.[0];
  if (!profile) return <EmptyState icon="home-outline" title="لا توجد بيانات" text="لم يتم ربط حسابك بمالك بعد." />;

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <Dashboard dashboard={{ building: profile.building, stats: {}, owners: [profile.summary] }} />
      <SectionTitle icon="receipt-outline" title="تفصيل نصيبك من المصروفات" />
      {(profile.expenses || []).map((item) => (
        <View key={item.id} style={styles.rowCard}>
          <View style={styles.rowIcon}><Ionicons name="receipt" size={20} color="#f97316" /></View>
          <View style={styles.flex1}>
            <Text style={styles.cardTitle}>{item.category}</Text>
            <Text style={styles.cardSub}>إجمالي المصروف: {money(item.amount)}</Text>
          </View>
          <Text style={styles.amountText}>{money(item.owner_share)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color="#0f766e" size="large" />
      <Text style={styles.loadingText}>جاري التحميل...</Text>
    </View>
  );
}

function AppShell({ token, user, selectedBuilding, setSelectedBuilding, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!selectedBuilding) return;
    setLoading(true);
    try {
      const [dash, expenseData, paymentData] = await Promise.all([
        request(`/buildings/${selectedBuilding.id}/dashboard`, {}, token),
        request(`/buildings/${selectedBuilding.id}/expenses`, {}, token),
        request(`/buildings/${selectedBuilding.id}/payments`, {}, token),
      ]);
      setDashboard(dash);
      setExpenses(expenseData.data || []);
      setPayments(paymentData.data || []);
    } catch (error) {
      Alert.alert('تعذر تحميل البيانات', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [selectedBuilding?.id]);

  if (user?.role === 'owner') {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="حسابي" subtitle={user.name} onLogout={onLogout} />
        <OwnerOnlyScreen token={token} />
      </SafeAreaView>
    );
  }

  const owners = dashboard?.owners || [];

  return (
    <SafeAreaView style={styles.container}>
      <Header title={selectedBuilding?.name || 'المبنى'} subtitle="إدارة اتحاد الملاك" onLogout={onLogout} onBack={() => setSelectedBuilding(null)} />
      {loading ? <LoadingScreen /> : (
        <>
          {tab === 'dashboard' && <Dashboard dashboard={dashboard} />}
          {tab === 'owners' && <OwnersScreen token={token} buildingId={selectedBuilding.id} owners={owners} reload={reload} />}
          {tab === 'expenses' && <ExpensesScreen token={token} buildingId={selectedBuilding.id} expenses={expenses} reload={reload} />}
          {tab === 'payments' && <PaymentsScreen token={token} buildingId={selectedBuilding.id} owners={owners} payments={payments} reload={reload} />}
        </>
      )}
      <View style={styles.tabs}>
        <TabButton active={tab === 'dashboard'} icon="grid-outline" title="الملخص" onPress={() => setTab('dashboard')} />
        <TabButton active={tab === 'owners'} icon="people-outline" title="الملاك" onPress={() => setTab('owners')} />
        <TabButton active={tab === 'expenses'} icon="receipt-outline" title="المصروفات" onPress={() => setTab('expenses')} />
        <TabButton active={tab === 'payments'} icon="wallet-outline" title="الدفعات" onPress={() => setTab('payments')} />
      </View>
    </SafeAreaView>
  );
}

function TabButton({ active, icon, title, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.tabBtn}>
      <Ionicons name={icon} size={21} color={active ? '#0f766e' : '#94a3b8'} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{title}</Text>
    </Pressable>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('bm_token')
      .then(async (saved) => {
        if (saved) {
          const data = await request('/me', {}, saved);
          setToken(saved);
          setUser(data.user);
          if (data.user?.buildings?.length === 1) setSelectedBuilding(data.user.buildings[0]);
        }
      })
      .catch(() => SecureStore.deleteItemAsync('bm_token'))
      .finally(() => setBooting(false));
  }, []);

  const logout = async () => {
    try {
      if (token) await request('/logout', { method: 'POST' }, token);
    } catch (_) {}
    await SecureStore.deleteItemAsync('bm_token');
    setToken(null);
    setUser(null);
    setSelectedBuilding(null);
  };

  if (booting) return <SafeAreaProvider><LoadingScreen /></SafeAreaProvider>;

  return (
    <SafeAreaProvider>
      {!token ? (
        <LoginScreen onLogin={(nextToken, nextUser) => {
          setToken(nextToken);
          setUser(nextUser);
          if (nextUser?.buildings?.length === 1) setSelectedBuilding(nextUser.buildings[0]);
        }} />
      ) : !selectedBuilding && user?.role !== 'owner' ? (
        <BuildingPicker user={user} onSelect={setSelectedBuilding} onLogout={logout} />
      ) : (
        <AppShell token={token} user={user} selectedBuilding={selectedBuilding} setSelectedBuilding={setSelectedBuilding} onLogout={logout} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  screenWrapper: { flex: 1, backgroundColor: '#f8fafc' },
  loginContainer: { flex: 1, backgroundColor: '#ecfdf5' },
  loginContent: { flex: 1, padding: 22, justifyContent: 'center' },
  logoCircle: { width: 98, height: 98, borderRadius: 49, backgroundColor: '#fff', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  appName: { fontSize: 27, fontWeight: '900', textAlign: 'center', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 8, lineHeight: 23 },
  loginCard: { backgroundColor: '#fff', borderRadius: 24, padding: 18, marginTop: 24, shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  demoBox: { backgroundColor: '#d1fae5', borderRadius: 18, padding: 14, marginTop: 16 },
  demoTitle: { color: '#064e3b', fontWeight: '900', textAlign: 'right', marginBottom: 4 },
  demoText: { color: '#065f46', textAlign: 'right', marginTop: 3 },
  field: { marginBottom: 12 },
  label: { color: '#334155', fontSize: 13, fontWeight: '800', textAlign: 'right', marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a' },
  textarea: { minHeight: 82, textAlignVertical: 'top' },
  button: { height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8, marginTop: 8 },
  button_primary: { backgroundColor: '#0f766e' },
  button_light: { backgroundColor: '#ecfdf5' },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  buttonTextLight: { color: '#0f766e' },
  pressed: { opacity: 0.75 },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerActions: { flexDirection: 'row', gap: 8 },
  circleBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', textAlign: 'right' },
  headerSubtitle: { fontSize: 12, color: '#64748b', textAlign: 'right', marginTop: 2 },
  flex1: { flex: 1 },
  listContent: { padding: 16, gap: 12 },
  buildingCard: { backgroundColor: '#fff', padding: 16, borderRadius: 22, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  buildingIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontWeight: '900', color: '#0f172a', fontSize: 15, textAlign: 'right' },
  cardSub: { color: '#64748b', fontSize: 12, marginTop: 3, textAlign: 'right' },
  screenContent: { padding: 16, paddingBottom: 110 },
  ownersScreenContent: { paddingTop: 58 },
  heroCard: { backgroundColor: '#0f766e', borderRadius: 26, padding: 18, flexDirection: 'row-reverse', alignItems: 'center', gap: 14, marginBottom: 14 },
  heroIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#fff', fontWeight: '900', fontSize: 20, textAlign: 'right' },
  heroSub: { color: '#ccfbf1', marginTop: 4, textAlign: 'right' },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48.5%', backgroundColor: '#fff', borderRadius: 22, padding: 14, minHeight: 125, borderWidth: 1, borderColor: '#e2e8f0' },
  tone_green: { backgroundColor: '#f0fdf4' },
  tone_orange: { backgroundColor: '#fff7ed' },
  tone_blue: { backgroundColor: '#eff6ff' },
  tone_default: { backgroundColor: '#fff' },
  statIconWrap: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statTitle: { color: '#64748b', fontSize: 12, textAlign: 'right' },
  statValue: { color: '#0f172a', fontSize: 16, fontWeight: '900', marginTop: 6, textAlign: 'right' },
  sectionTitle: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginTop: 18, marginBottom: 10 },
  sectionText: { fontSize: 17, fontWeight: '900', color: '#0f172a' },
  ownerCard: { backgroundColor: '#fff', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  ownerTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  ownerAvatar: { width: 42, height: 42, borderRadius: 16, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeDue: { backgroundColor: '#fee2e2' },
  badgeSurplus: { backgroundColor: '#dcfce7' },
  badgeBalanced: { backgroundColor: '#e0f2fe' },
  badgeText: { color: '#0f172a', fontWeight: '800', fontSize: 11 },
  ownerAmounts: { flexDirection: 'row-reverse', gap: 8, marginTop: 12 },
  smallAmount: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 16, padding: 10 },
  smallTitle: { fontSize: 11, color: '#64748b', textAlign: 'right' },
  smallValue: { fontSize: 13, color: '#0f172a', fontWeight: '900', textAlign: 'right', marginTop: 4 },
  formCard: { backgroundColor: '#fff', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  chipsRow: { flexDirection: 'row-reverse', gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  chipText: { color: '#475569', fontWeight: '800' },
  chipTextActive: { color: '#fff' },
  rowCard: { backgroundColor: '#fff', borderRadius: 18, padding: 13, marginBottom: 9, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  rowIcon: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  amountText: { color: '#0f172a', fontWeight: '900' },
  manageOwnerCard: { marginBottom: 12, backgroundColor: '#fff', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  ownerMetaRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap', paddingHorizontal: 4, paddingTop: 8 },
  ownerMeta: { fontSize: 11, color: '#64748b', textAlign: 'right' },
  actionsRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, height: 42, borderRadius: 14, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 6 },
  deleteBtn: { backgroundColor: '#fef2f2' },
  actionText: { color: '#0f766e', fontWeight: '900', fontSize: 13 },
  deleteText: { color: '#ef4444' },
  editingBanner: { backgroundColor: '#ecfdf5', borderRadius: 14, padding: 10, marginBottom: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  ownerFloatingAdd: { position: 'absolute', top: 10, left: 16, width: 54, height: 54, borderRadius: 27, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.18, shadowRadius: 14, elevation: 8, zIndex: 10 },
  modalRoot: { flex: 1, justifyContent: 'flex-start', paddingTop: Platform.OS === 'ios' ? 70 : 44, paddingHorizontal: 14 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.42)' },
  floatingFormCard: { maxHeight: '86%', backgroundColor: '#fff', borderRadius: 26, padding: 14, shadowColor: '#0f172a', shadowOpacity: 0.18, shadowRadius: 18, elevation: 10 },
  floatingFormHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 12, marginBottom: 8 },
  closeFloatingBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  floatingFormTitle: { color: '#0f172a', fontWeight: '900', fontSize: 18, textAlign: 'right' },
  floatingFormSub: { color: '#64748b', fontSize: 12, marginTop: 3, textAlign: 'right' },
  floatingFormBody: { paddingTop: 4, paddingBottom: 8 },
  tabs: { position: 'absolute', left: 12, right: 12, bottom: Platform.OS === 'ios' ? 20 : 12, backgroundColor: '#fff', borderRadius: 24, padding: 8, flexDirection: 'row-reverse', justifyContent: 'space-around', shadowColor: '#0f172a', shadowOpacity: 0.1, shadowRadius: 18, elevation: 7 },
  tabBtn: { alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 66 },
  tabText: { fontSize: 11, color: '#94a3b8', fontWeight: '800' },
  tabTextActive: { color: '#0f766e' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle: { color: '#0f172a', fontWeight: '900', fontSize: 17, marginTop: 10 },
  emptyText: { color: '#64748b', textAlign: 'center', lineHeight: 21, marginTop: 6 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 10, color: '#64748b', fontWeight: '800' },
});
