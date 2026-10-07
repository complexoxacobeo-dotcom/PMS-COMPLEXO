const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /if\s*\(res\.ota\s*&&\s*\(!matchingRoom\.agency\s*\|\|\s*matchingRoom\.agency\.trim\(\)\s*===\s*''\)\)\s*\{\s*matchingRoom\.agency\s*=\s*res\.ota;\s*updatedExisting\s*=\s*true;\s*\}/g;

const replaceWith = `
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
                                if (o && (!matchingRoom.agency || matchingRoom.agency.trim() === '' || matchingRoom.agency.toLowerCase().includes('ical') || matchingRoom.agency.toLowerCase().includes('misterplan'))) {
                                    matchingRoom.agency = o;
                                    updatedExisting = true;
                                } else if (o && matchingRoom.agency !== o) {
                                    matchingRoom.agency = o;
                                    updatedExisting = true;
                                }
`;

html = html.replace(regex, replaceWith);
fs.writeFileSync('index.html', html);
console.log("Patched agency merge");
