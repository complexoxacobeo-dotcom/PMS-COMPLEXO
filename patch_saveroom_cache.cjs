const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /if\(mainMultiSelectModeActive\) toggleMainMultiSelect\(\);/g;
const replaceWith = `
            // Clear local cache for all other days so they refresh from the server after saving
            Object.keys(appState.dailyData).forEach(k => {
                if (k !== currentPlaningDate) delete appState.dailyData[k];
            });
            if(mainMultiSelectModeActive) toggleMainMultiSelect();
`;
html = html.replace(regex, replaceWith);

fs.writeFileSync('index.html', html);
console.log("Patched saveRoom cache clearing");
