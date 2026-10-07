const fs = require('fs');
const text = `
27/08/2026 - 28/08/2026	Hotel Triacastela	3225-7064289	5264963750	Carlos Cebria Moscardo	68,00 €
Nº personas: 2
Precio total: 68 €
Habitación 204: 2 pax = 68,00 € SA
Teléfono: /
---- 17/03/2026 11:14:50 ---- Comentario del Cliente: Reserva obtenida de Booking.com el día 2026-03-17 --------
	27/08/2026 - 28/08/2026	Hotel Triacastela	1-7118652	RuralCloud_V2	CAMINO DE SANTIAGO RESERVAS. VIAJES CARMI S.L.	85,00 €
Nº personas: 2
Precio total: 85 €
Habitación 206: 2 pax = 65,00 € 
Teléfono: 639635925 /
Desayuno x 2 = 20,00 €
VIAJES CARMI Simone Felix do Nascimento20260767
`;

const blocks = text.split(/(?=\b\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}\/\d{2}\/\d{4}\b)/g).map(b => b.trim()).filter(Boolean);
console.log("Found", blocks.length, "blocks");
for (let b of blocks) {
    const lines = b.split('\n').map(l => l.trim()).filter(Boolean);
    const headerParts = lines[0].split('\t');
    console.log("Header parts:", headerParts);
    console.log("Lines:", lines.length);
}
