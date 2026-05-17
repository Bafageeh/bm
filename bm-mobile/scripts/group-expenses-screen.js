const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let s = fs.readFileSync(appPath, 'utf8');

if (s.includes('expenseCategoryDetailsVisible')) {
  console.log('Grouped expenses already applied');
  process.exit(0);
}

const stateLine = "const [category, setCategory] = useState('صيانة'); const [amount, setAmount] = useState(''); const [description, setDescription] = useState(''); const [loading, setLoading] = useState(false);";
const stateNew = stateLine + " const [selectedExpenseCategory, setSelectedExpenseCategory] = useState(null); const [expenseCategoryDetailsVisible, setExpenseCategoryDetailsVisible] = useState(false); const groupedExpenses = Object.values((expenses || []).reduce((groups, item) => { const key = item.category || 'أخرى'; if (!groups[key]) groups[key] = { category: key, total: 0, count: 0, items: [] }; groups[key].total += Number(item.amount || 0); groups[key].count += 1; groups[key].items.push(item); return groups; }, {})).sort((a, b) => b.total - a.total); const openCategoryDetails = (group) => { setSelectedExpenseCategory(group); setExpenseCategoryDetailsVisible(true); };";

if (!s.includes(stateLine)) {
  console.log('ExpensesScreen state line not found');
  process.exit(0);
}
s = s.replace(stateLine, stateNew);

const oldTail = "<SectionTitle icon=\"receipt-outline\" title=\"المصروفات\" />{(expenses || []).map((item) => <ExpenseRow key={item.id} item={item} />)}</ScrollView>;";
const detailCard = "<View key={item.id} style={styles.manageOwnerCard}><ExpenseRow item={item} /><View style={styles.actionsRow}><Pressable style={styles.actionBtn} onPress={() => Alert.alert('تعديل المصروف', 'سيتم فتح شاشة تعديل المصروف لاحقًا')}><Ionicons name=\"create-outline\" size={18} color=\"#0f766e\" /><Text style={styles.actionText}>تعديل</Text></Pressable><Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => Alert.alert('حذف المصروف', 'هل تريد حذف هذا المصروف؟')}><Ionicons name=\"trash-outline\" size={18} color=\"#ef4444\" /><Text style={[styles.actionText, styles.deleteText]}>حذف</Text></Pressable></View></View>";
const newTail = "<SectionTitle icon=\"receipt-outline\" title=\"إجمالي المصروفات حسب التصنيف\" />{groupedExpenses.length === 0 ? <EmptyState icon=\"receipt-outline\" title=\"لا توجد مصروفات\" text=\"أضف أول مصروف للمبنى ليظهر ملخص التصنيفات هنا.\" /> : null}{groupedExpenses.map((group) => <Pressable key={group.category} onPress={() => openCategoryDetails(group)} style={({ pressed }) => [styles.rowCard, pressed && styles.pressed]}><View style={styles.rowIcon}><Ionicons name=\"folder-open-outline\" size={20} color=\"#f97316\" /></View><View style={styles.flex1}><Text style={styles.cardTitle}>{group.category}</Text><Text style={styles.cardSub}>عدد العمليات: {group.count} - اضغط لعرض التفاصيل</Text></View><Text style={styles.amountText}>{money(group.total)}</Text></Pressable>)}<Modal visible={expenseCategoryDetailsVisible} transparent animationType=\"fade\" onRequestClose={() => setExpenseCategoryDetailsVisible(false)}><View style={styles.modalRoot}><Pressable style={styles.modalBackdrop} onPress={() => setExpenseCategoryDetailsVisible(false)} /><View style={styles.floatingFormCard}><View style={styles.floatingFormHeader}><Pressable onPress={() => setExpenseCategoryDetailsVisible(false)} style={styles.closeFloatingBtn}><Ionicons name=\"close\" size={22} color=\"#0f172a\" /></Pressable><View style={styles.flex1}><Text style={styles.floatingFormTitle}>{selectedExpenseCategory?.category || 'تفاصيل التصنيف'}</Text><Text style={styles.ownerMeta}>الإجمالي: {money(selectedExpenseCategory?.total)} - عدد العمليات: {selectedExpenseCategory?.count || 0}</Text></View></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}>{(selectedExpenseCategory?.items || []).map((item) => " + detailCard + ")}</ScrollView></View></View></Modal></ScrollView>;";

if (!s.includes(oldTail)) {
  console.log('ExpensesScreen list tail not found');
  process.exit(0);
}
s = s.replace(oldTail, newTail);
fs.writeFileSync(appPath, s);
console.log('Grouped expenses applied to #S-004 with expense actions');
