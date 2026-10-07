const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// The generic buttons container
const oldGeneric = '<div class="flex flex-wrap lg:justify-end gap-1.5">';
const newGeneric = '<div class="flex flex-nowrap xl:justify-end gap-1.5 overflow-x-auto pb-1 max-w-full" style="scrollbar-width: thin;">';
code = code.replace(oldGeneric, newGeneric);

// Also force nowrap on the shortcuts container instead of lg:flex-wrap
const oldShortcuts = '<div id="customShortcutsContainer" class="flex flex-nowrap lg:flex-wrap xl:justify-end gap-1.5 empty:hidden overflow-x-auto pb-1 max-w-full" style="scrollbar-width: thin;"></div>';
const newShortcuts = '<div id="customShortcutsContainer" class="flex flex-nowrap xl:justify-end gap-1.5 empty:hidden overflow-x-auto pb-1 max-w-full" style="scrollbar-width: thin;"></div>';
code = code.replace(oldShortcuts, newShortcuts);

// Add whitespace-nowrap to buttons so text inside doesn't wrap
code = code.replace(/<span>Vista Móbil<\/span>/g, '<span class="whitespace-nowrap">Vista Móbil</span>');
code = code.replace(/<span>Selección Múltiple<\/span>/g, '<span class="whitespace-nowrap">Selección Múltiple</span>');
code = code.replace(/<span>Limpar Rexistros<\/span>/g, '<span class="whitespace-nowrap">Limpar Rexistros</span>');
code = code.replace(/<span>Limpar Bloqueos iCal<\/span>/g, '<span class="whitespace-nowrap">Limpar iCal</span>'); // Make text shorter
code = code.replace(/<span>Importar Lista<\/span>/g, '<span class="whitespace-nowrap">Importar Lista</span>');
code = code.replace(/<span>Mensaxes<\/span>/g, '<span class="whitespace-nowrap">Mensaxes</span>');
code = code.replace(/<span>Notificacións<\/span>/g, '<span class="whitespace-nowrap">Notificacións</span>');
code = code.replace(/<span>Admin<\/span>/g, '<span class="whitespace-nowrap">Admin</span>');

fs.writeFileSync('index.html', code);
console.log("No-wrap patched!");
