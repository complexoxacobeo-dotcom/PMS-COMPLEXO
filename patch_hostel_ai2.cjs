const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /for\s*\(let\s*ri\s*of\s*res\.rooms\)\s*\{\s*let\s*baseRoom\s*=\s*appState\.baseRooms\.find\(br\s*=>\s*br\.id\s*===\s*ri\.baseRoomId\);\s*if\s*\(!baseRoom\)\s*continue;\s*if\s*\(baseRoom\.type\s*===\s*'hostel'\)\s*\{[\s\S]*?\}\s*else\s*\{[\s\S]*?updatedRooms\.push\(uRoom\);\s*\}\s*\}/g;

const newLoop = `
                    for (let ri of res.rooms) {
                        let baseRoom = null;
                        if (ri.baseRoomId) {
                            baseRoom = appState.baseRooms.find(br => br.id === ri.baseRoomId);
                        } else if (ri.qty > 0 && ri.rawName && (ri.rawName.toLowerCase().includes('cama') || ri.rawName.toLowerCase().includes('liter') || ri.rawName.toLowerCase().includes('albergue') || ri.rawName.toLowerCase().includes('compartida'))) {
                            baseRoom = appState.baseRooms.find(br => br.type === 'hostel');
                        }
                        
                        if (!baseRoom) continue;
                        
                        let o = res.ota || '';
                        if(o.toLowerCase().includes('booking')) o = 'Booking.com';
                        else if(o.toLowerCase().includes('hostelworld')) o = 'HostelWorld';
                        else if(o.toLowerCase().includes('pitchup')) o = 'Pitchup';
                        else if(o.toLowerCase().includes('expedia')) o = 'Expedia';
                        else if(o.toLowerCase().includes('airbnb')) o = 'Airbnb';
                        else {
                            let oLower = o.trim().toLowerCase();
                            if(oLower && appState && appState.agencies) {
                                let bestMatch = appState.agencies.find(a => oLower.includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(oLower));
                                if(bestMatch) o = bestMatch.name;
                            }
                        }
                        
                        if (baseRoom.type === 'hostel') {
                            let qty = ri.qty || 1;
                            let allHostelBases = appState.baseRooms.filter(br => br.type === 'hostel');
                            let allAvailableBeds = [];
                            
                            for (let hb of allHostelBases) {
                                let beds = dayData.filter(r => r.baseId === hb.id);
                                if (beds.length === 0) {
                                    for (let i = 1; i <= (hb.totalBeds || 16); i++) {
                                        let literaNum = Math.ceil(i / 2);
                                        let isTop = (i % 2 === 0);
                                        let bedCode = \`\${literaNum}\${isTop ? 'A' : 'B'}\`;
                                        beds.push({ id: \`\${hb.id}_\${bedCode}\`, bedId: bedCode, status: 'free', baseId: hb.id });
                                    }
                                }
                                
                                let icalBeds = beds.filter(b => b.status !== 'free' && (b.isIcal || (b.clientName && (b.clientName.includes('Verifica') || b.clientName.includes('misterplan') || b.clientName.includes('FORCE_UPDATE') || b.clientName.includes('Reserv')))));
                                for (let ib of icalBeds) {
                                    let freeRoom = createEmptyRoomObject(hb.id, hb.number, hb.roomName, 'bed', ib.bedId);
                                    freeRoom.status = 'free';
                                    freeRoom.clientName = '';
                                    updatedRooms.push(freeRoom);
                                    ib.status = 'free';
                                    ib.clientName = '';
                                }
                                
                                let availableInThisRoom = beds.filter(b => b.status === 'free' || !b.clientName);
                                availableInThisRoom.forEach(b => b._hb = hb);
                                allAvailableBeds.push(...availableInThisRoom);
                            }
                            
                            allAvailableBeds.sort((a, b) => {
                                if (a.baseId !== b.baseId) return a.baseId.localeCompare(b.baseId);
                                return a.bedId.localeCompare(b.bedId);
                            });
                            
                            let bedsToAssign = allAvailableBeds.slice(0, qty);
                            if (bedsToAssign.length < qty) {
                                console.log("Aviso: Non hai suficientes camas libres no albergue para:", res.clientName);
                            }
                            
                            for (let bed of bedsToAssign) {
                                let hb = bed._hb;
                                let uRoom = createEmptyRoomObject(hb.id, hb.number, hb.roomName, 'bed', bed.bedId);
                                uRoom.status = 'reserved';
                                uRoom.clientName = res.clientName;
                                uRoom.checkIn = res.checkIn;
                                uRoom.checkOut = res.checkOut;
                                uRoom.price = ri.roomPrice / qty;
                                uRoom.agency = o;
                                uRoom.clientPhone = res.phone || '';
                                updatedRooms.push(uRoom);
                                bed.status = 'reserved';
                                bed.clientName = res.clientName;
                            }
                        } else {
                            let uRoom = createEmptyRoomObject(baseRoom.id, baseRoom.number, baseRoom.roomName, baseRoom.type);
                            uRoom.status = 'reserved';
                            uRoom.clientName = res.clientName;
                            uRoom.checkIn = res.checkIn;
                            uRoom.checkOut = res.checkOut;
                            uRoom.price = ri.roomPrice;
                            uRoom.agency = o;
                            uRoom.clientPhone = res.phone || '';
                            updatedRooms.push(uRoom);
                        }
                    }
`;

html = html.replace(regex, newLoop);
fs.writeFileSync('index.html', html);
console.log("Replaced hostel AI block");
