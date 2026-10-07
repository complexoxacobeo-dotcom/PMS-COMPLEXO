const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

code = code.replace(/async fetchMisterPlanReservations\(\) \{[\s\S]*?\}\s*\}\n?/g, '');
code = code.replace(/async markEmailAsRead\(msgId\) \{[\s\S]*?\}\s*\}\n?/g, '');

const additionalWrappers = `
  async readReservationEmail(msgId) {
    if (this._success) {
       firebaseBackend.readReservationEmail(msgId).then(this._success).catch(this._failure);
    } else {
       return firebaseBackend.readReservationEmail(msgId);
    }
  }
  async checkIfThreadHasHotelReply(threadId) {
    if (this._success) {
       firebaseBackend.checkIfThreadHasHotelReply(threadId).then(this._success).catch(this._failure);
    } else {
       return firebaseBackend.checkIfThreadHasHotelReply(threadId);
    }
  }
`;
code = code.replace(/(async fetchPendingReservationEmails\(\) \{[\s\S]*?return firebaseBackend\.fetchPendingReservationEmails\(\);\s*\})/, "$1" + additionalWrappers);

fs.writeFileSync('src/firebase-backend.js', code);
console.log("Patched wrappers 3!");
