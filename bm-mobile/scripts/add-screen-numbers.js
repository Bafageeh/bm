const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let content = fs.readFileSync(appPath, 'utf8');

if (!content.includes('function ScreenCode(')) {
  content = content.replace(
    "function IconCard({ icon, family = 'ion', title, value, tone = 'default' }) {",
    "function ScreenCode({ code }) {\n  return (\n    <View style={styles.screenCodeBadge}>\n      <Text style={styles.screenCodeText}>{code}</Text>\n    </View>\n  );\n}\n\nfunction IconCard({ icon, family = 'ion', title, value, tone = 'default' }) {"
  );
}

const replacements = [
  ["<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginContent}>", "<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginContent}>\n        <ScreenCode code=\"#S-001\" />"],
  ["contentContainerStyle={styles.listContent}\n        data={user?.buildings || []}", "contentContainerStyle={styles.listContent}\n        data={user?.buildings || []}\n        ListHeaderComponent={<ScreenCode code=\"#S-002\" />}"],
  ["<ScrollView contentContainerStyle={styles.screenContent}>\n      <View style={styles.heroCard}>", "<ScrollView contentContainerStyle={styles.screenContent}>\n      <ScreenCode code=\"#S-003\" />\n      <View style={styles.heroCard}>"],
  ["<ScrollView contentContainerStyle={styles.screenContent}>\n      <SectionTitle icon=\"add-circle-outline\" title=\"إضافة مصروف\" />", "<ScrollView contentContainerStyle={styles.screenContent}>\n      <ScreenCode code=\"#S-007\" />\n      <SectionTitle icon=\"add-circle-outline\" title=\"إضافة مصروف\" />"],
  ["<ScrollView contentContainerStyle={styles.screenContent}>\n      <SectionTitle icon=\"card-outline\" title=\"تسجيل دفعة مالك\" />", "<ScrollView contentContainerStyle={styles.screenContent}>\n      <ScreenCode code=\"#S-008\" />\n      <SectionTitle icon=\"card-outline\" title=\"تسجيل دفعة مالك\" />"],
  ["<View style={styles.screenCodeBadge}>\n          <Text style={styles.screenCodeText}>#S-001</Text>\n        </View>", "<ScreenCode code=\"#S-004\" />"],
  ["<Text style={styles.screenCodeText}>{editingOwner ? '#S-003' : '#S-002'}</Text>", "<Text style={styles.screenCodeText}>{editingOwner ? '#S-006' : '#S-005'}</Text>"],
  ["<Dashboard dashboard={{ building: profile.building, stats: {}, owners: [profile.summary] }} />", "<ScreenCode code=\"#S-009\" />\n      <Dashboard dashboard={{ building: profile.building, stats: {}, owners: [profile.summary] }} />"],
];

for (const [from, to] of replacements) {
  if (content.includes(from) && !content.includes(to)) {
    content = content.replace(from, to);
  }
}

fs.writeFileSync(appPath, content);
console.log('Screen numbers injected into App.js');
