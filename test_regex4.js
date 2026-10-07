let desc = "Cliente: Pepe Garcia\\nTeléfono: 12345";
let m = desc.match(/(?:cliente|client|guest|nombre|name|hóspede|huesped)[:\s]+([^\n\r\\]+)/i);
console.log(m ? m[1].trim() : null);

let desc2 = "CLIENTE: Pepe\\n";
let m2 = desc2.match(/(?:cliente|client|guest|nombre|name|hóspede|huesped)[:\s]+([^\n\r\\]+)/i);
console.log(m2 ? m2[1].trim() : null);
