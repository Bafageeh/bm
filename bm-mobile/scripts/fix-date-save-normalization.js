const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let content = fs.readFileSync(appPath, 'utf8');

const screenCodeLine = "function ScreenCode({ code }) { return <View style={styles.screenCodeBadge}><Text style={styles.screenCodeText}>{code}</Text></View>; }";
const helper = `
function normalizeDateForApi(value) {
  const text = String(value || '').trim();
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(text)) return text;
  const ddmmyyyy = text.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return year + '-' + month + '-' + day;
  }
  return text;
}`;

if (!content.includes('function normalizeDateForApi(')) {
  if (!content.includes(screenCodeLine)) throw new Error('ScreenCode anchor not found');
  content = content.replace(screenCodeLine, screenCodeLine + helper);
}

content = content.replace(
  "if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(expenseDate)) return Alert.alert('تنبيه', 'اختر تاريخ المصروف');",
  "if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(normalizeDateForApi(expenseDate))) return Alert.alert('تنبيه', 'اختر تاريخ المصروف');"
);
content = content.replace(
  "if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(editDate)) return Alert.alert('تنبيه', 'اختر تاريخ المصروف');",
  "if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(normalizeDateForApi(editDate))) return Alert.alert('تنبيه', 'اختر تاريخ المصروف');"
);
content = content.replaceAll('expense_date: expenseDate,', 'expense_date: normalizeDateForApi(expenseDate),');
content = content.replaceAll('expense_date: editDate,', 'expense_date: normalizeDateForApi(editDate),');
content = content.replaceAll('payment_date: paymentDate,', 'payment_date: normalizeDateForApi(paymentDate),');

fs.writeFileSync(appPath, content);
console.log('Date save normalization patched');
