const fs = require('fs');
const file = 'src/utils/auth.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/redirectTo: \`\$\{window\.location\.origin\}\/dashboard\`,/g, 'redirectTo: \`${window.location.origin}/pin-setup\`,');
fs.writeFileSync(file, content);
console.log('Done replacing auth.ts');
