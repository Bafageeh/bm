const fs = require('fs');
const path = require('path');

const appPath = path.resolve(__dirname, '..', 'App.js');
let source = fs.readFileSync(appPath, 'utf8');
let changed = false;

function replaceOnce(searchValue, replaceValue) {
  if (source.includes(searchValue)) {
    source = source.replace(searchValue, replaceValue);
    changed = true;
  }
}

if (!source.includes("from 'expo-notifications'")) {
  replaceOnce(
    "import * as SecureStore from 'expo-secure-store';",
    "import * as SecureStore from 'expo-secure-store';\nimport * as Notifications from 'expo-notifications';"
  );
}

if (!source.includes('const NOTIFICATION_CHANNEL_ID')) {
  replaceOnce(
    "I18nManager.forceRTL(false);\n",
    `I18nManager.forceRTL(false);\n\nconst NOTIFICATION_CHANNEL_ID = 'bm-main-alerts';\n\nNotifications.setNotificationHandler({\n  handleNotification: async () => ({\n    shouldShowAlert: true,\n    shouldShowBanner: true,\n    shouldShowList: true,\n    shouldPlaySound: true,\n    shouldSetBadge: false,\n  }),\n});\n\nasync function prepareNotifications() {\n  try {\n    if (Platform.OS === 'android') {\n      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {\n        name: 'تنبيهات اتحاد الملاك',\n        importance: Notifications.AndroidImportance.MAX,\n        vibrationPattern: [0, 250, 250, 250],\n        lightColor: '#0f766e',\n        sound: 'default',\n        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,\n      });\n    }\n\n    const current = await Notifications.getPermissionsAsync();\n    const finalStatus = current.status === 'granted' ? current.status : (await Notifications.requestPermissionsAsync()).status;\n    return finalStatus === 'granted';\n  } catch (error) {\n    console.warn('BM notifications setup failed', error?.message || error);\n    return false;\n  }\n}\n\nasync function notifyLocal(title, body) {\n  try {\n    await Notifications.scheduleNotificationAsync({\n      content: {\n        title,\n        body,\n        sound: 'default',\n        priority: Notifications.AndroidNotificationPriority.MAX,\n      },\n      trigger: null,\n    });\n  } catch (_) {\n    Alert.alert(title, body);\n  }\n}\n`
  );
}

const oldHeader = `function Header({ title, subtitle, onLogout, onBack }) {\n  return <View style={styles.header}><View style={styles.headerActions}>{onBack ? <Pressable onPress={onBack} style={styles.circleBtn}><Ionicons name="arrow-forward" size={20} color="#0f172a" /></Pressable> : null}{onLogout ? <Pressable onPress={onLogout} style={styles.circleBtn}><Ionicons name="log-out-outline" size={20} color="#ef4444" /></Pressable> : null}</View><View style={styles.flex1}><Text style={styles.headerTitle}>{title}</Text>{subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}</View></View>;\n}`;

if (!source.includes('function HeaderIconButton')) {
  replaceOnce(
    oldHeader,
    `function Header({ title, subtitle, onLogout, onBack }) {\n  return <View style={styles.header}><View style={styles.headerActions}>{onBack ? <HeaderIconButton icon="arrow-right" color="#0f766e" label="رجوع" onPress={onBack} /> : null}<HeaderIconButton icon="bell-ring-outline" color="#7c3aed" label="تنبيه" onPress={() => notifyLocal('التنبيهات جاهزة', 'تم تفعيل مكتبة التنبيهات لاستخدامها مستقبلاً.')} />{onLogout ? <HeaderIconButton icon="logout-variant" color="#ef4444" label="خروج" onPress={onLogout} /> : null}</View><View style={styles.flex1}><Text style={styles.headerTitle}>{title}</Text>{subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}</View></View>;\n}\nfunction HeaderIconButton({ icon, color, label, onPress }) {\n  return <Pressable onPress={onPress} accessibilityLabel={label} style={({ pressed }) => [styles.circleBtn, pressed && styles.pressed]}><MaterialCommunityIcons name={icon} size={23} color={color} /><Text style={styles.circleBtnLabel}>{label}</Text></Pressable>;\n}`
  );
}

if (source.includes('const [booting, setBooting] = useState(true); useEffect(() => { SecureStore')) {
  replaceOnce(
    'const [booting, setBooting] = useState(true); useEffect(() => { SecureStore',
    'const [booting, setBooting] = useState(true); useEffect(() => { prepareNotifications(); }, []); useEffect(() => { SecureStore'
  );
}

replaceOnce(
  '<Ionicons name="ellipsis-vertical" size={20} color="#0f172a" />',
  '<MaterialCommunityIcons name="dots-vertical-circle-outline" size={24} color="#0f766e" />'
);
replaceOnce(
  '<Ionicons name="person" size={20} color="#0f766e" />',
  '<MaterialCommunityIcons name="account-circle-outline" size={22} color="#0f766e" />'
);

replaceOnce(
  "circleBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }, headerTitle:",
  "circleBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }, circleBtnLabel: { fontSize: 9, color: '#64748b', fontWeight: '900', marginTop: 1 }, headerTitle:"
);

replaceOnce(
  "ownerCardMenuButton: { position: 'absolute', top: 12, left: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', zIndex: 20 }",
  "ownerCardMenuButton: { position: 'absolute', top: 11, left: 12, width: 42, height: 42, borderRadius: 21, backgroundColor: '#ecfeff', borderWidth: 1, borderColor: '#a7f3d0', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, zIndex: 20 }"
);

if (changed) {
  fs.writeFileSync(appPath, source);
  console.log('Applied BM beautiful icons and notifications patch.');
} else {
  console.log('BM beautiful icons and notifications patch is already applied.');
}
