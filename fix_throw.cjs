const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

// In fetchPendingReservationEmails, readReservationEmail, checkIfThreadHasHotelReply
code = code.replace(/console\.error\("Error fetching pending emails", e\);\n      return \[\];/g, 'console.error("Error fetching pending emails", e);\n      throw e;');

fs.writeFileSync('src/firebase-backend.js', code);
