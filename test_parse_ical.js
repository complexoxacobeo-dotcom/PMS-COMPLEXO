const icalStr = `BEGIN:VEVENT
UID:12345
DTSTART;VALUE=DATE:20241010
DTEND;VALUE=DATE:20241012
SUMMARY:MisterPlan - Pepe Garcia
DESCRIPTION:Cliente: Pepe Garcia\\nTeléfono: 600123456\\nPax: 2\\nRegimen: AD\\n
END:VEVENT`;

let text = icalStr.replace(/\\n/g, ' ').toLowerCase();
console.log("TEXT:", text);

let descNameMatch = (icalStr || '').match(/(?:cliente|client|guest|nombre|name|hóspede|huesped)[:\s]+([^\\]+)/i);
console.log("NAME:", descNameMatch ? descNameMatch[1].trim() : 'no match');

let paxMatch = text.match(/(?:pax|personas|adults|adultos|huespedes|hóspedes|guests)[: ]*(\d+)/i);
console.log("PAX:", paxMatch ? paxMatch[1] : 'no pax');

let phoneMatch = text.match(/(?:teléfono|telefono|phone|tel|móvil|movil)[: ]*(\+?[\d\s]{9,15})/i);
console.log("PHONE:", phoneMatch ? phoneMatch[1] : 'no phone');

