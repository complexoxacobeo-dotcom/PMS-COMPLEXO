const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// The CSS tries to add padding-top to card-content, but !p-0 blocks it.
// Let's remove !p-0
code = code.replace('<div class="card-content !p-0 flex flex-col h-full w-full">', '<div class="card-content flex flex-col h-full w-full">');

// Also for hostels if they use it
code = code.replace('<div class="card-content !p-0 flex flex-col w-full h-full">', '<div class="card-content flex flex-col w-full h-full">');

fs.writeFileSync('index.html', code);
