const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const searchStr = `        function xerarDiaSeNonExiste() {
            if(!appState.dailyData[currentPlaningDate]) appState.dailyData[currentPlaningDate] = [];
            let dia = appState.dailyData[currentPlaningDate];
            let needsSave = false; 
            
            appState.baseRooms.forEach(base => {
                if (base.type === 'hostel') {
                    for (let i = 1; i <= (base.totalBeds || 16); i++) {
                        let literaNum = Math.ceil(i / 2); 
                        let isTop = (i % 2 === 0); 
                        let bedCode = \`\${literaNum}\${isTop ? 'A' : 'B'}\`;
                        
                        let bedObjId = \`\${base.id}_\${bedCode}\`;
                        let existingBed = dia.find(d => d.id === bedObjId);
                        if (!existingBed) {
                            let newBed = createEmptyRoomObject(base.id, base.number, \`\${base.roomName}\`, 'bed', bedCode);
                            newBed.price = base.bedPrice || 15; 
                            dia.push(newBed);
                            needsSave = true;
                        } else {
                            if (existingBed.roomName !== base.roomName || existingBed.number !== base.number || existingBed.zoneColor !== base.zoneColor) {
                                existingBed.roomName = base.roomName;
                                existingBed.number = base.number;
                                existingBed.zoneColor = base.zoneColor;
                                needsSave = true;
                            }
                        }
                    }
                } else {
                    let existingRoom = dia.find(d => d.id === base.id);
                    if (!existingRoom) {
                        let r = createEmptyRoomObject(base.id, base.number, base.roomName, base.type);
                        r.features = base.features || [];
                        r.bedConfig = base.bedConfig;
                        r.zoneColor = base.zoneColor;
                        dia.push(r);
                        needsSave = true;
                    } else {
                        if (existingRoom.roomName !== base.roomName || existingRoom.number !== base.number || existingRoom.zoneColor !== base.zoneColor || existingRoom.bedConfig !== base.bedConfig) {
                            existingRoom.roomName = base.roomName;
                            existingRoom.number = base.number;
                            existingRoom.zoneColor = base.zoneColor;
                            existingRoom.bedConfig = base.bedConfig;
                            existingRoom.features = base.features || [];
                            needsSave = true;
                        }
                    }
                }
            });

            dia.forEach(patchRoomServices);
            
            if(needsSave) {
                salvarDiaNoServidor();
            }
        }`;

const targetStrRegex = /function xerarDiaSeNonExiste\(\) \{[\s\S]*?salvarDiaNoServidor\(\);\s*\}\s*\}/;

html = html.replace(targetStrRegex, searchStr);

fs.writeFileSync('index.html', html);
console.log("Patched xerarDiaSeNonExiste in index.html");
