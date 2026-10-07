const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Fix saveRoom() guests calculation
const oldSaveRoomGuests = "room.guests = isMulti || room.type === 'bed' ? 1 : (parseInt(document.getElementById('guestCount').value)||1);";
const newSaveRoomGuests = "room.guests = room.type === 'bed' ? 1 : Math.max(1, Math.floor((parseInt(document.getElementById('guestCount').value)||1) / count));";
code = code.replace(oldSaveRoomGuests, newSaveRoomGuests);

// Fix processImportListAI() guests
code = code.replace(
    "uRoom.clientPhone = res.phone || '';\n                            updatedRooms.push(uRoom);",
    "uRoom.clientPhone = res.phone || '';\n                            uRoom.guests = res.guests || 1;\n                            updatedRooms.push(uRoom);"
);

// We need to do this for both 'bed' and 'room' branches in processImportListAI?
// Wait, for 'bed' it is already 1, but let's check the replace string.
// Let's just do a regex replace for the AI import.
code = code.replace(/uRoom\.clientPhone = res\.phone \|\| '';\s*updatedRooms\.push\(uRoom\);/g, "uRoom.clientPhone = res.phone || '';\n                            uRoom.guests = (baseRoom && baseRoom.type === 'hostel') ? 1 : (res.guests || ri.qty || 1);\n                            updatedRooms.push(uRoom);");

fs.writeFileSync('index.html', code);
console.log("Guests patched!");
