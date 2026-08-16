const fs = require('fs');
const path = require('path');

const appPath = path.resolve(__dirname, '..', 'App.js');
let source = fs.readFileSync(appPath, 'utf8');
let changed = false;

function replaceAll(searchValue, replaceValue) {
  if (source.includes(searchValue)) {
    source = source.split(searchValue).join(replaceValue);
    changed = true;
  }
}

// Remove font-backed icon imports. Some Android release devices fail to render
// the bundled icon font even though the surrounding icon containers render.
replaceAll("import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';\n", '');
replaceAll("import { useFonts } from 'expo-font';\n", '');

// Remove the icon-font preload that the beautify patch may have injected.
replaceAll(
  "export default function App() { const [iconFontsLoaded, iconFontsError] = useFonts({ ...Ionicons.font, ...MaterialCommunityIcons.font }); const [token, setToken] = useState(null);",
  "export default function App() { const [token, setToken] = useState(null);"
);
replaceAll(
  "if (!iconFontsLoaded && !iconFontsError) return <SafeAreaProvider><LoadingScreen /></SafeAreaProvider>; if (iconFontsError) console.warn('BM icon fonts failed to load', iconFontsError); ",
  ''
);

if (!source.includes('const SYSTEM_ICON_GLYPHS =')) {
  const anchor = 'I18nManager.forceRTL(false);\n';
  const systemIcons = `I18nManager.forceRTL(false);\n\n// Font-independent icons. These use normal system text glyphs, so they cannot\n// disappear because an icon font failed to load in a standalone Android APK.\nconst SYSTEM_ICON_GLYPHS = {\n  'arrow-forward': '←', 'arrow-forward-outline': '←', 'arrow-right': '←',\n  'chevron-back': '‹', 'chevron-forward': '›',\n  'log-in-outline': '↪', 'log-out-outline': '↩', 'logout-variant': '↩',\n  'bell-ring-outline': '!', 'notifications-outline': '!',\n  'calendar-outline': '▣', 'calendar': '▣',\n  'close': '×', 'close-outline': '×',\n  'business-outline': '▥', 'business': '▥', 'office-building-cog': '▥', 'home-city-outline': '▥', 'home-outline': '⌂',\n  'cash-outline': 'ر.س', 'wallet-outline': '▰', 'card-outline': '▰',\n  'receipt-outline': '≡', 'document-text-outline': '≡', 'list-outline': '≡',\n  'alert-circle-outline': '!', 'warning-outline': '!',\n  'people-outline': '◎', 'people': '◎', 'person': '●', 'person-outline': '○', 'account-circle-outline': '●',\n  'grid-outline': '▦', 'apps-outline': '▦',\n  'settings-outline': '⚙', 'cog-outline': '⚙',\n  'ellipsis-vertical': '⋮', 'dots-vertical-circle-outline': '⋮',\n  'add': '+', 'add-outline': '+', 'add-circle-outline': '+', 'plus': '+',\n  'create-outline': '✎', 'pencil-outline': '✎', 'edit-outline': '✎',\n  'trash-outline': '×', 'delete-outline': '×',\n  'search-outline': '⌕', 'search': '⌕',\n  'save-outline': '✓', 'checkmark': '✓', 'checkmark-circle-outline': '✓',\n  'eye-outline': '◉', 'information-circle-outline': 'i',\n  'call-outline': '☎', 'phone-outline': '☎',\n  'lock-closed-outline': '■', 'key-outline': '◆',\n  'download-outline': '↓', 'share-outline': '↗',\n  'refresh-outline': '↻', 'reload-outline': '↻',\n  'filter-outline': '▽', 'options-outline': '☰',\n  'menu': '☰', 'menu-outline': '☰',\n  'mail-outline': '@', 'chatbubble-outline': '□',\n  'camera-outline': '□', 'image-outline': '▧',\n  'location-outline': '◆', 'map-outline': '◇',\n  'time-outline': '◷', 'timer-outline': '◷'\n};\n\nfunction SystemIcon({ name, size = 20, color = '#0f172a', style }) {\n  const glyph = SYSTEM_ICON_GLYPHS[name] || '•';\n  const fontSize = Math.max(14, Number(size) || 20);\n  return <Text allowFontScaling={false} style={[{ fontSize, lineHeight: fontSize + 4, color, textAlign: 'center', fontWeight: '900', includeFontPadding: false, minWidth: fontSize + 4 }, style]}>{glyph}</Text>;\n}\nconst Ionicons = SystemIcon;\nconst MaterialCommunityIcons = SystemIcon;\n`;
  if (source.includes(anchor)) {
    source = source.replace(anchor, systemIcons);
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync(appPath, source);
  console.log('Applied font-independent system glyph icons.');
} else {
  console.log('System glyph icon fallback is already applied.');
}
