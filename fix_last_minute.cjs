const fs = require('fs');

let indexCode = fs.readFileSync('index.html', 'utf8');

const regex = /let isRuralgest = lowerBody\.includes\("ruralgest"\) \|\| \(email\.sender \|\| ""\)\.toLowerCase\(\)\.includes\("ruralgest"\);/m;

const replacement = `let isRuralgest = lowerBody.includes("ruralgest") || (email.sender || "").toLowerCase().includes("ruralgest");
                let isLastMinute = lowerBody.includes("ultima hora") || lowerBody.includes("última hora") || lowerBody.includes("last minute") || lowerBody.includes("para hoy") || lowerBody.includes("para hoxe") || lowerBody.includes("esta noche") || lowerBody.includes("esta noite") || lowerBody.includes("for today") || lowerBody.includes("tonight") || lowerBody.includes("inmediata");`;

if (indexCode.match(regex)) {
    indexCode = indexCode.replace(regex, replacement);
    console.log("Added isLastMinute variable");
} else {
    console.log("Failed to add isLastMinute variable");
}

const renderRegex = /\} else if \(isAgency\) \{\s*highlightClass = "border-red-500 bg-red-100 shadow-red-200\/50";\s*titleHighlight = "text-red-900 font-black";\s*estHighlight = "text-white bg-red-600 border-red-700 shadow-sm";\s*tagPrefix = "⚠️ AXENCIA \/ ";\s*customStyle = "background-color: #fee2e2 !important; border: 2px solid #ef4444 !important; box-shadow: 0 4px 6px -1px rgba\(239, 68, 68, 0\.2\);";\s*customTitleStyle = "color: #7f1d1d !important; font-weight: 900 !important; font-size: 13px !important;";\s*customTagStyle = "background-color: #dc2626 !important; border-color: #b91c1c !important; color: #ffffff !important;";\s*\}/m;

const renderReplacement = `} else if (isAgency) {
                    highlightClass = "border-red-500 bg-red-100 shadow-red-200/50";
                    titleHighlight = "text-red-900 font-black";
                    estHighlight = "text-white bg-red-600 border-red-700 shadow-sm";
                    tagPrefix = "⚠️ AXENCIA / ";
                    customStyle = "background-color: #fee2e2 !important; border: 2px solid #ef4444 !important; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);";
                    customTitleStyle = "color: #7f1d1d !important; font-weight: 900 !important; font-size: 13px !important;";
                    customTagStyle = "background-color: #dc2626 !important; border-color: #b91c1c !important; color: #ffffff !important;";
                }
                
                // LAST MINUTE OVERRIDE
                if (isLastMinute) {
                    highlightClass = "border-red-600 bg-red-100 shadow-red-500/50 animate-pulse";
                    titleHighlight = "text-red-900 font-black";
                    estHighlight = "text-white bg-red-600 border-red-800 shadow-sm animate-bounce";
                    tagPrefix = "🚨 ÚLTIMA HORA / " + tagPrefix;
                    customStyle = "background: linear-gradient(to right, #fee2e2, #fecaca) !important; border: 3px solid #dc2626 !important; box-shadow: 0 0 15px rgba(220, 38, 38, 0.6); transform: scale(1.01); margin-top: 8px; margin-bottom: 8px;";
                    customTitleStyle = "color: #7f1d1d !important; font-weight: 900 !important; font-size: 14px !important; text-transform: uppercase;";
                    customTagStyle = "background-color: #991b1b !important; border-color: #7f1d1d !important; color: #ffffff !important; font-size: 11px !important; padding: 4px 8px !important;";
                }`;

if (indexCode.match(renderRegex)) {
    indexCode = indexCode.replace(renderRegex, renderReplacement);
    console.log("Added LastMinute styling");
} else {
    console.log("Failed to add LastMinute styling");
}

fs.writeFileSync('index.html', indexCode);
