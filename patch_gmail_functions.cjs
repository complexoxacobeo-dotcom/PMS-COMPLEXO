const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

// We will find where `fetchRecentEmailsForMatching: async () => {` starts
const startIndex1 = code.indexOf('fetchRecentEmailsForMatching: async () => {');
const endIndex1 = code.indexOf('saveDailyCash:', startIndex1);

if (startIndex1 !== -1 && endIndex1 !== -1) {
    // We want to replace everything from startIndex1 to just before `saveDailyCash:`
    // with our new functions.
    
    const newFunctions = `
  fetchPendingReservationEmails: async () => {
    try {
      if (!googleAccessToken) return [];
      // Buscar correos dos ultimos 14 dias
      const queryStr = encodeURIComponent('newer_than:14d -in:spam -in:trash (reserva OR reservas OR disponibilidad OR availability OR booking OR habitación OR room)');
      const searchRes = await fetch(\`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=\${queryStr}&maxResults=30\`, {
          headers: { Authorization: \`Bearer \${googleAccessToken}\` }
      });
      const searchData = await searchRes.json();
      if (!searchData.messages) return [];
      
      let emails = [];
      for (const msg of searchData.messages) {
          const emailData = await firebaseBackend.readReservationEmail(msg.id);
          if (emailData) {
              // Comprobar si ja tem resposta do hotel no fio
              const hasReply = await firebaseBackend.checkIfThreadHasHotelReply(emailData.threadId);
              if (!hasReply) {
                  // Filtrar envios do propio hotel ou confirmacions automaticas
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
      return emails;
    } catch(e) {
      console.error("Error fetching pending emails", e);
      return [];
    }
  },

  readReservationEmail: async (messageId) => {
      try {
          if (!googleAccessToken) return null;
          const msgRes = await fetch(\`https://gmail.googleapis.com/gmail/v1/users/me/messages/\${messageId}?format=full\`, {
              headers: { Authorization: \`Bearer \${googleAccessToken}\` }
          });
          const msgData = await msgRes.json();
          if (msgData.error) return null;
          
          let subject = '';
          let sender = '';
          let dateStr = '';
          if (msgData.payload && msgData.payload.headers) {
              const subjHeader = msgData.payload.headers.find(h => h.name === 'Subject');
              if (subjHeader) subject = subjHeader.value;
              const senderHeader = msgData.payload.headers.find(h => h.name === 'From');
              if (senderHeader) sender = senderHeader.value;
              const dateHeader = msgData.payload.headers.find(h => h.name === 'Date');
              if (dateHeader) dateStr = dateHeader.value;
          }
          
          let rawBody = '';
          if (msgData.payload.parts) {
              const part = msgData.payload.parts.find(p => p.mimeType === 'text/plain');
              if (part && part.body && part.body.data) {
                  rawBody = part.body.data;
              } else if (msgData.payload.parts[0] && msgData.payload.parts[0].parts) {
                  const subPart = msgData.payload.parts[0].parts.find(p => p.mimeType === 'text/plain');
                  if (subPart && subPart.body && subPart.body.data) {
                      rawBody = subPart.body.data;
                  }
              }
          } else if (msgData.payload.body && msgData.payload.body.data) {
              rawBody = msgData.payload.body.data;
          }
          let textBody = '';
          if (rawBody) {
              textBody = decodeURIComponent(escape(atob(rawBody.replace(/-/g, '+').replace(/_/g, '/'))));
          }
          
          return {
              id: msgData.id,
              threadId: msgData.threadId,
              subject,
              sender,
              date: dateStr,
              body: textBody,
              snippet: msgData.snippet
          };
      } catch(e) {
          console.error("Error reading email", e);
          return null;
      }
  },

  checkIfThreadHasHotelReply: async (threadId) => {
      try {
          if (!googleAccessToken) return false;
          const threadRes = await fetch(\`https://gmail.googleapis.com/gmail/v1/users/me/threads/\${threadId}\`, {
              headers: { Authorization: \`Bearer \${googleAccessToken}\` }
          });
          const threadData = await threadRes.json();
          if (!threadData.messages) return false;
          
          // Se algunha mensaxe no fío ven do hotel (despois da primeira), considérase respondida
          for (let i = 1; i < threadData.messages.length; i++) {
              const msg = threadData.messages[i];
              if (msg.payload && msg.payload.headers) {
                  const senderHeader = msg.payload.headers.find(h => h.name === 'From');
                  if (senderHeader && senderHeader.value.toLowerCase().includes('complexoxacobeo@gmail.com')) {
                      return true;
                  }
              }
          }
          return false;
      } catch(e) {
          console.error("Error checking thread", e);
          return false;
      }
  },
  
`;
    code = code.substring(0, startIndex1) + newFunctions + code.substring(endIndex1);
    
    // Also remove them from the window.firebaseBackend wrapper at the end
    code = code.replace(/fetchRecentEmailsForMatching:\s*async\s*\(\)\s*=>\s*\{.*?\}(?=\s*,\s*\w+:)/gs, '');
    
    fs.writeFileSync('src/firebase-backend.js', code);
    console.log("Patched firebase-backend.js to add new functions and remove old ones.");
} else {
    console.log("Could not find start/end indices");
}
