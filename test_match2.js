let desc = "Cliente: Pepe Garcia\\nTeléfono: 600123456\\nPax: 2";
let m = desc.match(/(?:cliente|client|guest|nombre|name|hóspede|huesped)[:\s]+([^\\]+)/i);
console.log("Extracted literal:", m ? m[1].trim() : 'none');
