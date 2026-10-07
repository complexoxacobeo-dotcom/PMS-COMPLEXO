const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const searchRegex = /\/\/ QUICK CHECK: DOES THIS EXACT RESERVATION ALREADY EXIST\?[\s\S]*?if \(alreadyExists\) \{\s*console\.log\("Skipping already existing reservation:", res\.clientName\);\s*continue;\s*\}/m;

const newLogic = `// QUICK CHECK: DOES THIS EXACT RESERVATION ALREADY EXIST?
                    let alreadyExists = true;
                    for (let ri of res.rooms) {
                        let baseRoom = appState.baseRooms.find(br => br.id === ri.baseRoomId);
                        if (!baseRoom) continue;
                        
                        let targetClientName = (res.clientName || '').trim().toLowerCase();
                        let otaName = (res.ota || '').trim().toLowerCase();
                        
                        if (baseRoom.type === 'hostel') {
                            let qty = ri.qty || 1;
                            let matchingBeds = dayData.filter(r => r.baseId === baseRoom.id && r.clientName && (r.clientName.trim().toLowerCase().includes(targetClientName) || targetClientName.includes(r.clientName.trim().toLowerCase())) && r.status !== 'free');
                            if (matchingBeds.length < qty) {
                                alreadyExists = false; break;
                            }
                        } else {
                            let matchingRoom = dayData.find(r => r.baseId === baseRoom.id && r.status !== 'free' && r.clientName && (r.clientName.trim().toLowerCase().includes(targetClientName) || targetClientName.includes(r.clientName.trim().toLowerCase())));
                            if (!matchingRoom) {
                                alreadyExists = false; break;
                            }
                        }
                    }

                    if (alreadyExists) {
                        console.log("Skipping already existing reservation:", res.clientName);
                        continue;
                    }

                    // ALSO CHECK IF ROOMS ARE ALREADY OCCUPIED BY SOMEONE ELSE TO AVOID OVERWRITING REAL RESERVATIONS
                    let roomConflict = false;
                    for (let ri of res.rooms) {
                        let baseRoom = appState.baseRooms.find(br => br.id === ri.baseRoomId);
                        if (!baseRoom || baseRoom.type === 'hostel') continue;
                        
                        let existingRoom = dayData.find(r => r.baseId === baseRoom.id);
                        if (existingRoom && existingRoom.status !== 'free') {
                            // It is occupied. Is it a ghost block?
                            let cName = (existingRoom.clientName || '').toLowerCase();
                            let isGhost = existingRoom.isIcal || cName.includes('verifica') || cName.includes('misterplan') || cName.includes('force_update') || cName.includes('reserv');
                            if (!isGhost) {
                                // Real reservation is there, don't overwrite!
                                roomConflict = true;
                                break;
                            }
                        }
                    }

                    if (roomConflict) {
                        console.log("Skipping reservation because room is already occupied by a real reservation:", res.clientName);
                        continue;
                    }`;

html = html.replace(searchRegex, newLogic);

fs.writeFileSync('index.html', html);
console.log("Patched AI duplication logic");
