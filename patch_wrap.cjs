const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Remove overflow-hidden from parent
code = code.replace(
  '<div class="flex flex-col gap-1.5 w-full xl:w-auto xl:ml-auto max-w-full overflow-hidden">',
  '<div class="flex flex-col gap-1.5 w-full xl:w-auto xl:ml-auto max-w-full">'
);

// 2. Fix customShortcutsContainer
code = code.replace(
  '<div id="customShortcutsContainer" class="flex flex-nowrap xl:justify-end gap-1.5 empty:hidden overflow-x-auto pb-1 max-w-full" style="scrollbar-width: thin;"></div>',
  '<div id="customShortcutsContainer" class="flex flex-wrap lg:justify-end gap-1.5 empty:hidden"></div>'
);

// 3. Fix controls container
code = code.replace(
  '<!-- Controls & Notifications -->\n            <div class="flex flex-nowrap xl:justify-end gap-1.5 overflow-x-auto pb-1 max-w-full" style="scrollbar-width: thin;">',
  '<!-- Controls & Notifications -->\n            <div class="flex flex-wrap lg:justify-end gap-1.5">'
);

fs.writeFileSync('index.html', code);
console.log("Wrap fixed!");
