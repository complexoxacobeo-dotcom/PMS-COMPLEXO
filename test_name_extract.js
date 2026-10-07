let desc = "Cliente: Pepe Garcia\\nTeléfono: 12345\\nPax: 2";
let m = desc.match(/(?:cliente|client|guest|nombre|name|hóspede|huesped|pasajero)[:\s]+([^\n\r\\<]+)/i);
console.log("With literal \\n:", m ? m[1].trim() : 'no match');

let desc2 = "Cliente: Maria Fernandez\nTelefono: 12345\nPax: 2";
let m2 = desc2.match(/(?:cliente|client|guest|nombre|name|hóspede|huesped|pasajero)[:\s]+([^\n\r\\<]+)/i);
console.log("With actual newline:", m2 ? m2[1].trim() : 'no match');

let desc3 = "Reservado por Booking.com - Name: John Doe";
let m3 = desc3.match(/(?:cliente|client|guest|nombre|name|hóspede|huesped|pasajero)[:\s]+([^\n\r\\<]+)/i);
console.log("Booking:", m3 ? m3[1].trim() : 'no match');
