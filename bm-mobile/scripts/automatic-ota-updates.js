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

if (!source.includes("import * as Updates from 'expo-updates';")) {
  replaceOnce(
    "import { StatusBar } from 'expo-status-bar';\n",
    "import { StatusBar } from 'expo-status-bar';\nimport * as Updates from 'expo-updates';\n"
  );
}

if (!source.includes('function useAutomaticOtaUpdates()')) {
  const marker = 'function LoadingScreen() {';
  const helper = `function useAutomaticOtaUpdates() {\n  useEffect(() => {\n    if (__DEV__ || !Updates.isEnabled) return undefined;\n\n    let alive = true;\n    let checking = false;\n    let lastCheckAt = 0;\n\n    const checkAndApply = async () => {\n      const now = Date.now();\n      if (!alive || checking || now - lastCheckAt < 30000) return;\n      checking = true;\n      lastCheckAt = now;\n      try {\n        const result = await Updates.checkForUpdateAsync();\n        if (alive && result.isAvailable) {\n          await Updates.fetchUpdateAsync();\n          if (alive) await Updates.reloadAsync();\n        }\n      } catch (error) {\n        console.warn('BM automatic update check failed', error?.message || error);\n      } finally {\n        checking = false;\n      }\n    };\n\n    checkAndApply();\n    const { AppState } = require('react-native');\n    const subscription = AppState.addEventListener('change', (state) => {\n      if (state === 'active') checkAndApply();\n    });\n    const timer = setInterval(checkAndApply, 30 * 60 * 1000);\n\n    return () => {\n      alive = false;\n      clearInterval(timer);\n      subscription?.remove?.();\n    };\n  }, []);\n}\n\n`;
  if (source.includes(marker)) {
    source = source.replace(marker, helper + marker);
    changed = true;
  }
}

if (!source.includes('useAutomaticOtaUpdates(); const [token')) {
  replaceOnce(
    'export default function App() { const [token, setToken] = useState(null);',
    'export default function App() { useAutomaticOtaUpdates(); const [token, setToken] = useState(null);'
  );
  replaceOnce(
    'export default function App() { const [iconFontsLoaded, iconFontsError] = useFonts({ ...Ionicons.font, ...MaterialCommunityIcons.font }); const [token, setToken] = useState(null);',
    'export default function App() { useAutomaticOtaUpdates(); const [iconFontsLoaded, iconFontsError] = useFonts({ ...Ionicons.font, ...MaterialCommunityIcons.font }); const [token, setToken] = useState(null);'
  );
}

if (changed) {
  fs.writeFileSync(appPath, source);
  console.log('Applied automatic OTA update logic.');
} else {
  console.log('Automatic OTA update logic is already applied.');
}
