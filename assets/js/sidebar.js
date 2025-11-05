import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  signOut(auth).then(() => {
    console.log("👋 Đã đăng xuất!");
    window.location.href = "login.html";
  });
});