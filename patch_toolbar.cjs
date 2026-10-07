const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// The main wrapper for the right side
const oldWrapper = '<div class="flex flex-col gap-2 w-full xl:w-auto xl:ml-auto">';
const newWrapper = '<div class="flex flex-col gap-1.5 w-full xl:w-auto xl:ml-auto max-w-full overflow-hidden">';
code = code.replace(oldWrapper, newWrapper);

// Custom shortcuts container
// Make it scrollable if it exceeds width, but try to keep it in one line
const oldShortcuts = '<div id="customShortcutsContainer" class="flex flex-wrap lg:justify-end gap-1.5 empty:hidden"></div>';
const newShortcuts = '<div id="customShortcutsContainer" class="flex flex-nowrap lg:flex-wrap xl:justify-end gap-1.5 empty:hidden overflow-x-auto pb-1 max-w-full" style="scrollbar-width: thin;"></div>';
code = code.replace(oldShortcuts, newShortcuts);

// Generic buttons container
const oldGeneric = '<div class="flex flex-wrap lg:justify-end gap-1.5">';
const newGeneric = '<div class="flex flex-wrap lg:justify-end gap-1.5">';
// Actually generic buttons are fine to wrap if they must, but let's make sure they are compact.

fs.writeFileSync('index.html', code);
console.log("Toolbar patched!");
