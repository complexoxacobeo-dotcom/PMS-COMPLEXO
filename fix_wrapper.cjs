const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

const badWrapper = `  async fetchPendingReservationEmails() {
    return firebaseBackend.fetchPendingReservationEmails();
  }`;

const goodWrapper = `  async fetchPendingReservationEmails() {
    if (this._success) {
       firebaseBackend.fetchPendingReservationEmails().then(this._success).catch(this._failure);
    } else {
       return firebaseBackend.fetchPendingReservationEmails();
    }
  }`;

code = code.replace(badWrapper, goodWrapper);
fs.writeFileSync('src/firebase-backend.js', code);
console.log("Fixed wrapper");
