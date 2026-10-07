let desc = "Cliente: Pepe Garcia \\n Teléfono: 12345 \\n Pax: 2";
let text = desc.replace(/\\n/g, ' ').toLowerCase();
let paxMatch = text.match(/(?:cliente|client|guest|nombre|name|hóspede|huesped|pasajero)[:\s]+([^\n\r\\<]+)/i);
console.log(paxMatch ? paxMatch[1].trim() : 'no match');
