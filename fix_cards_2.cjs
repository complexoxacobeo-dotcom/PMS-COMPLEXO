const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const target1 = `id="roomGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 items-start"`;
const rep1 = `id="roomGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 items-stretch"`;
code = code.replace(target1, rep1);

const target2 = 'wrapper.className = `card-wrapper relative flex flex-col col-span-1 min-h-[140px] ${isSelected}`;';
const rep2 = 'wrapper.className = `card-wrapper relative flex flex-col h-full col-span-1 min-h-[140px] ${isSelected}`;';
code = code.replace(target2, rep2);

const target3 = '<div class="room-card ${room.status === \'free\' ? \'card-free\' : (room.status === \'reserved\' ? \'card-reserved\' : \'card-occupied\')} ${cardShapeClass}" style="${shapeStyle}">';
const rep3 = '<div class="room-card ${room.status === \'free\' ? \'card-free\' : (room.status === \'reserved\' ? \'card-reserved\' : \'card-occupied\')} ${cardShapeClass} flex-grow w-full" style="${shapeStyle}">';
code = code.replace(target3, rep3);

fs.writeFileSync('index.html', code);
