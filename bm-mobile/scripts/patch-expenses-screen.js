const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let content = fs.readFileSync(appPath, 'utf8');

if (!content.includes('const emptyExpenseForm =')) {
  content = content.replace(
    "const EXPENSE_CATEGORIES = ['حارس', 'كهرباء', 'مياه', 'نظافة', 'صيانة', 'مشتريات', 'مصعد', 'أخرى'];",
    "const EXPENSE_CATEGORIES = ['حارس', 'كهرباء', 'مياه', 'نظافة', 'صيانة', 'مشتريات', 'مصعد', 'أخرى'];\nconst emptyExpenseForm = { category: 'صيانة', amount: '', description: '' };"
  );
}

const start = content.indexOf('function ExpensesScreen({ token, buildingId, expenses, reload }) {');
const end = content.indexOf('\nfunction PaymentsScreen({ token, buildingId, owners, payments, reload }) {');

if (start === -1 || end === -1) {
  console.log('ExpensesScreen block not found');
  process.exit(0);
}

const newBlock = `function ExpensesScreen({ token, buildingId, expenses, reload }) {
  const [form, setForm] = useState(emptyExpenseForm);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formVisible, setFormVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [categories, setCategories] = useState(EXPENSE_CATEGORIES);
  const [categoryText, setCategoryText] = useState('');

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const activeCategory = form.category || categories[0] || 'أخرى';

  const resetForm = () => {
    setForm({ ...emptyExpenseForm, category: categories[0] || emptyExpenseForm.category });
    setEditingExpense(null);
    setFormVisible(true);
  };

  const startEdit = (expense) => {
    setEditingExpense(expense);
    setForm({
      category: expense.category || categories[0] || 'أخرى',
      amount: String(expense.amount || ''),
      description: expense.description || '',
    });
    setFormVisible(true);
  };

  const save = async () => {
    if (!form.amount) return Alert.alert('تنبيه', 'أدخل مبلغ المصروف');
    try {
      setLoading(true);
      await request(
        \`/buildings/\${buildingId}/expenses\${editingExpense ? \`/\${editingExpense.id}\` : ''}\`,
        {
          method: editingExpense ? 'PUT' : 'POST',
          body: JSON.stringify({
            category: activeCategory,
            amount: Number(form.amount),
            expense_date: editingExpense?.expense_date || new Date().toISOString().slice(0, 10),
            description: form.description,
          }),
        },
        token
      );
      resetForm();
      await reload();
      Alert.alert('تم', editingExpense ? 'تم تعديل المصروف' : 'تم حفظ المصروف');
    } catch (error) {
      Alert.alert(editingExpense ? 'تعذر تعديل المصروف' : 'تعذر إضافة المصروف', error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (expense) => {
    Alert.alert('حذف المصروف', \`هل تريد حذف مصروف \${expense.category} بقيمة \${money(expense.amount)}؟\`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => remove(expense) },
    ]);
  };

  const remove = async (expense) => {
    try {
      setDeletingId(expense.id);
      await request(\`/buildings/\${buildingId}/expenses/\${expense.id}\`, { method: 'DELETE' }, token);
      if (editingExpense?.id === expense.id) resetForm();
      await reload();
    } catch (error) {
      Alert.alert('تعذر حذف المصروف', error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const addCategory = () => {
    const next = categoryText.trim();
    if (!next) return;
    if (categories.includes(next)) return Alert.alert('تنبيه', 'هذا التصنيف موجود مسبقًا');
    setCategories((current) => [...current, next]);
    setField('category', next);
    setCategoryText('');
  };

  const renameCategory = (oldName) => {
    if (!categoryText.trim()) return Alert.alert('تنبيه', 'اكتب الاسم الجديد في خانة التصنيف');
    const next = categoryText.trim();
    setCategories((current) => current.map((item) => (item === oldName ? next : item)));
    if (activeCategory === oldName) setField('category', next);
    setCategoryText('');
  };

  const deleteCategory = (name) => {
    if ((expenses || []).some((item) => item.category === name)) {
      return Alert.alert('لا يمكن حذف التصنيف', 'يوجد مصروفات مرتبطة بهذا التصنيف. عدّل المصروفات أولًا.');
    }
    const nextCategories = categories.filter((item) => item !== name);
    setCategories(nextCategories);
    if (activeCategory === name) setField('category', nextCategories[0] || 'أخرى');
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <ScreenCode code="#S-007" />
        <View style={styles.expenseToolbar}>
          <Pressable style={styles.actionBtn} onPress={() => setFormVisible((value) => !value)}>
            <Ionicons name={formVisible ? 'chevron-up' : 'add-circle-outline'} size={18} color="#0f766e" />
            <Text style={styles.actionText}>{formVisible ? 'إخفاء الإضافة' : 'إضافة مصروف'}</Text>
          </Pressable>
        </View>

        {formVisible ? (
          <>
            <SectionTitle icon="add-circle-outline" title={editingExpense ? 'تعديل مصروف' : 'إضافة مصروف'} />
            <View style={styles.formCard}>
              <Text style={styles.label}>التصنيف</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {categories.map((item) => (
                  <Pressable key={item} onPress={() => setField('category', item)} style={[styles.chip, activeCategory === item && styles.chipActive]}>
                    <Text style={[styles.chipText, activeCategory === item && styles.chipTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.categoryManageBox}>
                <Field label="إدارة التصنيف" value={categoryText} onChangeText={setCategoryText} placeholder="اكتب تصنيفًا جديدًا أو اسمًا بديلًا" />
                <View style={styles.actionsRow}>
                  <Pressable style={styles.actionBtn} onPress={addCategory}>
                    <Ionicons name="add-outline" size={18} color="#0f766e" />
                    <Text style={styles.actionText}>إضافة</Text>
                  </Pressable>
                  <Pressable style={styles.actionBtn} onPress={() => renameCategory(activeCategory)}>
                    <Ionicons name="create-outline" size={18} color="#0f766e" />
                    <Text style={styles.actionText}>تعديل الاسم</Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => deleteCategory(activeCategory)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionText, styles.deleteText]}>حذف</Text>
                  </Pressable>
                </View>
              </View>
              <Field label="المبلغ" value={form.amount} onChangeText={(value) => setField('amount', value)} keyboardType="numeric" placeholder="0" />
              <Field label="ملاحظة" value={form.description} onChangeText={(value) => setField('description', value)} placeholder="وصف المصروف" multiline />
              <PrimaryButton title={editingExpense ? 'حفظ التعديل' : 'حفظ المصروف'} icon="save-outline" onPress={save} loading={loading} />
              {editingExpense ? <PrimaryButton title="إلغاء التعديل" icon="close-outline" onPress={resetForm} variant="light" /> : null}
            </View>
          </>
        ) : null}

        <SectionTitle icon="receipt-outline" title="المصروفات" />
        {(expenses || []).length === 0 ? <EmptyState icon="receipt-outline" title="لا توجد مصروفات" text="أضف أول مصروف للمبنى من النموذج أعلاه." /> : null}
        {(expenses || []).map((item) => (
          <View key={item.id} style={styles.manageOwnerCard}>
            <View style={styles.rowCard}>
              <View style={styles.rowIcon}><Ionicons name="receipt" size={20} color="#f97316" /></View>
              <View style={styles.flex1}>
                <Text style={styles.cardTitle}>{item.category}</Text>
                <Text style={styles.cardSub}>{item.expense_date} - {item.description || 'بدون ملاحظة'}</Text>
              </View>
              <Text style={styles.amountText}>{money(item.amount)}</Text>
            </View>
            <View style={styles.actionsRow}>
              <Pressable style={styles.actionBtn} onPress={() => startEdit(item)}>
                <Ionicons name="create-outline" size={18} color="#0f766e" />
                <Text style={styles.actionText}>تعديل</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => confirmDelete(item)} disabled={deletingId === item.id}>
                {deletingId === item.id ? <ActivityIndicator size="small" color="#ef4444" /> : <Ionicons name="trash-outline" size={18} color="#ef4444" />}
                <Text style={[styles.actionText, styles.deleteText]}>حذف</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
`;

content = content.slice(0, start) + newBlock + content.slice(end);

if (!content.includes('expenseToolbar:')) {
  content = content.replace(
    'categoryManageBox: { backgroundColor:',
    'expenseToolbar: { flexDirection: \'row-reverse\', marginBottom: 8 },\n  categoryManageBox: { backgroundColor:'
  );
}

if (!content.includes('categoryManageBox:')) {
  content = content.replace(
    'formCard: { backgroundColor:',
    "categoryManageBox: { backgroundColor: '#f8fafc', borderRadius: 18, padding: 10, marginTop: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },\n  formCard: { backgroundColor:"
  );
}

fs.writeFileSync(appPath, content);
console.log('Expenses screen management patch applied');
