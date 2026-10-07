const fs = require('fs');

let indexCode = fs.readFileSync('index.html', 'utf8');

// 1. Add floating button
const floatingBtnHTML = `
    <!-- Floating button to reopen emails -->
    <button id="reopenEmailsFab" onclick="openEmailsWidget()" class="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl z-[998] flex items-center justify-center transition-all transform hover:scale-110" style="display: none;" title="Ver Correos">
        <span class="text-2xl">✉️</span>
        <span id="fabPendingCount" class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm">0</span>
    </button>
    
    <!-- Floating Draggable Widget`;

if(!indexCode.includes('reopenEmailsFab')) {
    indexCode = indexCode.replace("<!-- Floating Draggable Widget", floatingBtnHTML);
}

// 2. Modify closeEmailsWidget and openEmailsWidget to toggle the FAB
const oldClose = `function closeEmailsWidget() {
            document.getElementById('draggableEmailsWidget').style.display = 'none';
        }
        function openEmailsWidget() {
            const w = document.getElementById('draggableEmailsWidget');
            w.style.display = 'flex';
            if (emailsWidgetMinimized) toggleEmailsMinMax();
            if (currentPendingEmails.length === 0) loadPendingEmails(true);
        }`;

const newClose = `function closeEmailsWidget() {
            document.getElementById('draggableEmailsWidget').style.display = 'none';
            document.getElementById('reopenEmailsFab').style.display = 'flex';
        }
        function openEmailsWidget() {
            document.getElementById('reopenEmailsFab').style.display = 'none';
            const w = document.getElementById('draggableEmailsWidget');
            w.style.display = 'flex';
            if (emailsWidgetMinimized) toggleEmailsMinMax();
            if (currentPendingEmails.length === 0) loadPendingEmails(true);
        }`;
        
indexCode = indexCode.replace(oldClose, newClose);

// 3. Make agency red really pop
const oldAgencyRed = `highlightClass = "border-red-400 bg-red-50";
                    titleHighlight = "text-red-800";
                    estHighlight = "text-red-900 bg-red-200 border-red-500";
                    tagPrefix = "⚠️ AXENCIA / ";`;

const newAgencyRed = `highlightClass = "border-red-500 bg-red-100 shadow-red-200/50";
                    titleHighlight = "text-red-900 font-black";
                    estHighlight = "text-white bg-red-600 border-red-700 shadow-sm";
                    tagPrefix = "⚠️ AXENCIA / ";`;

indexCode = indexCode.replace(oldAgencyRed, newAgencyRed);

// 4. Update the FAB count whenever emails are rendered
const renderStartRegex = /list\.innerHTML = currentPendingEmails\.map\(/;
const fabUpdateLogic = `
            const fabCount = document.getElementById('fabPendingCount');
            if (fabCount) fabCount.innerText = currentPendingEmails.length;
            
            list.innerHTML = currentPendingEmails.map(`;

indexCode = indexCode.replace(renderStartRegex, fabUpdateLogic);


fs.writeFileSync('index.html', indexCode);
console.log("Updated index.html");
