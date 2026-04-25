import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const DAILY_LIMIT = 20;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function checkLimit() {
  const user = auth.currentUser;

  if (!user) {
    return {
      ok: false,
      msg: "Login dulu untuk memakai Xinn AI."
    };
  }

  const ref = doc(db, "limits", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      date: today(),
      count: 0,
      limit: DAILY_LIMIT
    });

    return { ok: true };
  }

  const data = snap.data();

  if (data.date !== today()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      date: today(),
      count: 0,
      limit: DAILY_LIMIT
    });

    return { ok: true };
  }

  if ((data.count || 0) >= DAILY_LIMIT) {
    return {
      ok: false,
      msg: "Limit harian habis 😅 Coba lagi besok."
    };
  }

  return { ok: true };
}

export async function addUsage() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "limits", user.uid);

  await updateDoc(ref, {
    count: increment(1)
  });
}
