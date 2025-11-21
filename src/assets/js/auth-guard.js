// assets/js/auth-guard.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  const currentPage = window.location.pathname.split("/").pop();

  // 🔹 Nếu chưa đăng nhập và KHÔNG ở trang login → chuyển về login.html
  if (!user && currentPage !== "login.html") {
    console.log("🔒 Chưa đăng nhập, chuyển về login...");
    window.location.href = "login.html";
  }

  // 🔹 Nếu đã đăng nhập mà lại đang ở trang login → chuyển sang index
  if (user && currentPage === "login.html") {
    console.log("✅ Đã đăng nhập, chuyển sang dashboard...");
    // Redirect to the dashboard page used by the app (posts.html) to avoid loop
    if (!window.location.pathname.endsWith('posts.html')) {
      window.location.href = 'posts.html';
    }
  }
});
