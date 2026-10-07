const events = [
    { summary: 'Booking.com: Nueva reserva para X, de John Doe', description: 'Phone: 12345' },
    { summary: 'Airbnb (Not available)', description: 'Reservation URL: ...\nPhone Number (Last 4 Digits): 1234\nGuest Name: Alice Smith' },
    { summary: 'MisterPlan - Juan Perez', description: '' },
    { summary: 'Reserved', description: 'Reservation from Bob Jones' },
];

for (const ev of events) {
    let rawSummary = (ev.summary || '').replace(/\\,/g, ',').replace(/\\;/g, ';');
    let text = ((ev.summary || '') + ' ' + (ev.description || '')).replace(/\\n/g, ' ').toLowerCase();
    
    // Attempt advanced extraction
    let cleanDesc = (ev.description || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\\n/gi, '\n').replace(/\\r/gi, '\r');
    let descNameMatch = cleanDesc.match(/(?:cliente|client|guest|nombre|name|hóspede|huesped|pasajero|de|from)[:\s-]*([A-Z][a-zA-Z\s]+)/i);
    let extractedName = descNameMatch ? descNameMatch[1].trim() : rawSummary;

    if (rawSummary.match(/de\s+([A-Z][a-zA-Z\s]+)/i)) {
        extractedName = rawSummary.match(/de\s+([A-Z][a-zA-Z\s]+)/i)[1].trim();
    } else if (rawSummary.match(/from\s+([A-Z][a-zA-Z\s]+)/i)) {
        extractedName = rawSummary.match(/from\s+([A-Z][a-zA-Z\s]+)/i)[1].trim();
    } else if (rawSummary.match(/^(?:MisterPlan|Booking\.com|Airbnb|Expedia)[^A-Za-z0-9]*(?:-\s*)?([A-Z][a-zA-Z\s]+)/i)) {
        let m = rawSummary.match(/^(?:MisterPlan|Booking\.com|Airbnb|Expedia)[^A-Za-z0-9]*(?:-\s*)?([A-Z][a-zA-Z\s]+)/i);
        if (m[1].toLowerCase() !== 'nueva reserva' && m[1].toLowerCase() !== 'new reservation' && m[1].toLowerCase() !== 'not available') {
            extractedName = m[1].trim();
        }
    }
    
    console.log(extractedName);
}
