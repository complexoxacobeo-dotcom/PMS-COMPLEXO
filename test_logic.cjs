const fs = require('fs');
let indexCode = fs.readFileSync('index.html', 'utf8');

const regex = /let isTriacastela = lowerBody\.includes\("triacastela"\)[\s\S]*?let customTagStyle = "";/m;
const match = indexCode.match(regex);
if (match) {
    console.log(match[0]);
} else {
    console.log("Not found");
}
