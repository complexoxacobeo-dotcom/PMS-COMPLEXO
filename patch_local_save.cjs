const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const searchStr = `                            if(res.services && totalUnits > 0) {
                                uRoom.services = {
                                    breakfast: {qty: Math.floor((res.services.breakfast?.qty || 0)/totalUnits) || ((res.services.breakfast?.qty || 0) > 0 ? 1 : 0), price: (res.services.breakfast?.price || 0)/totalUnits},
                                    dinner: {qty: Math.floor((res.services.dinner?.qty || 0)/totalUnits) || ((res.services.dinner?.qty || 0) > 0 ? 1 : 0), price: (res.services.dinner?.price || 0)/totalUnits},
                                    picnic: {qty: Math.floor((res.services.picnic?.qty || 0)/totalUnits) || ((res.services.picnic?.qty || 0) > 0 ? 1 : 0), price: (res.services.picnic?.price || 0)/totalUnits},
                                    halfBoard: {qty: Math.floor((res.services.halfBoard?.qty || 0)/totalUnits) || ((res.services.halfBoard?.qty || 0) > 0 ? 1 : 0), price: (res.services.halfBoard?.price || 0)/totalUnits},
                                    fullBoard: {qty: Math.floor((res.services.fullBoard?.qty || 0)/totalUnits) || ((res.services.fullBoard?.qty || 0) > 0 ? 1 : 0), price: (res.services.fullBoard?.price || 0)/totalUnits},
                                    laundry: {active: false, price: 0},
                                    mochilas: {qty: 0, price: 0},
                                    outros: {qty: 0, price: 0},
                                    parking: false,
                                    taxi: false
                                };
                            }
                        }`;

const replaceStr = `                            if(res.services && totalUnits > 0) {
                                uRoom.services = {
                                    breakfast: {qty: Math.floor((res.services.breakfast?.qty || 0)/totalUnits) || ((res.services.breakfast?.qty || 0) > 0 ? 1 : 0), price: (res.services.breakfast?.price || 0)/totalUnits},
                                    dinner: {qty: Math.floor((res.services.dinner?.qty || 0)/totalUnits) || ((res.services.dinner?.qty || 0) > 0 ? 1 : 0), price: (res.services.dinner?.price || 0)/totalUnits},
                                    picnic: {qty: Math.floor((res.services.picnic?.qty || 0)/totalUnits) || ((res.services.picnic?.qty || 0) > 0 ? 1 : 0), price: (res.services.picnic?.price || 0)/totalUnits},
                                    halfBoard: {qty: Math.floor((res.services.halfBoard?.qty || 0)/totalUnits) || ((res.services.halfBoard?.qty || 0) > 0 ? 1 : 0), price: (res.services.halfBoard?.price || 0)/totalUnits},
                                    fullBoard: {qty: Math.floor((res.services.fullBoard?.qty || 0)/totalUnits) || ((res.services.fullBoard?.qty || 0) > 0 ? 1 : 0), price: (res.services.fullBoard?.price || 0)/totalUnits},
                                    laundry: {active: false, price: 0},
                                    mochilas: {qty: 0, price: 0},
                                    outros: {qty: 0, price: 0},
                                    parking: false,
                                    taxi: false
                                };
                            }
                            
                            // MERGE TO LOCAL STATE
                            let existingIdx = dayData.findIndex(d => d.id === uRoom.id);
                            if (existingIdx > -1) {
                                dayData[existingIdx] = uRoom;
                            } else {
                                dayData.push(uRoom);
                            }
                        }
                        
                        // We must save the local state BEFORE propagarReserva, just in case!
                        appState.dailyData[res.checkIn] = dayData;
                        // But wait! If we do saving here, it might get overwritten by propagarReserva. Let's just do it directly.
                        if (typeof google === 'undefined' || !google.script) {
                             if (res.checkIn === currentPlaningDate) salvarDiaNoServidor();
                        }`;

html = html.replace(searchStr, replaceStr);
fs.writeFileSync('index.html', html);
console.log("Patched local save");
