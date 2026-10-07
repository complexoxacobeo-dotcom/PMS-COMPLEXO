const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

code = code.replace(/fetchRecentEmailsForMatching\(\) \{[\s\S]*?return await firebaseBackend.fetchRecentEmailsForMatching\(\);\s*\}/, 
"fetchPendingReservationEmails() {\n    return firebaseBackend.fetchPendingReservationEmails();\n  }");

code = code.replace(/markEmailAsRead\(msgId\) \{[\s\S]*?return await firebaseBackend.markEmailAsRead\(msgId\);\s*\}/, 
"readReservationEmail(messageId) {\n    return firebaseBackend.readReservationEmail(messageId);\n  },\n  async checkIfThreadHasHotelReply(threadId) {\n    return firebaseBackend.checkIfThreadHasHotelReply(threadId);\n  }");

fs.writeFileSync('src/firebase-backend.js', code);
console.log("Patched wrappers!");
