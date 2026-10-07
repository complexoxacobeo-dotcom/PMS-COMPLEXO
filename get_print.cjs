const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/window\.printPlanningA4 = function\(\) \{[\s\S]*?printWindow\.document\.close\(\);\s*\};/);
if (match) {
    fs.writeFileSync('print_func.txt', match[0]);
    console.log('Saved');
} else {
    console.log('Not found');
}
