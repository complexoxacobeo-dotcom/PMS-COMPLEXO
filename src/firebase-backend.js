import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, updateDoc, query, where, orderBy, addDoc, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "tarefas-complexo",
  appId: "1:505162152462:web:36fa4854465bfd28541a5f",
  apiKey: "AIzaSyAQvhe-dIo8GezwOrd8lKagZxel1SSBSW8",
  authDomain: "tarefas-complexo.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-generated-7f348efa-1b24-4897-9746-18d7a6eacd36",
  storageBucket: "tarefas-complexo.firebasestorage.app",
  messagingSenderId: "505162152462",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

let authResolved = false;
let googleAccessToken = null;
try {
  googleAccessToken = localStorage.getItem('google_access_token');
  if (googleAccessToken === 'null' || googleAccessToken === 'undefined' || googleAccessToken === '') googleAccessToken = null;
  const tokenTime = localStorage.getItem('google_access_token_time');
  if (tokenTime && (Date.now() - parseInt(tokenTime)) > 50 * 60 * 1000) {
      googleAccessToken = null;
  }
} catch(e) {}
let authPromise = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    authResolved = true;
    resolve(user);
  });
});

const ensureAuth = async () => {
  if (!authResolved) {
    await authPromise;
  }
};

const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const getTenantPrefix = () => {
  let prefix = '';
  const user = auth.currentUser;
  if (!localMode && user && user.email !== 'complexoxacobeo@gmail.com') {
    prefix = `tenants/${user.uid}/`;
  }
  let estId = localStorage.getItem('currentEstablishmentId') || 'default';
  if (estId !== 'default') {
    prefix += `establishments/${estId}/`;
  }
  return prefix;
};

let localMode = localStorage.getItem('localMode') === 'true';

export const firebaseBackend = {
  validarQR: async (date, qrId, type, qty, user) => {
    try {
      await ensureAuth();
      const prefix = getTenantPrefix();
      const docRef = doc(db, prefix ? `${prefix}consumptions` : "consumptions", date);
      const docSnap = await getDoc(docRef);
      const data = docSnap.exists() ? docSnap.data() : {};
      
      const key = `${qrId}_${type}`;
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
      const docSnap = await getDoc(doc(db, prefix ? `${prefix}consumptions` : "consumptions", date));
      return docSnap.exists() ? docSnap.data() : {};
    } catch(e) {
      console.warn(e);
      return {};
    }
  },

  getGoogleAccessToken: () => googleAccessToken,
  doEmailLogin: async (email, password) => {
    try {
      const lowerEmail = email.toLowerCase();
      
      // 1. Check hardcoded credentials instantly (0ms)
      if ((lowerEmail === 'xacobeo07@xacobeo.com' && password === 'Xacobeo07') || 
          (lowerEmail === 'admin@xacobeo.com' && password === 'admin') ||
          (lowerEmail === 'complexoxacobeo@gmail.com' && password === 'Xacobeo07')) {
        localMode = true; localStorage.setItem('localMode', 'true');
        return { uid: 'local', email: email };
      }

      // 2. Check cached credentials from localStorage instantly (0ms)
      try {
        const cachedCredsStr = localStorage.getItem('cached_credentials');
        if (cachedCredsStr) {
          const cachedCreds = JSON.parse(cachedCredsStr);
          if (cachedCreds && cachedCreds.user && cachedCreds.pass) {
            const expectedEmail = (cachedCreds.user + "@xacobeo.com").toLowerCase();
            const expectedEmailAlt = cachedCreds.user.toLowerCase().includes('@') ? cachedCreds.user.toLowerCase() : '';
            if ((lowerEmail === expectedEmail || (expectedEmailAlt && lowerEmail === expectedEmailAlt)) && password === cachedCreds.pass) {
              localMode = true; localStorage.setItem('localMode', 'true');
              return { uid: 'local', email: email };
            }
          }
        }
      } catch (cacheErr) {
        console.warn("Could not parse cached credentials", cacheErr);
      }

      // 3. Try fetching live config/main to check custom credentials FIRST
      // This is much faster than waiting for a failing Firebase Auth call.
      let config = null;
      try {
        const configDoc = await getDoc(doc(db, "config/main"));
        config = configDoc.exists() ? configDoc.data() : null;
      } catch (dbErr) {
        console.warn("Could not fetch config/main for credentials check", dbErr);
      }

      if (config && config.credentials) {
        const expectedEmail = (config.credentials.user + "@xacobeo.com").toLowerCase();
        const expectedEmailAlt = config.credentials.user.toLowerCase().includes('@') ? config.credentials.user.toLowerCase() : '';
        if ((lowerEmail === expectedEmail || (expectedEmailAlt && lowerEmail === expectedEmailAlt)) && password === config.credentials.pass) {
          try {
            localStorage.setItem('cached_credentials', JSON.stringify(config.credentials));
          } catch (e) {}
          localMode = true; localStorage.setItem('localMode', 'true');
          return { uid: 'local', email: email };
        }
      }

      // 4. Fallback to Firebase Auth (this will run for non-local/tenant users)
      try {
        const safePassword = password.length < 6 ? password + password : password;
        const result = await signInWithEmailAndPassword(auth, email, safePassword);
        localMode = false; localStorage.setItem('localMode', 'false');
        return result.user;
      } catch (authError) {
        throw new Error("Credenciais incorrectas");
      }
    } catch(e) {
      throw e;
    }
  },
  doEmailRegister: async (email, password) => {
    const safePassword = password.length < 6 ? password + password : password;
    try {
      const result = await createUserWithEmailAndPassword(auth, email, safePassword);
      return result.user;
    } catch(e) {
      throw e;
    }
  },
  getInitialData: async (date) => {
    try {
      let rootPrefix = '';
      const user = auth.currentUser;
      if (!localMode && user && user.email !== 'complexoxacobeo@gmail.com') {
        rootPrefix = `tenants/${user.uid}/`;
      }
      const prefix = getTenantPrefix();

      // 1. Check local mirror first
      let localDayData = null;
      try {
        const cached = localStorage.getItem(`planing_day_${prefix}_${date}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localDayData = parsed;
          }
        }
      } catch(e) {}

      let rootConfig = {};
      let config = null;
      let dayData = null;

      try {
        await ensureAuth();
        const rootConfigReq = getDoc(doc(db, rootPrefix ? rootPrefix.replace(/\/$/, '') : "config", rootPrefix ? "config/main" : "main"));
        const configReq = prefix === rootPrefix ? rootConfigReq : getDoc(doc(db, prefix ? prefix.replace(/\/$/, '') : "config", prefix ? "config/main" : "main"));
        const dayReq = getDoc(doc(db, prefix ? `${prefix}dailyData` : "dailyData", date));

        const [rootConfigDoc, configDoc, dayDoc] = await Promise.all([rootConfigReq, configReq, dayReq]);

        rootConfig = rootConfigDoc.exists() ? rootConfigDoc.data() : {};
        const userEstablishments = rootConfig.establishments || rootConfig.userEstablishments || [{id: 'default', name: 'Recepción'}];
        
        config = configDoc.exists() ? configDoc.data() : null;
        if (config) {
          config.userEstablishments = userEstablishments;
          config.empregados = rootConfig.empregados || config.empregados || [];
          if (config.credentials) {
            try {
              localStorage.setItem('cached_credentials', JSON.stringify(config.credentials));
            } catch (e) {}
          }
          if (rootConfig.agencies) {
              config.agencies = rootConfig.agencies;
          }
          try {
            localStorage.setItem('cached_app_config', JSON.stringify(config));
          } catch(e) {}
        }
        
        dayData = dayDoc.exists() ? dayDoc.data().rooms : null;
      } catch(fsErr) {
        console.warn("Firestore getDoc aviso (cota/conexión):", fsErr.message);
      }

      // If config was not loaded from server, try local cache
      if (!config) {
        try {
          const cachedCfg = localStorage.getItem('cached_app_config');
          if (cachedCfg) config = JSON.parse(cachedCfg);
        } catch(e) {}
        if (!config) {
          config = { baseRooms: [], agencies: [], credentials: {user:'Xacobeo07', pass:'Xacobeo07'}, extrasPrices: {}, pushConfig: {} };
        }
      }

      // If server dayData is empty or unavailable, use localDayData
      if ((!dayData || dayData.length === 0) && localDayData && localDayData.length > 0) {
        dayData = localDayData;
      } else if (dayData && dayData.length > 0) {
        // Keep local mirror updated
        try {
          localStorage.setItem(`planing_day_${prefix}_${date}`, JSON.stringify(dayData));
        } catch(e) {}
      }

      if (!dayData) dayData = [];

      if (Array.isArray(dayData)) {
          dayData.forEach(r => {
              if (r.clientName && r.clientName.toLowerCase().includes('reserva ical')) {
                  r.clientName = 'Verifica e introduce o nome';
              }
          });
      }
      return { config, dayData };

    } catch(e) {
      console.error("Erro en getInitialData:", e);
      return { config: { baseRooms: [], agencies: [] }, dayData: [] };
    }
  },
  saveDayData: async (date, json) => {
    try {
      const prefix = getTenantPrefix();
      // 1. Sempre gardar en local mirror inmediatamente para non perder ningún dato
      try {
        localStorage.setItem(`planing_day_${prefix}_${date}`, json);
        localStorage.setItem(`planing_day_time_${prefix}_${date}`, Date.now().toString());
      } catch(e) {}

      // 2. Tentar persistencia en Firestore (se a cota está esgotada, non romper)
      try {
        await ensureAuth();
        await setDoc(doc(db, prefix ? `${prefix}dailyData` : "dailyData", date), { rooms: JSON.parse(json) });
      } catch(fsErr) {
        console.warn("Firestore setDoc aviso (cota esgotada ou offline), datos asegurados localmente:", fsErr.message);
      }
      return true;
    } catch(e) {
      console.warn("saveDayData aviso:", e);
      return true;
    }
  },
  propagarReserva: async (inD, outD, bedIds, updatedRooms, checkInDateStr) => {
    try {
      const prefix = getTenantPrefix();
      const startDate = new Date(inD);
      const endDate = new Date(outD);
      
      let curr = new Date(startDate);
      curr.setHours(12,0,0,0);
      let end = new Date(endDate);
      end.setHours(12,0,0,0);
      
      const dates = [];
      while (curr < end) {
        dates.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }

      for (const dStr of dates) {
        let rooms = [];
        try {
          const cached = localStorage.getItem(`planing_day_${prefix}_${dStr}`);
          if (cached) rooms = JSON.parse(cached);
        } catch(e) {}

        if (!rooms || rooms.length === 0) {
          try {
            await ensureAuth();
            const dayRef = doc(db, prefix ? `${prefix}dailyData` : "dailyData", dStr);
            const dayDoc = await getDoc(dayRef);
            if (dayDoc.exists()) rooms = dayDoc.data().rooms || [];
          } catch(e) {}
        }

        updatedRooms.forEach(ur => {
          const idx = rooms.findIndex(r => r.id === ur.id);
          if (idx !== -1) {
            rooms[idx] = JSON.parse(JSON.stringify(ur));
          } else {
            rooms.push(JSON.parse(JSON.stringify(ur)));
          }
        });

        // Always save to localStorage immediately
        try {
          localStorage.setItem(`planing_day_${prefix}_${dStr}`, JSON.stringify(rooms));
          localStorage.setItem(`planing_day_time_${prefix}_${dStr}`, Date.now().toString());
        } catch(e) {}

        // Try writing to Firestore
        try {
          await ensureAuth();
          const dayRef = doc(db, prefix ? `${prefix}dailyData` : "dailyData", dStr);
          await setDoc(dayRef, { rooms: rooms });
        } catch(fsErr) {
          console.warn("Firestore propagarReserva aviso para data " + dStr + ":", fsErr.message);
        }
      }
      return true;
    } catch(e) {
      console.warn("propagarReserva aviso:", e);
      return true;
    }
  },
  saveAppConfig: async (json) => {
    try {
      const data = JSON.parse(json);
      try {
        localStorage.setItem('cached_app_config', json);
        if (data.credentials) {
          localStorage.setItem('cached_credentials', JSON.stringify(data.credentials));
        }
      } catch (e) {}

      try {
        await ensureAuth();
        if (data.userEstablishments || data.agencies) {
          let rootPrefix = '';
          const user = auth.currentUser;
          if (!localMode && user && user.email !== 'complexoxacobeo@gmail.com') {
            rootPrefix = `tenants/${user.uid}/`;
          }
          const updates = {};
          if (data.userEstablishments) updates.establishments = data.userEstablishments;
          if (data.agencies) updates.agencies = data.agencies;
          if (data.empregados) updates.empregados = data.empregados;
          await setDoc(doc(db, rootPrefix ? rootPrefix.replace(/\/$/, '') : "config", rootPrefix ? "config/main" : "main"), updates, { merge: true });
        }

        const prefix = getTenantPrefix();
        await setDoc(doc(db, prefix ? prefix.replace(/\/$/, '') : "config", prefix ? "config/main" : "main"), data);
      } catch(fsErr) {
        console.warn("Firestore saveAppConfig aviso:", fsErr.message);
      }
      return true;
    } catch(e) {
      console.warn("saveAppConfig aviso:", e);
      return true;
    }
  },
  
  
    forceUpdateIcalName: async (uid, checkIn, noches, clientName, phone, email, agency) => {
    try {
        const prefix = getTenantPrefix();
        const dates = [];
        const startDate = new Date(checkIn);
        for (let i = 0; i < noches; i++) {
            let d = new Date(startDate);
            d.setDate(d.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        for (const date of dates) {
            let dia = [];
            try {
              const cached = localStorage.getItem(`planing_day_${prefix}_${date}`);
              if (cached) dia = JSON.parse(cached);
            } catch(e) {}

            try {
              await ensureAuth();
              const dayRef = doc(db, prefix ? `${prefix}dailyData` : "dailyData", date);
              const dayDoc = await getDoc(dayRef);
              if (dayDoc.exists()) dia = dayDoc.data().rooms || dia;
            } catch(e) {}

            if (dia && dia.length > 0) {
                let modified = false;
                for (let i = 0; i < dia.length; i++) {
                    let room = dia[i];
                    if (room.icalUid === uid && (room.status === 'reserved' || room.status === 'occupied')) {
                        if (clientName) room.clientName = clientName;
                        if (phone) room.clientPhone = phone;
                        if (email) room.clientEmail = email;
                        if (agency) room.agency = agency;
                        modified = true;
                    }
                }
                if (modified) {
                    try {
                        localStorage.setItem(`planing_day_${prefix}_${date}`, JSON.stringify(dia));
                        localStorage.setItem(`planing_day_time_${prefix}_${date}`, Date.now().toString());
                    } catch(e) {}
                    try {
                        await ensureAuth();
                        const dayRef = doc(db, prefix ? `${prefix}dailyData` : "dailyData", date);
                        await setDoc(dayRef, { rooms: dia });
                    } catch(fsErr) {
                        console.warn("Firestore forceUpdateIcalName aviso:", fsErr.message);
                    }
                }
            }
        }
        return { success: true };
    } catch (e) {
        console.warn("forceUpdateIcalName aviso:", e);
        return { success: true };
    }
  },
  freeIcalReservation: async (uid, checkIn, noches, targetBaseId, oldClientName) => {
    try {
      const prefix = getTenantPrefix();
      const dates = [];
      const startDate = new Date(checkIn);
      for (let i = 0; i < noches; i++) {
          let d = new Date(startDate);
          d.setDate(d.getDate() + i);
          dates.push(d.toISOString().split('T')[0]);
      }
      for (const date of dates) {
          let dia = [];
          try {
            const cached = localStorage.getItem(`planing_day_${prefix}_${date}`);
            if (cached) dia = JSON.parse(cached);
          } catch(e) {}

          try {
            await ensureAuth();
            const dayRef = doc(db, prefix ? `${prefix}dailyData` : "dailyData", date);
            const dayDoc = await getDoc(dayRef);
            if (dayDoc.exists()) dia = dayDoc.data().rooms || dia;
          } catch(e) {}

          if (dia && dia.length > 0) {
              let modified = false;
              for (let i = 0; i < dia.length; i++) {
                  let room = dia[i];
                  
                  let matchUid = (uid && room.icalUid === uid);
                  let matchFallback = (targetBaseId && room.id === targetBaseId && (room.status === 'reserved' || room.status === 'occupied') && (!oldClientName || room.clientName === oldClientName));
                  
                  if (matchUid || matchFallback) {
                      room.status = 'free';
                      room.clientName = '';
                      room.clientEmail = '';
                      room.clientPhone = '';
                      room.agency = '';
                      room.price = room.type === 'bed' ? 15 : 0; 
                      room.paidAgency = 0;
                      room.icalUid = '';
                      room.groupId = '';
                      modified = true;
                  }
              }
              if (modified) {
                  try {
                      localStorage.setItem(`planing_day_${prefix}_${date}`, JSON.stringify(dia));
                      localStorage.setItem(`planing_day_time_${prefix}_${date}`, Date.now().toString());
                  } catch(e) {}
                  try {
                      await ensureAuth();
                      const dayRef = doc(db, prefix ? `${prefix}dailyData` : "dailyData", date);
                      await setDoc(dayRef, { rooms: dia });
                  } catch(fsErr) {
                      console.warn("Firestore freeIcalReservation aviso:", fsErr.message);
                  }
              }
          }
      }
      return { success: true };
    } catch (e) {
      console.warn("freeIcalReservation aviso:", e);
      return { success: true };
    }
  },

  autoAssignReservation: async (resObj) => {
    try {
      if (!googleAccessToken && !resObj.isIcal) return { error: true, message: "NOT_LOGGED_IN_GOOGLE" };
      const prefix = getTenantPrefix();

      if (!resObj.checkIn || !resObj.noches || resObj.noches <= 0) {
          return { error: true, message: "Datas de reserva non válidas." };
      }

      const inD = new Date(resObj.checkIn);
      const outD = new Date(resObj.checkIn);
      outD.setDate(outD.getDate() + resObj.noches);

      const configDoc = await getDoc(doc(db, prefix ? prefix.replace(/\/$/, '') : "config", prefix ? "config/main" : "main"));
      const config = configDoc.exists() ? configDoc.data() : { baseRooms: [] };
      const baseRooms = config.baseRooms || [];

      let isAlbergue = resObj.roomInfo && resObj.roomInfo.toLowerCase().includes('albergue');
      let isHotel = resObj.establecimiento && resObj.establecimiento.toLowerCase().includes('hotel');
      if (!isAlbergue && !isHotel && resObj.roomInfo) {
          isAlbergue = resObj.roomInfo.toLowerCase().includes('cama');
      }

      let reqPersonas = resObj.personas || 1;

      let curr = new Date(inD);
      curr.setHours(12,0,0,0);
      let end = new Date(outD);
      end.setHours(12,0,0,0);
      const dates = [];
      while (curr < end) {
        dates.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }

      const dayDocs = [];
      for (let i = 0; i < dates.length; i += 30) {
          const chunk = dates.slice(i, i + 30);
          const docs = await Promise.all(chunk.map(d => getDoc(doc(db, prefix ? `${prefix}dailyData` : "dailyData", d))));
          dayDocs.push(...docs);
      }
      let daysData = dayDocs.map(d => d.exists() ? d.data().rooms : []);
      
      for (let i = 0; i < daysData.length; i++) {
         let dia = daysData[i];
         baseRooms.forEach(base => {
             if (base.type === 'hostel') {
                 for (let j = 1; j <= (base.totalBeds || 16); j++) {
                     let literaNum = Math.ceil(j / 2);
                     let isTop = (j % 2 === 0);
                     let bedCode = `${literaNum}${isTop ? 'A' : 'B'}`;
                     let bedObjId = `${base.id}_${bedCode}`;
                     if (!dia.find(d => d.id === bedObjId)) {
                         dia.push({
                             
                                 id: bedObjId, baseId: base.id, number: base.number, bedId: bedCode, roomName: base.roomName, type: 'bed', bedCode: bedCode, status: 'free', price: base.bedPrice || 15,
                                 clientName: '', guests: 1, agency: '', checkIn: '', checkOut: '', paidCash: 0, paidCard: 0, paidAgency: 0, paidTransfer: 0, accountSettled: false, observations: '', cleaningStatus: 'clean', groupId: '',
                                 services: { breakfast: {qty:0, price:0}, dinner: {qty:0, price:0}, picnic: {qty:0, price:0}, halfBoard: {qty:0, price:0}, fullBoard: {qty:0, price:0}, laundry: {active:false, price:0}, mochilas: {qty:0, price:0}, outros: {qty:0, price:0}, parking: false, taxi: false }

                         });
                     }
                 }
             } else {
                 if (!dia.find(d => d.id === base.id)) {
                     dia.push({
                         
                                 id: base.id, baseId: base.id, number: base.number, roomName: base.roomName, type: base.type, status: 'free', price: 0,
                                 clientName: '', guests: 1, agency: '', checkIn: '', checkOut: '', paidCash: 0, paidCard: 0, paidAgency: 0, paidTransfer: 0, accountSettled: false, observations: '', cleaningStatus: 'clean', groupId: '',
                                 services: { breakfast: {qty:0, price:0}, dinner: {qty:0, price:0}, picnic: {qty:0, price:0}, halfBoard: {qty:0, price:0}, fullBoard: {qty:0, price:0}, laundry: {active:false, price:0}, mochilas: {qty:0, price:0}, outros: {qty:0, price:0}, parking: false, taxi: false },
                                 features: base.features || [], bedConfig: base.bedConfig, zoneColor: base.zoneColor

                     });
                 }
             }
         });
      }

      let assignedIds = [];

      if (resObj.targetBaseId) {
          // It's a specific room/hostel assignment from iCal
          let base = baseRooms.find(b => b.id === resObj.targetBaseId);
          if (base && base.type === 'hostel') {
              let freeBedIds = [];
              let allBedIds = daysData[0].filter(r => r.baseId === resObj.targetBaseId).map(r => r.id);
              for (const bid of allBedIds) {
                  let isFree = true;
                  for (const dia of daysData) {
                      let r = dia.find(d => d.id === bid);
                      if (!r || r.status !== 'free') { isFree = false; break; }
                  }
                  if (isFree) freeBedIds.push(bid);
              }
              if (freeBedIds.length < reqPersonas) {
                  return { error: true, message: `Non hai ${reqPersonas} camas libres en albergue para estas datas.` };
              }
              assignedIds = freeBedIds.slice(0, reqPersonas);
          } else {
              let isFree = true;
              for (const dia of daysData) {
                  let r = dia.find(d => d.id === resObj.targetBaseId);
                  if (!r || r.status !== 'free') { isFree = false; break; }
              }
              if (isFree) {
                  assignedIds = [resObj.targetBaseId];
              } else {
                  return { error: true, message: `Habitación ${resObj.targetBaseId} xa ocupada nesas datas.` };
              }
          }
      } else if (isAlbergue || reqPersonas > 4) {
          let freeBedIds = [];
          let allBedIds = daysData[0].filter(r => r.type === 'bed').map(r => r.id);
          for (const bid of allBedIds) {
              let isFree = true;
              for (const dia of daysData) {
                  let r = dia.find(d => d.id === bid);
                  if (!r || r.status !== 'free') { isFree = false; break; }
              }
              if (isFree) {
                  freeBedIds.push(bid);
              }
          }
          if (freeBedIds.length < reqPersonas) {
              return { error: true, message: `Non hai ${reqPersonas} camas libres en albergue para estas datas.` };
          }
          assignedIds = freeBedIds.slice(0, reqPersonas);
      } else {
          let freeRoomIds = [];
          let allRoomIds = daysData[0].filter(r => r.type !== 'bed' && r.type !== 'hostel').map(r => r.id);
          for (const rid of allRoomIds) {
              let isFree = true;
              for (const dia of daysData) {
                  let r = dia.find(d => d.id === rid);
                  if (!r || r.status !== 'free') { isFree = false; break; }
              }
              if (isFree) {
                  freeRoomIds.push(rid);
              }
          }
          if (freeRoomIds.length === 0) {
              return { error: true, message: `Non hai habitacións privadas libres para estas datas.` };
          }
          assignedIds = [freeRoomIds[0]];
      }

      let isMulti = assignedIds.length > 1;
      let commonGroupId = isMulti ? 'GRP-' + Date.now() : '';
      let pPerBed = (resObj.total || 0) / assignedIds.length;
      let agencyPerBed = (resObj.paidAgency || 0) / assignedIds.length;

      for (let i = 0; i < dates.length; i++) {
          let dia = daysData[i];
          assignedIds.forEach(aid => {
              let room = dia.find(d => d.id === aid);
              if (room) {
                  room.status = 'occupied';
                  room.clientName = resObj.clientName || 'Reserva Automática';
                  room.clientEmail = resObj.clientEmail || '';
                  room.clientPhone = resObj.clientPhone || '';
                  room.checkIn = resObj.checkIn;
                  room.checkOut = outD.toISOString().split('T')[0];
                  room.guests = isMulti || room.type === 'bed' ? 1 : reqPersonas;
                  room.agency = resObj.agency || '';
                  room.icalUid = resObj.uid || '';
                  room.price = pPerBed;
                  room.paidAgency = agencyPerBed;
                  if (isMulti) room.groupId = commonGroupId;
                  
                  if (!room.services) room.services = {};
                  ['breakfast', 'dinner', 'picnic', 'halfBoard', 'fullBoard', 'mochilas', 'outros'].forEach(s => {
                      if (!room.services[s]) room.services[s] = {qty:0, price:0};
                  });
                  if (!room.services.laundry) room.services.laundry = {active:false, price:0};
              }
          });
          try {
              localStorage.setItem(`planing_day_${prefix}_${dates[i]}`, JSON.stringify(dia));
              localStorage.setItem(`planing_day_time_${prefix}_${dates[i]}`, Date.now().toString());
          } catch(e) {}
          try {
              await setDoc(doc(db, prefix ? `${prefix}dailyData` : "dailyData", dates[i]), { rooms: dia });
          } catch(fsErr) {
              console.warn("Firestore autoAssign setDoc aviso:", fsErr.message);
          }
      }

      

      return { success: true, assignedIds, dates };
    } catch(e) { if (e && e.message !== "NOT_LOGGED_IN_GOOGLE" && (!e.message || (!e.message.includes("xa ocupada") && !e.message.includes("Non hai")))) console.error(e); throw e; }
  },

  autoCancelReservation: async (resObj) => {
      try {
        if (!googleAccessToken) return { error: true, message: "NOT_LOGGED_IN_GOOGLE" };
        const prefix = getTenantPrefix();

        if (!resObj.checkIn || !resObj.noches) {
             return { error: true, message: "Datas de reserva non válidas para cancelar." };
        }

        const inD = new Date(resObj.checkIn);
        const outD = new Date(resObj.checkIn);
        outD.setDate(outD.getDate() + resObj.noches);

        let curr = new Date(inD);
        curr.setHours(12,0,0,0);
        let end = new Date(outD);
        end.setHours(12,0,0,0);
        const dates = [];
        while (curr < end) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }

        const dayDocs = await Promise.all(dates.map(d => getDoc(doc(db, prefix ? `${prefix}dailyData` : "dailyData", d))));
        let daysData = dayDocs.map(d => d.exists() ? d.data().rooms : []);

        let canceledCount = 0;

        for (let i = 0; i < dates.length; i++) {
            let dia = daysData[i];
            let modified = false;
            dia.forEach(r => {
                if (r.clientName && resObj.clientName && r.clientName.trim().toLowerCase() === resObj.clientName.trim().toLowerCase()) {
                    r.status = 'free';
                    r.clientName = '';
                    r.clientEmail = '';
                    r.checkIn = '';
                    r.checkOut = '';
                    r.agency = '';
                    r.price = 0;
                    r.paidAgency = 0;
                    r.groupId = '';
                    modified = true;
                    canceledCount++;
                }
            });
            if (modified) {
                try {
                    localStorage.setItem(`planing_day_${prefix}_${dates[i]}`, JSON.stringify(dia));
                    localStorage.setItem(`planing_day_time_${prefix}_${dates[i]}`, Date.now().toString());
                } catch(e) {}
                try {
                    await setDoc(doc(db, prefix ? `${prefix}dailyData` : "dailyData", dates[i]), { rooms: dia });
                } catch(fsErr) {
                    console.warn("Firestore autoCancel setDoc aviso:", fsErr.message);
                }
            }
        }

        if (canceledCount === 0) {
            return { error: true, message: "Non se atoparon habitacións asociadas a este nome ("+resObj.clientName+") nas datas indicadas." };
        }

        

        return { success: true, canceledCount };
      } catch(e) { if (e && e.message !== "NOT_LOGGED_IN_GOOGLE" && (!e.message || (!e.message.includes("xa ocupada") && !e.message.includes("Non hai")))) console.error(e); throw e; }
  },

  
  
  fetchPendingReservationEmails: async () => {
    try {
      if (!googleAccessToken) throw new Error("Acceso a Gmail denegado. Pecha a sesión e volve entrar premendo o botón azul de \"Iniciar sesión con Google\".");
      const queryStr = encodeURIComponent('-in:spam -in:trash (reserva OR reservas OR disponibilidad OR availability OR booking OR habitación OR room)');
      const searchRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${queryStr}&maxResults=30`, {
          headers: { Authorization: `Bearer ${googleAccessToken}` }
      });
      const searchData = await searchRes.json();
      if (searchData.error) throw new Error("Erro de permisos de Gmail: " + (searchData.error.message || "Acceso denegado."));
      if (!searchData.messages) return [];
      
      const emailPromises = searchData.messages.map(async (msg) => {
          const emailData = await firebaseBackend.readReservationEmail(msg.id);
          if (emailData) {
              const hasReply = await firebaseBackend.checkIfThreadHasHotelReply(emailData.threadId);
              if (!hasReply) {
                  const sender = (emailData.sender || "").toLowerCase();
                  if (!sender.includes('complexoxacobeo@gmail.com') && !sender.includes('no-reply') && !sender.includes('noreply')) {
                      return emailData;
                  }
              }
          }
          return null;
      });
      const results = await Promise.all(emailPromises);
      return results.filter(e => e !== null);
    } catch(e) {
      
      throw e;
    }
  },

  readReservationEmail: async (messageId) => {
      try {
          if (!googleAccessToken) return null;
          const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
              headers: { Authorization: `Bearer ${googleAccessToken}` }
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
          const threadRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`, {
              headers: { Authorization: `Bearer ${googleAccessToken}` }
          });
          const threadData = await threadRes.json();
          if (!threadData.messages) return false;
          
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
  
obterIncidencias: async () => {
    try {
      await ensureAuth();
      const prefix = getTenantPrefix();
      const q = query(collection(db, prefix + 'incidencias'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      let res = [];
      snap.forEach(d => {
          let data = d.data();
          data.id = d.id;
          res.push(data);
      });
      return res;
    } catch(e) { console.error(e); return []; }
  },
  gardarIncidencia: async (obj) => {
    try {
      await ensureAuth();
      const prefix = getTenantPrefix();
      const now = new Date();
      await addDoc(collection(db, prefix + "incidencias"), {
          tipo: obj.tipo, aloxamento: obj.aloxamento, descricion: obj.descricion, 
          asignado: obj.asignado || "",
          dataLimite: obj.data || "",
          foto: obj.foto || "",
          rexistradaPor: obj.receptionist || "App",
          data: now.toLocaleString("gl-ES", { timeZone: "Europe/Madrid" }),
          estado: "Pendente",
          timestamp: now.getTime()
      });
      return true;
    } catch (e) {
      console.warn("Firestore gardarIncidencia aviso:", e?.message || e);
      return true;
    }
  },
  gardarIncidenciaOLD: async (tipo, aloxamento, descricion, receptionist) => {
    try {
      await ensureAuth();
      const prefix = getTenantPrefix();
      const now = new Date();
      await addDoc(collection(db, prefix + 'incidencias'), {
          tipo, aloxamento, descricion, 
          rexistradaPor: receptionist,
          data: now.toLocaleString('gl-ES', { timeZone: 'Europe/Madrid' }),
          estado: 'Pendente',
          timestamp: now.getTime()
      });
      return true;
    } catch(e) { console.error(e); return false; }
  },
  verificarIncidenciasActivas: async () => {
    try {
      await ensureAuth();
      const prefix = getTenantPrefix();
      const q = query(collection(db, prefix + 'incidencias'), where('estado', '==', 'Pendente'));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch(e) { return false; }
  },
  marcarIncidenciaResolta: async (id, receptionist) => {
    try {
      await ensureAuth();
      const prefix = getTenantPrefix();
      await updateDoc(doc(db, prefix + 'incidencias', id), {
          estado: 'Resolto',
          resoltaPor: receptionist,
          dataResolucion: new Date().toLocaleString('gl-ES', { timeZone: 'Europe/Madrid' })
      });
      return true;
    } catch(e) { console.error(e); return false; }
  },
  gardarVaucher: async (agency, tipo, pNum, clientName, qty, persoa) => {
    return true;
  },
  gardarPecheCaixa: async (caixa, date, receptionist) => {
    try {
      const prefix = getTenantPrefix();
      try {
        localStorage.setItem(`peche_caixa_${prefix}_${date}`, JSON.stringify({ caixa, receptionist, timestamp: Date.now() }));
      } catch(e) {}
      try {
        await ensureAuth();
        await setDoc(doc(db, prefix + 'pecheCaixa', date), { caixa, receptionist, timestamp: new Date().getTime() });
      } catch(fsErr) {
        console.warn("Firestore pecheCaixa aviso:", fsErr.message);
      }
      return true;
    } catch(e) { console.error(e); return true; }
  },
  obterDatosInformes: async (startDate, endDate) => {
    try {
      await ensureAuth();
      const prefix = getTenantPrefix();
      const colName = prefix ? `${prefix}dailyData` : "dailyData";
      const q = query(collection(db, colName));
      const snap = await getDocs(q);
      let res = [];
      snap.forEach(d => {
          const date = d.id;
          if (date >= startDate && date <= endDate) {
              const data = d.data();
              if (data.rooms) {
                  data.rooms.forEach(r => {
                      if (r.status !== 'free' && r.clientName) {
                          // Only include records that check-in on this date to avoid duplicates, OR if we want daily revenue we could aggregate differently.
                          // Usually a reservation spans multiple days, if we show all days they multiply. Let's show only on checkIn date.
                          if (r.checkIn === date || !r.checkIn) {
                              let row = { ...r, dataRexistro: date };
                              res.push(row);
                          }
                      }
                  });
              }
          }
      });
      return res;
    } catch(e) { console.error(e); return []; }
  },
  doGoogleLogin: async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        googleAccessToken = credential.accessToken;
        try {
          localStorage.setItem('google_access_token', googleAccessToken);
          localStorage.setItem('google_access_token_time', Date.now().toString());
        } catch(e) {}
      }
      return result.user;
    } catch (e) {
      if (e && e.code !== 'auth/cancelled-popup-request' && e.code !== 'auth/popup-blocked') {
        console.error(e);
      }
      throw e;
    }
  }
};

class GoogleScriptRun {
  constructor() {
    this._success = null;
    this._failure = null;
  }
  withSuccessHandler(cb) {
    this._success = cb;
    return this;
  }
  withFailureHandler(cb) {
    this._failure = cb;
    return this;
  }
  
  async doEmailLogin(email, password) {
    try {
      const user = await firebaseBackend.doEmailLogin(email, password);
      if (this._success) this._success(user);
    } catch(e) { 
        if (e.message !== "NOT_LOGGED_IN_GOOGLE") {
            console.error(e); 
        }
        if(this._failure) this._failure(e); 
    }
  }
  async doEmailRegister(email, password) {
    try {
      const user = await firebaseBackend.doEmailRegister(email, password);
      if (this._success) this._success(user);
    } catch(e) { console.error(e); if(this._failure) this._failure(e); }
  }
  async propagarReserva(inD, outD, bedIds, updatedRooms, checkInDateStr) {
    try {
      const res = await firebaseBackend.propagarReserva(inD, outD, bedIds, updatedRooms, checkInDateStr);
      if (this._success) this._success(res);
    } catch(e) { console.error(e); if(this._failure) this._failure(e); }
    return this;
  }
  async getInitialData(date) {
    try {
      const res = await firebaseBackend.getInitialData(date);
      if (this._success) this._success(res);
    } catch(e) { console.error(e); if(this._failure) this._failure(e); }
  }
  getGoogleAccessToken() {
    return firebaseBackend.getGoogleAccessToken();
  }
  async saveDayData(date, json) {
    try {
      const res = await firebaseBackend.saveDayData(date, json);
      if (this._success) this._success(res);
    } catch(e) { console.error(e); if(this._failure) this._failure(e); }
  }
  async saveAppConfig(json) {
    try {
      const res = await firebaseBackend.saveAppConfig(json);
      if (this._success) this._success(res);
    } catch(e) { console.error(e); if(this._failure) this._failure(e); }
  }
  async verificarIncidenciasActivas() {
    try {
      const res = await firebaseBackend.verificarIncidenciasActivas();
      if (this._success) this._success(res);
    } catch(e) { console.error(e); if(this._failure) this._failure(e); }
  }
  async gardarVaucher(agency, tipo, pNum, clientName, qty, persoa) {
    try {
      const res = await firebaseBackend.gardarVaucher(agency, tipo, pNum, clientName, qty, persoa);
      if (this._success) this._success(res);
    } catch(e) { console.error(e); if(this._failure) this._failure(e); }
  }
  async gardarPecheCaixa(caixa, date, receptionist) {
    try {
      const res = await firebaseBackend.gardarPecheCaixa(caixa, date, receptionist);
      if (this._success) this._success(res);
    } catch(e) { console.error(e); if(this._failure) this._failure(e); }
  }
  
  
    async forceUpdateIcalName(uid, checkIn, noches, clientName, phone, email, agency) {
    return await firebaseBackend.forceUpdateIcalName(uid, checkIn, noches, clientName, phone, email, agency);
  }
  async freeIcalReservation(uid, checkIn, noches, targetBaseId, oldClientName) {
      const res = await firebaseBackend.freeIcalReservation(uid, checkIn, noches, targetBaseId, oldClientName);
      if (res && res.error) throw new Error(res.message);
      return res;
  }

  async autoAssignReservation(resObj) {
    try {
      const res = await firebaseBackend.autoAssignReservation(resObj);
      if (res && res.error) { if (this._failure) this._failure({ message: res.message }); return; }
      if (this._success) this._success(res);
    } catch(e) { 
      if (e && e.message !== "NOT_LOGGED_IN_GOOGLE" && (!e.message || (!e.message.includes("xa ocupada") && !e.message.includes("Non hai")))) console.error(e); 
      if(this._failure) this._failure(e); 
    }
  }
  async autoCancelReservation(resObj) {
    try {
      const res = await firebaseBackend.autoCancelReservation(resObj);
      if (res && res.error) { if (this._failure) this._failure({ message: res.message }); return; }
      if (this._success) this._success(res);
    } catch(e) { 
      if (e && e.message !== "NOT_LOGGED_IN_GOOGLE" && (!e.message || (!e.message.includes("xa ocupada") && !e.message.includes("Non hai")))) console.error(e); 
      if(this._failure) this._failure(e); 
    }
  }

  
  async fetchPendingReservationEmails() {
    if (this._success) {
       firebaseBackend.fetchPendingReservationEmails().then(this._success).catch(this._failure);
    } else {
       return firebaseBackend.fetchPendingReservationEmails();
    }
  }
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

  async obterIncidencias() {
    try {
      const res = await firebaseBackend.obterIncidencias();
      if (this._success) this._success(res);
    } catch(e) { console.error(e); if(this._failure) this._failure(e); }
  }
  async gardarIncidencia(obj) {
    try {
      const res = await firebaseBackend.gardarIncidencia(obj);
      if (this._success) this._success(res);
    } catch(e) { console.error(e); if(this._failure) this._failure(e); }
  }
  async marcarIncidenciaResolta(id, receptionist) {
    try {
      const res = await firebaseBackend.marcarIncidenciaResolta(id, receptionist);
      if (this._success) this._success(res);
    } catch(e) { console.error(e); if(this._failure) this._failure(e); }
  }
  async obterDatosInformes(startDate, endDate) {
    try {
      const res = await firebaseBackend.obterDatosInformes(startDate, endDate);
      if (this._success) this._success(res);
    } catch(e) { console.error(e); if(this._failure) this._failure(e); }
  }
  async marcarIncidenciaResolta(id, receptionist) {
    try {
      const res = await firebaseBackend.marcarIncidenciaResolta(id, receptionist);
      if (this._success) this._success(res);
    } catch(e) { console.error(e); if(this._failure) this._failure(e); }
  }
}

// Make it available globally
Object.defineProperty(window, 'google', {
  value: {
    get script() {
      return {
        get run() {
          return new GoogleScriptRun();
        }
      };
    }
  }
});

window.firebaseBackend = firebaseBackend;
window.doGoogleLogin = firebaseBackend.doGoogleLogin;
