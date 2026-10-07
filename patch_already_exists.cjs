const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const searchStr = `                    if (alreadyExists) {
                        console.log("Skipping already existing reservation:", res.clientName);
                        continue;
                    }`;

const replaceStr = `                    if (alreadyExists) {
                        console.log("Reservation already exists, merging notes and services:", res.clientName);
                        let updatedExisting = false;
                        for (let ri of res.rooms) {
                            let baseRoom = appState.baseRooms.find(br => br.id === ri.baseRoomId);
                            if (!baseRoom) continue;
                            
                            let targetClientName = (res.clientName || '').trim().toLowerCase();
                            
                            let matchingRooms = [];
                            if (baseRoom.type === 'hostel') {
                                matchingRooms = dayData.filter(r => r.baseId === baseRoom.id && r.status !== 'free' && r.clientName && (r.clientName.trim().toLowerCase().includes(targetClientName) || targetClientName.includes(r.clientName.trim().toLowerCase())));
                            } else {
                                let m = dayData.find(r => r.baseId === baseRoom.id && r.status !== 'free' && r.clientName && (r.clientName.trim().toLowerCase().includes(targetClientName) || targetClientName.includes(r.clientName.trim().toLowerCase())));
                                if (m) matchingRooms.push(m);
                            }
                            
                            for (let matchingRoom of matchingRooms) {
                                if (res.observations && (!matchingRoom.observations || !matchingRoom.observations.includes(res.observations))) {
                                    matchingRoom.observations = (matchingRoom.observations ? matchingRoom.observations + "\\n" : "") + res.observations;
                                    updatedExisting = true;
                                }
                                if (res.services) {
                                    if (res.services.breakfast?.qty > 0 && (!matchingRoom.services.breakfast || matchingRoom.services.breakfast.qty === 0)) {
                                         matchingRoom.services.breakfast = res.services.breakfast; updatedExisting = true;
                                    }
                                    if (res.services.halfBoard?.qty > 0 && (!matchingRoom.services.halfBoard || matchingRoom.services.halfBoard.qty === 0)) {
                                         matchingRoom.services.halfBoard = res.services.halfBoard; updatedExisting = true;
                                    }
                                    if (res.services.dinner?.qty > 0 && (!matchingRoom.services.dinner || matchingRoom.services.dinner.qty === 0)) {
                                         matchingRoom.services.dinner = res.services.dinner; updatedExisting = true;
                                    }
                                }
                                if (res.ota && (!matchingRoom.agency || matchingRoom.agency.trim() === '')) {
                                    matchingRoom.agency = res.ota;
                                    updatedExisting = true;
                                }
                            }
                        }
                        
                        if (updatedExisting) {
                            appState.dailyData[res.checkIn] = dayData;
                            if (typeof google === 'undefined' || !google.script) {
                                 if (res.checkIn === currentPlaningDate) salvarDiaNoServidor();
                            } else {
                                 const s = document.getElementById('saveStatus'); if(s) { s.classList.remove('hidden'); setTimeout(()=>s.classList.add('hidden'), 2000); }
                                 google.script.run.withSuccessHandler(()=>{
                                    console.log("Merged data saved to server");
                                 }).saveDayData(res.checkIn, JSON.stringify(dayData));
                            }
                        }
                        
                        continue;
                    }`;

html = html.replace(searchStr, replaceStr);
fs.writeFileSync('index.html', html);
console.log("Patched index.html alreadyExists logic");
