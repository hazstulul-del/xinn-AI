import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBqPxbAcHXZF0JLGrvQhuzETiRDmDtyn48",
  authDomain: "xinn-ai.firebaseapp.com",
  projectId: "xinn-ai",
  storageBucket: "xinn-ai.appspot.com",
  messagingSenderId: "673308828850",
  appId: "1:673308828850:web:988c0cec98f223924d15ab"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
