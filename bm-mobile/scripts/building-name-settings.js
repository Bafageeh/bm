const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'App.js');
let s = fs.readFileSync(file, 'utf8');
let changed = false;
function r(a, b) {
  if (s.includes(a)) {
    s = s.replace(a, b);
    changed = true;
  }
}

r(
  "function BuildingSettingsScreen({ token, buildingId, dashboard, reload, setTab }) {\n  const [apartmentCount, setApartmentCount] = useState(String(dashboard?.stats?.apartment_count || '')); const [annualCycleStartsOn, setAnnualCycleStartsOn] = useState(normalizeDateForApi(dashboard?.building?.annual_cycle_starts_on || todayDate())); const [loading, setLoading] = useState(false);",
  "function BuildingSettingsScreen({ token, buildingId, dashboard, reload, setTab }) {\n  const [buildingName, setBuildingName] = useState(dashboard?.building?.name || ''); const [apartmentCount, setApartmentCount] = useState(String(dashboard?.stats?.apartment_count || '')); const [annualCycleStartsOn, setAnnualCycleStartsOn] = useState(normalizeDateForApi(dashboard?.building?.annual_cycle_starts_on || todayDate())); const [loading, setLoading] = useState(false);"
);

r(
  "useEffect(() => { setApartmentCount(String(dashboard?.stats?.apartment_count || '')); setAnnualCycleStartsOn(normalizeDateForApi(dashboard?.building?.annual_cycle_starts_on || todayDate())); }, [dashboard?.stats?.apartment_count, dashboard?.building?.annual_cycle_starts_on]);",
  "useEffect(() => { setBuildingName(dashboard?.building?.name || ''); setApartmentCount(String(dashboard?.stats?.apartment_count || '')); setAnnualCycleStartsOn(normalizeDateForApi(dashboard?.building?.annual_cycle_starts_on || todayDate())); }, [dashboard?.building?.name, dashboard?.stats?.apartment_count, dashboard?.building?.annual_cycle_starts_on]);"
);

r(
  "const save = async () => { const count = Number(apartmentCount); const apiDate = normalizeDateForApi(annualCycleStartsOn); if (!Number.isInteger(count) || count < 0) return Alert.alert('تنبيه', 'أدخل عدد الشقق بشكل صحيح'); try { setLoading(true); await request(`/buildings/${buildingId}/apartment-count`, { method: 'PUT', body: JSON.stringify({ apartment_count: count, annual_cycle_starts_on: apiDate || null }) }, token); await reload(); Alert.alert('تم', 'تم حفظ إعدادات المبنى'); setTab('settings'); } catch (e) { Alert.alert('تعذر حفظ إعدادات المبنى', e.message); } finally { setLoading(false); } };",
  "const save = async () => { const count = Number(apartmentCount); const apiDate = normalizeDateForApi(annualCycleStartsOn); const nextName = String(buildingName || '').trim(); if (!nextName) return Alert.alert('تنبيه', 'أدخل اسم المبنى'); if (!Number.isInteger(count) || count < 0) return Alert.alert('تنبيه', 'أدخل عدد الشقق بشكل صحيح'); try { setLoading(true); await request(`/buildings/${buildingId}/apartment-count`, { method: 'PUT', body: JSON.stringify({ name: nextName, apartment_count: count, annual_cycle_starts_on: apiDate || null }) }, token); await reload(); Alert.alert('تم', 'تم حفظ إعدادات المبنى'); setTab('settings'); } catch (e) { Alert.alert('تعذر حفظ إعدادات المبنى', e.message); } finally { setLoading(false); } };"
);

r(
  "<View style={styles.formCard}><Field label=\"عدد الشقق\" value={apartmentCount}",
  "<View style={styles.formCard}><Field label=\"اسم المبنى\" value={buildingName} onChangeText={setBuildingName} placeholder=\"اسم المبنى\" /><Field label=\"عدد الشقق\" value={apartmentCount}"
);

r(
  "<Header title={selectedBuilding?.name || 'المبنى'} subtitle=\"إدارة اتحاد الملاك\" onLogout={onLogout} onBack={() => setSelectedBuilding(null)} />",
  "<Header title={tab === 'owners' ? 'إدارة الملاك' : dashboard?.building?.name || selectedBuilding?.name || 'المبنى'} subtitle=\"إدارة اتحاد الملاك\" onLogout={onLogout} onBack={() => setSelectedBuilding(null)} />"
);

if (changed) fs.writeFileSync(file, s);
console.log(changed ? 'building name settings applied' : 'no changes');
