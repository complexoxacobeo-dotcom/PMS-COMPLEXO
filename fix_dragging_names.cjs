const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Change the first one back to isDragging
code = code.replace(/let isWidgetDragging = false;/i, 'let isDragging = false;');
code = code.replace(/if \(!isWidgetDragging\) return;/g, (match, offset) => offset < 40000 ? 'if (!isDragging) return;' : match);
code = code.replace(/isWidgetDragging = true;/g, (match, offset) => offset < 40000 ? 'isDragging = true;' : match);
code = code.replace(/isWidgetDragging = false;/g, (match, offset) => offset < 40000 ? 'isDragging = false;' : match);

fs.writeFileSync('index.html', code);
