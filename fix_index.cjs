const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// The injected modal starts with "    <!-- Modal Correos Pendentes -->"
// and the script ends with "    </script>\n</body>" 
// We want to extract this chunk and put it at the end.
const startMarker = "    <!-- Modal Correos Pendentes -->";
const endMarker = "    </script>\n</body>";

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const chunk = code.substring(startIndex, endIndex + endMarker.length);
    code = code.substring(0, startIndex) + "</body>" + code.substring(endIndex + endMarker.length);
    
    // Now replace the LAST </body> with the chunk
    const lastBodyIndex = code.lastIndexOf('</body>');
    code = code.substring(0, lastBodyIndex) + chunk.replace('</body>', '') + "\n</body>\n" + code.substring(lastBodyIndex + 7);
    
    fs.writeFileSync('index.html', code);
    console.log("Fixed index.html!");
} else {
    console.log("Could not find markers.");
}
