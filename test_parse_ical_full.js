const events = [
    { summary: "MisterPlan - Pepe Garcia", description: "Cliente: Pepe Garcia\\nTeléfono: 12345" },
    { summary: "Booking.com", description: "NAME: Juan\\nPHONE: 123" },
    { summary: "Airbnb (12345)", description: "Guest: Maria" },
    { summary: "Pepe", description: "" },
    { summary: "Reserva de Antonio", description: "" },
    { summary: "CLOSED - Out of order", description: "" },
    { summary: "Reservation from Hostelworld: Alice", description: "" }
];

events.forEach(ev => {
    let agency = 'Particular';
    let rawSummary = (ev.summary || '').replace(/\\,/g, ',').replace(/\\;/g, ';');
    rawSummary = rawSummary.replace(/Reservation from [^:]+:/i, '').trim();
    rawSummary = rawSummary.replace(/Reserva de /i, '').trim();
    rawSummary = rawSummary.replace(/MisterPlan - /i, '').trim();
    rawSummary = rawSummary.replace(/CLOSED - /i, '').trim();
    rawSummary = rawSummary.replace(/Reserved - /i, '').trim();
    rawSummary = rawSummary.replace(/Airbnb \(/i, '').replace(/\)$/, '').trim();
    
    let descNameMatch = (ev.description || '').match(/(?:cliente|client|guest|nombre|name|hóspede|huesped)[:\s]+([^\n\r\\<]+)/i);
    let extractedName = descNameMatch ? descNameMatch[1].trim() : rawSummary;
    
    if (extractedName.toLowerCase() === 'booking' || extractedName.toLowerCase() === 'airbnb') {
        extractedName = "Reserva " + agency;
    }
    let clientName = extractedName || 'Reserva iCal';
    console.log(`Original: "${ev.summary}" -> Client: "${clientName}"`);
});
