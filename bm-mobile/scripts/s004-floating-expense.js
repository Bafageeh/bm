const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let content = fs.readFileSync(appPath, 'utf8');

const functionText = String.raw`function ExpensesScreen({ token, buildingId, expenses, reload }) {
  const [expenseFormVisible, setExpenseFormVisible] = useState(false);
  const [category, setCategory] = useState('صيانة');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayDate());
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState(null);
  const [expenseCategoryDetailsVisible, setExpenseCategoryDetailsVisible] = useState(false);

  const [editExpenseVisible, setEditExpenseVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editCategory, setEditCategory] = useState('صيانة');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);

  const groupedExpenses = Object.values((expenses || []).reduce((groups, item) => {
    const key = item.category || 'أخرى';
    if (!groups[key]) groups[key] = { category: key, total: 0, count: 0, items: [] };
    groups[key].total += Number(item.amount || 0);
    groups[key].count += 1;
    groups[key].items.push(item);
    return groups;
  }, {})).sort((a, b) => b.total - a.total);

  const resetAddExpenseForm = () => {
    setCategory('صيانة');
    setAmount('');
    setExpenseDate(todayDate());
    setDescription('');
  };

  const closeAddExpenseForm = () => {
    resetAddExpenseForm();
    setExpenseFormVisible(false);
  };

  const add = async () => {
    if (!amount) return Alert.alert('تنبيه', 'أدخل مبلغ المصروف');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) return Alert.alert('تنبيه', 'اختر تاريخ المصروف');
    try {
      setLoading(true);
      await request('/buildings/' + buildingId + '/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category,
          amount: Number(amount),
          expense_date: expenseDate,
          description,
        }),
      }, token);
      resetAddExpenseForm();
      setExpenseFormVisible(false);
      await reload();
    } catch (e) {
      Alert.alert('تعذر إضافة المصروف', e.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditExpense = (item) => {
    setEditingExpense(item);
    setEditCategory(item.category || 'صيانة');
    setEditAmount(String(item.amount || ''));
    setEditDate(item.expense_date || todayDate());
    setEditDescription(item.description || '');
    setEditExpenseVisible(true);
  };

  const saveExpense = async () => {
    if (!editingExpense) return;
    if (!editAmount) return Alert.alert('تنبيه', 'أدخل مبلغ المصروف');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editDate)) return Alert.alert('تنبيه', 'اختر تاريخ المصروف');

    try {
      setSavingExpense(true);
      await request('/buildings/' + buildingId + '/expenses/' + editingExpense.id, {
        method: 'PUT',
        body: JSON.stringify({
          category: editCategory,
          amount: Number(editAmount),
          expense_date: editDate,
          description: editDescription,
        }),
      }, token);

      setEditExpenseVisible(false);
      setExpenseCategoryDetailsVisible(false);
      await reload();
    } catch (e) {
      Alert.alert('تعذر تعديل المصروف', e.message);
    } finally {
      setSavingExpense(false);
    }
  };

  const deleteExpense = (item) => {
    Alert.alert('حذف المصروف', 'هل تريد حذف هذا المصروف؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await request('/buildings/' + buildingId + '/expenses/' + item.id, { method: 'DELETE' }, token);
            setExpenseCategoryDetailsVisible(false);
            await reload();
          } catch (e) {
            Alert.alert('تعذر حذف المصروف', e.message);
          }
        },
      },
    ]);
  };

  return <View style={styles.screenWrapper}><ScrollView contentContainerStyle={[styles.screenContent, styles.ownersScreenContent]}><ScreenCode code="#S-004" /><SectionTitle icon="receipt-outline" title="إجمالي المصروفات حسب التصنيف" />{groupedExpenses.length === 0 ? <EmptyState icon="receipt-outline" title="لا توجد مصروفات" text="اضغط زر الإضافة العائم لإضافة أول مصروف للمبنى." /> : null}{groupedExpenses.map((group) => <Pressable key={group.category} onPress={() => { setSelectedExpenseCategory(group); setExpenseCategoryDetailsVisible(true); }} style={({ pressed }) => [styles.rowCard, pressed && styles.pressed]}><View style={styles.rowIcon}><Ionicons name="folder-open-outline" size={20} color="#f97316" /></View><View style={styles.flex1}><Text style={styles.cardTitle}>{group.category}</Text><Text style={styles.cardSub}>عدد العمليات: {group.count} - اضغط لعرض التفاصيل</Text></View><Text style={styles.amountText}>{money(group.total)}</Text></Pressable>)}</ScrollView><Pressable onPress={() => setExpenseFormVisible(true)} style={({ pressed }) => [styles.ownerFloatingAdd, pressed && styles.pressed]}><Ionicons name="add" size={29} color="#fff" /></Pressable><Modal visible={expenseFormVisible} transparent animationType="fade" onRequestClose={closeAddExpenseForm}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}><Pressable style={styles.modalBackdrop} onPress={closeAddExpenseForm} /><View style={styles.floatingFormCard}><View style={styles.floatingFormHeader}><Pressable onPress={closeAddExpenseForm} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable><View style={styles.flex1}><Text style={styles.screenCodeText}>#S-004</Text><Text style={styles.floatingFormTitle}>إضافة مصروف</Text></View></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}><Text style={styles.label}>التصنيف</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>{EXPENSE_CATEGORIES.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}><Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</ScrollView><Field label="المبلغ" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" /><DatePickerField label="تاريخ المصروف" value={expenseDate} onChange={setExpenseDate} /><Field label="ملاحظة" value={description} onChangeText={setDescription} placeholder="وصف المصروف" multiline /><PrimaryButton title="حفظ المصروف" icon="save-outline" onPress={add} loading={loading} /><PrimaryButton title="إلغاء" icon="close-outline" onPress={closeAddExpenseForm} variant="light" /></ScrollView></View></KeyboardAvoidingView></Modal><Modal visible={expenseCategoryDetailsVisible} transparent animationType="fade" onRequestClose={() => setExpenseCategoryDetailsVisible(false)}><View style={styles.modalRoot}><Pressable style={styles.modalBackdrop} onPress={() => setExpenseCategoryDetailsVisible(false)} /><View style={styles.floatingFormCard}><View style={styles.floatingFormHeader}><Pressable onPress={() => setExpenseCategoryDetailsVisible(false)} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable><View style={styles.flex1}><Text style={styles.floatingFormTitle}>{selectedExpenseCategory?.category || 'تفاصيل التصنيف'}</Text><Text style={styles.ownerMeta}>الإجمالي: {money(selectedExpenseCategory?.total)} - عدد العمليات: {selectedExpenseCategory?.count || 0}</Text></View></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}>{(selectedExpenseCategory?.items || []).map((item) => <View key={item.id} style={styles.manageOwnerCard}><ExpenseRow item={item} /><View style={styles.actionsRow}><Pressable style={styles.actionBtn} onPress={() => startEditExpense(item)}><Ionicons name="create-outline" size={18} color="#0f766e" /><Text style={styles.actionText}>تعديل</Text></Pressable><Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => deleteExpense(item)}><Ionicons name="trash-outline" size={18} color="#ef4444" /><Text style={[styles.actionText, styles.deleteText]}>حذف</Text></Pressable></View></View>)}</ScrollView></View></View></Modal><Modal visible={editExpenseVisible} transparent animationType="fade" onRequestClose={() => setEditExpenseVisible(false)}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}><Pressable style={styles.modalBackdrop} onPress={() => setEditExpenseVisible(false)} /><View style={styles.floatingFormCard}><View style={styles.floatingFormHeader}><Pressable onPress={() => setEditExpenseVisible(false)} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable><View style={styles.flex1}><Text style={styles.floatingFormTitle}>تعديل المصروف</Text></View></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}><Text style={styles.label}>التصنيف</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>{EXPENSE_CATEGORIES.map((item) => <Pressable key={item} onPress={() => setEditCategory(item)} style={[styles.chip, editCategory === item && styles.chipActive]}><Text style={[styles.chipText, editCategory === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</ScrollView><Field label="المبلغ" value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" placeholder="0" /><DatePickerField label="تاريخ المصروف" value={editDate} onChange={setEditDate} /><Field label="ملاحظة" value={editDescription} onChangeText={setEditDescription} placeholder="وصف المصروف" multiline /><PrimaryButton title="حفظ التعديل" icon="save-outline" onPress={saveExpense} loading={savingExpense} /><PrimaryButton title="إلغاء" icon="close-outline" onPress={() => setEditExpenseVisible(false)} variant="light" /></ScrollView></View></KeyboardAvoidingView></Modal></View>;
}`;

const start = content.indexOf('function ExpensesScreen(');
const end = content.indexOf('\nfunction ExpenseRow', start);
if (start === -1 || end === -1) throw new Error('ExpensesScreen block not found');
content = content.slice(0, start) + functionText + '\n' + content.slice(end);
fs.writeFileSync(appPath, content);
console.log('S004 floating expense form patched');
