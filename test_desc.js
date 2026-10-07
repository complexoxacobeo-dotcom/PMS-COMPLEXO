let desc = "Agencia: Booking.com\\nCliente: Pepe Garcia\\nPersonas: 2";
let match = desc.match(/(?:cliente|client|guest|nombre|name|huesped)[: ]+([a-zA-Z\s]+)(?:\\n|$)/i);
console.log(match ? match[1].trim() : 'no match');
