const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const searchFn = `window.processImportListAI = async function() {
            if (!window.pendingAIParsedReservations || window.pendingAIParsedReservations.length === 0) return;
            showLoader();
            let successCount = 0;
            
            try {
                for (let res of window.pendingAIParsedReservations) {
                    const updatedRooms = [];
                    let dayData = [];
                    if (appState.dailyData && appState.dailyData[res.checkIn]) {
                        dayData = appState.dailyData[res.checkIn];
                    } else if (typeof google !== 'undefined' && google.script) {
                        const initRes = await new Promise((resolve) => {
                            google.script.run
                                .withSuccessHandler(resolve)
                                .withFailureHandler(resolve)
                                .getInitialData(res.checkIn);
                        });
                        if (initRes && initRes.dayData) dayData = initRes.dayData;
                    }`;

const replaceFn = `window.processImportListAI = async function() {
            if (!window.pendingAIParsedReservations || window.pendingAIParsedReservations.length === 0) return;
            showLoader();
            let successCount = 0;
            
            try {
                // 1. Gather all dates needed for all reservations
                let datesNeeded = new Set();
                for (let res of window.pendingAIParsedReservations) {
                    let inD = new Date(res.checkIn);
                    let outD = new Date(res.checkOut);
                    if (isNaN(inD.getTime()) || isNaN(outD.getTime()) || outD <= inD) {
                        outD = new Date(inD);
                        outD.setDate(outD.getDate() + 1);
                    }
                    let iter = new Date(inD);
                    while (iter < outD) {
                        datesNeeded.add(iter.toISOString().split('T')[0]);
                        iter.setDate(iter.getDate() + 1);
                    }
                }
                
                // 2. Fetch all missing dates in parallel
                if (typeof google !== 'undefined' && google.script) {
                    let fetchPromises = Array.from(datesNeeded).map(d => {
                        if (appState.dailyData && appState.dailyData[d]) return Promise.resolve();
                        return new Promise(resolve => {
                            google.script.run.withSuccessHandler(res => {
                                if (res && res.dayData) {
                                    if(!appState.dailyData) appState.dailyData = {};
                                    appState.dailyData[d] = res.dayData;
                                }
                                resolve();
                            }).withFailureHandler(resolve).getInitialData(d);
                        });
                    });
                    await Promise.all(fetchPromises);
                }

                // 3. Process reservations locally in memory
                for (let res of window.pendingAIParsedReservations) {
                    const updatedRooms = [];
                    let dayData = (appState.dailyData && appState.dailyData[res.checkIn]) ? appState.dailyData[res.checkIn] : [];
                    `;

const searchEndParts = [
    "appState.dailyData[res.checkIn] = dayData; // keep dayData ref intact for this day just in case",
    "if (typeof google !== 'undefined' && google.script) {",
    "await new Promise((resolve) => {",
    "google.script.run",
    ".withSuccessHandler(resolve)",
    ".withFailureHandler(resolve)",
    ".propagarReserva(res.checkIn, res.checkOut, updatedRooms.map(r => r.id), updatedRooms, res.checkIn);",
    "});",
    "successCount++;",
    "}",
    "}",
    "}"
];

// Let's find the indices manually
let startIdx = html.indexOf("appState.dailyData[res.checkIn] = dayData; // keep dayData ref intact for this day just in case");
if (startIdx === -1) {
    console.log("Could not find startIdx");
    process.exit(1);
}
let successStr = "successCount++;";
let successIdx = html.indexOf(successStr, startIdx);
let endBlockIdx = html.indexOf("}", successIdx);
endBlockIdx = html.indexOf("}", endBlockIdx + 1);
endBlockIdx = html.indexOf("}", endBlockIdx + 1);

let originalEndStr = html.substring(startIdx, endBlockIdx + 1);
// console.log("ORIGINAL STR:\n" + originalEndStr);

const replaceEndStr = `appState.dailyData[res.checkIn] = dayData; // keep dayData ref intact for this day just in case
                    }
                }
                
                // 4. Save all modified dates in parallel
                if (typeof google !== 'undefined' && google.script) {
                    let savePromises = Array.from(datesNeeded).map(d => {
                        return new Promise(resolve => {
                            google.script.run.withSuccessHandler(resolve).withFailureHandler(resolve)
                                .saveDayData(d, JSON.stringify(appState.dailyData[d]));
                        });
                    });
                    await Promise.all(savePromises);
                    successCount = window.pendingAIParsedReservations.length;
                } else {
                    successCount = window.pendingAIParsedReservations.length;
                }`;

if (html.includes(searchFn)) {
    html = html.replace(searchFn, replaceFn);
    html = html.replace(originalEndStr, replaceEndStr);
    fs.writeFileSync('index.html', html);
    console.log("Successfully patched index.html for fast imports (v2)!");
} else {
    console.log("Failed to find search string in index.html (searchFn)");
}
