const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Fix grid items-stretch
code = code.replace(
    'class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 items-start"', 
    'class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 items-stretch"'
);

// Add h-full to the wrapper for room/apartment
code = code.replace(
    /wrapper\.className = \`card-wrapper relative flex flex-col col-span-1 min-h-\[140px\] \$\{isSelected\}\`;/g,
    'wrapper.className = `card-wrapper relative flex flex-col h-full col-span-1 min-h-[140px] ${isSelected}`;'
);

// Add flex-grow to room-card
const regexCard = /<div class="room-card \$\{room\.status === 'free' \? 'card-free' : \(room\.status === 'reserved' \? 'card-reserved' : 'card-occupied'\)\} \$\{cardShapeClass\}" style="\$\{shapeStyle\}">/g;
code = code.replace(regexCard, '<div class="room-card ${room.status === \'free\' ? \'card-free\' : (room.status === \'reserved\' ? \'card-reserved\' : \'card-occupied\')} ${cardShapeClass} flex-grow w-full" style="${shapeStyle}">');

// Improve card-apartment CSS so it's a very clear house shape using an actual SVG roof or an improved polygon
const cssOld = '.card-apartment { clip-path: polygon(0 25px, 50% 0%, 100% 25px, 100% 100%, 0% 100%); }';
const cssNew = `
        /* Enhanced House Shape for Apartments */
        .card-apartment { 
            clip-path: polygon(0 25px, 50% 0%, 100% 25px, 100% 100%, 0% 100%); 
            margin-top: 15px; /* Give it space so it doesn't look squished */
            border-top: none; /* the roof will be created with pseudo */
            overflow: visible; /* to show the roof if we use a pseudo element */
        }
`;
// Actually, clip-path is nice but it removes border. Let's just use CSS background magic.
// Or we can just use clip-path but give the background a clear color.
