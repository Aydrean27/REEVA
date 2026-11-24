import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// COMPLETA los valores de tu firebaseConfig desde Firebase Console > Configuración > General
const firebaseConfig = {
  apiKey: "AIzaSyCwE9xjeK3lFaSsF2hf_-M8DIRNB-enUHU",
  authDomain: "reevaaydrean27.firebaseapp.com",
  projectId: "reevaaydrean27",
  storageBucket: "reevaaydrean27.firebasestorage.app",
  messagingSenderId: "689525944164",
  appId: "1:689525944164:web:881c6ee4bf608be6dcd471"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export async function guardarPerfilFirebase(user, extra = {}) {
  const targetUser = user || auth.currentUser;
  if (!targetUser) return null;

  const ref = doc(db, "usuarios", targetUser.uid);
  const prevSnap = await getDoc(ref);
  const prev = prevSnap.exists() ? prevSnap.data() : {};

  const data = {
    uid: targetUser.uid,
    name: extra.name || targetUser.displayName || prev.name || (targetUser.email ? targetUser.email.split("@")[0] : "Usuario"),
    email: targetUser.email || prev.email || "",
    role: extra.role || prev.role || "b",
    ok: extra.ok !== undefined ? extra.ok : (prev.ok ?? false),
    notif: extra.notif !== undefined ? extra.notif : (prev.notif ?? true),
    updatedAt: new Date().toISOString()
  };

  await setDoc(ref, data, { merge: true });
  window.acct = data;
  try { localStorage.setItem("ra", JSON.stringify(data)); } catch (e) {}
  window.dispatchEvent(new CustomEvent("reeva-auth-change", { detail: data }));
  return data;
}

export async function loginConGoogle(role = "b") {
  const res = await signInWithPopup(auth, googleProvider);
  return await guardarPerfilFirebase(res.user, { role });
}

export async function registroEmail(name, email, password, role = "b") {
  const res = await createUserWithEmailAndPassword(auth, email, password);
  return await guardarPerfilFirebase(res.user, { name, role });
}

export async function loginEmail(email, password) {
  const res = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "usuarios", res.user.uid));
  const data = snap.exists() ? snap.data() : await guardarPerfilFirebase(res.user);
  window.acct = data;
  try { localStorage.setItem("ra", JSON.stringify(data)); } catch (e) {}
  window.dispatchEvent(new CustomEvent("reeva-auth-change", { detail: data }));
  return data;
}

export async function cerrarSesionFirebase() {
  await signOut(auth);
  window.acct = null;
  try { localStorage.removeItem("ra"); } catch (e) {}
  window.dispatchEvent(new CustomEvent("reeva-auth-change", { detail: null }));
}

window.reevaAuth = {
  auth,
  db,
  guardarPerfilFirebase,
  loginConGoogle,
  registroEmail,
  loginEmail,
  cerrarSesionFirebase
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    window.acct = snap.exists() ? snap.data() : await guardarPerfilFirebase(user);
  } else {
    window.acct = null;
  }
  window.dispatchEvent(new CustomEvent("reeva-auth-change", { detail: window.acct }));
});
