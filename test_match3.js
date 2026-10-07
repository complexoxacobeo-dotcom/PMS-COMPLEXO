let desc = "Cliente: Pepe Garcia\\nTeléfono: 600123456\\nPax: 2";
let m = desc.match(/(?:cliente|client|guest|nombre|name|hóspede|huesped)[:\s]+([^\n\r\\]+)/i);
console.log("Result:", m ? m[1].trim() : null);

let desc2 = "CLIENTE: ALBERTO PEREZ<br>TELEFONO: 600000000";
let m2 = desc2.match(/(?:cliente|client|guest|nombre|name|hóspede|huesped)[:\s]+([^\n\r\\<]+)/i);
console.log("Result2:", m2 ? m2[1].trim() : null);
