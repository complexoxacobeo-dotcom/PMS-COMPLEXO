const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Remove the floating widget HTML and Script that was wrongly inserted
const badWidgetHtml = /<!-- Floating Draggable Widget for Pending Emails -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const match1 = code.match(badWidgetHtml);
if(match1) {
    code = code.replace(match1[0], '</body>');
}

const badScriptHtml = /<script>\s*\/\/ Minimize\/Maximize[\s\S]*?<\/script>/;
const match2 = code.match(badScriptHtml);
if(match2) {
    // Note: the second replacement replaced another </body> or the same one?
    // In my script I did code = code.replace('</body>', scriptHTML + '\n</body>');
    // So the second one also replaced the FIRST </body> again!
    // So </body> is currently after the script. Let's just remove the script.
    code = code.replace(match2[0], '');
}

fs.writeFileSync('index.html', code);
console.log("Cleaned up bad insertion.");
