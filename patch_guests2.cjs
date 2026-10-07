const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(
    /uRoom\.guests = \(baseRoom && baseRoom\.type === 'hostel'\) \? 1 : \(res\.guests \|\| ri\.qty \|\| 1\);/g,
    "uRoom.guests = (baseRoom && baseRoom.type === 'hostel') ? 1 : (ri.pax || res.pax || res.guests || ri.qty || 1);"
);

fs.writeFileSync('index.html', code);
console.log("Guests 2 patched!");
