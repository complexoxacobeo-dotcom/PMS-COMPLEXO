const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetStr = `// Try to find local room name if available
            let rName = roomId;
            let cName = "Hóspede";
            if (appState.dailyData && appState.dailyData[date]) {
                const rm = appState.dailyData[date].find(r => r.id === roomId);
                if (rm) {
                    rName = rm.bedId ? rm.number+'-'+rm.bedId : rm.number;
                    cName = rm.clientName || cName;
                }
            }`;

const replaceStr = `// Try to find local room name if available
            let rName = roomId;
            let cName = "Hóspede";
            
            try {
                if (!appState.dailyData) appState.dailyData = {};
                
                // If we don't have the data, try to fetch it from backend
                if (!appState.dailyData[date] && typeof firebaseBackend !== 'undefined') {
                    document.getElementById('qrStatusBox').innerText = "Cargando datos da habitación...";
                    const dayData = await firebaseBackend.getInitialData(date);
                    if (dayData && dayData.daily && dayData.daily.rooms) {
                        appState.dailyData[date] = dayData.daily.rooms;
                    }
                }
                
                if (appState.dailyData[date]) {
                    const rm = appState.dailyData[date].find(r => r.id === roomId);
                    if (rm) {
                        rName = rm.bedId ? rm.number+'-'+rm.bedId : rm.number;
                        cName = rm.clientName || cName;
                    }
                }
            } catch (e) {
                console.warn("Failed to fetch day data for QR:", e);
            }`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('index.html', code);
