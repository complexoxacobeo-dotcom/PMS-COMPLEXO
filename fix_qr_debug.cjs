const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetStr = `
            try {
                if (!appState.dailyData) appState.dailyData = {};
                
                // If we don't have the data, try to fetch it from backend
                if (!appState.dailyData[date] && typeof firebaseBackend !== 'undefined') {
                    document.getElementById('qrStatusBox').innerText = "Cargando datos da habitación...";
                    const dayData = await firebaseBackend.getInitialData(date);
                    if (dayData && dayData.dayData) {
                        appState.dailyData[date] = dayData.dayData;
                    }
                }`;

const replaceStr = `
            try {
                if (!appState.dailyData) appState.dailyData = {};
                
                // If we don't have the data, try to fetch it from backend
                if (!appState.dailyData[date] && typeof firebaseBackend !== 'undefined') {
                    document.getElementById('qrStatusBox').innerText = "Cargando datos da habitación...";
                    const dayData = await firebaseBackend.getInitialData(date);
                    if (dayData && dayData.dayData) {
                        appState.dailyData[date] = dayData.dayData;
                    }
                }
                
                // Extra fallback if we still don't have the specific room (could be from another establishment)
                if (appState.dailyData[date] && !appState.dailyData[date].find(r => r.id === roomId)) {
                     // try to look inside config.baseRooms or something if necessary? 
                }`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('index.html', code);
