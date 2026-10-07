const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

const filterRegex = /if \(!sender\.includes\('complexoxacobeo@gmail\.com'\) &&[\s\S]*?!sender\.includes\('expedia'\)\) \{/s;
const newFilter = `if (!sender.includes('complexoxacobeo@gmail.com') && !sender.includes('no-reply') && !sender.includes('noreply')) {`;

if (code.match(filterRegex)) {
    code = code.replace(filterRegex, newFilter);
    fs.writeFileSync('src/firebase-backend.js', code);
    console.log("Relaxed email filters!");
} else {
    console.log("Could not find email filters.");
}
