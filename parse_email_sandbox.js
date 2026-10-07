const text = `
Alonso Miguel
amique.692573@guest.booking.com
/ +34617514305
48200 Astepe 1C 3C
España
Observaciones:
--- 29/07/2026 00:54:58 ---
Condiciones para la habitacion Habitacion Doble - General:
...
Importe Total: 175,50€
Hotel Triacastela
31/07/2026 - 3 noches - 2 personas
1 Habitación para 2 Adultos (Habitación Doble )
Precio habitación: 58,50€
3 noches = 175,50 €
Sólo alojamiento
Total 2 personas, 3 noches = 175,50 €
Establecimiento
Hotel Triacastela
`;

let clientName = '';
let clientEmail = '';
let clientPhone = '';
let checkIn = '';
let noches = 1;
let personas = 1;
let agency = 'Booking';

const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

// Look for patterns like DD/MM/YYYY - X noches - Y personas
let dateNightPaxMatch = text.match(/([0-9]{2}\/[0-9]{2}\/[0-9]{4})\s*-\s*([0-9]+)\s*noches?\s*-\s*([0-9]+)\s*personas?/i);
if (dateNightPaxMatch) {
    let p = dateNightPaxMatch[1].split('/');
    checkIn = `${p[2]}-${p[1]}-${p[0]}`;
    noches = parseInt(dateNightPaxMatch[2], 10);
    personas = parseInt(dateNightPaxMatch[3], 10);
}

// Phone
let phoneMatch = text.match(/(?:\+?[0-9\s]{9,15})/);
if (phoneMatch) {
    clientPhone = phoneMatch[0].trim();
}

// Email
let emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})/);
if (emailMatch) {
    clientEmail = emailMatch[1].trim();
}

// Name is usually the first line if it's right before the email
for (let i = 0; i < lines.length; i++) {
    if (lines[i] === clientEmail && i > 0) {
        clientName = lines[i-1];
        break;
    }
}

console.log({ clientName, clientEmail, clientPhone, checkIn, noches, personas });
