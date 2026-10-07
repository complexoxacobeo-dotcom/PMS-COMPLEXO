const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const widgetHTML = `
    <!-- Floating Draggable Widget for Pending Emails -->
    <div id="draggableEmailsWidget" class="fixed bottom-6 right-6 w-[450px] bg-white/95 backdrop-blur-xl shadow-2xl border border-blue-200 rounded-2xl z-[999] flex flex-col overflow-hidden transition-all" style="max-height: 85vh;">
        <!-- Header (Drag Handle) -->
        <div id="draggableEmailsHeader" class="bg-blue-600 hover:bg-blue-700 text-white p-3 flex justify-between items-center cursor-move select-none transition-colors">
            <h3 class="font-bold text-sm flex items-center gap-2 pointer-events-none">
                <span>✉️</span> Reservas Pendentes (<span id="widgetPendingCount">0</span>)
            </h3>
            <div class="flex gap-2 items-center">
                <button onclick="loadPendingEmails(true)" class="text-white hover:text-blue-200 cursor-pointer" title="Actualizar">🔄</button>
                <button id="widgetMinMaxBtn" onclick="toggleEmailsMinMax()" class="text-white hover:text-blue-200 font-bold ml-1 cursor-pointer transition-transform duration-200">▼</button>
            </div>
        </div>
        
        <!-- Body -->
        <div id="widgetEmailsBody" class="flex flex-col flex-1 overflow-hidden transition-all duration-300 min-h-[200px]">
            <div id="pendingEmailsLoader" class="hidden flex-col items-center justify-center p-6 bg-slate-50 flex-1">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                <p class="text-slate-500 text-xs font-medium animate-pulse text-center">Buscando correos recentes...</p>
            </div>
            
            <div id="pendingEmailsError" class="hidden bg-red-50 text-red-700 text-xs p-3 border-b border-red-200"></div>
            
            <div id="pendingEmailsList" class="overflow-y-auto flex-1 p-2 bg-slate-50/50 flex flex-col gap-2">
                <!-- Correos renderizados aqui -->
            </div>
        </div>
    </div>
    <script>
        // Minimize/Maximize
        let emailsWidgetMinimized = false;
        function toggleEmailsMinMax() {
            emailsWidgetMinimized = !emailsWidgetMinimized;
            const body = document.getElementById('widgetEmailsBody');
            const btn = document.getElementById('widgetMinMaxBtn');
            if (emailsWidgetMinimized) {
                body.style.display = 'none';
                btn.style.transform = 'rotate(-90deg)';
            } else {
                body.style.display = 'flex';
                btn.style.transform = 'rotate(0deg)';
                if (currentPendingEmails.length === 0 && !document.getElementById('pendingEmailsLoader').classList.contains('flex')) {
                    loadPendingEmails();
                }
            }
        }

        // Draggable Logic
        const dragWidget = document.getElementById('draggableEmailsWidget');
        const dragHeader = document.getElementById('draggableEmailsHeader');
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        dragHeader.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return; // Don't drag if clicking buttons
            isDragging = true;
            dragOffsetX = e.clientX - dragWidget.getBoundingClientRect().left;
            dragOffsetY = e.clientY - dragWidget.getBoundingClientRect().top;
            dragWidget.style.transition = 'none'; // Disable transition while dragging
            
            // Set fixed dimensions so it doesn't collapse
            dragWidget.style.width = dragWidget.offsetWidth + 'px';
            if(!emailsWidgetMinimized) dragWidget.style.height = dragWidget.offsetHeight + 'px';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newX = e.clientX - dragOffsetX;
            let newY = e.clientY - dragOffsetY;
            
            // Keep within bounds
            newX = Math.max(0, Math.min(newX, window.innerWidth - dragWidget.offsetWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - dragWidget.offsetHeight));
            
            dragWidget.style.right = 'auto';
            dragWidget.style.bottom = 'auto';
            dragWidget.style.left = newX + 'px';
            dragWidget.style.top = newY + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                dragWidget.style.transition = 'all 0.3s';
            }
        });
    </script>
`;

// Insert it right before the last </body>
const lastBodyIndex = code.lastIndexOf('</body>');
if (lastBodyIndex !== -1) {
    code = code.substring(0, lastBodyIndex) + widgetHTML + code.substring(lastBodyIndex);
    fs.writeFileSync('index.html', code);
    console.log("Successfully inserted draggable widget at the bottom!");
} else {
    console.log("Could not find </body>");
}
