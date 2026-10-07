const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const target1 = `<div class="mb-4">
                        <label class="block text-xs font-bold text-slate-900 mb-1">🔗 iCal URL (MisterPlan, Airbnb, Booking...)</label>
                        <input type="text" id="newRoomIcal" placeholder="https://..." class="w-full p-3 border rounded-xl font-bold text-xs bg-slate-50 text-blue-600 outline-none">
                    </div>`;

code = code.replace(target1, '');
fs.writeFileSync('index.html', code);
