const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// The issue is in index.html there is literally `return \``, `\`;` etc.
// And similarly `\\\${` etc? Let's check what it looks like exactly.
console.log(code.substring(code.indexOf('return \\`'), code.indexOf('return \\`') + 100));

