const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let content = fs.readFileSync(appPath, 'utf8');

function replaceAll(search, replacement) {
  content = content.split(search).join(replacement);
}

// Standard visible date format: dd/mm/yyyy while keeping API payloads as yyyy-mm-dd.
replaceAll("join(' / ')", "join('/')");

if (!content.includes('function displayDate(')) {
  const anchor = "function ScreenCode({ code }) { return <View style={styles.screenCodeBadge}><Text style={styles.screenCodeText}>{code}</Text></View>; }";
  const helper = `\nfunction displayDate(value, fallback = '-') {\n  return /^\\d{4}-\\d{2}-\\d{2}$/.test(value || '') ? value.split('-').reverse().join('/') : (value || fallback);\n}`;
  if (content.includes(anchor)) content = content.replace(anchor, anchor + helper);
}

if (!content.includes('function normalizeDateForApi(')) {
  const anchor = "function ScreenCode({ code }) { return <View style={styles.screenCodeBadge}><Text style={styles.screenCodeText}>{code}</Text></View>; }";
  const helper = `\nfunction normalizeDateForApi(value) {\n  const text = String(value || '').trim();\n  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(text)) return text;\n  const m = text.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);\n  if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');\n  return text;\n}`;
  if (content.includes(anchor)) content = content.replace(anchor, anchor + helper);
}

replaceAll('{item.expense_date} - {item.description || \'بدون ملاحظة\'}', "{displayDate(item.expense_date)} - {item.description || 'بدون ملاحظة'}");
replaceAll('{item.payment_date} - {item.notes || item.method || \'دفعة\'}', "{displayDate(item.payment_date)} - {item.notes || item.method || 'دفعة'}");
replaceAll("value={dashboard?.building?.annual_cycle_starts_on || '-'}", "value={displayDate(dashboard?.building?.annual_cycle_starts_on)}");
replaceAll("const cycle = dashboard?.building?.annual_cycle_starts_on || 'غير محدد';", "const cycle = displayDate(dashboard?.building?.annual_cycle_starts_on, 'غير محدد');");

replaceAll("/^\\d{4}-\\d{2}-\\d{2}$/.test(expenseDate)", "/^\\d{4}-\\d{2}-\\d{2}$/.test(normalizeDateForApi(expenseDate))");
replaceAll("/^\\d{4}-\\d{2}-\\d{2}$/.test(editDate)", "/^\\d{4}-\\d{2}-\\d{2}$/.test(normalizeDateForApi(editDate))");
replaceAll('expense_date: expenseDate,', 'expense_date: normalizeDateForApi(expenseDate),');
replaceAll('expense_date: editDate,', 'expense_date: normalizeDateForApi(editDate),');
replaceAll('payment_date: paymentDate,', 'payment_date: normalizeDateForApi(paymentDate),');

fs.writeFileSync(appPath, content);
console.log('Dates formatted as dd/mm/yyyy and normalized before saving');
