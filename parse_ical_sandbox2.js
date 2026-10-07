const events = [
    { summary: 'Booking.com: Nueva reserva para X, de John Doe', description: 'Phone: 12345' },
    { summary: 'Airbnb (Not available)', description: 'Reservation URL: ...\nPhone Number (Last 4 Digits): 1234\nGuest Name: Alice Smith\n' },
    { summary: 'MisterPlan - Juan Perez', description: '' },
    { summary: 'Reserved', description: 'Reservation from Bob Jones' },
];

for (const ev of events) {
    let rawSummary = (ev.summary || '').replace(/\\,/g, ',').replace(/\\;/g, ';');
    let cleanDesc = (ev.description || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\\n/gi, '\n').replace(/\\r/gi, '\r');
    
    let extractedName = rawSummary;
    let nameFound = false;

    // 1. Check description for Guest Name:
    let descNameMatch = cleanDesc.match(/(?:Guest Name|Nombre del huésped|Nombre|Name|Cliente|Hóspede)[:\s-]*([A-Z][a-zA-Z\s]+)/i);
    if (descNameMatch) {
        extractedName = descNameMatch[1].trim();
        nameFound = true;
    }

    if (!nameFound) {
        let fromMatch = cleanDesc.match(/(?:Reservation from|Reserva de)[:\s]*([A-Z][a-zA-Z\s]+)/i);
        if (fromMatch) {
            extractedName = fromMatch[1].trim();
            nameFound = true;
        }
    }

    // 2. Check summary for "de Nombre"
    if (!nameFound) {
        let subjDeMatch = rawSummary.match(/(?:de|from)\s+([A-Z][a-zA-Z\s]+)/i);
        if (subjDeMatch) {
            extractedName = subjDeMatch[1].trim();
            nameFound = true;
        }
    }

    // 3. Check summary for "MisterPlan - Nombre"
    if (!nameFound) {
        let m = rawSummary.match(/^(?:MisterPlan|Booking\.com|Airbnb|Expedia)[^A-Za-z0-9]*(?:-\s*)?([A-Z][a-zA-Z\s]+)/i);
        if (m && !m[1].match(/nueva reserva|new reservation|not available/i)) {
            extractedName = m[1].trim();
            nameFound = true;
        }
    }
    
    // Clean up extracted Name
    extractedName = extractedName.replace(/^(?:CLOSED|Reserved|Bloqueo|Out of order|Fora de servizo)$/i, '').trim();

    console.log(extractedName);
}
