let desc = "Agencia: Booking.com\\nCliente: Pepe Garcia \\nPersonas: 2";
let descNameMatch = desc.match(/(?:cliente|client|guest|nombre|name|hóspede|huesped)[:\s]+([^\\]+)/i);
console.log(descNameMatch ? descNameMatch[1].trim() : 'none');
