const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /if\(o\.toLowerCase\(\)\.includes\('booking'\)\) o = 'Booking\.com';\s*else if\(o\.toLowerCase\(\)\.includes\('hostelworld'\)\) o = 'HostelWorld';\s*else if\(o\.toLowerCase\(\)\.includes\('pitchup'\)\) o = 'Pitchup';\s*else if\(o\.toLowerCase\(\)\.includes\('expedia'\)\) o = 'Expedia';\s*else if\(o\.toLowerCase\(\)\.includes\('airbnb'\)\) o = 'Airbnb';\s*else \{\s*let oLower = o\.trim\(\)\.toLowerCase\(\);\s*if\(oLower && appState && appState\.agencies\) \{\s*let bestMatch = appState\.agencies\.find\(a => oLower\.includes\(a\.name\.toLowerCase\(\)\) \|\| a\.name\.toLowerCase\(\)\.includes\(oLower\)\);\s*if\(bestMatch\) o = bestMatch\.name;\s*\}\s*\}/g;

const replaceWith = `
                                let oLower = o.trim().toLowerCase();
                                let matched = false;
                                if(oLower && appState && appState.agencies) {
                                    let bestMatch = appState.agencies.find(a => oLower.includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(oLower));
                                    if(bestMatch) { o = bestMatch.name; matched = true; }
                                }
                                if(!matched && oLower) {
                                    if(oLower.includes('booking')) o = 'Booking.com';
                                    else if(oLower.includes('hostelworld')) o = 'HostelWorld';
                                    else if(oLower.includes('pitchup')) o = 'Pitchup';
                                    else if(oLower.includes('expedia')) o = 'Expedia';
                                    else if(oLower.includes('airbnb')) o = 'Airbnb';
                                }
`;

html = html.replace(regex, replaceWith);
fs.writeFileSync('index.html', html);
console.log("Patched agency matching logic");
