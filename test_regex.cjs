const fs = require('fs');
const code = fs.readFileSync('index.html', 'utf8');

const regex = /let isTriacastela = lowerBody\.includes\("triacastela"\)[\s\S]*?\}\)\.join\(''\);/m;
if(code.match(regex)) {
    console.log("Matched!");
} else {
    console.log("Not matched.");
}
