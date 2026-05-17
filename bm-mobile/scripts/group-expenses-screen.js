const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.js');
let content = fs.readFileSync(appPath, 'utf8');

if (content.includes('expenseCategoryDetailsVisible')) {
  console.log('Grouped expenses screen already applied.');
} else {
  console.log('Grouped expenses screen patch pending.');
}
