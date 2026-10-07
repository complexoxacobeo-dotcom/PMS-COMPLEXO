const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

code = code.replace(/async fetchRecentEmailsForMatching\(\) \{.*?\}/s, 
\`async fetchPendingReservationEmails() {
    return await firebaseBackend.fetchPendingReservationEmails();
  }\`);

code = code.replace(/async markEmailAsRead\(msgId\) \{.*?\}/s,
\`async readReservationEmail(messageId) {
    return await firebaseBackend.readReservationEmail(messageId);
  },
  async checkIfThreadHasHotelReply(threadId) {
    return await firebaseBackend.checkIfThreadHasHotelReply(threadId);
  }\`);

fs.writeFileSync('src/firebase-backend.js', code);
console.log("Patched wrappers!");
