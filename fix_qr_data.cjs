const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetStr = `if (dayData && dayData.daily && dayData.daily.rooms) {
                        appState.dailyData[date] = dayData.daily.rooms;
                    }`;
const replaceStr = `if (dayData && dayData.dayData) {
                        appState.dailyData[date] = dayData.dayData;
                    }`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('index.html', code);
