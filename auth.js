import { auth, provider } from "./firebase.js";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

window.loginGoogle = async function () {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    localStorage.setItem("xinn_user", JSON.stringify({
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photo: user.photoURL
    }));

    window.location.href = "index.html";
  } catch (err) {
    alert("Login gagal: " + err.message);
  }
};

window.logout = async function () {
  await signOut(auth);
  localStorage.removeItem("xinn_user");
  window.location.href = "login.html";
};

window.checkLogin = function () {
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
};
