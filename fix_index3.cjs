const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const startMarker = "    <!-- Modal Correos Pendentes -->";
const startIndex = code.indexOf(startMarker);

// Find the </body> immediately following the script
const scriptEndIndex = code.indexOf('</script>', startIndex);
const bodyIndex = code.indexOf('</body>', scriptEndIndex);

if (startIndex !== -1 && bodyIndex !== -1) {
    const chunk = code.substring(startIndex, bodyIndex + 7);
    code = code.substring(0, startIndex) + "</body>" + code.substring(bodyIndex + 7);
    
    const lastBodyIndex = code.lastIndexOf('</body>');
    code = code.substring(0, lastBodyIndex) + chunk.replace(/<\/body>$/, '') + "\n</body>\n" + code.substring(lastBodyIndex + 7);
    
    fs.writeFileSync('index.html', code);
    console.log("Fixed index.html completely!");
} else {
    console.log("Failed again.");
}
