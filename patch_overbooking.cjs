const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const searchStr = `                            let availableBeds = beds.filter(b => b.status === 'free' || !b.clientName);
                            let bedsToAssign = availableBeds.slice(0, qty);
                            if (bedsToAssign.length < qty) {
                                const remaining = qty - bedsToAssign.length;
                                const otherBeds = beds.filter(b => !bedsToAssign.includes(b));
                                bedsToAssign = bedsToAssign.concat(otherBeds.slice(0, remaining));
                            }`;

const replaceStr = `                            let availableBeds = beds.filter(b => b.status === 'free' || !b.clientName);
                            let bedsToAssign = availableBeds.slice(0, qty);
                            if (bedsToAssign.length < qty) {
                                console.log("Aviso: Non hai suficientes camas libres no albergue para:", res.clientName, ". Asignando só as dispoñibles.");
                            }`;

html = html.replace(searchStr, replaceStr);
fs.writeFileSync('index.html', html);
console.log("Patched overbooking prevention");
