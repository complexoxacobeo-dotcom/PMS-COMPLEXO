const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

const injection = `
  validarQR: async (date, qrId, type, qty, user) => {
    try {
      await ensureAuth();
      const prefix = getTenantPrefix();
      const docRef = doc(db, prefix ? \`\${prefix}consumptions\` : "consumptions", date);
      const docSnap = await getDoc(docRef);
      const data = docSnap.exists() ? docSnap.data() : {};
      
      const key = \`\${qrId}_\${type}\`;
      if (data[key]) {
        return { success: false, error: 'Xa consumido', info: data[key] };
      }
      
      const updateData = {
         [key]: {
            consumedAt: new Date().toISOString(),
            validatedBy: user,
            qty: qty
         }
      };
      
      await setDoc(docRef, updateData, { merge: true });
      return { success: true, info: updateData[key] };
    } catch(e) {
      handleFirestoreError(e, OperationType.WRITE, 'validarQR');
      return { success: false, error: e.message };
    }
  },
  getConsumptions: async (date) => {
    try {
      await ensureAuth();
      const prefix = getTenantPrefix();
      const docSnap = await getDoc(doc(db, prefix ? \`\${prefix}consumptions\` : "consumptions", date));
      return docSnap.exists() ? docSnap.data() : {};
    } catch(e) {
      console.warn(e);
      return {};
    }
  },
`;

code = code.replace(/export const firebaseBackend = \{/, "export const firebaseBackend = {" + injection);
fs.writeFileSync('src/firebase-backend.js', code);
console.log("firebase-backend patched with QR methods");
