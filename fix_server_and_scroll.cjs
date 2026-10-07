const fs = require('fs');

// 1. Fix server.ts missing express.json()
let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(/app\.post\("\/api\/generate-reply", async \(req, res\) => \{/, 'app.post("/api/generate-reply", express.json(), async (req, res) => {');
fs.writeFileSync('server.ts', serverCode);
console.log("Fixed server.ts");

// 2. Add autoscroll to index.html
let indexCode = fs.readFileSync('index.html', 'utf8');

// Insert autoscroll logic
const scrollLogic = `
        let emailScrollInterval;
        function startEmailAutoScroll() {
            stopEmailAutoScroll();
            const list = document.getElementById('pendingEmailsList');
            emailScrollInterval = setInterval(() => {
                if(list.scrollTop + list.clientHeight >= list.scrollHeight) {
                    list.scrollTop = 0; // go back to top when reaching bottom
                } else {
                    list.scrollTop += 1;
                }
            }, 40); // speed of scroll
        }
        function stopEmailAutoScroll() {
            clearInterval(emailScrollInterval);
        }
        
        document.getElementById('pendingEmailsList').addEventListener('mouseenter', stopEmailAutoScroll);
        document.getElementById('pendingEmailsList').addEventListener('mouseleave', startEmailAutoScroll);
        document.getElementById('pendingEmailsList').addEventListener('touchstart', stopEmailAutoScroll);
        document.getElementById('pendingEmailsList').addEventListener('touchend', startEmailAutoScroll);
`;

const renderFunctionReplace = /list\.innerHTML = currentPendingEmails\.map[\s\S]*?\}\)\.join\(''\);\s*\}/;

indexCode = indexCode.replace(renderFunctionReplace, (match) => {
    return match + `\n            startEmailAutoScroll();\n        }`;
});

const beforeScriptLogic = /\/\/ Minimize\/Maximize/;
indexCode = indexCode.replace(beforeScriptLogic, scrollLogic + '\n        // Minimize/Maximize');

fs.writeFileSync('index.html', indexCode);
console.log("Fixed index.html");
