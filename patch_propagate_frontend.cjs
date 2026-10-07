const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /\/\/ MERGE TO LOCAL STATE\s*let existingIdx = dayData\.findIndex\(d => d\.id === uRoom\.id\);\s*if \(existingIdx > -1\) \{\s*dayData\[existingIdx\] = uRoom;\s*\} else \{\s*dayData\.push\(uRoom\);\s*\}/g;

const replaceWith = `
                            // We will do the multi-day merge after the rooms loop!
                            // Just tracking it here.
                            let existingIdx = dayData.findIndex(d => d.id === uRoom.id);
                            if (existingIdx > -1) {
                                dayData[existingIdx] = uRoom;
                            } else {
                                dayData.push(uRoom);
                            }
`;
html = html.replace(regex, replaceWith);

const regex2 = /\/\/ We must save the local state BEFORE propagarReserva, just in case!\s*appState\.dailyData\[res\.checkIn\] = dayData;\s*\/\/ But wait! If we do saving here, it might get overwritten by propagarReserva\. Let's just do it directly\.\s*if \(typeof google === 'undefined' \|\| !google\.script\) \{\s*if \(res\.checkIn === currentPlaningDate\) salvarDiaNoServidor\(\);\s*\}/g;

const replaceWith2 = `
                        // We must save the local state BEFORE propagarReserva, just in case!
                        
                        // LOCAL MULTI-DAY PROPAGATION
                        let inDate = new Date(res.checkIn);
                        let outDate = new Date(res.checkOut);
                        if (isNaN(inDate.getTime()) || isNaN(outDate.getTime()) || outDate <= inDate) {
                            outDate = new Date(inDate);
                            outDate.setDate(outDate.getDate() + 1);
                        }
                        
                        let iterD = new Date(inDate);
                        while(iterD < outDate) {
                            let dStr = iterD.toISOString().split('T')[0];
                            if (!appState.dailyData[dStr]) {
                                // Basic generation if missing
                                appState.dailyData[dStr] = [];
                                appState.baseRooms.forEach(base => {
                                    if (base.type === 'hostel') {
                                        for (let i = 1; i <= (base.totalBeds || 16); i++) {
                                            let bedCode = Math.ceil(i/2) + (i%2===0?'A':'B');
                                            let newBed = createEmptyRoomObject(base.id, base.number, base.roomName, 'bed', bedCode);
                                            newBed.price = base.bedPrice || 15;
                                            appState.dailyData[dStr].push(newBed);
                                        }
                                    } else {
                                        appState.dailyData[dStr].push(createEmptyRoomObject(base.id, base.number, base.roomName, base.type));
                                    }
                                });
                            }
                            
                            // Merge updatedRooms into this day
                            for (let uRoom of updatedRooms) {
                                let idx = appState.dailyData[dStr].findIndex(d => d.id === uRoom.id);
                                if (idx > -1) {
                                    appState.dailyData[dStr][idx] = JSON.parse(JSON.stringify(uRoom));
                                } else {
                                    appState.dailyData[dStr].push(JSON.parse(JSON.stringify(uRoom)));
                                }
                            }
                            
                            if (typeof google === 'undefined' || !google.script) {
                                if (dStr === currentPlaningDate) salvarDiaNoServidor();
                            }
                            iterD.setDate(iterD.getDate() + 1);
                        }
                        
                        appState.dailyData[res.checkIn] = dayData; // keep dayData ref intact for this day just in case
`;
html = html.replace(regex2, replaceWith2);

fs.writeFileSync('index.html', html);
console.log("Patched local propagation");
