const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /for\s*\(let\s*ri\s*of\s*res\.rooms\)\s*\{\s*let\s*baseRoom\s*=\s*appState\.baseRooms\.find\(br\s*=>\s*br\.id\s*===\s*ri\.baseRoomId\);\s*if\s*\(!baseRoom\)\s*continue;\s*if\s*\(baseRoom\.type\s*===\s*'hostel'\)\s*\{[\s\S]*?\}\s*else\s*\{[\s\S]*?updatedRooms\.push\(uRoom\);\s*\}\s*\}/g;

const match = html.match(regex);
if (match) {
    console.log("Found target to replace!");
} else {
    console.log("Not found.");
}
