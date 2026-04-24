import { auth, provider } from "./firebase.js";
import {
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export async function loginGoogle() {
  try {
    await signInWithRedirect(auth, provider);
  } catch (err) {
    alert("Login gagal: " + err.message);
  }
}

export async function loginGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    localStorage.setItem("xinn_user", JSON.stringify({
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photo: user.photoURL
    }));

    location.replace("./index.html");
  } catch (err) {
    alert("Login gagal: " + err.message);
  }
}

export async function logout() {
  await signOut(auth);
  localStorage.removeItem("xinn_user");
  window.location.href = "login.html";
}

export function checkLogin() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      localStorage.removeItem("xinn_user");
      window.location.href = "login.html";
    } else {
      localStorage.setItem("xinn_user", JSON.stringify({
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photo: user.photoURL
      }));
    }
  });
}
