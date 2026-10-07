const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const startMarker = "    <!-- Modal Correos Pendentes -->";
const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf("</html>`;", startIndex); // This is where the old string ended. Wait, let me find the exact end of my injected block.

// My injected block ends with "}, 3000);\n    </script>\n</body>"
const exactEnd = "}, 3000);\n    </script>\n</body>";
const exactEndIndex = code.indexOf(exactEnd);

if (startIndex !== -1 && exactEndIndex !== -1) {
    const totalLength = exactEndIndex + exactEnd.length;
    const chunk = code.substring(startIndex, totalLength);
    
    // Replace the extracted chunk with </body>
    code = code.substring(0, startIndex) + "</body>" + code.substring(totalLength);
    
    const lastBodyIndex = code.lastIndexOf('</body>');
    code = code.substring(0, lastBodyIndex) + chunk.replace(/<\/body>$/, '') + "\n</body>\n" + code.substring(lastBodyIndex + 7);
    
    fs.writeFileSync('index.html', code);
    console.log("Fixed index.html!");
} else {
    console.log("Could not find exact end.");
}
