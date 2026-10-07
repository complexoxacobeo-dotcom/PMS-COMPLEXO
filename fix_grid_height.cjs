const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(
    'id="roomGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 items-start"', 
    'id="roomGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 items-stretch"'
);

code = code.replace(
    'wrapper.className = `card-wrapper relative flex flex-col col-span-1 min-h-[140px] ${isSelected}`;',
    'wrapper.className = `card-wrapper relative flex flex-col h-full w-full col-span-1 min-h-[140px] ${isSelected}`;'
);

code = code.replace(
    '<div class="room-card ${room.status === \\\'free\\\' ? \\\'card-free\\\' : (room.status === \\\'reserved\\\' ? \\\'card-reserved\\\' : \\\'card-occupied\\\')} ${cardShapeClass}" style="${shapeStyle}">',
    '<div class="room-card ${room.status === \\\'free\\\' ? \\\'card-free\\\' : (room.status === \\\'reserved\\\' ? \\\'card-reserved\\\' : \\\'card-occupied\\\')} ${cardShapeClass} flex-grow w-full" style="${shapeStyle}">'
);

fs.writeFileSync('index.html', code);
