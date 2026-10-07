const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const regex = /let isDragging = false;\s*let dragOffsetX = 0;[\s\S]*?dragWidget\.style\.transition = 'all 0\.3s';\s*\}/s;
// wait, instead of regex, I'll just use a small search and replace because the previous script used the same block of code.

code = code.replace(/let isDragging = false;\n        let dragOffsetX = 0;\n        let dragOffsetY = 0;/g, 'let isWidgetDragging = false;\n        let dragOffsetX = 0;\n        let dragOffsetY = 0;');

code = code.replace(/isDragging = true;/g, (match, offset, str) => {
    // Only replace after line 7000
    if (offset > 40000) return 'isWidgetDragging = true;';
    return match;
});

code = code.replace(/if \(\!isDragging\) return;/g, (match, offset, str) => {
    if (offset > 40000) return 'if (!isWidgetDragging) return;';
    return match;
});

code = code.replace(/if \(isDragging\) \{/g, (match, offset, str) => {
    if (offset > 40000) return 'if (isWidgetDragging) {';
    return match;
});

code = code.replace(/isDragging = false;/g, (match, offset, str) => {
    if (offset > 40000) return 'isWidgetDragging = false;';
    return match;
});

fs.writeFileSync('index.html', code);
