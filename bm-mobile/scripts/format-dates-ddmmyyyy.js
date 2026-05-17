const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let content = fs.readFileSync(appPath, 'utf8');

function all(search, replacement) {
  content = content.split(search).join(replacement);
}

const anchor = "function ScreenCode({ code }) { return <View style={styles.screenCodeBadge}><Text style={styles.screenCodeText}>{code}</Text></View>; }";
const helpers = `
function displayDate(value, fallback = '-') {
  const text = String(value || '').trim();
  const iso = text.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);
  if (iso) return iso[3] + '/' + iso[2] + '/' + iso[1];
  const slash = text.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);
  if (slash) return slash[1].padStart(2, '0') + '/' + slash[2].padStart(2, '0') + '/' + slash[3];
  return value || fallback;
}
function normalizeDateForApi(value) {
  const text = String(value || '').trim();
  const iso = text.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);
  if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];
  const slash = text.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);
  if (slash) return slash[3] + '-' + slash[2].padStart(2, '0') + '-' + slash[1].padStart(2, '0');
  return text;
}
function displayTextDates(value) {
  return String(value || '').replace(/(\\d{4})-(\\d{2})-(\\d{2})(?:[T\\s][^\\s]*)?/g, (_, y, m, d) => d + '/' + m + '/' + y);
}`;

if (content.includes('function displayDate(')) {
  content = content.replace(/function displayDate\(value, fallback = '-'\) \{[\s\S]*?\n\}/, helpers.match(/function displayDate[\s\S]*?\n\}/)[0]);
} else if (content.includes(anchor)) {
  content = content.replace(anchor, anchor + helpers);
}
if (content.includes('function normalizeDateForApi(')) {
  content = content.replace(/function normalizeDateForApi\(value\) \{[\s\S]*?\n\}/, helpers.match(/function normalizeDateForApi[\s\S]*?\n\}/)[0]);
} else if (content.includes(anchor)) {
  content = content.replace(anchor, anchor + '\n' + helpers.match(/function normalizeDateForApi[\s\S]*?\n\}/)[0]);
}
if (!content.includes('function displayTextDates(') && content.includes(anchor)) {
  content = content.replace(anchor, anchor + '\n' + helpers.match(/function displayTextDates[\s\S]*?\n\}/)[0]);
}

all("join(' / ')", "join('/')");
all("expense_date: expenseDate,", "expense_date: normalizeDateForApi(expenseDate),");
all("expense_date: editDate,", "expense_date: normalizeDateForApi(editDate),");
all("payment_date: paymentDate,", "payment_date: normalizeDateForApi(paymentDate),");
all("/^\\d{4}-\\d{2}-\\d{2}$/.test(expenseDate)", "/^\\d{4}-\\d{2}-\\d{2}$/.test(normalizeDateForApi(expenseDate))");
all("/^\\d{4}-\\d{2}-\\d{2}$/.test(editDate)", "/^\\d{4}-\\d{2}-\\d{2}$/.test(normalizeDateForApi(editDate))");
all("{item.expense_date} - {item.description || 'بدون ملاحظة'}", "{displayDate(item.expense_date)} - {displayTextDates(item.description) || 'بدون ملاحظة'}");
all("{item.payment_date} - {item.notes || item.method || 'دفعة'}", "{displayDate(item.payment_date)} - {displayTextDates(item.notes || item.method) || 'دفعة'}");
all("value={dashboard?.building?.annual_cycle_starts_on || '-'}", "value={displayDate(dashboard?.building?.annual_cycle_starts_on)}");
all("const cycle = dashboard?.building?.annual_cycle_starts_on || 'غير محدد';", "const cycle = displayDate(dashboard?.building?.annual_cycle_starts_on, 'غير محدد');");

fs.writeFileSync(appPath, content);
console.log('Final date rule applied: visible dd/mm/yyyy, API yyyy-mm-dd');
