window.syncIcalReservations = async function(silent = false) {
            if (window.isSyncingIcal) return;
            window.isSyncingIcal = true;
            const cont = document.getElementById('inboxContent');
            if (!silent && cont) cont.innerHTML = '<div class="col-span-full p-8 text-center font-bold text-indigo-600"><div class="spinner inline-block mr-2 border-indigo-600"></div>Sincronizando iCal...</div>';

            let newReservations = [];
            const roomsWithIcal = appState.baseRooms.filter(r => r.icalUrl && r.icalUrl.trim() !== '');

            if (roomsWithIcal.length === 0) {
                if (!silent && cont) cont.innerHTML = '<div class="col-span-full p-8 text-center text-slate-600 bg-slate-50 rounded-xl border border-slate-200">Non hai ningunha url de iCal configurada nos aloxamentos.</div>';
                return;
            }

            let errors = [];

            for (const room of roomsWithIcal) {
                try {
                    const proxyUrl = "/api/proxy-ical?url=" + encodeURIComponent(room.icalUrl.trim() + (room.icalUrl.includes("?") ? "&" : "?") + "_t=" + Date.now());
                    const res = await fetch(proxyUrl);
                    if (!res.ok) throw new Error("Erro na petición HTTP");
                    const data = await res.json();
                    
                    if (data && data.contents) {
                        const icalData = data.contents;
                        const events = parseIcal(icalData);
                        
                        events.forEach(ev => {
                            if (!ev.dtstart || !ev.dtend) return;
                            
                            // Check if event is in the past, maybe ignore older than 1 month
                            const startDate = new Date(ev.dtstart);
                            let today = new Date();
                            today.setHours(0,0,0,0);
                            const oneMonthAgo = new Date(today);
                            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                            
                            if (startDate < oneMonthAgo) return;
                            
                            const endDate = new Date(ev.dtend);
                            const nights = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
                            if (nights <= 0) return;
                            
                            // Format YYYY-MM-DD
                            const checkInStr = startDate.toISOString().split('T')[0];
                            
                            // Check if past
                            if (endDate <= today) return; // Skip past events
                            
                            // Check cache
                            const cacheKey = room.id + '_' + checkInStr + '_' + nights + '_' + (ev.summary || '').substring(0,20).replace(/[^a-zA-Z0-9]/g, '');
                            let processedCache = JSON.parse(localStorage.getItem('processedIcalEvents') || '{}');
                            if (processedCache[cacheKey]) return; // Already processed
                            
                                                            let text = ((ev.summary || '') + ' ' + (ev.description || '')).replace(/\\n/g, ' ').toLowerCase();
                                
                                let pax = room.type === 'hostel' ? 1 : (room.totalBeds || 2);
                                let paxMatch = text.match(/(?:pax|personas|adults|adultos|huespedes|hóspedes|guests)[: ]*(\d+)/i);
                                if (paxMatch && parseInt(paxMatch[1])) {
                                    pax = parseInt(paxMatch[1]);
                                }
                                
                                let agency = 'MisterPlan / iCal';
                                if (text.includes('booking')) agency = 'Booking';
                                else if (text.includes('airbnb')) agency = 'Airbnb';
                                else if (text.includes('expedia')) agency = 'Expedia';
                                else if (text.includes('agoda')) agency = 'Agoda';
                                else if (text.includes('tripadvisor')) agency = 'TripAdvisor';
                                else if (text.includes('hostelworld')) agency = 'HostelWorld';
                                else if (text.includes('pitchup')) agency = 'Pitchup';
                                
                                let regimen = '';
                                if (text.match(/\b(desayuno|breakfast|almorzo|ad|a\/d)\b/i)) {
                                    regimen = 'AD';
                                }
                                if (text.match(/\b(media pensi|half board|mp|m\/p)\b/i)) {
                                    regimen = 'MP';
                                }
                                if (text.match(/\b(pensi.*completa|full board|pc|p\/c)\b/i)) {
                                    regimen = 'PC';
                                }
                                
                                let rawSummary = (ev.summary || '').replace(/\\,/g, ',').replace(/\\;/g, ';');
                                rawSummary = rawSummary.replace(/\(.*?\)/g, '').trim(); // Remove anything in parentheses
                                rawSummary = rawSummary.replace(/Reservation from [^:]+:/i, '').trim();
                                rawSummary = rawSummary.replace(/Reserva de /i, '').trim();
                                rawSummary = rawSummary.replace(/MisterPlan - /i, '').trim();
                                rawSummary = rawSummary.replace(/CLOSED - /i, '').trim();
                                rawSummary = rawSummary.replace(/Reserved - /i, '').trim();
                                rawSummary = rawSummary.replace(/Airbnb \(/i, '').replace(/\)$/, '').trim();
                                
                                let descNameMatch = (ev.description || '').match(/(?:cliente|client|guest|nombre|name|hóspede|huesped|pasajero)[:\s]+([^\n\r\\<]+)/i);
                                let extractedName = descNameMatch ? descNameMatch[1].trim() : rawSummary;
                                
                                // Special fallback if the summary is very short or just says "Booking" etc.
                                if (extractedName.toLowerCase() === 'booking' || extractedName.toLowerCase() === 'airbnb') {
                                    extractedName = "Reserva " + agency;
                                }

                                let clientName = extractedName || 'Reserva iCal';
                                if (regimen) {
                                    clientName += ` [${regimen}]`;
                                }

                                let phoneMatch = text.match(/(?:teléfono|telefono|phone|tel|móvil|movil)[: ]*(\+?[\d\s]{9,15})/i);
                                let emailMatch = text.match(/(?:email|correo|e-mail)[: ]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})/i);
                                let phone = phoneMatch ? phoneMatch[1].trim() : '';
                                let email = emailMatch ? emailMatch[1].trim() : '';

                                let isDomus = /domus\s*carcer|delux[e]?\s*domus|c[aá]rcel/i.test(text + ' ' + (room.roomName || '') + ' ' + (room.number || ''));

                                let rObj = {
                                cacheKey: cacheKey,
                                id: 'ical_' + Date.now() + '_' + Math.floor(Math.random()*10000),
                                checkIn: checkInStr,
                                noches: nights,
                                personas: pax,
                                clientName: clientName,
                                clientPhone: phone,
                                clientEmail: email,
                                agency: agency,
                                total: 0,
                                paidAgency: 0,
                                targetBaseId: room.id,
                                isIcal: true,
                                isDomusCarceris: isDomus
                            };
                            newReservations.push(rObj);
                        });
                    }
                } catch(err) {
                    console.error("Erro sincronizando iCal para", room.roomName, err);
                    if(err.message && !err.message.includes('xa ocupada')) errors.push(room.roomName);
                }
            }
            
            if (newReservations.length > 0) {
                // Remove duplicates if the exact same reservation exists already in inbox
                // Note: we might want to auto-assign them immediately if the room is free!
                
                if (!silent && cont) cont.innerHTML = '<div class="col-span-full p-8 text-center font-bold text-indigo-600"><div class="spinner inline-block mr-2 border-indigo-600"></div>Auto-asignando reservas iCal...</div>';
                
                let assignedCount = 0;
                let conflictCount = 0;
                
                let currentCache = JSON.parse(localStorage.getItem('processedIcalEvents') || '{}');
                for (const rObj of newReservations) {
                    try {
                         await autoAssignIcal(rObj);
                         assignedCount++;
                         currentCache[rObj.cacheKey] = true;
                    } catch(e) {
                         conflictCount++;
                         // DO NOT cache if it failed due to conflict, so the user can free the room and retry!
                         // currentCache[rObj.cacheKey] = true;
                    }
                }
                localStorage.setItem('processedIcalEvents', JSON.stringify(currentCache));
                
                let htmlRes = `<div class="col-span-full p-8 text-center bg-indigo-50 rounded-xl border border-indigo-200">`;
                htmlRes += `<h3 class="font-black text-xl text-indigo-800 mb-2">Sincronización Completada</h3>`;
                htmlRes += `<p class="text-slate-700 font-bold">${assignedCount} reservas asignadas correctamente.</p>`;
                if (conflictCount > 0) {
                    htmlRes += `<p class="text-red-600 font-bold">${conflictCount} reservas ignoradas (conflito ou xa ocupada).</p>`;
                }
                if (errors.length > 0) {
                    htmlRes += `<p class="text-orange-600 text-sm mt-2">Erros descargando: ${errors.join(', ')}</p>`;
                }
                htmlRes += `</div>`;
                
                if (!silent && cont) cont.innerHTML = htmlRes;
                
                // Refresh grid
                if (window.changeDate) window.changeDate();
                
            } else {
                if (!silent && cont) cont.innerHTML = '<div class="col-span-full p-8 text-center text-slate-600 bg-slate-50 rounded-xl border border-slate-200">Non se atoparon reservas futuras novas nos iCal.</div>';
            }
            window.isSyncingIcal = false;
        };