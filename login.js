import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBD_MiOr1WxnwtknFtFWkrXIHEeDeVWmU",
  authDomain: "choudharyicecream.firebaseapp.com",
  projectId: "choudharyicecream",
  storageBucket: "choudharyicecream.firebasestorage.app",
  messagingSenderId: "534606829278",
  appId: "1:534606829278:web:b10c63f8340c158df0d44f",
  measurementId: "G-T1EJ28G8TF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    // ✅ redirect to admin
    window.location.href = "admin.html";

  } catch (err) {
    alert("Invalid login");
  }
};



