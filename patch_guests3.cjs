const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(
    /uRoom\.guests = res\.guests \|\| 1;/g,
    "uRoom.guests = (ri.pax || res.pax || res.guests || ri.qty || 1);"
);

fs.writeFileSync('index.html', code);
console.log("Guests 3 patched!");
