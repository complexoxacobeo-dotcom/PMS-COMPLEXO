const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Replace the javascript logic for toggle widget
const oldJs1 = `        let emailsWidgetOpen = true;

        function toggleEmailsWidgetBody() {
            emailsWidgetOpen = !emailsWidgetOpen;
            const body = document.getElementById('widgetEmailsBody');
            const btn = document.getElementById('widgetCollapseBtn');
            if (emailsWidgetOpen) {
                body.style.display = 'flex';
                btn.textContent = '▼';
            } else {
                body.style.display = 'none';
                btn.textContent = '▲';
            }
        }`;

const newJs1 = `        let emailsWidgetOpen = false;

        function toggleEmailsDropdown() {
            emailsWidgetOpen = !emailsWidgetOpen;
            const widget = document.getElementById('pendingEmailsWidget');
            if (emailsWidgetOpen) {
                widget.style.display = 'flex';
                if (currentPendingEmails.length === 0 && !document.getElementById('pendingEmailsLoader').classList.contains('flex')) {
                    loadPendingEmails();
                }
            } else {
                widget.style.display = 'none';
            }
        }

        // Clicar fora pecha o dropdown
        document.addEventListener('click', (e) => {
            const container = document.getElementById('emailsDropdownContainer');
            if (container && emailsWidgetOpen && !container.contains(e.target)) {
                // Ignore if clicked inside the reply editor
                if (document.getElementById('replyEditorContainer') && document.getElementById('replyEditorContainer').contains(e.target)) return;
                
                emailsWidgetOpen = false;
                document.getElementById('pendingEmailsWidget').style.display = 'none';
            }
        });`;

code = code.replace(oldJs1, newJs1);

// Fix updatePendingEmailsBadge to handle the hidden class correctly
const oldJs2 = `        function updatePendingEmailsBadge() {
            const badge = document.getElementById('widgetPendingCount');
            if (badge) {
                badge.textContent = currentPendingEmails.length;
            }
        }`;

const newJs2 = `        function updatePendingEmailsBadge() {
            const badge = document.getElementById('widgetPendingCount');
            if (badge) {
                badge.textContent = currentPendingEmails.length;
                if(currentPendingEmails.length > 0) {
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
        }`;
code = code.replace(oldJs2, newJs2);

// Fix loadPendingEmails so it doesn't force display flex on the widget unless opened
code = code.replace("widget.style.display = 'flex'; // Ensure widget is visible", "");

fs.writeFileSync('index.html', code);
console.log("Patched JS logic!");
