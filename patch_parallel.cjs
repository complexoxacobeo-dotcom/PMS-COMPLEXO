const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

const oldLoop = `      let emails = [];
      for (const msg of searchData.messages) {
          const emailData = await firebaseBackend.readReservationEmail(msg.id);
          if (emailData) {
              const hasReply = await firebaseBackend.checkIfThreadHasHotelReply(emailData.threadId);
              if (!hasReply) {
                  const sender = (emailData.sender || "").toLowerCase();
                  if (!sender.includes('complexoxacobeo@gmail.com') && 
                      !sender.includes('no-reply') && 
                      !sender.includes('noreply') &&
                      !sender.includes('admin') &&
                      !sender.includes('ruralgest') &&
                      !sender.includes('booking.com') &&
                      !sender.includes('expedia')) {
                      emails.push(emailData);
                  }
              }
          }
      }
      return emails;`;

const newLoop = `      const emailPromises = searchData.messages.map(async (msg) => {
          const emailData = await firebaseBackend.readReservationEmail(msg.id);
          if (emailData) {
              const hasReply = await firebaseBackend.checkIfThreadHasHotelReply(emailData.threadId);
              if (!hasReply) {
                  const sender = (emailData.sender || "").toLowerCase();
                  if (!sender.includes('complexoxacobeo@gmail.com') && 
                      !sender.includes('no-reply') && 
                      !sender.includes('noreply') &&
                      !sender.includes('admin') &&
                      !sender.includes('ruralgest') &&
                      !sender.includes('booking.com') &&
                      !sender.includes('expedia')) {
                      return emailData;
                  }
              }
          }
          return null;
      });
      const results = await Promise.all(emailPromises);
      return results.filter(e => e !== null);`;

if (code.includes(oldLoop)) {
    code = code.replace(oldLoop, newLoop);
    fs.writeFileSync('src/firebase-backend.js', code);
    console.log("Patched loop to be parallel!");
} else {
    console.log("Could not find old loop.");
}
