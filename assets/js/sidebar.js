import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  signOut(auth).then(() => {
    console.log("👋 Đã đăng xuất!");
    window.location.href = "login.html";
  });
});
// 🟢 Toggle menu cho mobile
const menuBtn = document.getElementById("menuToggle");
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
  });
}

// 🟠 Tự đóng menu khi click ra ngoài (chỉ trên mobile)
document.addEventListener("click", (e) => {
  if (
    document.body.classList.contains("menu-open") &&
    !e.target.closest(".sidebar") &&
    !e.target.closest("#menuToggle")
  ) {
    document.body.classList.remove("menu-open");
  }
});
