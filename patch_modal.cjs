const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const newModal = `
    <!-- Modal Correos Pendentes -->
    <div id="pendingEmailsModal" class="modal z-[100]">
        <div class="glass-panel w-full max-w-5xl rounded-2xl p-6 m-4 relative modal-content glass-panel backdrop-blur-md border border-white/50 shadow-sm max-h-[90dvh] overflow-y-auto flex flex-col">
            <button onclick="document.getElementById('pendingEmailsModal').classList.remove('active')" class="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-600 text-3xl font-black bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center transition-colors shadow-md z-50">&times;</button>
            <div class="flex justify-between items-center mb-6 border-b pb-4 pr-12">
                <h2 class="text-2xl font-black text-slate-800 flex items-center gap-2">✉️ Reservas pendentes de resposta</h2>
                <button onclick="loadPendingEmails(true)" class="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                    <span>🔄</span> <span>Actualizar</span>
                </button>
            </div>
            
            <div id="pendingEmailsLoader" class="hidden flex-col items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-slate-500 font-medium animate-pulse">Buscando correos recentes en Gmail...</p>
            </div>
            
            <div id="pendingEmailsError" class="hidden bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-4"></div>
            
            <div id="pendingEmailsList" class="grid gap-4 overflow-y-auto flex-1">
                <!-- Correos renderizados aqui -->
            </div>
            
            <!-- Editor de Resposta -->
            <div id="replyEditorContainer" class="hidden flex-col h-full absolute inset-0 bg-white/95 backdrop-blur-xl z-[60] rounded-2xl p-6 overflow-y-auto">
                <button onclick="closeReplyEditor()" class="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-600 text-3xl font-black bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center transition-colors shadow-md z-50">&times;</button>
                
                <h3 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">✨ Preparar resposta con IA</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                    <div class="flex flex-col gap-4">
                        <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 flex-1 overflow-y-auto max-h-[40dvh]">
                            <p class="text-xs text-slate-500 mb-1 uppercase tracking-wider font-bold">Correo orixinal</p>
                            <div class="text-sm font-medium text-slate-800 mb-1" id="replyOriginalSender"></div>
                            <div class="text-xs text-slate-600 mb-3 border-b pb-2" id="replyOriginalSubject"></div>
                            <div class="text-sm text-slate-700 whitespace-pre-wrap font-serif" id="replyOriginalBody"></div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-4">
                        <div id="replyGeneratingLoader" class="hidden flex-col items-center justify-center h-full">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            <p class="text-slate-500 font-medium animate-pulse">Redactando resposta...</p>
                        </div>
                        
                        <div id="replyContentArea" class="flex flex-col h-full gap-2">
                            <label class="text-xs text-slate-500 uppercase tracking-wider font-bold">Suxerencia de resposta</label>
                            <textarea id="replyTextarea" class="w-full flex-1 min-h-[200px] border border-slate-300 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-inner resize-none"></textarea>
                            
                            <div class="flex gap-2 justify-end mt-4">
                                <button onclick="closeReplyEditor()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">Descartar e volver</button>
                                <button onclick="copyReplyText()" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors flex items-center gap-2">
                                    <span>📋</span> <span>Copiar resposta</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

code = code.replace(/<\/body>/, newModal + '\n</body>');
fs.writeFileSync('index.html', code);
console.log("Patched modal");
