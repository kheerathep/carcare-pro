const fs = require('fs');
const file = 'src/pages/Register.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/navigate\('\/dashboard', \{ replace: true \}\);/g, "navigate('/pin-setup', { replace: true });");
fs.writeFileSync(file, content);
console.log('Done replacing Register.tsx');
