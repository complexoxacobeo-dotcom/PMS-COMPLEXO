const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetStr = `document.getElementById('qrBtnValidate').disabled = false;
                    document.getElementById('qrBtnValidate').classList.remove('opacity-50');
                }
            } else {
                document.getElementById('qrStatusBox').innerText = "⚠️ Modo Sen Conexión: PENDENTE";
                document.getElementById('qrBtnValidate').disabled = false;
                document.getElementById('qrBtnValidate').classList.remove('opacity-50');
            }`;
            
const replaceStr = `document.getElementById('qrBtnValidate').disabled = false;
                    document.getElementById('qrBtnValidate').classList.remove('opacity-50');
                    document.getElementById('qrBtnValidate').classList.remove('hidden');
                }
            } else {
                document.getElementById('qrStatusBox').innerText = "⚠️ Modo Sen Conexión: PENDENTE";
                document.getElementById('qrBtnValidate').disabled = false;
                document.getElementById('qrBtnValidate').classList.remove('opacity-50');
                document.getElementById('qrBtnValidate').classList.remove('hidden');
            }`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('index.html', code);
