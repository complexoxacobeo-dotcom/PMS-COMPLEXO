const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Remove the erroneous </div> that appears right before the voiceModal button
code = code.replace(/<\/div>\s*<button onclick="document\.getElementById\('voiceModal'\)\.classList\.add\('active'\);"/g, 
`<button onclick="document.getElementById('voiceModal').classList.add('active');"`);

// Add the closing div after the Admin button
code = code.replace(/<button onclick="openAdmin\(\)".*?<\/button>\s*/s, (match) => {
  return match + '</div>\n';
});

fs.writeFileSync('index.html', code);
console.log("Layout patched part 3!");
